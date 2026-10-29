import { error, redirect } from '@sveltejs/kit';
import { EDITION } from '$lib/comic/edition';
import { entries as pages, guard } from '$lib/comic/reader';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => pages(EDITION);

export const load: PageLoad = ({ params }) => {
	const to = guard(EDITION, params.n);
	if (!to) error(404, 'No such page');
	if ('redirect' in to) redirect(307, `/p/${to.redirect}`);
	return { page: to.page };
};
