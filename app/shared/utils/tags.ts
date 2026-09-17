/**
 * Parses comma-separated text into unique, trimmed tags.
 *
 * @param value Comma-separated tag text.
 * @returns Tags in first-seen order, preserving their original casing.
 */
export function parseCommaSeparatedTags(value: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const segment of value.split(",")) {
    const tag = segment.trim();
    const normalizedTag = tag.toLowerCase();

    if (tag && !seen.has(normalizedTag)) {
      seen.add(normalizedTag);
      tags.push(tag);
    }
  }

  return tags;
}
