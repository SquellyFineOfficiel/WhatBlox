import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const item = req.body;

    const { error } = await supabase
      .from('rolimons_items')
      .upsert({
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
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'item_id',
      });

    if (error) {
      console.error('Supabase upsert error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Import error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}