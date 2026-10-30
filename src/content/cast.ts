/**
 * The cast page: the characters with speaking roles, in order of first appearance. Who speaks
 * comes from each act's script (see plans/2026-10-30_cast-page.plan.md); the one-liners are
 * written from the story network's summaries and are Sam's to approve. Portraits are made by
 * `scripts/cast-portraits.sh`.
 */

export const ACTS = [
	'Prologue',
	'Act One',
	'Act Two',
	'Act Three',
	'Act Four',
	'Act Five',
	'Epilogue'
] as const;
export type Act = (typeof ACTS)[number];

export type Character = {
	/** The link fragment: /cast#<id>. */
	id: string;
	name: string;
	/** The acts they speak or appear in, in book order. */
	acts: Act[];
	/** One sentence. */
	line: string;
	portrait: string;
	alt: string;
};

const person = (c: Omit<Character, 'portrait'>): Character => ({
	...c,
	portrait: `/cast/${c.id}.webp`
});

export const CAST: Character[] = [
	person({
		id: 'darya',
		name: 'Darya',
		acts: ['Prologue', 'Act Three'],
		line: 'A veteran Manila banker who, sheltering from the sixth disaster in a single week, dreams up the institutions the world will need next.',
		alt: 'Darya: long black hair, glasses and a grey blazer.'
	}),
	person({
		id: 'nusa',
		name: 'Nusa',
		acts: ['Act One', 'Act Three'],
		line: 'A Minangkabau elder from West Sumatra who opens the 2028 Sunda Summit, and later mentors Ismahan.',
		alt: 'Nusa: an old woman with white hair and a teal stole.'
	}),
	person({
		id: 'ismahan',
		name: 'Ismahan',
		acts: ['Act One', 'Act Two', 'Act Three', 'Act Four', 'Epilogue'],
		line: 'Youngest child of the Sultan of Muara, the youngest delegate at the Sunda Summit, and in time the first and last matriarch of Muara.',
		alt: 'Ismahan at eighteen: a long braid and a cream blouse.'
	}),
	person({
		id: 'sultan-nuh',
		name: 'Sultan Nuh',
		acts: ['Act Two'],
		line: 'The ageing Sultan of Muara, who doubts the Summit and sends his youngest in place of his sons.',
		alt: 'Sultan Nuh: a grey beard, a black songkok and a white baju.'
	}),
	person({
		id: 'hamzah',
		name: 'Tengku Hamzah',
		acts: ['Act Two', 'Act Three'],
		line: "The General, Muara's elder prince, who learns that care wins more than force.",
		alt: 'Tengku Hamzah: short black hair and an olive military uniform with medals.'
	}),
	person({
		id: 'faris',
		name: 'Tengku Faris',
		acts: ['Act Two', 'Act Three'],
		line: "The Financier, Muara's second prince, back from Wall Street, who ends up taking dams down for a living.",
		alt: 'Tengku Faris: slicked black hair, a black suit and a phone in his hand.'
	}),
	person({
		id: 'dew',
		name: 'Dew',
		acts: ['Act Four'],
		line: 'Runs the family restaurant on stilts on the Ping, cooking by the Gross Deliciousness Index before it had a name.',
		alt: 'Dew: an old woman with her grey hair in a bun and a brown apron.'
	}),
	person({
		id: 'ya',
		name: 'Ya',
		acts: ['Act Four', 'Act Five', 'Epilogue'],
		line: "Dew's granddaughter from Chiang Mai, a cook who becomes a researcher of food ecosystems.",
		alt: 'Ya at twenty: a black bob with a fringe and a red apron.'
	}),
	person({
		id: 'taro',
		name: 'Taro',
		acts: ['Act Four', 'Act Five', 'Epilogue'],
		line: "Ya's grey tabby, a kitten on the 2052 sailabout who grows up to keep the family's memories.",
		alt: 'Taro: a grey tabby cat with green eyes and a white chest.'
	}),
	person({
		id: 'jalal',
		name: 'Jalal',
		acts: ['Act Five'],
		line: 'A fisherman on the Meghna whose second-hand drone nets a research-tagged hilsa.',
		alt: 'Jalal: a moustache, a white vest and a yellow cloth over one shoulder.'
	}),
	person({
		id: 'shapla',
		name: 'Shapla',
		acts: ['Act Five'],
		line: "Jalal's wife, from a family whose history is one of leaving, who cooks the tagged hilsa into a feast.",
		alt: 'Shapla: her hair in a bun and a green sari.'
	}),
	person({
		id: 'teja',
		name: 'Teja',
		acts: ['Epilogue'],
		line: "Ismahan's granddaughter, who at eleven travels with her to the seed vault on Svalbard.",
		alt: 'Teja at eleven: a high ponytail and a teal dress.'
	}),
	person({
		id: 'biret',
		name: 'Biret',
		acts: ['Epilogue'],
		line: 'A Sámi elder and keeper of the Svalbard Global Seed Vault, dry and unimpressed.',
		alt: 'Biret: short grey hair and a dark tunic with bright Sámi bands.'
	})
];

export function castUrl(origin: string, id?: string): string {
	return `${origin}/cast${id ? `#${id}` : ''}`;
}

/** "Acts One–Four · Epilogue": runs of acts together, the Prologue and Epilogue on their own. */
export function actsLabel(acts: Act[]): string {
	const parts: string[] = [];
	let run: string[] = [];
	const flush = () => {
		if (run.length === 1) parts.push(`Act ${run[0]}`);
		else if (run.length === 2) parts.push(`Acts ${run[0]} & ${run[1]}`);
		else if (run.length > 2) parts.push(`Acts ${run[0]}–${run.at(-1)}`);
		run = [];
	};
	acts.forEach((act, i) => {
		const n = act.startsWith('Act ') ? act.slice(4) : null;
		const next = i > 0 && ACTS.indexOf(act) === ACTS.indexOf(acts[i - 1]) + 1;
		if (!n) {
			flush();
			parts.push(act);
		} else {
			if (!next) flush();
			run.push(n);
		}
	});
	flush();
	return parts.join(' · ');
}
