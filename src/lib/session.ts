import type { Cookies } from '@sveltejs/kit';

export type SessionRole = 'facilitator' | 'contributor';

export interface PreWorkshopSession {
	name: string;
	role: SessionRole;
	tenantId: string;
	workshopId?: string;
	facilitatorCode?: string;
	contributorCode?: string;
}

const COOKIE_NAME = 'pw_session';
const DEFAULT_TENANT = 'default';

export function getSession(cookies: Cookies): PreWorkshopSession | null {
	const raw = cookies.get(COOKIE_NAME);
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw) as PreWorkshopSession;
		if (!parsed.name || !parsed.role || !parsed.tenantId) return null;
		return parsed;
	} catch {
		return null;
	}
}

export function setSession(
	cookies: Cookies,
	name: string,
	role: SessionRole,
	workshopId?: string,
	facilitatorCode?: string,
	contributorCode?: string
): void {
	const session: PreWorkshopSession = {
		name,
		role,
		tenantId: DEFAULT_TENANT,
		workshopId,
		facilitatorCode,
		contributorCode
	};
	cookies.set(COOKIE_NAME, JSON.stringify(session), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 7 // 7 days
	});
}

export function clearSession(cookies: Cookies): void {
	cookies.delete(COOKIE_NAME, { path: '/' });
}

export function getAccessCodes(): { facilitator: string; contributor: string } {
	const raw = process.env.PHASE1_ACCESS_CODES ?? 'FACILITATOR=FAC123,CONTRIBUTOR=CON123';
	const parts = Object.fromEntries(raw.split(',').map((p) => p.trim().split('=') as [string, string]));
	return {
		facilitator: (parts['FACILITATOR'] ?? 'FAC123').trim(),
		contributor: (parts['CONTRIBUTOR'] ?? 'CON123').trim()
	};
}
