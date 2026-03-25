export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { lead, interactions } = await req.json();

    const interactionsSummary = interactions?.length
      ? interactions.map((i) => `- [${i.type}] ${i.date}: ${i.title}${i.description ? ' — ' + i.description : ''}`).join('\n')
      : 'No activity logged yet.';

    const userPrompt = `Summarize this home care lead for a sales rep. Be concise, actionable, and highlight what matters most for the next conversation.

LEAD:
- Name: ${lead.name || 'Unknown'}
- Score: ${lead.score || 'unscored'}
- Stage: ${lead.stage || 'unknown'}
- Care Type: ${lead.careLevel || lead.careType || 'unknown'}
- Contact: ${lead.contactPerson || ''} (${lead.relationship || ''})
- Phone: ${lead.contactPhone || ''} | Email: ${lead.contactEmail || ''}
- Timeline: ${lead.timeline || 'unknown'}
- Budget: ${lead.budget || 'unknown'}
- Hours: ${lead.hoursPerDay || 'unknown'}
- Source: ${lead.source || 'unknown'}
- Last Contact: ${lead.lastContactDate || 'unknown'}
- Date of Birth: ${lead.dateOfBirth || 'unknown'}
- Zipcode: ${lead.zipcode || ''}

INTAKE NOTES:
${lead.intakeNote ? JSON.stringify(lead.intakeNote, null, 2) : 'No intake notes.'}

ACTIVITY LOG (${interactions?.length || 0} entries):
${interactionsSummary}

Write a brief markdown summary covering:
1. Who is this lead and their situation (1-2 sentences)
2. Key care needs and preferences
3. Where they are in the pipeline and engagement level
4. Recommended next steps (be specific)`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a senior care sales assistant. Generate concise, actionable lead summaries for home care CRM users. Use markdown formatting. Keep it under 200 words.',
          },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      return new Response(
        JSON.stringify({ error: `OpenAI error: ${response.status}`, details: errorData }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const summary = data.choices[0].message.content;

    return new Response(JSON.stringify({ summary }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Summarize lead error:', error);
    return new Response(JSON.stringify({ error: 'Failed to summarize lead' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
