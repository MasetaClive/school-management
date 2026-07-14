-- Phase 2.3: Inventory tracking (Transport assignments are in 001)

-- ==================== INVENTORY ITEMS ====================
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT, -- 'furniture', 'electronics', 'stationary'
  total_quantity INTEGER DEFAULT 0,
  available_quantity INTEGER DEFAULT 0,
  condition TEXT DEFAULT 'good', -- 'new', 'good', 'damaged', 'maintenance'
  location TEXT, -- 'room 101', 'main hall'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== INVENTORY LOGS ====================
CREATE TABLE public.inventory_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'check-in', 'check-out', 'damage_report'
  quantity INTEGER NOT NULL,
  person_name TEXT, -- who took the item
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== RLS POLICIES ====================
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;



CREATE POLICY "inventory_admin_all" ON public.inventory_items FOR ALL USING (public.get_user_role() = 'admin');
CREATE POLICY "inventory_logs_admin_all" ON public.inventory_logs FOR ALL USING (public.get_user_role() = 'admin');
