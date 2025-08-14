import { DaytonaService } from '../../../lib/daytona';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { verifyIdToken } from '../../../lib/auth';

const daytonaService = new DaytonaService();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    // Get user's sandbox info from Firestore
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const sandboxId = userData.sandboxId;

    if (!sandboxId) {
      return res.status(200).json({ 
        sandbox: null,
        message: 'No sandbox found for user'
      });
    }

    // Get sandbox status from Daytona
    const sandbox = await daytonaService.getSandboxStatus(sandboxId);
    
    // Get usage data from Firestore
    const usageDoc = await getDoc(doc(db, 'usage', userId));
    const usage = usageDoc.exists() ? usageDoc.data() : {
      apiCalls: 0,
      sandboxHours: 0,
      storageGB: 0,
      estimatedCost: 0
    };

    res.status(200).json({
      success: true,
      sandbox: sandbox,
      usage: usage
    });

  } catch (error) {
    console.error('Error getting sandbox status:', error);
    res.status(500).json({ 
      error: 'Failed to get sandbox status',
      details: error.message 
    });
  }
}
