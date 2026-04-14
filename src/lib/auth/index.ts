import { Lucia } from 'lucia';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from '$lib/db/index.js';
import { sessions, users } from '$lib/db/schema.js';

const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === 'production',
    },
  },
  getUserAttributes(dbUser) {
    return {
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      initials: dbUser.initials,
      color: dbUser.color,
    };
  },
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      email: string;
      name: string;
      role: string;
      initials: string;
      color: string;
    };
  }
}
