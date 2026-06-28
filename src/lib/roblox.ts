export type RobloxMetadata = {
  title: string;
  description: string;
  thumbnail_url: string | null;
  player_count: number | null;
  visits: number | null;
  universe_id: string | null;
  root_place_id: number | null;
};

function extractRobloxId(robloxUrl: string) {
  if (!robloxUrl) {
    return null;
  }

  const normalized = robloxUrl.trim();
  const match = normalized.match(/(?:games|places)\/(\d+)/i) ?? normalized.match(/placeId=(\d+)/i) ?? normalized.match(/universeId=(\d+)/i);

  return match?.[1] ?? null;
}

export async function getRobloxGameMetadata(robloxUrl: string): Promise<RobloxMetadata | null> {
  const universeId = extractRobloxId(robloxUrl);
  if (!universeId) {
    return null;
  }

  try {
    const [gamesResponse, thumbnailResponse] = await Promise.all([
      fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`, {
        headers: { Accept: 'application/json' },
      }),
      fetch(
        `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png&isCircular=false`,
        {
          headers: { Accept: 'application/json' },
        }
      ),
    ]);

    if (!gamesResponse.ok || !thumbnailResponse.ok) {
      return null;
    }

    const gamesData = await gamesResponse.json();
    const thumbnailData = await thumbnailResponse.json();
    const game = gamesData?.data?.[0];
    const thumbnail = thumbnailData?.data?.[0]?.imageUrl ?? null;

    if (!game) {
      return null;
    }

    return {
      title: game.name ?? 'Roblox game',
      description: game.description ?? 'A community favorite on Roblox.',
      thumbnail_url: thumbnail,
      player_count: typeof game.playerCount === 'number' ? game.playerCount : null,
      visits: typeof game.visits === 'number' ? game.visits : null,
      universe_id: String(game.universeId ?? universeId),
      root_place_id: typeof game.rootPlaceId === 'number' ? game.rootPlaceId : null,
    };
  } catch {
    return null;
  }
}

export function formatStat(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return value.toString();
}
