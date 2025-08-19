import { verifyIdToken } from '../../../lib/auth';
import { db } from '../../../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    const { sandboxId, projectName, code, language, collaborators = [] } = req.body;
    
    if (!projectName || !code) {
      return res.status(400).json({ error: 'Project name and code required' });
    }

    const projectId = `${projectName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

    // Save project to Firestore
    await setDoc(doc(db, 'projects', projectId), {
      id: projectId,
      name: projectName,
      userId,
      sandboxId,
      code,
      language,
      collaborators,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      status: 'saved'
    });

    res.status(200).json({
      success: true,
      project: {
        id: projectId,
        name: projectName,
        savedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Project save error:', error);
    res.status(500).json({ 
      error: 'Failed to save project',
      details: error.message 
    });
  }
}
