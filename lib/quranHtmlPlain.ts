/** Turn Quran.com / Quran Foundation tafsir HTML into readable plain text for RN `Text`. */
export function tafsirHtmlToPlain(html: string): string {
  const withBreaks = html
    .replace(/<\/(p|div|h[1-6]|li|blockquote|section|article)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(tr|table)>/gi, '\n');
  const noTags = withBreaks.replace(/<[^>]+>/g, '');
  return noTags
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}
