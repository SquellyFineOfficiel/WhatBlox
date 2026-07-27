import { useState, useCallback, useEffect, useMemo } from 'react';
import { Search, X, RefreshCw, Eye, Upload, Loader2, Tag, Package, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  fetchAllItems, 
  fetchItemDetails, 
  filterItems, 
  ITEM_TYPES,
  formatNumber,
  getDemandColor,
  type RolimonsItem,
  type RolimonsItemDetail,
} from '@/lib/rolimonsApi';

interface RolimonsItemFilters {
  search: string;
  min_rap: number;
  max_rap: number;
  min_value: number;
  max_value: number;
  min_demand: number;
  max_demand: number;
  item_type: string;
  sort_by: 'rap' | 'value' | 'demand' | 'trend' | 'name';
  sort_order: 'asc' | 'desc';
  limit: number;
  page: number;
}

export function RolimonsBrowser() {
  const [allItems, setAllItems] = useState<Record<string, RolimonsItem>>({});
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RolimonsItemFilters>({
    search: '',
    min_rap: 0,
    max_rap: 100000000,
    min_value: 0,
    max_value: 100000000,
    min_demand: 0,
    max_demand: 10,
    item_type: 'All',
    sort_by: 'rap',
    sort_order: 'desc',
    limit: 50,
    page: 1,
  });
  const [selectedItem, setSelectedItem] = useState<RolimonsItemDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const items = await fetchAllItems();
      setAllItems(items);
    } catch (err) {
      console.error('Rolimons fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch items');
      setAllItems({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filteredItems = useMemo(() => {
    if (Object.keys(allItems).length === 0) return [];
    
    const filtered = filterItems(allItems, {
      search: filters.search,
      minRap: filters.min_rap,
      maxRap: filters.max_rap,
      minValue: filters.min_value,
      maxValue: filters.max_value,
      minDemand: filters.min_demand,
      maxDemand: filters.max_demand,
      itemType: filters.item_type !== 'All' ? filters.item_type : undefined,
      sortBy: filters.sort_by,
      sortOrder: filters.sort_order,
    });

    const start = (filters.page - 1) * filters.limit;
    const end = start + filters.limit;
    return filtered.slice(start, end);
  }, [allItems, filters]);

  const totalFiltered = useMemo(() => {
    if (Object.keys(allItems).length === 0) return 0;
    return filterItems(allItems, {
      search: filters.search,
      minRap: filters.min_rap,
      maxRap: filters.max_rap,
      minValue: filters.min_value,
      maxValue: filters.max_value,
      minDemand: filters.min_demand,
      maxDemand: filters.max_demand,
      itemType: filters.item_type !== 'All' ? filters.item_type : undefined,
      sortBy: filters.sort_by,
      sortOrder: filters.sort_order,
    }).length;
  }, [allItems, filters]);

  const totalPages = Math.ceil(totalFiltered / filters.limit) || 1;

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchItems]);

  useEffect(() => {
    setFilters(prev => ({ ...prev, page: 1 }));
    setSelectedItems(new Set());
  }, [filters.search, filters.item_type, filters.min_rap, filters.max_rap, filters.min_value, filters.max_value, filters.min_demand, filters.max_demand, filters.sort_by, filters.sort_order]);

  const handleFilterChange = (key: keyof RolimonsItemFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const toggleItemSelection = (itemId: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedItems(new Set(filteredItems.map(item => item.item_id)));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const openItemDetail = async (item: RolimonsItem) => {
    try {
      const detail = await fetchItemDetails(item.item_id);
      setSelectedItem(detail);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Failed to fetch item detail:', err);
    }
  };

  const handleImportToSupabase = async () => {
    const toImport = filteredItems.filter(item => selectedItems.has(item.item_id));
    if (toImport.length === 0) return;

    setImporting(true);
    setImportResult(null);

    let success = 0;
    let failed = 0;

    for (const item of toImport) {
      try {
        const response = await fetch('/api/admin/import-rolimons-item', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_id: item.item_id,
            name: item.name,
            acronym: item.acronym,
            rap: item.rap,
            value: item.value,
            demand: item.demand,
            trend: item.trend,
            projected: item.projected,
            hyped: item.hyped,
            rare: item.rare,
            thumbnail_url: item.thumbnail_url,
            item_type: item.item_type,
            creator_id: item.creator_id,
            creator_name: item.creator_name,
            created: item.created,
            updated: item.updated,
            description: item.description,
            tags: item.tags,
          }),
        });

        if (response.ok) {
          success++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    setImportResult({ success, failed });
    setImporting(false);

    if (failed === 0) {
      setSelectedItems(new Set());
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Panel */}
      <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-lg">Rolimons Item Browser</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchItems()} disabled={isLoading}>
                <RefreshCw className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <Label className="block text-sm text-slate-300 mb-2">Search Items</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    type="text"
                    placeholder="Search by name, acronym..."
                    value={filters.search}
                    onChange={e => handleFilterChange('search', e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              {/* Item Type */}
              <div>
                <Label className="block text-sm text-slate-300 mb-2">Item Type</Label>
                <select
                  value={filters.item_type}
                  onChange={e => handleFilterChange('item_type', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {ITEM_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* RAP Range */}
              <div>
                <Label className="block text-sm text-slate-300 mb-2">Min RAP</Label>
                <Input
                  type="number"
                  value={filters.min_rap}
                  onChange={e => handleFilterChange('min_rap', parseInt(e.target.value) || 0)}
                  min={0}
                  className="bg-slate-800 border-slate-700 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <Label className="block text-sm text-slate-300 mb-2">Max RAP</Label>
                <Input
                  type="number"
                  value={filters.max_rap}
                  onChange={e => handleFilterChange('max_rap', parseInt(e.target.value) || 100000000)}
                  min={0}
                  className="bg-slate-800 border-slate-700 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Value Range */}
              <div>
                <Label className="block text-sm text-slate-300 mb-2">Min Value</Label>
                <Input
                  type="number"
                  value={filters.min_value}
                  onChange={e => handleFilterChange('min_value', parseInt(e.target.value) || 0)}
                  min={0}
                  className="bg-slate-800 border-slate-700 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <Label className="block text-sm text-slate-300 mb-2">Max Value</Label>
                <Input
                  type="number"
                  value={filters.max_value}
                  onChange={e => handleFilterChange('max_value', parseInt(e.target.value) || 100000000)}
                  min={0}
                  className="bg-slate-800 border-slate-700 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Demand Range */}
              <div>
                <Label className="block text-sm text-slate-300 mb-2">Min Demand</Label>
                <Input
                  type="number"
                  value={filters.min_demand}
                  onChange={e => handleFilterChange('min_demand', parseInt(e.target.value) || 0)}
                  min={0}
                  max={10}
                  className="bg-slate-800 border-slate-700 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <Label className="block text-sm text-slate-300 mb-2">Max Demand</Label>
                <Input
                  type="number"
                  value={filters.max_demand}
                  onChange={e => handleFilterChange('max_demand', parseInt(e.target.value) || 10)}
                  min={0}
                  max={10}
                  className="bg-slate-800 border-slate-700 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Sort */}
              <div>
                <Label className="block text-sm text-slate-300 mb-2">Sort By</Label>
                <select
                  value={filters.sort_by}
                  onChange={e => handleFilterChange('sort_by', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="rap">RAP</option>
                  <option value="value">Value</option>
                  <option value="demand">Demand</option>
                  <option value="trend">Trend</option>
                  <option value="name">Name</option>
                </select>
              </div>
              <div>
                <Label className="block text-sm text-slate-300 mb-2">Order</Label>
                <select
                  value={filters.sort_order}
                  onChange={e => handleFilterChange('sort_order', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>

              {/* Limit */}
              <div>
                <Label className="block text-sm text-slate-300 mb-2">Items per Page</Label>
                <select
                  value={filters.limit}
                  onChange={e => handleFilterChange('limit', parseInt(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error/Results Info */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <X size={18} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {importResult && (
        <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <Tag size={18} />
          <span className="text-sm">
            Imported: {importResult.success} successful
            {importResult.failed > 0 && <span className="text-red-400 ml-2">, {importResult.failed} failed</span>}
          </span>
        </div>
      )}

      {/* Results */}
      <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-lg">Results ({totalFiltered} items)</CardTitle>
              <p className="text-sm text-slate-400">
                Page {filters.page} of {totalPages} • {selectedItems.size} selected
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedItems.size > 0 && (
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  <X className="mr-1 h-3.5 w-3.5" />
                  Deselect All
                </Button>
              )}
              {selectedItems.size > 0 && (
                <Button variant="white" size="sm" onClick={handleImportToSupabase} disabled={importing}>
                  <Upload className="mr-1 h-3.5 w-3.5" />
                  {importing ? 'Importing...' : `Import ${selectedItems.size}`}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={selectAll} disabled={filteredItems.length === 0}>
                <Package className="mr-1 h-3.5 w-3.5" />
                Select All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-slate-400">Loading items...</span>
            </div>
          )}

          {!isLoading && filteredItems.length === 0 && !error && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-slate-600 mb-4" />
              <p className="text-slate-400">No items found. Adjust filters and search.</p>
            </div>
          )}

          {filteredItems.length > 0 && (
            <ScrollArea className="max-h-[60vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1">
                {filteredItems.map(item => (
                  <ItemCard
                    key={item.item_id}
                    item={item}
                    selected={selectedItems.has(item.item_id)}
                    onSelect={toggleItemSelection}
                    onViewDetail={openItemDetail}
                  />
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFilterChange('page', filters.page - 1)}
                disabled={filters.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-4 text-sm text-slate-300">
                Page {filters.page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFilterChange('page', filters.page + 1)}
                disabled={filters.page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Item Detail Modal */}
      {showDetailModal && selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </div>
  );
}

function ItemCard({
  item,
  selected,
  onSelect,
  onViewDetail,
}: {
  item: RolimonsItem;
  selected: boolean;
  onSelect: (itemId: number) => void;
  onViewDetail: (item: RolimonsItem) => void;
}) {
  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-3.5 h-3.5 text-green-400" />;
    if (trend < 0) return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
    return <span className="w-3.5 h-3.5 text-slate-500">-</span>;
  };

  return (
    <div
      className={cn(
        'relative bg-slate-800/50 border border-slate-700 rounded-xl p-4 transition-all',
        selected && 'ring-2 ring-primary border-primary'
      )}
    >
      <div className="absolute top-2 right-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(item.item_id)}
          className="w-5 h-5 text-primary border-slate-600 rounded focus:ring-primary focus:ring-2 cursor-pointer"
        />
      </div>

      <div className="relative aspect-square rounded-lg overflow-hidden mb-3 bg-slate-900">
        {item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-slate-500" />
          </div>
        )}
        {item.projected && (
          <Badge className="absolute top-2 left-2 bg-purple-500/90 text-purple-100">
            Projected
          </Badge>
        )}
        {item.hyped && (
          <Badge className="absolute top-2 left-2 bg-orange-500/90 text-orange-100">
            Hyped
          </Badge>
        )}
        {item.rare && (
          <Badge className="absolute top-2 right-2 bg-red-500/90 text-red-100">
            Rare
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-white truncate">{item.name}</h3>
            <p className="text-xs text-slate-400 truncate">{item.acronym}</p>
          </div>
          <button
            onClick={() => onViewDetail(item)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            aria-label="View details"
          >
            <Eye size={14} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-900/50 rounded-lg p-2">
            <p className="text-xs text-slate-400">RAP</p>
            <p className="font-mono text-sm font-semibold text-yellow-300">{formatNumber(item.rap)}</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2">
            <p className="text-xs text-slate-400">Value</p>
            <p className="font-mono text-sm font-semibold text-green-300">{formatNumber(item.value)}</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2">
            <p className="text-xs text-slate-400">Demand</p>
            <p className="font-mono text-sm font-semibold">
              {item.demand}/10 {getTrendIcon(item.trend)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Badge variant="secondary" className={cn(getDemandColor(item.demand), 'text-xs')}>
            Demand: {item.demand}/10
          </Badge>
          <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
            {item.item_type}
          </Badge>
        </div>

        <p className="text-xs text-slate-500 line-clamp-2">{item.description || 'No description'}</p>

        <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
          <span className="text-xs text-slate-400 flex-1 truncate">
            By {item.creator_name}
          </span>
          <a
            href={`https://www.rolimons.com/item/${item.item_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            View on Rolimons
          </a>
        </div>
      </div>
    </div>
  );
}

function ItemDetailModal({
  item,
  onClose,
}: {
  item: RolimonsItemDetail;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-4">
            {item.item.thumbnail_url ? (
              <img
                src={item.item.thumbnail_url}
                alt={item.item.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center">
                <Package className="w-8 h-8 text-slate-500" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-white">{item.item.name}</h2>
              <p className="text-sm text-slate-400">{item.item.acronym} • ID: {item.item.item_id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="RAP" value={formatNumber(item.item.rap)} icon={<TrendingUp className="w-5 h-5 text-yellow-400" />} color="text-yellow-300" />
            <StatCard label="Value" value={formatNumber(item.item.value)} icon={<Tag className="w-5 h-5 text-green-400" />} color="text-green-300" />
            <StatCard label="Demand" value={`${item.item.demand}/10`} icon={<Package className="w-5 h-5 text-orange-400" />} color="text-orange-300" />
            <StatCard label="Trend" value={item.item.trend > 0 ? `+${item.item.trend}%` : `${item.item.trend}%`} icon={item.item.trend > 0 ? <TrendingUp className="w-5 h-5 text-green-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />} color={item.item.trend > 0 ? 'text-green-300' : 'text-red-300'} />
          </div>

          {/* Tags & Status */}
          <div className="flex flex-wrap gap-2">
            {item.item.projected && <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Projected</Badge>}
            {item.item.hyped && <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">Hyped</Badge>}
            {item.item.rare && <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Rare</Badge>}
            <Badge variant="outline" className="text-slate-400 border-slate-600">{item.item.item_type}</Badge>
          </div>

          {/* Description */}
          {item.item.description && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
              <p className="text-slate-300 whitespace-pre-wrap">{item.item.description}</p>
            </div>
          )}

          {/* Creator Info */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Creator</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                <Package className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="font-medium text-white">{item.item.creator_name}</p>
                <p className="text-sm text-slate-400">User ID: {item.item.creator_id}</p>
              </div>
            </div>
          </div>

          {/* Price History */}
          {item.price_history && item.price_history.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Price History (Last 30 Days)</h3>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <PriceStat label="Current RAP" value={formatNumber(item.item.rap)} />
                  <PriceStat label="Current Value" value={formatNumber(item.item.value)} />
                  <PriceStat label="Avg RAP (30d)" value={formatNumber(Math.round(item.price_history.reduce((a, b) => a + b.rap, 0) / item.price_history.length))} />
                  <PriceStat label="Avg Value (30d)" value={formatNumber(Math.round(item.price_history.reduce((a, b) => a + b.value, 0) / item.price_history.length))} />
                </div>
              </div>
            </div>
          )}

          {/* Recent Sales */}
          {item.recent_sales && item.recent_sales.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Recent Sales</h3>
              <div className="bg-slate-800/50 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-3 text-sm font-medium text-slate-400">Price</th>
                      <th className="text-left p-3 text-sm font-medium text-slate-400">Quantity</th>
                      <th className="text-left p-3 text-sm font-medium text-slate-400">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.recent_sales.slice(0, 10).map((sale, index) => (
                      <tr key={index} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/50">
                        <td className="p-3 text-sm text-white font-mono">{formatNumber(sale.price)}</td>
                        <td className="p-3 text-sm text-slate-300">{sale.quantity}</td>
                        <td className="p-3 text-sm text-slate-400">{new Date(sale.date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className={cn('font-mono text-xl font-bold', color)}>{value}</p>
    </div>
  );
}

function PriceStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="font-mono text-lg font-semibold text-white">{value}</p>
    </div>
  );
}