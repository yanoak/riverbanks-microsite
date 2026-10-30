/**
 * The get-involved form's fields on the Google Form behind it ("Riverbanks: get involved", set up
 * with scripts/get-involved-form.json). The page posts to the form's formResponse endpoint, where
 * each question is a field named entry.<its question id, hex, as decimal>. Change a question's
 * wording in the form and the ids stay; add or remove one and this file follows.
 */

const RESPONDER =
	'https://docs.google.com/forms/d/e/1FAIpQLSfCazuHHJPb1q6yudtSfumyAfHIC-xru_oK8k55ahShy_pW9g';
export const FORM_RESPONSE = `${RESPONDER}/formResponse`;
/** The Google Form itself, for when sending fails. */
export const FORM_VIEW = `${RESPONDER}/viewform`;

export const QUESTION_IDS = {
	interests: '562daeda',
	name: '4b4ab01a',
	place: '0ea13c05',
	community: '1141849b',
	language: '548b7a25',
	message: '5bbbccfb',
	email: '7b612db6',
	updates: '1533b82d'
} as const;

export const ENTRY = Object.fromEntries(
	Object.entries(QUESTION_IDS).map(([k, hex]) => [k, parseInt(hex, 16)])
) as Record<keyof typeof QUESTION_IDS, number>;

/** The interests, worded exactly as the form's options. */
export const INTERESTS = [
	'Translate it into my language',
	'Exhibit it for my community',
	'Host a talk or workshop',
	'Publish or print it',
	'Teach with it',
	'Collaborate on what comes next'
] as const;
export const TRANSLATE = INTERESTS[0];
export const UPDATES_OPTION = 'Yes, send me news about Riverbanks';

export type Answers = {
	interests: string[];
	/** "Something else", written in. */
	other: string;
	name: string;
	place: string;
	community: string;
	language: string;
	message: string;
	email: string;
	updates: boolean;
};

export const empty = (): Answers => ({
	interests: [],
	other: '',
	name: '',
	place: '',
	community: '',
	language: '',
	message: '',
	email: '',
	updates: false
});

/** The answers as the form's fields. Empty answers are left out; the language goes only with
 * Translate ticked, since that's the only time the page asks it. */
export function encode(a: Answers): URLSearchParams {
	const p = new URLSearchParams();
	const put = (key: keyof typeof ENTRY, value: string) => {
		if (value.trim()) p.append(`entry.${ENTRY[key]}`, value.trim());
	};
	for (const i of a.interests) put('interests', i);
	if (a.other.trim()) {
		p.append(`entry.${ENTRY.interests}`, '__other_option__');
		p.append(`entry.${ENTRY.interests}.other_option_response`, a.other.trim());
	}
	put('name', a.name);
	put('place', a.place);
	put('community', a.community);
	if (a.interests.includes(TRANSLATE)) put('language', a.language);
	put('message', a.message);
	put('email', a.email);
	if (a.updates) put('updates', UPDATES_OPTION);
	return p;
}

/** What stops a step: the first field in error and what to say, or null. */
export function check(step: 1 | 2 | 3, a: Answers): { field: string; message: string } | null {
	if (step === 1 && !a.interests.length && !a.other.trim())
		return { field: 'interests', message: 'Tick at least one, or tell us what else.' };
	if (step === 3 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email.trim()))
		return { field: 'email', message: 'We need an email address to reply to.' };
	return null;
}
