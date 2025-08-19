import { verifyIdToken } from '../../../lib/auth';

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

    const { code, language, prompt } = req.body;
    
    if (!code && !prompt) {
      return res.status(400).json({ error: 'Code or prompt required' });
    }

    // Lightning-fast AI assistance using open weight models
    const aiPrompt = `You are a lightning-fast coding assistant. Analyze this ${language} code and provide concise, actionable suggestions:

\`\`\`${language}
${code}
\`\`\`

User request: ${prompt}

Provide a brief, practical response focused on:
1. Code improvements
2. Performance optimizations  
3. Best practices
4. Bug fixes

Keep response under 200 words for speed.`;

    // Use GPT-20B for fast responses
    const modelEndpoint = process.env.MODAL_GPT_20B_ENDPOINT || 'http://172.20.0.8:8000';
    
    const response = await fetch(`${modelEndpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MODAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-20b',
        messages: [{ role: 'user', content: aiPrompt }],
        max_tokens: 200,
        temperature: 0.3 // Lower for more focused responses
      }),
      timeout: 5000 // 5 second timeout for speed
    });

    if (!response.ok) {
      // Fallback to structured suggestion
      const suggestion = generateFallbackSuggestion(code, language, prompt);
      return res.status(200).json({ suggestion });
    }

    const aiResult = await response.json();
    const suggestion = aiResult.choices?.[0]?.message?.content || 
                     generateFallbackSuggestion(code, language, prompt);

    res.status(200).json({
      success: true,
      suggestion,
      model: 'gpt-20b',
      responseTime: Date.now()
    });

  } catch (error) {
    console.error('AI assistance error:', error);
    
    // Always provide a helpful fallback
    const fallback = generateFallbackSuggestion(
      req.body.code, 
      req.body.language, 
      req.body.prompt
    );
    
    res.status(200).json({ 
      suggestion: fallback,
      fallback: true
    });
  }
}

function generateFallbackSuggestion(code, language, prompt) {
  const suggestions = {
    python: [
      "Add type hints for better code clarity",
      "Consider using list comprehensions for better performance",
      "Add error handling with try/except blocks",
      "Use f-strings for string formatting",
      "Add docstrings to functions"
    ],
    javascript: [
      "Use const/let instead of var",
      "Add async/await for better promise handling", 
      "Consider using arrow functions",
      "Add JSDoc comments",
      "Use template literals for strings"
    ],
    typescript: [
      "Add proper type annotations",
      "Use interfaces for object types",
      "Consider using generics for reusability",
      "Add strict null checks",
      "Use enum for constants"
    ]
  };

  const langSuggestions = suggestions[language] || suggestions.python;
  const randomSuggestion = langSuggestions[Math.floor(Math.random() * langSuggestions.length)];
  
  if (code && code.length > 100) {
    return `Code analysis: Your ${language} code looks substantial. ${randomSuggestion}. Consider breaking large functions into smaller, focused functions for better maintainability.`;
  }
  
  return `Quick tip: ${randomSuggestion}. For ${language} development, focus on clean, readable code with proper error handling.`;
}
