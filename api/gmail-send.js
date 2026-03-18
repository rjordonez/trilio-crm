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

    const { to, subject, body } = await req.json();
    if (!to || !subject || !body) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to, subject, body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get Gmail tokens for this user
    const { data: tokenRow, error: tokenError } = await supabase
      .from('gmail_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenRow) {
      return new Response(JSON.stringify({ error: 'Gmail not connected' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let accessToken = tokenRow.access_token;

    // Refresh token if expired
    if (new Date(tokenRow.expiry) <= new Date()) {
      const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: tokenRow.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshRes.ok) {
        console.error('Token refresh failed:', await refreshRes.text());
        return new Response(JSON.stringify({ error: 'Gmail token expired. Please reconnect Gmail.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const refreshed = await refreshRes.json();
      accessToken = refreshed.access_token;
      const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

      await supabase
        .from('gmail_tokens')
        .update({ access_token: accessToken, expiry: newExpiry })
        .eq('user_id', user.id);
    }

    // MIME-encode subject and body for non-ASCII (RFC 2047)
    const toBase64 = (str) => btoa(Array.from(new TextEncoder().encode(str), b => String.fromCharCode(b)).join(''));
    const encodedSubject = `=?UTF-8?B?${toBase64(subject)}?=`;
    const encodedBody = toBase64(body);

    const rawMessage = [
      `From: ${tokenRow.gmail_address}`,
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      encodedBody,
    ].join('\r\n');

    // Base64url encode the entire message
    const encoder = new TextEncoder();
    const bytes = encoder.encode(rawMessage);
    const base64 = btoa(Array.from(bytes, b => String.fromCharCode(b)).join(''))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send via Gmail API
    const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: base64 }),
    });

    if (!sendRes.ok) {
      const errBody = await sendRes.text();
      console.error('Gmail send failed:', sendRes.status, errBody);
      return new Response(JSON.stringify({ error: 'Failed to send email via Gmail' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sendData = await sendRes.json();

    return new Response(JSON.stringify({ success: true, messageId: sendData.id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Gmail send error:', error);
    return new Response(JSON.stringify({ error: 'Failed to send email' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
