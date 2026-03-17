// See https://svelte.dev/docs/kit/types#app.d.ts

import type { AuthUser } from '@optura-ai/agent-ui-kit/auth';

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      user: AuthUser | undefined;
      accessToken: string | undefined;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
