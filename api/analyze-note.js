export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { transcription } = await req.json();

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

    return new Response(JSON.stringify({
      title: result.title || 'Note added',
      description: result.description || transcription,
      type: ['call', 'email', 'tour', 'meeting', 'note'].includes(result.type) ? result.type : 'note'
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Analyze note error:', error);
    return new Response(JSON.stringify({ error: 'Failed to analyze note' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
