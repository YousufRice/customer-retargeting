import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "session";
const MAX_AGE = 60 * 60 * 24;

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET must be at least 32 characters long"
    );
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  jti: string;
  iat: number;
  exp: number;
}

export async function encrypt(): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());
}

export async function decrypt(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (
      typeof payload.jti !== "string" ||
      typeof payload.iat !== "number" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: MAX_AGE,
  path: "/",
} as const;
