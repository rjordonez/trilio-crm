import { supabase } from '@/lib/supabase';

export async function fetchLeads() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map((row) => ({ ...row.data, id: row.id }));
}

export async function createLead(leadData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { id, ...rest } = leadData;

  const { data, error } = await supabase
    .from('leads')
    .insert({ user_id: user.id, data: rest })
    .select()
    .single();

  if (error) throw error;
  return { ...data.data, id: data.id };
}

export async function updateLead(id, leadData) {
  const { id: _id, ...rest } = leadData;

  const { data, error } = await supabase
    .from('leads')
    .update({ data: rest })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return { ...data.data, id: data.id };
}

export async function deleteLead(id) {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
