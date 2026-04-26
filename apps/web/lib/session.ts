import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const cookieName = "library_session";

export type SessionUser = {
  email: string;
  name: string;
  role: string;
};

function secret() {
  return process.env.SESSION_SECRET ?? "phase-1-local-demo-secret";
}

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString();
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function verify(payload: string, signature: string) {
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function createSession(user: SessionUser) {
  const payload = encode(JSON.stringify(user));
  const signature = sign(payload);
  cookies().set(cookieName, `${payload}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export async function clearSession() {
  cookies().delete(cookieName);
}

export async function getSession(): Promise<SessionUser | null> {
  const value = cookies().get(cookieName)?.value;
  if (!value) {
    return null;
  }

  const [payload, signature] = value.split(".");
  if (!payload || !signature || !verify(payload, signature)) {
    return null;
  }

  return JSON.parse(decode(payload)) as SessionUser;
}

export async function requireUser() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}
