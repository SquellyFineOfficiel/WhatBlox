import type { RobloxMetadata } from '@/src/lib/roblox';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function normalize(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function calculateTrendingScore(metadata: RobloxMetadata | null | undefined, createdAt: string) {
  const players = normalize(metadata?.player_count);
  const visits = normalize(metadata?.visits);
  const ageInDays = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / MS_PER_DAY);
  const freshnessBoost = 1 / (1 + ageInDays / 4);

  return players * 6 + Math.log10(visits + 1) * 180 + freshnessBoost * 120;
}
