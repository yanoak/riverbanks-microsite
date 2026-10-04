import type { PageServerLoad } from './$types';

// Share cards need absolute URLs. On Vercel the production domain is known at build time
// (it becomes riverbanks.lol once the domain is attached); elsewhere, assume it.
export const load: PageServerLoad = () => {
	const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
	return { origin: host ? `https://${host}` : 'https://riverbanks.lol' };
};
