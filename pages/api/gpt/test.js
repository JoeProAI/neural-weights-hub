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

    console.log(`GPT test for user ${userId} with plan: ${plan}`);

    const { prompt = "Hello, how are you?" } = req.body;

    // Determine model based on plan
    const modelName = plan === 'free' ? 'gpt-20b' : 'gpt-120b';

    // Fallback response (Modal will be deployed separately)
    const fallbackResponse = {
      model: modelName,
      response: `Hello! I'm the ${modelName.toUpperCase()} model on Neural Weights Hub. You said: "${prompt}". 

This is a demonstration response. Your ${plan} plan gives you access to ${modelName === 'gpt-120b' ? 'our most powerful 120B parameter model' : 'our efficient 20B parameter model'}.

The platform is ready for production deployment with real GPU-powered AI models.`,
      tokens: 50,
      plan: plan,
      timestamp: new Date().toISOString(),
      demo: true
    };

    // Update usage in Firestore
    await updateUserData(userId, {
      lastApiCall: new Date().toISOString(),
      totalApiCalls: (userData?.totalApiCalls || 0) + 1,
      totalTokens: (userData?.totalTokens || 0) + fallbackResponse.tokens
    });

    return res.status(200).json({
      success: true,
      data: fallbackResponse
    });

  } catch (error) {
    console.error('GPT test error:', error);
    return res.status(500).json({ 
      error: 'Failed to process request',
      details: error.message 
    });
  }
}
