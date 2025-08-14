import { DaytonaService } from '../../../lib/daytona';
import { db } from '../../../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { verifyIdToken } from '../../../lib/auth';

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

    // Get user's subscription plan from Firestore
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const plan = userData.subscriptionPlan || 'free';

    // Check if user already has a sandbox
    const existingSandboxes = await daytonaService.listUserSandboxes(userId);
    if (existingSandboxes.length > 0) {
      return res.status(400).json({ 
        error: 'User already has a sandbox',
        sandbox: existingSandboxes[0]
      });
    }

    // Create new sandbox with GPT model access
    const sandbox = await daytonaService.createUserSandbox(userId, plan);

    // Store sandbox info in Firestore
    await setDoc(doc(db, 'sandboxes', sandbox.id), {
      userId: userId,
      sandboxId: sandbox.id,
      plan: plan,
      createdAt: new Date(),
      status: 'creating',
      resources: daytonaService.getResourcesForPlan(plan),
      volumes: daytonaService.getVolumesForPlan(plan)
    });

    // Update user document with sandbox info
    await setDoc(doc(db, 'users', userId), {
      ...userData,
      sandboxId: sandbox.id,
      sandboxCreatedAt: new Date()
    }, { merge: true });

    res.status(200).json({
      success: true,
      sandbox: sandbox,
      message: 'Sandbox created successfully with GPT model access'
    });

  } catch (error) {
    console.error('Error creating sandbox:', error);
    res.status(500).json({ 
      error: 'Failed to create sandbox',
      details: error.message 
    });
  }
}
