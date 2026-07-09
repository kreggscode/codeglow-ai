import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3005;

app.use(cors());
app.use(express.json());

// Helper to scan directory recursively
function scanDirectory(dir, baseDir = dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  const ignoredFolders = ['node_modules', '.git', '.github', 'dist', 'build', 'out', 'temp', 'logs'];
  const ignoredFiles = ['package-lock.json', '.DS_Store', 'favicon.ico'];
  const allowedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.go', '.html', '.css', '.json', '.java', '.cpp', '.c', '.h', '.rs', '.php', '.rb', '.sh'];

  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat && stat.isDirectory()) {
      if (!ignoredFolders.includes(file)) {
        results = results.concat(scanDirectory(fullPath, baseDir));
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      if (!ignoredFiles.includes(file) && allowedExtensions.includes(ext)) {
        try {
          const relativePath = path.relative(baseDir, fullPath);
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n').length;
          const sizeKb = (stat.size / 1024).toFixed(1);

          results.push({
            name: file,
            relativePath,
            lines,
            size: `${sizeKb} KB`,
            ext: ext.substring(1)
          });
        } catch (e) {
          console.error(`Failed to read file ${file}:`, e);
        }
      }
    }
  });

  return results;
}

// REST ENDPOINTS

// Scan directory recursively
app.post('/api/scan', (req, res) => {
  const { folderPath } = req.body;
  if (!folderPath) {
    return res.status(400).json({ error: 'Folder absolute path is required' });
  }

  const resolvedPath = path.resolve(folderPath);

  if (!fs.existsSync(resolvedPath)) {
    return res.status(404).json({ error: `Directory "${folderPath}" does not exist.` });
  }

  try {
    const files = scanDirectory(resolvedPath);
    res.json({
      folderName: path.basename(resolvedPath),
      filesCount: files.length,
      files
    });
  } catch (error) {
    console.error("Scan error:", error);
    res.status(500).json({ error: `Directory scan failed: ${error.message}` });
  }
});

// Get raw file content for code editor
app.get('/api/file-content', (req, res) => {
  const { folderPath, relativePath } = req.query;
  if (!folderPath || !relativePath) {
    return res.status(400).json({ error: 'FolderPath and relativePath are required' });
  }

  const fullPath = path.resolve(folderPath, relativePath);
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: `Failed to read file: ${error.message}` });
  }
});

// Analyze individual file code complexity and debt
app.post('/api/analyze-file', async (req, res) => {
  const { folderPath, relativePath, apiKey, provider, model } = req.body;
  if (!folderPath || !relativePath || !apiKey) {
    return res.status(400).json({ error: 'FolderPath, relativePath, and API key are required' });
  }

  const fullPath = path.resolve(folderPath, relativePath);
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: `File not found at "${relativePath}"` });
  }

  const selectedProvider = provider || 'gemini';
  const selectedModel = model || 'gemini-2.5-flash';

  try {
    const codeContent = fs.readFileSync(fullPath, 'utf8');
    
    // Check if file is excessively large
    const truncatedCode = codeContent.length > 25000 ? codeContent.substring(0, 25000) + '\n// [Code truncated due to length]' : codeContent;

    const systemPrompt = `
You are an expert static analyzer and code auditor. Read the following source code and evaluate it.
Return your evaluation strictly as a valid JSON object matching this structure:
{
  "complexityScore": 85, // number from 1 to 100 (where 100 means clean, simple, low cyclomatic complexity; 1 means terrible spaghetti)
  "securityScore": 90,   // number from 1 to 100 (where 100 means zero security issues; 1 means critical vulnerabilites)
  "documentationScore": 75, // number from 1 to 100 (where 100 means excellent comments/docstrings; 1 means zero comments)
  "debtGrade": "B", // A, B, C, D, or F
  "topIssues": [
    "Issue explanation including line number if relevant",
    "Another issue"
  ],
  "summary": "Brief summary analysis of what is good and bad in this file."
}

Do not include markdown tags or explanation in your output, return ONLY the raw JSON string.
`;

    const fullPrompt = `${systemPrompt}\n\nFile: ${relativePath}\n\nSource Code:\n\`\`\`\n${truncatedCode}\n\`\`\``;

    const rawJson = await callLlm(selectedProvider, selectedModel, apiKey, fullPrompt);
    const cleanJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedReport = JSON.parse(cleanJson);
    res.json(parsedReport);

  } catch (error) {
    console.error("File analysis error:", error);
    res.status(500).json({ error: `Analysis failed: ${error.message}` });
  }
});

