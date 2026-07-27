export interface RobloxGameFilters {
  tags?: string[];
  blacklistWords?: string[];
  minVisits?: number;
  maxVisits?: number;
  minPlayers?: number;
  maxPlayers?: number;
  createdAfter?: string;
  createdBefore?: string;
  limit?: number;
  sortOrder?: 'Desc' | 'Asc';
  sortBy?: 'Visits' | 'Updated' | 'Created' | 'Favorited';
}

export interface RobloxGame {
  id: number;
  name: string;
  description: string;
  creator: {
    id: number;
    name: string;
    type: 'User' | 'Group';
  };
  rootPlace: {
    id: number;
    name: string;
  };
  universeId: number;
  price: number;
  genre: string;
  tags: string[];
  visits: number;
  playing: number;
  created: string;
  updated: string;
  favoritedCount: number;
  isPlayable: boolean;
  maxPlayers: number;
  isGenreEnforced: boolean;
  copyingAllowed: boolean;
  playingCount: number;
}

export interface RobloxGameSearchResult {
  data: RobloxGame[];
  nextPageCursor?: string;
}

const ROBLOX_API_BASE = import.meta.env.VITE_ROBLOX_API_URL || 'https://games.roproxy.com/v1';
const ROBLOX_GAMES_API = `${ROBLOX_API_BASE}/games/list`;

const GENRE_MAP: Record<string, number> = {
  'All': 0,
  'Building': 1,
  'Fighting': 2,
  'Adventure': 3,
  'SciFi': 4,
  'Sports': 5,
  'Horror': 6,
  'Naval': 7,
  'Comedy': 8,
  'Western': 9,
  'TownAndCity': 10,
  'RPG': 11,
  'Military': 12,
  'Medieval': 13,
  'AllGenre': 14,
};

const TAG_MAP: Record<string, string> = {
  'Obby': 'Obby',
  'Tycoon': 'Tycoon',
  'Simulator': 'Simulator',
  'RPG': 'RPG',
  'FPS': 'FPS',
  'Horror': 'Horror',
  'Adventure': 'Adventure',
  'Building': 'Building',
  'Social': 'Social',
  'Roleplay': 'Roleplay',
  'SciFi': 'SciFi',
  'Sports': 'Sports',
  'Racing': 'Racing',
  'Puzzle': 'Puzzle',
  'Strategy': 'Strategy',
  'Survival': 'Survival',
  'Anime': 'Anime',
  'Military': 'Military',
  'Medieval': 'Medieval',
  'Fantasy': 'Fantasy',
  'Sandbox': 'Sandbox',
  'Minigame': 'Minigame',
  'PvP': 'PvP',
  'PvE': 'PvE',
  'Co-op': 'Co-op',
  'SinglePlayer': 'SinglePlayer',
  'Multiplayer': 'Multiplayer',
};

export async function searchRobloxGames(
  filters: RobloxGameFilters = {}
): Promise<RobloxGameSearchResult> {
  const params = new URLSearchParams();

  if (filters.tags && filters.tags.length > 0) {
    const genreIds = filters.tags
      .map(tag => GENRE_MAP[tag])
      .filter((id): id is number => id !== undefined);
    if (genreIds.length > 0) {
      params.append('genre', genreIds.join(','));
    }
  }

  params.append('limit', (filters.limit || 50).toString());
  params.append('sortOrder', filters.sortOrder || 'Desc');
  params.append('sortBy', filters.sortBy || 'Visits');

  const url = `${ROBLOX_GAMES_API}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Roblox API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Roblox games:', error);
    throw error;
  }
}

export function filterGamesLocally(
  games: RobloxGame[],
  filters: RobloxGameFilters
): RobloxGame[] {
  return games.filter(game => {
    if (filters.blacklistWords && filters.blacklistWords.length > 0) {
      const lowerName = game.name.toLowerCase();
      const lowerDesc = game.description.toLowerCase();
      if (filters.blacklistWords.some(word => 
        lowerName.includes(word.toLowerCase()) || 
        lowerDesc.includes(word.toLowerCase())
      )) {
        return false;
      }
    }

    if (filters.minVisits !== undefined && game.visits < filters.minVisits) return false;
    if (filters.maxVisits !== undefined && game.visits > filters.maxVisits) return false;
    if (filters.minPlayers !== undefined && game.playing < filters.minPlayers) return false;
    if (filters.maxPlayers !== undefined && game.playing > filters.maxPlayers) return false;

    if (filters.createdAfter) {
      const createdDate = new Date(game.created);
      const filterDate = new Date(filters.createdAfter);
      if (createdDate < filterDate) return false;
    }
    if (filters.createdBefore) {
      const createdDate = new Date(game.created);
      const filterDate = new Date(filters.createdBefore);
      if (createdDate > filterDate) return false;
    }

    return true;
  });
}

export function mapRobloxGameToWhatBlox(game: RobloxGame): {
  id: string;
  title: string;
  genre: string;
  developer: string;
  players_now: number;
  total_visits: number;
  description: string;
  gradient_from: string;
  gradient_to: string;
  icon_name: string;
  roblox_url: string;
} {
  const gradients = [
    ['#1A1A2E', '#16213E'],
    ['#0F0F23', '#1A1A3E'],
    ['#1B0A2E', '#2D1B4E'],
    ['#0D1B1A', '#1A2E2B'],
    ['#1E3A5F', '#2E5A8F'],
    ['#2D4A2B', '#3D6B3A'],
    ['#2E1A1A', '#4A2A2A'],
    ['#3D2A0A', '#5D4A1A'],
    ['#2E1A3D', '#4A2A5E'],
    ['#1A2E1A', '#2A4A2A'],
  ];
  
  const icons = ['gamepad2', 'sword', 'castle', 'radio', 'feather', 'swords', 'car', 'gem', 'music', 'mapPin', 'brain', 'heart', 'star', 'zap', 'shield'];
  
  const hash = game.id.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradient = gradients[hash % gradients.length];
  const icon = icons[hash % icons.length];

  return {
    id: game.universeId.toString(),
    title: game.name,
    genre: game.genre || 'Other',
    developer: game.creator?.name || 'Unknown',
    players_now: game.playing || 0,
    total_visits: game.visits || 0,
    description: game.description || 'No description available.',
    gradient_from: gradient[0],
    gradient_to: gradient[1],
    icon_name: icon,
    roblox_url: `https://www.roblox.com/games/${game.rootPlace?.id || game.universeId}`,
  };
}

export const AVAILABLE_TAGS = Object.keys(TAG_MAP).sort();
export const AVAILABLE_GENRES = Object.keys(GENRE_MAP).sort();