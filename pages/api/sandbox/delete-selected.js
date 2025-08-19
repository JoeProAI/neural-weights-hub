import { DaytonaService } from '../../../lib/daytona.js';
import { verifyUserToken } from '../../../lib/firebase-admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.authorization;
    const userInfo = await verifyUserToken(authHeader);
    const userId = userInfo.userId;
    const userEmail = userInfo.email;

    const { sandboxIds } = req.body;

    if (!sandboxIds || !Array.isArray(sandboxIds) || sandboxIds.length === 0) {
      return res.status(400).json({ error: 'sandboxIds array is required' });
    }

    const daytona = new DaytonaService();
    const headers = await daytona.createHeaders();

    // Protected sandboxes that should never be deleted
    const protectedSandboxes = [
      '2a4c567a-5375-4a47-b356-68bbf5381930', // GPT-20B production
      'f8bf5d41-f332-4d69-b527-2636e4d5b897', // GPT-120B production
      'f93ec1b4-09cb-4f42-b1ba-f5602295c790', // GPT-20B production (new)
      '25dab552-6c1d-4c86-905e-0478ba544b71'  // GPT-120B production (new)
    ];

    const deleteResults = [];

    for (const sandboxId of sandboxIds) {
      try {
        // Check if sandbox is protected
        if (protectedSandboxes.includes(sandboxId)) {
          deleteResults.push({
            id: sandboxId,
            status: 'protected',
            message: 'Production server - cannot delete'
          });
          continue;
        }

        // Get sandbox details first to verify ownership
        const sandboxResponse = await fetch(`${daytona.baseUrl}/sandbox/${sandboxId}`, {
          method: 'GET',
          headers
        });

        if (!sandboxResponse.ok) {
          deleteResults.push({
            id: sandboxId,
            status: 'not_found',
            message: 'Sandbox not found'
          });
          continue;
        }

        const sandbox = await sandboxResponse.json();

        // Verify user owns this sandbox
        const isOwner = (
          (sandbox.env && sandbox.env['NEURAL_WEIGHTS_USER_ID'] === userId) ||
          (sandbox.labels && sandbox.labels['neural-weights/user-id'] === userId) ||
          (userEmail && sandbox.labels && sandbox.labels['neural-weights/user-email'] === userEmail) ||
          (sandbox.name && sandbox.name.includes(userId.substring(0, 8))) ||
          (sandbox.createdBy === userId || sandbox.owner === userId)
        );

        if (!isOwner) {
          deleteResults.push({
            id: sandboxId,
            status: 'access_denied',
            message: 'You do not own this sandbox'
          });
          continue;
        }

        // Don't delete running sandboxes - but allow STOPPED sandboxes
        if (sandbox.state === 'STARTED' || sandbox.state === 'STARTING') {
          deleteResults.push({
            id: sandboxId,
            name: sandbox.name,
            status: 'running',
            message: 'Cannot delete running sandbox - stop it first'
          });
          continue;
        }

        // Delete the sandbox
        const deleteResponse = await fetch(`${daytona.baseUrl}/sandbox/${sandboxId}`, {
          method: 'DELETE',
          headers
        });

        if (deleteResponse.ok) {
          deleteResults.push({
            id: sandboxId,
            name: sandbox.name || 'Unnamed',
            status: 'deleted',
            message: 'Successfully deleted'
          });
        } else {
          deleteResults.push({
            id: sandboxId,
            name: sandbox.name || 'Unnamed',
            status: 'failed',
            message: `Delete failed: HTTP ${deleteResponse.status}`
          });
        }

      } catch (error) {
        deleteResults.push({
          id: sandboxId,
          status: 'error',
          message: error.message
        });
      }
    }

    const successCount = deleteResults.filter(r => r.status === 'deleted').length;
    const failureCount = deleteResults.length - successCount;

    return res.status(200).json({
      success: true,
      message: `Deleted ${successCount} sandbox(es), ${failureCount} failed/skipped`,
      results: deleteResults,
      summary: {
        requested: sandboxIds.length,
        deleted: successCount,
        failed: failureCount,
        protected: deleteResults.filter(r => r.status === 'protected').length,
        running: deleteResults.filter(r => r.status === 'running').length
      }
    });

  } catch (error) {
    console.error('Delete selected sandboxes error:', error);
    return res.status(500).json({ 
      error: 'Failed to delete sandboxes',
      details: error.message 
    });
  }
}
