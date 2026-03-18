import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, leadsContext } = req.body;
    console.log('Received request - Messages:', JSON.stringify(messages, null, 2));
    console.log('Leads context count:', leadsContext?.length);

    const systemMessage = `You are a helpful AI assistant for a senior living CRM system. You have access to the following leads data:

${JSON.stringify(leadsContext, null, 2)}

Help the user with questions about their leads pipeline, provide insights, and suggest next steps. Be concise and helpful. When discussing leads, use their names and provide specific details from the data.`;

    // Convert UIMessage format to ModelMessage format
    const coreMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.parts.map(part => {
        if (part.type === 'text') return part.text;
        return part;
      }).filter(Boolean).join('')
    }));

    const result = streamText({
      model: openai('gpt-4-turbo', { apiKey: process.env.OPENAI_API_KEY }),
      system: systemMessage,
      messages: coreMessages,
      temperature: 0.7,
      maxTokens: 1000,
    });

    result.pipeUIMessageStreamToResponse(res);
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { transcription, context } = req.body;

    const prompt = `You are an AI assistant analyzing conversations to extract structured insights.

Analyze the following conversation transcript and extract:

1. **Key Points**: The most important takeaways, main topics discussed, or key information mentioned (3-5 items). Extract any significant statements, goals, preferences, or requirements mentioned.

2. **Concerns**: Any worries, questions, objections, or issues raised (2-4 items). If none exist, extract things that might need follow-up or clarification.

3. **Small Things**: Minor details, personal preferences, or interesting facts mentioned that could be useful for personalization (2-4 items). This includes hobbies, locations, relationships, or specific likes/dislikes.

IMPORTANT: Even if this is a brief or casual conversation, extract at least 2-3 items for each category based on what was actually said. Be creative and extract value from whatever information is provided.

Context:
- Person: ${context.firstName} ${context.lastName}
- Situation: ${context.situation}
- Email: ${context.email}
- Phone: ${context.phone}

Transcript:
${transcription}

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):
{
  "keyPoints": ["point 1", "point 2", ...],
  "concerns": ["concern 1", "concern 2", ...],
  "smallThings": ["detail 1", "detail 2", ...]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are an AI assistant that analyzes senior living tour conversations and extracts structured insights. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    res.json({
      keyPoints: result.keyPoints || [],
      concerns: result.concerns || [],
      smallThings: result.smallThings || [],
      provider: 'openai',
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview'
    });
  } catch (error) {
    console.error('Analyze API error:', error);
    res.status(500).json({ error: 'Failed to analyze transcription' });
  }
});

app.post('/api/analyze-note', async (req, res) => {
  try {
    const { transcription } = req.body;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You format raw notes into concise CRM activity log entries for a senior living community. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: `Format this into a CRM activity log entry. Return JSON with:
- "type": one of "call", "email", "tour", "meeting", or "note" (pick the best fit)
- "title": short, 3-8 words (e.g. "Follow-up call with daughter")
- "description": 1-2 sentences summarizing the key details

Raw note:
${transcription}`
          }
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    res.json({
      title: result.title || 'Note added',
      description: result.description || transcription,
      type: ['call', 'email', 'tour', 'meeting', 'note'].includes(result.type) ? result.type : 'note'
    });
  } catch (error) {
    console.error('Analyze note error:', error);
    res.status(500).json({ error: 'Failed to analyze note' });
  }
});

app.post('/api/analyze-lead', async (req, res) => {
  try {
    const { transcription, context } = req.body;

    const userPrompt = `Extract lead information from this transcribed audio recording for a home care / senior care CRM. Return JSON with these fields (leave empty string or empty array if not mentioned):

- "name": client/patient full name (the person who needs care)
- "age": age as string
- "contactPerson": name of the person calling or making the inquiry (may be same as client)
- "contactPhone": phone number if mentioned
- "contactEmail": email if mentioned
- "zipcode": zip code if mentioned
- "relationship": MUST be one of: "Self", "Daughter / Son", "Spouse", "Relative", "Hospital / Social Worker", "Other" — or empty string
- "careType": array of care types mentioned, each MUST be one of: "ADL Support", "Assisted Living", "Post-Acute", "Companionship", "Not Sure Yet"
- "hoursPerDay": hours of care needed if mentioned (e.g. "20 hours", "4-6 hours")
- "timeline": MUST be one of: "Immediately", "Within a few days", "Within a week", "Within a month", "More than a month", "Just researching" — or empty string
- "budget": MUST be one of: "Under $40/hr", "$40-60/hr", "$60+/hr", "Not sure" — or empty string
- "source": MUST be one of: "Website", "Digital Ads", "Referral Partner", "Event", "Other" — or empty string. Infer from context if possible.
- "notes": Concise bullet points of key personal details, concerns, preferences, medical conditions, family dynamics, and anything that doesn't fit the other fields. This is the most important field — capture everything relevant.

${context ? `\nAdditional context from the user: ${context}` : ''}

Transcription:
${transcription}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You extract structured lead information from transcribed audio recordings for a home care CRM. Always respond with valid JSON only. Be concise but thorough in the notes field.',
          },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    const validRelationships = ["Self", "Daughter / Son", "Spouse", "Relative", "Hospital / Social Worker", "Other"];
    const validCareTypes = ["ADL Support", "Assisted Living", "Post-Acute", "Companionship", "Not Sure Yet"];
    const validTimelines = ["Immediately", "Within a few days", "Within a week", "Within a month", "More than a month", "Just researching"];
    const validBudgets = ["Under $40/hr", "$40-60/hr", "$60+/hr", "Not sure"];
    const validSources = ["Website", "Digital Ads", "Referral Partner", "Event", "Other"];

    res.json({
      name: result.name || "",
      age: result.age || "",
      contactPerson: result.contactPerson || "",
      contactPhone: result.contactPhone || "",
      contactEmail: result.contactEmail || "",
      zipcode: result.zipcode || "",
      relationship: validRelationships.includes(result.relationship) ? result.relationship : "",
      careType: Array.isArray(result.careType) ? result.careType.filter((t) => validCareTypes.includes(t)) : [],
      hoursPerDay: result.hoursPerDay || "",
      timeline: validTimelines.includes(result.timeline) ? result.timeline : "",
      budget: validBudgets.includes(result.budget) ? result.budget : "",
      source: validSources.includes(result.source) ? result.source : "",
      notes: result.notes || "",
    });
  } catch (error) {
    console.error('Analyze lead error:', error);
    res.status(500).json({ error: 'Failed to analyze lead' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
