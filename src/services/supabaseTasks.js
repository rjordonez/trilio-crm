import { supabase } from '@/lib/supabase';

export async function fetchTasks(orgId) {
  if (!orgId) return [];

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('organization_id', orgId)
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data;
}

export async function createTask({ leadId, title, dueDate, priority }, orgId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      organization_id: orgId,
      lead_id: leadId || null,
      title,
      due_date: dueDate,
      priority: priority || 'normal',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(id, updates) {
  const payload = { ...updates };
  if (updates.status === 'done' && !updates.completed_at) {
    payload.completed_at = new Date().toISOString();
  }
  if (updates.status === 'pending') {
    payload.completed_at = null;
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTask(id) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
