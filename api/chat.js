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
    const { messages, leadsContext, referrersContext, tasksContext } = await req.json();

    const systemMessage = `You are Trilio, an AI assistant for a home care CRM system. You have access to all of the user's data.

LEADS DATA (${leadsContext?.length || 0} leads):
${JSON.stringify(leadsContext, null, 2)}

REFERRAL PARTNERS DATA (${referrersContext?.length || 0} partners):
${JSON.stringify(referrersContext, null, 2)}

PENDING TASKS (${tasksContext?.length || 0} tasks):
${JSON.stringify(tasksContext, null, 2)}

You can help the user with:
- Questions about their leads pipeline (stages, scores, care types, budgets, timelines)
- Referral partner information and performance
- Follow-up recommendations based on last contact dates
- Insights on conversion rates and pipeline health
- Suggestions for next steps with specific leads
- Summarizing lead details and intake notes
- Reviewing and discussing their task list and upcoming follow-ups

You can manage tasks for the user. When they ask you to:
- Create a task: respond with the task details and include a JSON block: {"action":"create_task","title":"...","dueDate":"YYYY-MM-DD","priority":"normal"}
  - If the task is about a specific lead, add "leadId":"<uuid>" to the JSON block
  - If the task is general (not about a specific lead), omit leadId
- List tasks: summarize their pending tasks from the context data
- Complete a task: respond confirming and include: {"action":"complete_task","taskId":"..."}

Always confirm the action in natural language alongside the JSON block.

Be concise, specific, and use actual names and data from the records. When discussing leads, mention relevant details like their stage, score, care type, and last contact. Format responses with markdown for readability.`;

    const coreMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.parts.map(part => {
        if (part.type === 'text') return part.text;
        return part;
      }).filter(Boolean).join('')
    }));

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemMessage,
      messages: coreMessages,
      temperature: 0.7,
      maxTokens: 1500,
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
