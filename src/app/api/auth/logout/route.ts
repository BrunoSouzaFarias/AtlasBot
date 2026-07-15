import { SESSION_COOKIE } from '@/lib/auth/session';

export async function POST() {
  const response = Response.json({ success: true });
  response.headers.set(
    'Set-Cookie',
    `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
  );
  return response;
}