// Refactor individual file
app.post('/api/refactor-file', async (req, res) => {
  const { folderPath, relativePath, apiKey, provider, model } = req.body;
  if (!folderPath || !relativePath || !apiKey) {
    return res.status(400).json({ error: 'FolderPath, relativePath, and API key are required' });
  }

  const fullPath = path.resolve(folderPath, relativePath);
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: `File not found` });
  }

  const selectedProvider = provider || 'gemini';
  const selectedModel = model || 'gemini-2.5-flash';

  try {
    const codeContent = fs.readFileSync(fullPath, 'utf8');
    const truncatedCode = codeContent.length > 25000 ? codeContent.substring(0, 25000) : codeContent;

    const systemPrompt = `
You are a Senior Principal Engineer. Refactor the following source code to improve readability, optimize speed, enhance security, and add proper documentation/comments.
Provide your response strictly as a valid JSON object matching this structure:
{
  "refactoredCode": "The fully refactored, production-ready code blocks",
  "explanation": "Markdown description detailing the optimizations, architectural improvements, and refactor explanations."
}

Ensure the output is raw JSON, with no markdown formatting tags. Double escape quotes and backslashes inside JSON values correctly.
`;

    const fullPrompt = `${systemPrompt}\n\nFile Path: ${relativePath}\n\nSource Code:\n\`\`\`\n${truncatedCode}\n\`\`\``;

    const rawJson = await callLlm(selectedProvider, selectedModel, apiKey, fullPrompt);
    const cleanJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedRefactor = JSON.parse(cleanJson);
    res.json(parsedRefactor);

  } catch (error) {
    console.error("Refactoring error:", error);
    res.status(500).json({ error: `Refactoring compiler failed: ${error.message}` });
  }
});

// API Client Wrapper (supporting 17 providers)
async function callLlm(provider, model, apiKey, prompt) {
  const openAiCompatibleProviders = {
    openai: 'https://api.openai.com/v1/chat/completions',
    groq: 'https://api.groq.com/openai/v1/chat/completions',
    together: 'https://api.together.xyz/v1/chat/completions',
    mistral: 'https://api.mistral.ai/v1/chat/completions',
    cohere: 'https://api.cohere.ai/v1/chat/completions',
    deepseek: 'https://api.deepseek.com/v1/chat/completions',
    perplexity: 'https://api.perplexity.ai/chat/completions',
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    huggingface: 'https://api-inference.huggingface.co/v1/chat/completions',
    fireworks: 'https://api.fireworks.ai/inference/v1/chat/completions',
    novita: 'https://api.novita.ai/v3/openai/chat/completions',
    anyscale: 'https://api.endpoints.anyscale.com/v1/chat/completions',
    octoai: 'https://text.octoai.run/v1/chat/completions',
    lepton: 'https://api.lepton.ai/v1/chat/completions',
    deepinfra: 'https://api.deepinfra.com/v1/openai/chat/completions'
  };

  if (provider === 'gemini') {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Gemini API Error');
    }
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } 
  
  if (provider === 'anthropic') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Anthropic API Error');
    }
    const data = await response.json();
    return data.content[0].text;
  }

  if (openAiCompatibleProviders[provider]) {
    const url = openAiCompatibleProviders[provider];
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      let errText = `${provider.toUpperCase()} API Error`;
      try {
        const err = await response.json();
        errText = err.error?.message || err.error || JSON.stringify(err);
      } catch (e) {}
      throw new Error(errText);
    }
    const data = await response.json();
    return data.choices[0].message.content;
  }

  throw new Error(`Provider "${provider}" is not configured for completions.`);
}

app.listen(PORT, () => {
  console.log(`CodeGlow Backend Server running on http://localhost:${PORT}`);
});
