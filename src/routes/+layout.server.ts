import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
  return {
    user: locals.user
      ? { id: locals.user.id, name: locals.user.name, initials: locals.user.initials, color: locals.user.color }
      : null,
  };
};
