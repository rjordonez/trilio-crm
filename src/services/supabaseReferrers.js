import { supabase } from '@/lib/supabase';

export async function fetchReferrers(orgId) {
  if (!orgId) return [];

  const { data, error } = await supabase
    .from('referrers')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map((row) => ({ ...row.data, id: row.id }));
}

export async function createReferrer(referrerData, orgId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { id, ...rest } = referrerData;

  const { data, error } = await supabase
    .from('referrers')
    .insert({ user_id: user.id, organization_id: orgId, data: rest })
    .select()
    .single();

  if (error) throw error;
  return { ...data.data, id: data.id };
}

export async function createReferrersBulk(referrersArray, orgId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const rows = referrersArray.map((referrerData) => {
    const { id, ...rest } = referrerData;
    return { user_id: user.id, organization_id: orgId, data: rest };
  });

  const { data, error } = await supabase
    .from('referrers')
    .insert(rows)
    .select();

  if (error) throw error;
  return data.map((row) => ({ ...row.data, id: row.id }));
}

export async function updateReferrer(id, referrerData) {
  const { id: _id, ...rest } = referrerData;

  // Fetch existing data first to merge, so partial updates don't wipe the JSONB column
  const { data: existing, error: fetchErr } = await supabase
    .from('referrers')
    .select('data')
    .eq('id', id)
    .single();

  if (fetchErr) throw fetchErr;

  const merged = { ...(existing.data || {}), ...rest };

  const { data, error } = await supabase
    .from('referrers')
    .update({ data: merged })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return { ...data.data, id: data.id };
}

export async function deleteReferrer(id) {
  const { error } = await supabase
    .from('referrers')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
