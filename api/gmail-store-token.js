import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { google_access_token, google_refresh_token } = await req.json();
    if (!google_access_token) {
      return new Response(JSON.stringify({ error: 'Missing google_access_token' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get Gmail address from Google token
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
      headers: { Authorization: `Bearer ${google_access_token}` },
    });

    if (!userInfoRes.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch Google user info' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userInfo = await userInfoRes.json();
    const expiry = new Date(Date.now() + 3600 * 1000).toISOString();

    const { error: upsertError } = await supabase
      .from('gmail_tokens')
      .upsert({
        user_id: user.id,
        access_token: google_access_token,
        refresh_token: google_refresh_token || '',
        expiry,
        gmail_address: userInfo.email,
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Token storage error:', upsertError);
      return new Response(JSON.stringify({ error: 'Failed to store token' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, gmail_address: userInfo.email }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Gmail store token error:', error);
    return new Response(JSON.stringify({ error: 'Failed to store token' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
