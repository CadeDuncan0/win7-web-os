import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import z from 'zod'

import { ADMIN_COOKIE_NAME, adminToken, isAdminPassword } from '@/lib/adminAuth'

// Admin session endpoint. POST verifies the password and issues the httpOnly
// admin cookie; DELETE clears it (sign-out). The cookie is what the proxy gates
// /win7/desktop on — the client never sees its value.

const LoginSchema = z.object({ password: z.string() })

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = LoginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Password is required' }, { status: 400 })
  }

  const token = await adminToken()
  if (token === null) {
    return NextResponse.json(
      { ok: false, error: 'Admin sign-in is not configured' },
      { status: 503 }
    )
  }

  if (!(await isAdminPassword(parsed.data.password))) {
    return NextResponse.json({ ok: false, error: 'Incorrect password' }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    // No maxAge — a session cookie that lives until the browser closes,
    // mirroring the client-side session marker's lifetime.
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE_NAME)
  return NextResponse.json({ ok: true })
}
