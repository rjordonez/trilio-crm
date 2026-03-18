import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const userId = url.searchParams.get('state');

    if (!code || !userId) {
      return Response.redirect(`${url.origin}/integrations?gmail=error`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${url.origin}/api/gmail-callback`;

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      console.error('Token exchange failed:', await tokenRes.text());
      return Response.redirect(`${url.origin}/integrations?gmail=error`);
    }

    const tokens = await tokenRes.json();

    // Get user's Gmail address
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      console.error('User info fetch failed');
      return Response.redirect(`${url.origin}/integrations?gmail=error`);
    }

    const userInfo = await userInfoRes.json();

    // Store tokens in Supabase via service role
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const expiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { error: upsertError } = await supabase
      .from('gmail_tokens')
      .upsert({
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry,
        gmail_address: userInfo.email,
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Token storage error:', upsertError);
      return Response.redirect(`${url.origin}/integrations?gmail=error`);
    }

    return Response.redirect(`${url.origin}/integrations?gmail=connected`);
  } catch (error) {
    console.error('Gmail callback error:', error);
    const url = new URL(req.url);
    return Response.redirect(`${url.origin}/integrations?gmail=error`);
  }
}
