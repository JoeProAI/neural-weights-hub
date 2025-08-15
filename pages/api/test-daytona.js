// Simple test endpoint to debug Daytona API issues
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Testing Daytona API connection...');
    
    // Test basic connectivity
    const testUrl = process.env.DAYTONA_SERVER_URL || 'http://localhost:3986';
    const apiKey = process.env.DAYTONA_API_KEY;
    
    console.log('Daytona URL:', testUrl);
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey ? apiKey.length : 0);
    
    // Try to ping Daytona server
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    console.log('Headers:', JSON.stringify(headers, null, 2));
    
    // Test simple GET request first (use same endpoint as sandbox creation)
    const response = await fetch(`${testUrl}/sandbox`, {
      method: 'GET',
      headers
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    return res.status(200).json({
      success: true,
      daytonaUrl: testUrl,
      hasApiKey: !!apiKey,
      responseStatus: response.status,
      responseBody: responseText,
      message: 'Daytona test completed'
    });
    
  } catch (error) {
    console.error('Daytona test error:', error);
    return res.status(500).json({
      error: 'Daytona test failed',
      message: error.message,
      stack: error.stack
    });
  }
}
