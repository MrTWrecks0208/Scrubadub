import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Lazy-initialized GoogleGenAI client helper
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not defined in the workspace secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Regex generation endpoint
  app.post('/api/ai/generate-regex', async (req, res) => {
    try {
      const { prompt, sampleText } = req.body;
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        res.status(400).json({ error: 'Prompt is required and must be a valid non-empty string.' });
        return;
      }

      const client = getAiClient();
      
      const userPrompt = `Generate a structured regular expression pattern based on this description:
Description: "${prompt}"
${sampleText ? `Optional sample text that the regex should match or be tested against: "${sampleText}"` : ''}

Provide a robust regular expression with appropriate flags and replacement strategy (or empty replacement to strip/remove matches).
Make sure backslashes in the pattern are escaped properly for a valid JSON string (e.g., use \\d instead of \d, \\w instead of \w, etc.).`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: `You are an expert software engineer and regex designer.
You must construct a highly accurate and robust regular expression based on the user's description.
You must return your output ONLY as a JSON object matching this schema. Do not include markdown formatting or backticks around the JSON.

Rules for fields:
- "name": a short 2-4 word Title Case name for this rule (e.g., "Email Redactor", "Strip Newlines")
- "pattern": the raw regular expression pattern. Must be properly escaped for a JSON string. Do not wrap in forward slashes.
- "replacement": the string to substitute the matches with. Use an empty string if the goal is to remove/strip the matches.
- "global": true if we should find all matches (g flag)
- "caseInsensitive": true if matching should ignore case (i flag)
- "multiline": true if ^ and $ should match start/end of lines (m flag)
- "dotAll": true if dot (.) should match newline characters (s flag)
- "explanation": a clear, 1-2 sentence explanation of how the pattern works.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              pattern: { type: Type.STRING },
              replacement: { type: Type.STRING },
              global: { type: Type.BOOLEAN },
              caseInsensitive: { type: Type.BOOLEAN },
              multiline: { type: Type.BOOLEAN },
              dotAll: { type: Type.BOOLEAN },
              explanation: { type: Type.STRING },
            },
            required: ['name', 'pattern', 'replacement', 'global', 'caseInsensitive', 'multiline', 'dotAll', 'explanation'],
          },
        },
      });

      const textOutput = response.text;
      if (!textOutput) {
        throw new Error('Gemini model did not return any output text.');
      }

      const data = JSON.parse(textOutput.trim());
      res.json(data);
    } catch (error: any) {
      console.error('AI regex generation failed:', error);
      res.status(500).json({ 
        error: error.message || 'An error occurred while generating the regular expression.' 
      });
    }
  });

  // Serve frontend assets
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
