import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [membershipStatus, setMembershipStatus] = useState(null); // 'pending' | 'active' | null
  const [loading, setLoading] = useState(true);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailAddress, setGmailAddress] = useState(null);

  const fetchOrganization = useCallback(async (userId) => {
    // First get membership row (uses "Users can view own membership" policy)
    const { data: membership, error: memError } = await supabase
      .from('organization_members')
      .select('id, organization_id, role, status')
      .eq('user_id', userId)
      .in('status', ['active', 'pending'])
      .limit(1)
      .maybeSingle();

    if (memError || !membership) {
      setOrganization(null);
      setMembershipStatus(null);
      return;
    }

    // Then get org details (uses "Anyone can validate org codes" policy)
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, code')
      .eq('id', membership.organization_id)
      .single();

    if (!org) {
      setOrganization(null);
      setMembershipStatus(null);
      return;
    }

    if (membership.status === 'active') {
      setOrganization({
        id: org.id,
        name: org.name,
        code: org.code,
        role: membership.role,
      });
      setMembershipStatus('active');
    } else if (membership.status === 'pending') {
      setOrganization({
        id: org.id,
        name: org.name,
        code: null,
        role: null,
      });
      setMembershipStatus('pending');
    }
  }, []);

  const refreshOrganization = useCallback(async () => {
    if (user) {
      await fetchOrganization(user.id);
    }
  }, [user, fetchOrganization]);

  const fetchGmailStatus = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('gmail_tokens')
      .select('gmail_address')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      setGmailConnected(false);
      setGmailAddress(null);
    } else {
      setGmailConnected(true);
      setGmailAddress(data.gmail_address);
    }
  }, []);

  const refreshGmailStatus = useCallback(async () => {
    if (user) {
      await fetchGmailStatus(user.id);
    }
  }, [user, fetchGmailStatus]);

  // Store Google OAuth provider tokens as Gmail tokens for sending
  const storeGoogleTokens = useCallback(async (session) => {
    if (!session?.provider_token || !session?.user) return;

    try {
      const res = await fetch('/api/gmail-store-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          google_access_token: session.provider_token,
          google_refresh_token: session.provider_refresh_token || '',
        }),
      });

      if (res.ok) {
        await fetchGmailStatus(session.user.id);
      }
    } catch (err) {
      console.error('Failed to store Google tokens:', err);
    }
  }, [fetchGmailStatus]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        Promise.all([
          fetchOrganization(currentUser.id),
          fetchGmailStatus(currentUser.id),
        ]).finally(() => setLoading(false));

        if (session?.provider_token) {
          storeGoogleTokens(session);
        }
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchOrganization(currentUser.id);
        fetchGmailStatus(currentUser.id);

        if (event === 'SIGNED_IN' && session?.provider_token) {
          storeGoogleTokens(session);
        }
      } else {
        setOrganization(null);
        setMembershipStatus(null);
        setGmailConnected(false);
        setGmailAddress(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchOrganization, fetchGmailStatus, storeGoogleTokens]);

  const signIn = (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signInWithGoogle = () => {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/gmail.send',
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  };

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) return { data, error };
    return { data, error: null };
  };

  const requestToJoinOrganization = async (orgCode) => {
    if (!user) return { error: { message: 'Not authenticated' } };

    const { data, error } = await supabase.rpc('request_to_join_organization', {
      p_user_id: user.id,
      p_org_code: orgCode,
    });

    if (error) {
      return { error: { message: error.message.includes('not found') ? 'Invalid organization code' : error.message } };
    }

    await fetchOrganization(user.id);
    return { data, error: null };
  };

  const createOrganization = async (orgName) => {
    if (!user) return { error: { message: 'Not authenticated' } };

    const { data, error } = await supabase.rpc('create_organization', {
      p_user_id: user.id,
      p_org_name: orgName,
    });

    if (error) {
      return { error: { message: error.message } };
    }

    await fetchOrganization(user.id);
    return { data, error: null };
  };

  const leaveOrganization = async () => {
    if (!user) return { error: { message: 'Not authenticated' } };

    // Delete own membership row
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      return { error: { message: error.message } };
    }

    setOrganization(null);
    setMembershipStatus(null);
    return { error: null };
  };

  const signOut = () => {
    return supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user, organization, membershipStatus, loading,
      gmailConnected, gmailAddress, refreshGmailStatus,
      signIn, signInWithGoogle, signUp, signOut,
      requestToJoinOrganization, createOrganization, leaveOrganization, refreshOrganization,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
