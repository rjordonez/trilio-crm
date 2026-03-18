import { supabase } from '@/lib/supabase';

export async function fetchActivityLogs(leadId, orgId) {
  if (!orgId) return [];

  let query = supabase
    .from('activity_logs')
    .select('*')
    .eq('organization_id', orgId)
    .order('date', { ascending: false });

  if (leadId) {
    query = query.eq('lead_id', leadId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createActivityLog(entry, orgId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('activity_logs')
    .insert({
      user_id: user.id,
      organization_id: orgId,
      lead_id: entry.leadId,
      type: entry.type,
      title: entry.title,
      description: entry.description || null,
      by: entry.by || null,
      tour_note: entry.tourNote || null,
      date: entry.date || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateActivityLog(id, updates) {
  const { data, error } = await supabase
    .from('activity_logs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteActivityLog(id) {
  const { error } = await supabase
    .from('activity_logs')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
