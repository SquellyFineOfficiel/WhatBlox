import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

export type SignedSessionUser = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
};

const SESSION_COOKIE = 'rbx_session';

function getSessionSecret() {
  return process.env.RBX_SESSION_SECRET || process.env.ROBLOX_OAUTH_SECRET || '';
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signPayload(payload: string) {
  const secret = getSessionSecret();
  if (!secret) {
    return null;
  }

  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createSignedSessionCookie(user: SignedSessionUser) {
  const payload = base64UrlEncode(JSON.stringify({ ...user, issuedAt: Date.now() }));
  const signature = signPayload(payload);

  if (!signature) {
    return null;
  }

  return `${payload}.${signature}`;
}

export function verifySignedSessionCookie(value: string | null | undefined): SignedSessionUser | null {
  if (!value) {
    return null;
  }

  const secret = getSessionSecret();
  if (!secret) {
    return null;
  }

  const [payload, signature] = value.split('.');
  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(payload);
  if (!expectedSignature) {
    return null;
  }

  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const actualBuffer = Buffer.from(signature, 'utf8');
  if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as SignedSessionUser & { issuedAt?: number };
    if (!parsed.id) {
      return null;
    }

    return {
      id: parsed.id,
      name: parsed.name ?? null,
      avatarUrl: parsed.avatarUrl ?? null,
    };
  } catch {
    return null;
  }
}

export async function getVerifiedServerUser(): Promise<SignedSessionUser | null> {
  const cookieStore = await cookies();
  return verifySignedSessionCookie(cookieStore.get(SESSION_COOKIE)?.value);
}

export function sessionCookieName() {
  return SESSION_COOKIE;
}