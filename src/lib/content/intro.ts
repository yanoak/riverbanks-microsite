/**
 * Sam's intro (`src/content/intro.md`) as HTML paragraphs. It needs only paragraphs, `_italics_`
 * and `[links](url)`, so this is a few lines rather than a Markdown library.
 */

const escape = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** One HTML string per paragraph. `here` is where the `#TODO-link` goes; null leaves it as text. */
export function intro(md: string, here: string | null): string[] {
	const body = md.replace(/^---\n[\s\S]*?\n---\n/, '');
	return body
		.split(/\n\s*\n/)
		.map((p) => p.trim().replace(/\s*\n\s*/g, ' '))
		.filter(Boolean)
		.map((p) =>
			escape(p)
				.replace(/_([^_]+)_/g, '<em>$1</em>')
				.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text: string, url: string) => {
					if (url === '#TODO-link') return here ? `<a href="${here}">${text}</a>` : text;
					const external = /^https?:/.test(url) ? ' target="_blank" rel="noopener"' : '';
					return `<a href="${url}"${external}>${text}</a>`;
				})
		);
}
