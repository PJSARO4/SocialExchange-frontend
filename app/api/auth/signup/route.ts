import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';

export async function POST(request: NextRequest) {
    try {
          const body = await request.json();
          const email = (body.email || '').trim().toLowerCase();
          const password = body.password || '';
          const name = body.name || null;

      if (!email || !password) {
              return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
      }
          if (password.length < 8) {
                  return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
          }

      const existing = await prisma.user.findUnique({ where: { email } });
          if (existing) {
                  return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
          }

      const user = await prisma.user.create({
              data: {
                        email,
                        name,
                        password: hashPassword(password),
              },
      });

      return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
    } catch (error) {
          console.error('[Signup POST]', error);
          return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }
}
