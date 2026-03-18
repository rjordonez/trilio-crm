import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrganization = async (userId) => {
    const { data, error } = await supabase
      .from('organization_members')
      .select('organization_id, role, organizations(id, name, code)')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (error || !data) {
      setOrganization(null);
      return;
    }

    setOrganization({
      id: data.organizations.id,
      name: data.organizations.name,
      code: data.organizations.code,
      role: data.role,
    });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchOrganization(currentUser.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchOrganization(currentUser.id);
      } else {
        setOrganization(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email, password, fullName, orgCode) => {
    // Validate org code first
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('code', orgCode)
      .single();

    if (orgError || !org) {
      return { error: { message: 'Invalid organization code' } };
    }

    // Create the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) return { data, error };

    // Add user to the organization via SECURITY DEFINER function (bypasses RLS)
    if (data.user) {
      const { error: memberError } = await supabase
        .rpc('join_organization_by_code', {
          p_user_id: data.user.id,
          p_org_code: orgCode,
        });

      if (memberError) {
        return { data, error: { message: 'Account created but failed to join organization. Contact your admin.' } };
      }
    }

    return { data, error: null };
  };

  const signOut = () => {
    return supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, organization, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
