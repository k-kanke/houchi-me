import type { Clone, Topic } from '@/types';

export function buildContext(clone: Clone, recentTopics: Topic[]): string {
  const lines: string[] = [];

  // Layer 1: clone profile
  lines.push('## クローンプロフィール');
  lines.push(`名前: ${clone.name}`);
  lines.push(`MBTI: ${clone.mbti}`);
  lines.push(`好きなもの: ${clone.likes.join('、')}`);
  if (clone.dislikes.length > 0) lines.push(`苦手なもの: ${clone.dislikes.join('、')}`);
  lines.push(`自己紹介: ${clone.selfDescription}`);
  if (clone.idealSelf) lines.push(`なりたい自分: ${clone.idealSelf}`);
  lines.push(`探索タイプ: ${clone.explorationType}`);
  lines.push('');

  // Layer 2: recent topics (last 7)
  const recent = recentTopics.slice(0, 7);
  if (recent.length > 0) {
    lines.push('## 直近の探索トピック');
    for (const t of recent) {
      lines.push(`- ${t.dateKey}: ${t.title}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
