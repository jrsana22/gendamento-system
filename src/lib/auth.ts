import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'segredo-fallback'
)

export type TokenPayload = {
  userId: string
  email: string
  role: 'ADMIN' | 'CLIENT'
  clientId?: string
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as TokenPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = cookies()
  const token = cookieStore.get('session')?.value
  if (!token) return null
  return verifyToken(token)
}

export async function getSessionFromRequest(
  req: NextRequest
): Promise<TokenPayload | null> {
  const token = req.cookies.get('session')?.value
  if (!token) return null
  return verifyToken(token)
}
