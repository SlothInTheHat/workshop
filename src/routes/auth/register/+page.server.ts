import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/db/index.js';
import { users } from '$lib/db/schema.js';
import { lucia } from '$lib/auth/index.js';
import { hashPassword } from '$lib/auth/password.js';
import { eq } from 'drizzle-orm';
import { generateId } from 'lucia';

function makeInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const COLORS = [
  'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-red-500',
];

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const name = (data.get('name') as string)?.trim();
    const email = (data.get('email') as string)?.trim().toLowerCase();
    const password = data.get('password') as string;
    const role = (data.get('role') as string)?.trim() || 'Participant';

    if (!name || !email || !password) {
      return fail(400, { error: 'Name, email and password are required.' });
    }
    if (password.length < 8) {
      return fail(400, { error: 'Password must be at least 8 characters.' });
    }

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return fail(400, { error: 'An account with that email already exists.' });
    }

    const hashed = await hashPassword(password);
    const userId = generateId(15);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    await db.insert(users).values({
      id: userId,
      email,
      hashedPassword: hashed,
      name,
      role,
      initials: makeInitials(name),
      color,
    });

    const session = await lucia.createSession(userId, {});
    const cookie = lucia.createSessionCookie(session.id);
    cookies.set(cookie.name, cookie.value, { path: '.', ...cookie.attributes });

    redirect(302, '/');
  },
};
