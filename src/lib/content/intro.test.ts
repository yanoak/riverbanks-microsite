import { describe, expect, it } from 'vitest';
import { intro } from './intro';

const md = `---
title: 'Example'
source: somewhere
---

Welcome to _Riverbanks_, a series.

It explores _ecoarchy_; particularly
across two lines.

Reach out [here](#TODO-link).

Visit [https://seapunk.asia](https://seapunk.asia) & more <b>.
`;

describe('intro', () => {
	it('drops the frontmatter and gives one entry per paragraph, lines joined', () => {
		const ps = intro(md, null);
		expect(ps).toHaveLength(4);
		expect(ps[1]).toBe('It explores <em>ecoarchy</em>; particularly across two lines.');
	});

	it('keeps italics as <em>', () => {
		expect(intro(md, null)[0]).toBe('Welcome to <em>Riverbanks</em>, a series.');
	});

	it('makes links, external ones opening in a new tab, and escapes HTML', () => {
		expect(intro(md, null)[3]).toBe(
			'Visit <a href="https://seapunk.asia" target="_blank" rel="noopener">https://seapunk.asia</a> &amp; more &lt;b&gt;.'
		);
	});

	it('points the TODO link where it is told to', () => {
		expect(intro(md, '/join')[2]).toBe('Reach out <a href="/join">here</a>.');
	});

	it('never renders the TODO link: with nowhere to go it is plain text', () => {
		expect(intro(md, null)[2]).toBe('Reach out here.');
	});
});
