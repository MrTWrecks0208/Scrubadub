import { GoogleGenAI, Type } from '@google/genai';

export const handler = async (event: any) => {
  // CORS & Method Check
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'GEMINI_API_KEY environment variable is not defined on the server.' })
      };
    }

    const { prompt, sampleText } = JSON.parse(event.body || '{}');
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Prompt is required and must be a valid non-empty string.' })
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    const userPrompt = `Generate a structured regular expression pattern based on this description:
Description: "${prompt}"
${sampleText ? `Optional sample text that the regex should match or be tested against: "${sampleText}"` : ''}

Provide a robust regular expression with appropriate flags and replacement strategy (or empty replacement to strip/remove matches).
Make sure backslashes in the pattern are escaped properly for a valid JSON string (e.g., use \\d instead of \d, \\w instead of \w, etc.).`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };
  } catch (error: any) {
    console.error('AI regex generation failed:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message || 'An error occurred while generating the regular expression.' })
    };
  }
};
