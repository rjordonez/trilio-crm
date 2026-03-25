export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { transcription, context } = await req.json();

    const userPrompt = `Extract lead information from this transcribed audio recording for a home care / senior care CRM. Return JSON with these fields (leave empty string or empty array if not mentioned):

- "name": client/patient full name (the person who needs care)
- "dateOfBirth": date of birth as string (MM/DD/YYYY or similar format)
- "contactPerson": name of the person calling or making the inquiry (may be same as client)
- "contactPhone": phone number if mentioned
- "contactEmail": email if mentioned
- "zipcode": zip code if mentioned
- "relationship": MUST be one of: "Self", "Daughter / Son", "Spouse", "Relative", "Hospital / Social Worker", "Care Manager", "Other" — or empty string
- "careType": array of care types mentioned, each MUST be one of: "Assisted Living", "Independent Living", "Memory Care", "Skilled Nursing"
- "hoursPerDay": hours of care needed if mentioned (e.g. "20 hours", "4-6 hours")
- "timeline": MUST be one of: "Immediately", "Within a few days", "Within a week", "Within a month", "More than a month", "Just researching" — or empty string
- "budget": MUST be one of: "Under $40/hr", "$40–60/hr", "$60+/hr", "Not sure" — or empty string
- "source": MUST be one of: "Digital Ads", "Website", "Phone Call", "Walk-in", "Referral", "Event" — or empty string. Infer from context if possible.
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
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
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
      console.error('OpenAI API error:', response.status, errorData);
      return new Response(
        JSON.stringify({ error: `OpenAI error: ${response.status}`, details: errorData }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    // Validate enum fields
    const validRelationships = ["Self", "Daughter / Son", "Spouse", "Relative", "Hospital / Social Worker", "Care Manager", "Other"];
    const validCareTypes = ["Assisted Living", "Independent Living", "Memory Care", "Skilled Nursing"];
    const validTimelines = ["Immediately", "Within a few days", "Within a week", "Within a month", "More than a month", "Just researching"];
    const validBudgets = ["Under $40/hr", "$40–60/hr", "$60+/hr", "Not sure"];
    const validSources = ["Digital Ads", "Website", "Phone Call", "Walk-in", "Referral", "Event"];

    const cleaned = {
      name: result.name || "",
      dateOfBirth: result.dateOfBirth || "",
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
    };

    return new Response(JSON.stringify(cleaned), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Analyze lead error:', error);
    return new Response(JSON.stringify({ error: 'Failed to analyze lead' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
