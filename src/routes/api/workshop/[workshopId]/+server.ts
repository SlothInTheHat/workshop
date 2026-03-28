import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  workshops,
  getWorkshopTeams,
  getWorkshopParticipants,
  getWorkshopUseCases,
} from '$lib/workshop/store.js';

export const GET: RequestHandler = async ({ params }) => {
  const workshop = workshops.get(params.workshopId);
  if (!workshop) throw error(404, 'Workshop not found');

  const workshopTeams = getWorkshopTeams(params.workshopId);
  const workshopParticipants = getWorkshopParticipants(params.workshopId);
  const useCaseCount = getWorkshopUseCases(params.workshopId).length;

  return json({ workshop, teams: workshopTeams, participants: workshopParticipants, useCaseCount });
};
