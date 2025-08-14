import { verifyIdToken } from '../../../lib/auth';
import { db } from '../../../lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

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

    const { model, message } = req.body;
    if (!model || !message) {
      return res.status(400).json({ error: 'Model and message required' });
    }

    // Get user's subscription plan
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const plan = userData.subscriptionPlan || 'free';

    // Check model access based on plan
    if (model === 'gpt-120b' && !['pro', 'team', 'enterprise'].includes(plan)) {
      return res.status(403).json({ 
        error: 'GPT-120B requires Pro plan or higher',
        upgradeUrl: '/pricing'
      });
    }

    // Determine the correct Modal endpoint
    const endpoints = {
      'gpt-20b': process.env.MODAL_GPT_20B_ENDPOINT || 'https://joe-9--neural-weights-hub-gpt-20b-inference.modal.run',
      'gpt-120b': process.env.MODAL_GPT_120B_ENDPOINT || 'https://joe-9--neural-weights-hub-gpt-120b-inference.modal.run'
    };

    const endpoint = endpoints[model];
    if (!endpoint) {
      return res.status(400).json({ error: 'Invalid model specified' });
    }

    // Call the Modal GPT endpoint
    const modalResponse = await fetch(`${endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MODAL_API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (!modalResponse.ok) {
      const errorText = await modalResponse.text();
      console.error(`Modal API error for ${model}:`, errorText);
      return res.status(500).json({ 
        error: `${model} model is currently unavailable`,
        details: errorText
      });
    }

    const modalData = await modalResponse.json();
    const response = modalData.choices?.[0]?.message?.content || 'No response generated';

    // Track API usage
    try {
      await updateDoc(doc(db, 'users', userId), {
        'usage.apiCalls': increment(1),
        'usage.lastApiCall': new Date()
      });
    } catch (error) {
      console.warn('Failed to track usage:', error);
    }

    res.status(200).json({
      model,
      response,
      usage: {
        prompt_tokens: modalData.usage?.prompt_tokens || 0,
        completion_tokens: modalData.usage?.completion_tokens || 0,
        total_tokens: modalData.usage?.total_tokens || 0
      }
    });

  } catch (error) {
    console.error('Error testing GPT model:', error);
    res.status(500).json({ error: 'Failed to test model' });
  }
}
