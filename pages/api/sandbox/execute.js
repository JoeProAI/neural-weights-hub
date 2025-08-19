import { verifyIdToken } from '../../../lib/auth';
import { DaytonaClient } from '../../../lib/daytona-client';

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
    const userEmail = decodedToken.email;

    const { sandboxId, code, language = 'python', useAI = false } = req.body;
    
    if (!sandboxId || !code) {
      return res.status(400).json({ error: 'Sandbox ID and code required' });
    }

    const daytonaClient = new DaytonaClient();

    // Verify sandbox ownership
    const sandbox = await daytonaClient.getSandbox(sandboxId);
    if (!sandbox) {
      return res.status(404).json({ error: 'Sandbox not found' });
    }

    const isOwner = sandbox.env?.['NEURAL_WEIGHTS_USER_ID'] === userId ||
                   sandbox.labels?.['neural-weights/user-id'] === userId ||
                   sandbox.labels?.['neural-weights/user-email'] === userEmail;

    if (!isOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Generate execution script based on language
    let executionScript;
    let filename;

    switch (language) {
      case 'python':
        filename = 'main.py';
        executionScript = `
# Save code to file
cat > ${filename} << 'EOF'
${code}
EOF

# Execute with timeout and capture output
timeout 30s python ${filename} 2>&1
echo "Exit code: $?"
`;
        break;

      case 'javascript':
        filename = 'main.js';
        executionScript = `
cat > ${filename} << 'EOF'
${code}
EOF

timeout 30s node ${filename} 2>&1
echo "Exit code: $?"
`;
        break;

      case 'typescript':
        filename = 'main.ts';
        executionScript = `
cat > ${filename} << 'EOF'
${code}
EOF

# Install TypeScript if not present
npm install -g typescript ts-node 2>/dev/null || true
timeout 30s ts-node ${filename} 2>&1
echo "Exit code: $?"
`;
        break;

      case 'go':
        filename = 'main.go';
        executionScript = `
cat > ${filename} << 'EOF'
${code}
EOF

timeout 30s go run ${filename} 2>&1
echo "Exit code: $?"
`;
        break;

      case 'rust':
        filename = 'main.rs';
        executionScript = `
cat > ${filename} << 'EOF'
${code}
EOF

timeout 30s rustc ${filename} -o main && ./main 2>&1
echo "Exit code: $?"
`;
        break;

      default:
        return res.status(400).json({ error: 'Unsupported language' });
    }

    // Add AI assistance if requested
    if (useAI) {
      const aiScript = `
# AI-Enhanced Execution
echo "🧠 AI Analysis enabled..."

# Load Neural Weights client
python -c "
import sys
sys.path.append('/tmp')
from neural_model_client import NeuralWeightsClient

client = NeuralWeightsClient()
analysis = client.quick_generate('''
Analyze this ${language} code and provide execution insights:

\`\`\`${language}
${code}
\`\`\`

Provide brief insights about what this code does and any potential issues.
''')
print('🔍 AI Analysis:', analysis[:200] + '...' if len(analysis) > 200 else analysis)
"

echo "---"
`;
      executionScript = aiScript + executionScript;
    }

    // Execute code in sandbox
    const startTime = Date.now();
    const result = await daytonaClient.executeCommand(sandboxId, executionScript);
    const executionTime = Date.now() - startTime;

    // Parse output and format response
    let output = result.output || '';
    let exitCode = 0;

    // Extract exit code if present
    const exitCodeMatch = output.match(/Exit code: (\d+)/);
    if (exitCodeMatch) {
      exitCode = parseInt(exitCodeMatch[1]);
      output = output.replace(/Exit code: \d+\s*$/, '').trim();
    }

    // Add execution metadata
    const metadata = `
--- Execution Complete ---
Language: ${language}
Time: ${executionTime}ms
Exit Code: ${exitCode}
Sandbox: ${sandboxId.substring(0, 8)}...
${useAI ? 'AI Analysis: Enabled' : ''}
`;

    res.status(200).json({
      success: true,
      output: output + '\n' + metadata,
      exitCode,
      executionTime,
      language,
      aiEnabled: useAI,
      sandboxId
    });

  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({ 
      error: 'Execution failed',
      details: error.message,
      output: `Error: ${error.message}\n\nExecution failed. Please check your code and try again.`
    });
  }
}
