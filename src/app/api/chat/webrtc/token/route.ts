import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  // Servidores STUN públicos de alta disponibilidade do Google (fallback de baixo custo/grátis)
  const fallbackIceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ];

  if (!accountSid || !authToken) {
    return Response.json({ iceServers: fallbackIceServers });
  }

  try {
    // Requisição HTTP básica para a API REST da Twilio para gerar tokens TURN temporários
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Tokens.json`;
    const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
      },
    });

    if (!res.ok) {
      console.warn('Twilio API returned error status, using public STUN fallback.');
      return Response.json({ iceServers: fallbackIceServers });
    }

    const data = await res.json();
    return Response.json({ iceServers: data.ice_servers || fallbackIceServers });
  } catch (error) {
    console.error('Failed to request Twilio TURN token:', error);
    return Response.json({ iceServers: fallbackIceServers });
  }
}
