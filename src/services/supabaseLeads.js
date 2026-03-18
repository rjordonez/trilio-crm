import { supabase } from '@/lib/supabase';

export async function fetchLeads(orgId) {
  if (!orgId) return [];

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map((row) => ({ ...row.data, id: row.id }));
}

export async function createLead(leadData, orgId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { id, ...rest } = leadData;

  const { data, error } = await supabase
    .from('leads')
    .insert({ user_id: user.id, organization_id: orgId, data: rest })
    .select()
    .single();

  if (error) throw error;
  return { ...data.data, id: data.id };
}

export async function createLeadsBulk(leadsArray, orgId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const rows = leadsArray.map((leadData) => {
    const { id, ...rest } = leadData;
    return { user_id: user.id, organization_id: orgId, data: rest };
  });

  const { data, error } = await supabase
    .from('leads')
    .insert(rows)
    .select();

  if (error) throw error;
  return data.map((row) => ({ ...row.data, id: row.id }));
}

export async function updateLead(id, leadData) {
  const { id: _id, ...rest } = leadData;

  // Fetch existing data first to merge, so partial updates don't wipe the JSONB column
  const { data: existing, error: fetchErr } = await supabase
    .from('leads')
    .select('data')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;

  const merged = { ...(existing.data || {}), ...rest };

  const { data, error } = await supabase
    .from('leads')
    .update({ data: merged })
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
