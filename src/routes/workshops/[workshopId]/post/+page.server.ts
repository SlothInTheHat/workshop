import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
  const workshopId = params.workshopId;
  console.log('[POST-WORKSHOP] Loading for workshopId:', workshopId);

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

    // Fetch stack rank
    let stackRank = [];
    try {
      const stackRankRes = await fetch(`/api/workshop/${workshopId}/stackrank`);
      stackRank = stackRankRes.ok ? await stackRankRes.json() : [];
    } catch (err) {
      console.error('Failed to load stack rank:', err);
    }

    // Fetch teams
    const teams = workshopData.teams || [];

    // Try to fetch existing summary
    let existingSummary = null;
    try {
      const summaryRes = await fetch(`/api/workshop/${workshopId}/summary`);
      existingSummary = summaryRes.ok ? await summaryRes.json() : null;
    } catch (err) {
      console.error('Failed to load existing summary:', err);
    }

    return {
      workshop: workshopData.workshop,
      teams,
      useCases,
      stackRank,
      existingSummary,
    };
  } catch (err) {
    console.error('Failed to load workshop data:', err);
    throw error(500, 'Failed to load workshop data');
  }
};
