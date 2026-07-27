export interface RolimonsItem {
  item_id: number;
  name: string;
  acronym: string;
  rap: number;
  value: number;
  demand: number;
  trend: number;
  projected: boolean;
  hyped: boolean;
  rare: boolean;
  thumbnail_url: string;
  item_type: string;
  creator_id: number;
  creator_name: string;
  created: string;
  updated: string;
  description: string;
  tags: string[];
}

export interface RolimonsItemDetail {
  item: RolimonsItem;
  price_history: Array<{
    date: string;
    rap: number;
    value: number;
    demand: number;
  }>;
  recent_sales: Array<{
    price: number;
    quantity: number;
    date: string;
  }>;
}

export interface RolimonsCollectionItem {
  item_id: number;
  name: string;
  acronym: string;
  rap: number;
  value: number;
  demand: number;
  trend: number;
  thumbnail_url: string;
  quantity: number;
}

export interface RolimonsCollection {
  user_id: number;
  username: string;
  display_name: string;
  total_rap: number;
  total_value: number;
  item_count: number;
  items: RolimonsCollectionItem[];
}

const ROLIMONS_API_BASE = 'https://api.rolimons.com';

async function fetchRolimons<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${ROLIMONS_API_BASE}${endpoint}`);
  
  if (!response.ok) {
    throw new Error(`Rolimons API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Rolimons API returned error');
  }
  
  return data;
}

export async function fetchAllItems(): Promise<Record<string, RolimonsItem>> {
  const data = await fetchRolimons<{ items: Record<string, RolimonsItem> }>('/items/v1/itemdetails');
  return data.items;
}

export async function fetchItemDetails(itemId: number): Promise<RolimonsItemDetail> {
  const data = await fetchRolimons<{ item: RolimonsItemDetail }>(`/items/v1/itemdetails/${itemId}`);
  return data.item;
}

export async function fetchItemPriceHistory(itemId: number): Promise<Array<{ date: string; rap: number; value: number; demand: number }>> {
  const data = await fetchRolimons<{ price_history: Array<{ date: string; rap: number; value: number; demand: number }> }>(`/items/v1/pricehistory/${itemId}`);
  return data.price_history;
}

export async function fetchItemRecentSales(itemId: number): Promise<Array<{ price: number; quantity: number; date: string }>> {
  const data = await fetchRolimons<{ recent_sales: Array<{ price: number; quantity: number; date: string }> }>(`/items/v1/recent_sales/${itemId}`);
  return data.recent_sales;
}

export async function fetchUserCollection(userId: number): Promise<RolimonsCollection> {
  const data = await fetchRolimons<{ collection: RolimonsCollection }>(`/collections/v1/collection/${userId}`);
  return data.collection;
}

export function filterItems(
  items: Record<string, RolimonsItem>,
  filters: {
    search?: string;
    minRap?: number;
    maxRap?: number;
    minValue?: number;
    maxValue?: number;
    minDemand?: number;
    maxDemand?: number;
    itemType?: string;
    sortBy?: 'rap' | 'value' | 'demand' | 'trend' | 'name';
    sortOrder?: 'asc' | 'desc';
  }
): RolimonsItem[] {
  let filtered = Object.values(items);

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(searchLower) ||
      item.acronym.toLowerCase().includes(searchLower)
    );
  }

  if (filters.minRap !== undefined) {
    filtered = filtered.filter(item => item.rap >= filters.minRap!);
  }
  if (filters.maxRap !== undefined) {
    filtered = filtered.filter(item => item.rap <= filters.maxRap!);
  }
  if (filters.minValue !== undefined) {
    filtered = filtered.filter(item => item.value >= filters.minValue!);
  }
  if (filters.maxValue !== undefined) {
    filtered = filtered.filter(item => item.value <= filters.maxValue!);
  }
  if (filters.minDemand !== undefined) {
    filtered = filtered.filter(item => item.demand >= filters.minDemand!);
  }
  if (filters.maxDemand !== undefined) {
    filtered = filtered.filter(item => item.demand <= filters.maxDemand!);
  }
  if (filters.itemType && filters.itemType !== 'All') {
    filtered = filtered.filter(item => item.item_type === filters.itemType);
  }

  const sortBy = filters.sortBy || 'rap';
  const sortOrder = filters.sortOrder || 'desc';

  filtered.sort((a, b) => {
    let aVal: number | string = 0;
    let bVal: number | string = 0;

    switch (sortBy) {
      case 'rap':
        aVal = a.rap;
        bVal = b.rap;
        break;
      case 'value':
        aVal = a.value;
        bVal = b.value;
        break;
      case 'demand':
        aVal = a.demand;
        bVal = b.demand;
        break;
      case 'trend':
        aVal = a.trend;
        bVal = b.trend;
        break;
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
    }

    if (typeof aVal === 'string') {
      return sortOrder === 'asc' 
        ? aVal.localeCompare(bVal as string) 
        : (bVal as string).localeCompare(aVal);
    }
    
    return sortOrder === 'asc' 
      ? (aVal as number) - (bVal as number) 
      : (bVal as number) - (aVal as number);
  });

  return filtered;
}

export const ITEM_TYPES = [
  'All',
  'Hat',
  'Face',
  'Gear',
  'FaceAccessory',
  'HairAccessory',
  'NeckAccessory',
  'ShoulderAccessory',
  'FrontAccessory',
  'BackAccessory',
  'WaistAccessory',
  'Animation',
  'Bundle',
];

export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

export function getDemandColor(demand: number): string {
  if (demand >= 8) return 'text-red-400 bg-red-500/20';
  if (demand >= 6) return 'text-orange-400 bg-orange-500/20';
  if (demand >= 4) return 'text-yellow-400 bg-yellow-500/20';
  return 'text-slate-400 bg-slate-500/20';
}