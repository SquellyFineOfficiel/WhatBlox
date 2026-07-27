import { useState, useCallback } from 'react';
import { Search, X, Check, AlertCircle, Upload, Eye, EyeOff, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase';
import { searchRobloxGames, filterGamesLocally, mapRobloxGameToWhatBlox, RobloxGameFilters, AVAILABLE_TAGS } from '@/lib/robloxApi';
import { getIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface ScrapedGame extends ReturnType<typeof mapRobloxGameToWhatBlox> {
  selected: boolean;
  disabled: boolean;
}

export function AdminDashboard() {
  const [filters, setFilters] = useState<RobloxGameFilters>({
    tags: [],
    blacklistWords: [],
    minVisits: 0,
    maxVisits: 10000000,
    minPlayers: 0,
    maxPlayers: 100000,
    createdAfter: '',
    createdBefore: '',
    limit: 50,
    sortBy: 'Visits',
    sortOrder: 'Desc',
  });
  const [scrapedGames, setScrapedGames] = useState<ScrapedGame[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: number; failed: number } | null>(null);

  const toggleTag = useCallback((tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: (prev.tags || []).includes(tag)
        ? (prev.tags || []).filter(t => t !== tag)
        : [...(prev.tags || []), tag],
    }));
  }, []);

  const [skipExisting, setSkipExisting] = useState(true);

  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    setSearchError(null);
    setScrapedGames([]);
    setSelectedCount(0);
    setSaveResult(null);

    try {
      // Check for existing games if skip is enabled
      let existingGameIds: Set<string> = new Set();
      if (skipExisting) {
        const { data, error } = await supabase.from('games').select('id');
        if (error) throw error;
        existingGameIds = new Set(data.map(game => game.id));
      }

      const result = await searchRobloxGames(filters);
      let filtered = filterGamesLocally(result.data, filters);
      
      // Filter out existing games if skip is enabled
      if (skipExisting) {
        filtered = filtered.filter(game => !existingGameIds.has(game.universeId.toString()));
      }

      const mapped = filtered.map(game => ({
        ...mapRobloxGameToWhatBlox(game),
        selected: false,
        disabled: false,
      }));
      setScrapedGames(mapped);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(error instanceof Error ? error.message : 'Failed to search games');
    } finally {
      setIsSearching(false);
    }
  }, [filters, skipExisting]);

  const toggleGameSelection = useCallback((index: number) => {
    setScrapedGames(prev => {
      const newGames = [...prev];
      if (!newGames[index].disabled) {
        newGames[index] = { ...newGames[index], selected: !newGames[index].selected };
      }
      return newGames;
    });
    setSelectedCount(prev => {
      const game = scrapedGames[index];
      return game.selected ? prev - 1 : prev + 1;
    });
  }, [scrapedGames]);

  const toggleGameDisabled = useCallback((index: number) => {
    setScrapedGames(prev => {
      const newGames = [...prev];
      newGames[index] = { ...newGames[index], disabled: !newGames[index].disabled, selected: false };
      return newGames;
    });
    setSelectedCount(prev => {
      const game = scrapedGames[index];
      return game.selected ? prev - 1 : prev;
    });
  }, [scrapedGames]);

  const selectAll = useCallback(() => {
    setScrapedGames(prev => prev.map(g => ({ ...g, selected: !g.disabled })));
    setSelectedCount(scrapedGames.filter(g => !g.disabled).length);
  }, [scrapedGames]);

  const deselectAll = useCallback(() => {
    setScrapedGames(prev => prev.map(g => ({ ...g, selected: false })));
    setSelectedCount(0);
  }, []);

  const handleSaveToSupabase = useCallback(async () => {
    const toSave = scrapedGames.filter(g => g.selected && !g.disabled);
    if (toSave.length === 0) return;

    setIsSaving(true);
    setSaveResult(null);

    let success = 0;
    let failed = 0;

    for (const game of toSave) {
      try {
        const { error } = await supabase.from('games').upsert({
          id: game.id,
          title: game.title,
          genre: game.genre,
          developer: game.developer,
          players_now: game.players_now,
          total_visits: game.total_visits,
          description: game.description,
          gradient_from: game.gradient_from,
          gradient_to: game.gradient_to,
          icon_name: game.icon_name,
          roblox_url: game.roblox_url,
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;
        success++;
      } catch {
        failed++;
      }
    }

    setSaveResult({ success, failed });
    setIsSaving(false);

    if (failed === 0) {
      setScrapedGames(prev => prev.map(g => g.selected ? { ...g, disabled: true, selected: false } : g));
      setSelectedCount(0);
    }
  }, [scrapedGames]);

  const handleFilterChange = (key: keyof RobloxGameFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleBlacklistChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const words = e.target.value.split(',').map(w => w.trim()).filter(Boolean);
    handleFilterChange('blacklistWords', words);
  };

  return (
    <div className="space-y-6">
      {/* Filters Panel */}
      <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Search Filters</CardTitle>
            <Button onClick={handleSearch} disabled={isSearching} size="lg">
              <Search className="mr-2 h-4 w-4" />
              {isSearching ? 'Searching...' : 'Search Games'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Tags */}
            <div className="lg:col-span-2">
              <Label className="block text-sm text-slate-300 mb-2">Tags (click to toggle)</Label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2">
                {AVAILABLE_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                      filters.tags?.includes(tag)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:border-slate-600'
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Visits Range */}
            <div>
              <Label className="block text-sm text-slate-300 mb-2">Min Visits</Label>
              <input
                type="number"
                value={filters.minVisits}
                onChange={e => handleFilterChange('minVisits', parseInt(e.target.value) || 0)}
                min={0}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <Label className="block text-sm text-slate-300 mb-2">Max Visits</Label>
              <input
                type="number"
                value={filters.maxVisits}
                onChange={e => handleFilterChange('maxVisits', parseInt(e.target.value) || 10000000)}
                min={0}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Players Range */}
            <div>
              <Label className="block text-sm text-slate-300 mb-2">Min Players</Label>
              <input
                type="number"
                value={filters.minPlayers}
                onChange={e => handleFilterChange('minPlayers', parseInt(e.target.value) || 0)}
                min={0}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <Label className="block text-sm text-slate-300 mb-2">Max Players</Label>
              <input
                type="number"
                value={filters.maxPlayers}
                onChange={e => handleFilterChange('maxPlayers', parseInt(e.target.value) || 100000)}
                min={0}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Date Range */}
            <div>
              <Label className="block text-sm text-slate-300 mb-2">Created After</Label>
              <input
                type="date"
                value={filters.createdAfter}
                onChange={e => handleFilterChange('createdAfter', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <Label className="block text-sm text-slate-300 mb-2">Created Before</Label>
              <input
                type="date"
                value={filters.createdBefore}
                onChange={e => handleFilterChange('createdBefore', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Blacklist */}
            <div className="lg:col-span-4">
              <Label className="block text-sm text-slate-300 mb-2">Blacklist Words (comma separated)</Label>
              <input
                type="text"
                value={filters.blacklistWords?.join(', ') || ''}
                onChange={handleBlacklistChange}
                placeholder="e.g., tycoon, simulator, obby, clicker"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            {/* Limit */}
            <div className="lg:col-span-1">
              <Label className="block text-sm text-slate-300 mb-2">Number of Games</Label>
              <input
                type="number"
                value={filters.limit}
                onChange={e => handleFilterChange('limit', parseInt(e.target.value) || 50)}
                min={1}
                max={100}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            {/* Skip existing */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 h-full">
                <input
                  type="checkbox"
                  id="skip-existing"
                  checked={skipExisting}
                  onChange={e => setSkipExisting(e.target.checked)}
                  className="w-5 h-5 text-primary border-slate-600 rounded focus:ring-primary focus:ring-2"
                />
                <Label htmlFor="skip-existing" className="text-sm text-slate-300">
                  Skip existing in Supabase
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error/Result Messages */}
      {searchError && (
        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <AlertCircle size={18} />
          <span className="text-sm">{searchError}</span>
        </div>
      )}

      {saveResult && (
        <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <CheckCheck size={18} />
          <span className="text-sm">
            Saved: {saveResult.success} successful
            {saveResult.failed > 0 && <span className="text-red-400 ml-2">, {saveResult.failed} failed</span>}
          </span>
        </div>
      )}

      {/* Results */}
      <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-lg">Results ({scrapedGames.length} games)</CardTitle>
              <p className="text-sm text-slate-400">
                {selectedCount} selected for import
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedCount > 0 && (
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  <X className="mr-1 h-3.5 w-3.5" />
                  Deselect All
                </Button>
              )}
              {selectedCount > 0 && (
                <Button variant="white" size="sm" onClick={handleSaveToSupabase} disabled={isSaving}>
                  <Upload className="mr-1 h-3.5 w-3.5" />
                  {isSaving ? 'Saving...' : `Import ${selectedCount}`}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={selectAll} disabled={scrapedGames.length === 0}>
                <Check className="mr-1 h-3.5 w-3.5" />
                Select All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {scrapedGames.length === 0 && !isSearching && (
            <div className="text-center py-12">
              <Search className="mx-auto h-12 w-12 text-slate-600 mb-4" />
              <p className="text-slate-400">No games found. Adjust filters and search.</p>
            </div>
          )}

          {scrapedGames.length > 0 && (
            <ScrollArea className="max-h-[60vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1">
                {scrapedGames.map((game, index) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    index={index}
                    onToggleSelect={toggleGameSelection}
                    onToggleDisable={toggleGameDisabled}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function GameCard({
  game,
  index,
  onToggleSelect,
  onToggleDisable,
}: {
  game: ScrapedGame;
  index: number;
  onToggleSelect: (index: number) => void;
  onToggleDisable: (index: number) => void;
}) {
  const IconComponent = getIcon(game.icon_name);

  return (
    <div
      className={cn(
        'relative bg-slate-800/50 border border-slate-700 rounded-xl p-4 transition-all',
        game.disabled && 'opacity-50 border-slate-800 bg-slate-900/50',
        game.selected && !game.disabled && 'ring-2 ring-primary border-primary'
      )}
    >
      {/* Disable/Enable Button */}
      <button
        onClick={() => onToggleDisable(index)}
        className="absolute top-2 right-2 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-10"
        aria-label={game.disabled ? 'Enable game' : 'Disable game'}
      >
        {game.disabled ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>

      {/* Selection Checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <input
          type="checkbox"
          checked={game.selected}
          onChange={() => onToggleSelect(index)}
          disabled={game.disabled}
          className="w-5 h-5 text-primary border-slate-600 rounded focus:ring-primary focus:ring-2 cursor-pointer"
        />
      </div>

      {/* Gradient Banner */}
      <div
        className="relative h-24 rounded-lg mb-3 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${game.gradient_from}, ${game.gradient_to})`,
        }}
      >
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <IconComponent className="w-12 h-12 text-white/30" strokeWidth={1.5} />
        </div>
        <div className="absolute top-2 left-2">
          <Badge className="text-xs">{game.genre}</Badge>
        </div>
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="text-xs">
            <span className="relative flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              {game.players_now.toLocaleString()}
            </span>
          </Badge>
        </div>
      </div>

      {/* Game Info */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-white truncate">{game.title}</h3>
            <p className="text-xs text-slate-400 truncate">by {game.developer}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-4 h-4" />
            {game.total_visits.toLocaleString()} visits
          </span>
        </div>

        <p className="text-xs text-slate-500 line-clamp-2">{game.description}</p>

        <a
          href={game.roblox_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          View on Roblox
          <span className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}