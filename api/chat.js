import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { messages, leadsContext } = await req.json();
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
      model: openai('gpt-4-turbo'),
      system: systemMessage,
      messages: coreMessages,
      temperature: 0.7,
      maxTokens: 1000,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process chat request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
