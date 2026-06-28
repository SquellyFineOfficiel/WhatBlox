export type RobloxMetadata = {
  title: string;
  description: string;
  thumbnail_url: string | null;
  player_count: number | null;
  visits: number | null;
  universe_id: string | null;
  root_place_id: number | null;
};

type RobloxIdInfo = {
  universeId: string | null;
  placeId: string | null;
};

function extractRobloxId(robloxUrl: string): RobloxIdInfo {
  if (!robloxUrl) {
    return { universeId: null, placeId: null };
  }

  const normalized = robloxUrl.trim();
  const universeMatch = normalized.match(/universeId=(\d+)/i) ?? normalized.match(/\/universes\/(\d+)/i);
  const placeMatch = normalized.match(/(?:games|places)\/(\d+)/i) ?? normalized.match(/placeId=(\d+)/i);

  return {
    universeId: universeMatch?.[1] ?? null,
    placeId: placeMatch?.[1] ?? null,
  };
}

async function resolveUniverseId(placeId: string): Promise<string | null> {
  const response = await fetch(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const resolvedUniverseId = data?.universeId;
  return typeof resolvedUniverseId === 'number' || typeof resolvedUniverseId === 'string'
    ? String(resolvedUniverseId)
    : null;
}

async function fetchMetadataByUniverseId(universeId: string, placeId: string | null): Promise<RobloxMetadata | null> {
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
    player_count: typeof game.playing === 'number' ? game.playing : (typeof game.playerCount === 'number' ? game.playerCount : null),
    visits: typeof game.visits === 'number' ? game.visits : null,
    universe_id: String(game.universeId ?? universeId),
    root_place_id: typeof game.rootPlaceId === 'number' ? game.rootPlaceId : (placeId ? Number(placeId) : null),
  };
}

export async function getRobloxGameMetadata(robloxUrl: string): Promise<RobloxMetadata | null> {
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch(`/api/roblox/metadata?url=${encodeURIComponent(robloxUrl)}`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        return null;
      }
      const payload = await response.json();
      return payload?.metadata ?? null;
    } catch (error) {
      console.error('Failed to fetch Roblox metadata from API route', error);
      return null;
    }
  }

  try {
    const idInfo = extractRobloxId(robloxUrl);
    const universeId = idInfo.universeId ?? (idInfo.placeId ? await resolveUniverseId(idInfo.placeId) : null);
    if (!universeId) {
      return null;
    }

    return await fetchMetadataByUniverseId(universeId, idInfo.placeId);
  } catch (error) {
    console.error('Failed to fetch Roblox metadata', error);
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
