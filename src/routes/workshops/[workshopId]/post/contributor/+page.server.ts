import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
  const workshopId = params.workshopId;

  try {
    // Fetch workshop details
    const workshopRes = await fetch(`/api/workshop/${workshopId}`);
    if (!workshopRes.ok) throw error(404, 'Workshop not found');
    const workshopData = await workshopRes.json();

    // Fetch use cases
    let useCases = [];
    try {
      const useCasesRes = await fetch(`/api/workshop/${workshopId}/usecases`);
      useCases = useCasesRes.ok ? await useCasesRes.json() : [];
    } catch (err) {
      console.error('Failed to load use cases:', err);
    }

    // Fetch teams
    const teams = workshopData.teams || [];

    return {
      workshop: workshopData.workshop,
      teams,
      useCases,
    };
  } catch (err) {
    console.error('Failed to load workshop data:', err);
    throw error(500, 'Failed to load workshop data');
  }
};
