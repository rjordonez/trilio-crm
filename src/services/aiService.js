/**
 * AI/LLM Service
 *
 * This file provides an abstraction layer for AI-powered text analysis.
 * Replace the implementation below with your preferred LLM service:
 * - OpenAI (GPT-4, GPT-3.5)
 * - Anthropic (Claude)
 * - Google (Gemini)
 * - Azure OpenAI
 * - Cohere
 * - Open-source models via API
 */

import { getConfig } from './config';

/**
 * Analyzes a tour transcription and extracts structured insights
 * @param {string} transcription - The full text transcription
 * @param {Object} context - Additional context (prospect info, situation, etc.)
 * @returns {Promise<Object>} - Returns { keyPoints, concerns, smallThings }
 */
export async function analyzeTourTranscription(transcription, context = {}) {
  const config = getConfig();
  const service = config.ai.provider;

  switch (service) {
    case 'openai':
      return analyzeWithOpenAI(transcription, context);
    case 'anthropic':
      return analyzeWithAnthropic(transcription, context);
    case 'google':
      return analyzeWithGoogle(transcription, context);
    case 'azure':
      return analyzeWithAzureOpenAI(transcription, context);
    case 'mock':
    default:
      return analyzeWithMock(transcription, context);
  }
}

/**
 * Creates the analysis prompt (used by Anthropic/Google/Azure providers)
 */
function getAnalysisPrompt(transcription, context) {
  return `Analyze this conversation transcript and extract structured insights.

Context: ${context.firstName} ${context.lastName} - ${context.situation}

Transcript:
${transcription}

Extract key points, concerns, small personal details, and also identify decision makers involved, any budget/financial details mentioned, and level of care needed if discussed.

Return ONLY valid JSON: { "keyPoints": [...], "concerns": [...], "smallThings": [...], "decisionMakers": [...], "budget": [...], "careLevel": [...] }`;
}

/**
 * OpenAI Implementation — proxied through /api/analyze to avoid CORS
 */
async function analyzeWithOpenAI(transcription, context) {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ transcription, context })
    });

    if (!response.ok) {
      throw new Error(`Analysis API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('OpenAI analysis error:', error);
    throw error;
  }
}

/**
 * Anthropic Claude Implementation
 * Docs: https://docs.anthropic.com/claude/reference/messages_post
 */
async function analyzeWithAnthropic(transcription, context) {
  const config = getConfig();
  const apiKey = config.ai.apiKey;
  const model = config.ai.model || 'claude-3-5-sonnet-20241022';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: getAnalysisPrompt(transcription, context)
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Parse JSON from response (Claude might wrap it in markdown)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = JSON.parse(jsonMatch ? jsonMatch[0] : content);

    return {
      keyPoints: result.keyPoints || [],
      concerns: result.concerns || [],
      smallThings: result.smallThings || [],
      decisionMakers: result.decisionMakers || [],
      budget: result.budget || [],
      careLevel: result.careLevel || [],
      provider: 'anthropic',
      model: model
    };
  } catch (error) {
    console.error('Anthropic analysis error:', error);
    throw error;
  }
}

/**
 * Google Gemini Implementation
 * Docs: https://ai.google.dev/api/rest
 */
async function analyzeWithGoogle(transcription, context) {
  const config = getConfig();
  const apiKey = config.ai.apiKey;
  const model = config.ai.model || 'gemini-pro';

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: getAnalysisPrompt(transcription, context)
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Google API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = JSON.parse(jsonMatch ? jsonMatch[0] : content);

    return {
      keyPoints: result.keyPoints || [],
      concerns: result.concerns || [],
      smallThings: result.smallThings || [],
      decisionMakers: result.decisionMakers || [],
      budget: result.budget || [],
      careLevel: result.careLevel || [],
      provider: 'google',
      model: model
    };
  } catch (error) {
    console.error('Google analysis error:', error);
    throw error;
  }
}

/**
 * Azure OpenAI Implementation
 * Docs: https://learn.microsoft.com/azure/ai-services/openai/
 */
async function analyzeWithAzureOpenAI(transcription, context) {
  const config = getConfig();
  const apiKey = config.ai.apiKey;
  const endpoint = config.ai.azureEndpoint;
  const deployment = config.ai.azureDeployment;

  try {
    const response = await fetch(`${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2023-05-15`, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that analyzes senior living tour conversations and extracts structured insights. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: getAnalysisPrompt(transcription, context)
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`Azure OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const result = JSON.parse(content);

    return {
      keyPoints: result.keyPoints || [],
      concerns: result.concerns || [],
      smallThings: result.smallThings || [],
      decisionMakers: result.decisionMakers || [],
      budget: result.budget || [],
      careLevel: result.careLevel || [],
      provider: 'azure-openai',
      model: deployment
    };
  } catch (error) {
    console.error('Azure OpenAI analysis error:', error);
    throw error;
  }
}

/**
 * Mock Implementation (for testing without API keys)
 */
async function analyzeWithMock(transcription, context) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  return {
    keyPoints: [
      "Looking for independent living with activities",
      "Prefers a room with garden view",
      "Concerned about pet policy for small dog",
      "Interested in starting within 2-3 months"
    ],
    concerns: [
      "Cost of monthly fees and what's included",
      "Whether they can bring their small dog (Chihuahua)",
      "Distance from family (daughter lives 30 minutes away)",
      "Quality of meals and dietary accommodations"
    ],
    smallThings: [
      "Likes to paint and asked about art studio",
      "Enjoys gardening - mentioned herb garden",
      "Reads mystery novels - asked about library",
      "Plays bridge on Wednesdays with friends"
    ],
    decisionMakers: [
      "Daughter (primary contact)",
      "Prospect (self)"
    ],
    budget: [
      "Inquired about monthly fees",
      "Wants to understand what's included"
    ],
    careLevel: [
      "Independent Living with some assistance",
      "Dietary accommodations needed"
    ],
    provider: 'mock'
  };
}
