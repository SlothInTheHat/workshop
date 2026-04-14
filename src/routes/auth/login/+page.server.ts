import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db/index.js';
import { users } from '$lib/db/schema.js';
import { lucia } from '$lib/auth/index.js';
import { verifyPassword } from '$lib/auth/password.js';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) redirect(302, '/');
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = (data.get('email') as string)?.trim().toLowerCase();
    const password = data.get('password') as string;

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required.' });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      return fail(400, { error: 'Invalid email or password.' });
    }

    const valid = await verifyPassword(user.hashedPassword, password);
    if (!valid) {
      return fail(400, { error: 'Invalid email or password.' });
    }

    const session = await lucia.createSession(user.id, {});
    const cookie = lucia.createSessionCookie(session.id);
    cookies.set(cookie.name, cookie.value, { path: '.', ...cookie.attributes });

    redirect(302, '/');
  },
};
