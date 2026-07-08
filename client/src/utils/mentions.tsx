const MENTION_PATTERN = /@\[([^\]]+)\]\(([^)]+)\)/g;

export function renderMentionText(text: string) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  MENTION_PATTERN.lastIndex = 0;
  while ((match = MENTION_PATTERN.exec(text))) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(
      <span key={key++} className="mention">
        @{match[1]}
      </span>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}
