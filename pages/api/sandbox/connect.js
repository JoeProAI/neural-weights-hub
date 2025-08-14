import { DaytonaService } from '../../../lib/daytona';
import { verifyIdToken } from '../../../lib/auth';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const daytonaService = new DaytonaService();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    const { sandboxId } = req.body;
    if (!sandboxId) {
      return res.status(400).json({ error: 'Sandbox ID required' });
    }

    // Verify user owns this sandbox
    const sandboxDoc = await getDoc(doc(db, 'sandboxes', sandboxId));
    if (!sandboxDoc.exists() || sandboxDoc.data().userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get sandbox connection URL from Daytona
    const sandbox = await daytonaService.getSandboxStatus(sandboxId);
    
    // Generate connection URL (Daytona provides web IDE access)
    const connectionUrl = `https://app.daytona.io/workspace/${sandboxId}`;

    res.status(200).json({
      connectionUrl,
      status: sandbox.status,
      resources: sandbox.resources
    });

  } catch (error) {
    console.error('Error connecting to sandbox:', error);
    res.status(500).json({ error: 'Failed to get connection info' });
  }
}
