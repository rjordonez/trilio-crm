import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

// Supabase service client for server-side operations
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper: extract authenticated user from Authorization header
async function getAuthUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

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
- "relationship": MUST be one of: "Self", "Daughter / Son", "Spouse", "Relative", "Hospital / Social Worker", "Care Manager", "Other" — or empty string
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

    const validRelationships = ["Self", "Daughter / Son", "Spouse", "Relative", "Hospital / Social Worker", "Care Manager", "Other"];
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

// ─── Gmail Integration Routes ────────────────────────────────────────────────

// Store Google OAuth tokens from Supabase Google sign-in
app.post('/api/gmail-store-token', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { google_access_token, google_refresh_token } = req.body;
    if (!google_access_token) {
      return res.status(400).json({ error: 'Missing google_access_token' });
    }

    // Get the user's Gmail address from the Google token
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
      headers: { Authorization: `Bearer ${google_access_token}` },
    });

    if (!userInfoRes.ok) {
      return res.status(502).json({ error: 'Failed to fetch Google user info' });
    }

    const userInfo = await userInfoRes.json();

    // Default expiry: 1 hour from now (standard Google access token lifetime)
    const expiry = new Date(Date.now() + 3600 * 1000).toISOString();

    const { error: upsertError } = await supabaseAdmin
      .from('gmail_tokens')
      .upsert({
        user_id: user.id,
        access_token: google_access_token,
        refresh_token: google_refresh_token || '',
        expiry,
        gmail_address: userInfo.email,
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Token storage error:', upsertError);
      return res.status(500).json({ error: 'Failed to store token' });
    }

    res.json({ success: true, gmail_address: userInfo.email });
  } catch (error) {
    console.error('Gmail store token error:', error);
    res.status(500).json({ error: 'Failed to store token' });
  }
});

app.get('/api/gmail-auth-url', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/api/gmail-callback';

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/gmail.send email',
      access_type: 'offline',
      prompt: 'consent',
      state: user.id,
    });

    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  } catch (error) {
    console.error('Gmail auth URL error:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

app.get('/api/gmail-callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query;
    if (!code || !userId) return res.redirect('/integrations?gmail=error');

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/api/gmail-callback';

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      console.error('Token exchange failed:', await tokenRes.text());
      return res.redirect('/integrations?gmail=error');
    }

    const tokens = await tokenRes.json();

    // Get Gmail address
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!userInfoRes.ok) return res.redirect('/integrations?gmail=error');
    const userInfo = await userInfoRes.json();

    const expiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { error: upsertError } = await supabaseAdmin
      .from('gmail_tokens')
      .upsert({
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry,
        gmail_address: userInfo.email,
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Token storage error:', upsertError);
      return res.redirect('/integrations?gmail=error');
    }

    res.redirect('/integrations?gmail=connected');
  } catch (error) {
    console.error('Gmail callback error:', error);
    res.redirect('/integrations?gmail=error');
  }
});

app.post('/api/gmail-send', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { to, subject, body } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
    }

    // Get Gmail tokens
    const { data: tokenRow, error: tokenError } = await supabaseAdmin
      .from('gmail_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenRow) {
      return res.status(400).json({ error: 'Gmail not connected' });
    }

    let accessToken = tokenRow.access_token;

    // Refresh if expired
    if (new Date(tokenRow.expiry) <= new Date()) {
      const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: tokenRow.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshRes.ok) {
        return res.status(401).json({ error: 'Gmail token expired. Please reconnect Gmail.' });
      }

      const refreshed = await refreshRes.json();
      accessToken = refreshed.access_token;
      const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

      await supabaseAdmin
        .from('gmail_tokens')
        .update({ access_token: accessToken, expiry: newExpiry })
        .eq('user_id', user.id);
    }

    // MIME-encode subject for non-ASCII characters (RFC 2047)
    const encodedSubject = `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`;

    // Build RFC 2822 message
    const rawMessage = [
      `From: ${tokenRow.gmail_address}`,
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(body).toString('base64'),
    ].join('\r\n');

    // Base64url encode
    const base64 = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send via Gmail API
    const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: base64 }),
    });

    if (!sendRes.ok) {
      const errBody = await sendRes.text();
      console.error('Gmail send failed:', sendRes.status, errBody);
      return res.status(502).json({ error: 'Failed to send email via Gmail' });
    }

    const sendData = await sendRes.json();
    res.json({ success: true, messageId: sendData.id });
  } catch (error) {
    console.error('Gmail send error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.post('/api/gmail-disconnect', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { error } = await supabaseAdmin
      .from('gmail_tokens')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Gmail disconnect error:', error);
      return res.status(500).json({ error: 'Failed to disconnect' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Gmail disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
