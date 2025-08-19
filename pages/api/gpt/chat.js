import { verifyUserToken, getUserData, updateUserData } from '../../../lib/firebase-admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.authorization;
    const userInfo = await verifyUserToken(authHeader);
    const userId = userInfo.userId;

    // Get user's subscription plan
    const userData = await getUserData(userId);
    const plan = userData?.subscriptionPlan || 'free';

    console.log(`GPT chat for user ${userId} with plan: ${plan}`);

    const { messages, model: requestedModel } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Determine model based on plan and request
    let modelName = 'gpt-20b'; // Default to free tier model
    if (plan !== 'free' && requestedModel === 'gpt-120b') {
      modelName = 'gpt-120b';
    }

    try {
      // Modal GPU endpoint URLs
      const modalEndpoints = {
        'gpt-20b': process.env.MODAL_GPT_20B_ENDPOINT || 'https://your-username--neural-weights-gpt-gpt-20b.modal.run',
        'gpt-120b': process.env.MODAL_GPT_120B_ENDPOINT || 'https://your-username--neural-weights-gpt-gpt-120b.modal.run'
      };

      const endpoint = modalEndpoints[modelName];
      
      const modalResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MODAL_API_KEY || 'demo-key'}`
        },
        body: JSON.stringify({
          messages: messages,
          model: modelName,
          max_tokens: 512,
          temperature: 0.7
        }),
        timeout: 30000
      });

      let responseData;
      if (modalResponse.ok) {
        responseData = await modalResponse.json();
        
        // Update usage in Firestore
        await updateUserData(userId, {
          lastApiCall: new Date().toISOString(),
          totalApiCalls: (userData?.totalApiCalls || 0) + 1,
          totalTokens: (userData?.totalTokens || 0) + (responseData.usage?.total_tokens || 0)
        });

        return res.status(200).json({
          success: true,
          model: modelName,
          response: responseData.choices[0]?.message?.content || 'No response generated',
          usage: responseData.usage,
          plan: plan
        });
      } else {
        throw new Error(`Modal API error: ${modalResponse.status}`);
      }

    } catch (modalError) {
      console.error('Modal API error:', modalError);
      
      // Fallback response for development/testing
      const lastMessage = messages[messages.length - 1];
      const userPrompt = lastMessage?.content || 'Hello';
      
      const fallbackResponse = {
        model: modelName,
        response: `Hello! I'm the ${modelName.toUpperCase()} model running on Neural Weights Hub. You said: "${userPrompt}". 

I'm currently running in fallback mode while the Modal GPU infrastructure is being configured. Once deployed, I'll provide full AI model responses powered by real GPT models on NVIDIA A100 GPUs.

Your ${plan} plan gives you access to ${modelName === 'gpt-120b' ? 'our most powerful 120B parameter model' : 'our efficient 20B parameter model'}.`,
        usage: {
          prompt_tokens: JSON.stringify(messages).length / 4,
          completion_tokens: 100,
          total_tokens: JSON.stringify(messages).length / 4 + 100
        },
        plan: plan,
        fallback: true
      };

      // Update usage in Firestore
      await updateUserData(userId, {
        lastApiCall: new Date().toISOString(),
        totalApiCalls: (userData?.totalApiCalls || 0) + 1,
        totalTokens: (userData?.totalTokens || 0) + fallbackResponse.usage.total_tokens
      });

      return res.status(200).json({
        success: true,
        ...fallbackResponse
      });
    }

  } catch (error) {
    console.error('GPT chat error:', error);
    return res.status(500).json({ 
      error: 'Failed to process chat request',
      details: error.message 
    });
  }
}
