import { createClient } from '@/lib/supabase/server';

export class InventoryServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

export class InventoryService {
    static async listItems() {
        const supabase = await createClient();
        const { data, error } = await supabase.from('inventory_items').select('*').order('name');
        if (error) throw new InventoryServiceError('Failed to fetch inventory', 500);
        return data;
    }

    static async addItem(input: { name: string; category?: string; total_quantity: number; location?: string }) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('inventory_items')
            .insert({ ...input, available_quantity: input.total_quantity })
            .select('*')
            .single();

        if (error) throw new InventoryServiceError('Failed to add inventory item', 500);
        return data;
    }

    static async recordLog(itemId: string, actionType: string, quantity: number, personName?: string, notes?: string) {
        const supabase = await createClient();

        // 1. Get current item
        const { data: item, error: fetchError } = await supabase
            .from('inventory_items')
            .select('available_quantity')
            .eq('id', itemId)
            .single();

        if (fetchError || !item) throw new InventoryServiceError('Item not found', 404);

        let newAvailable = item.available_quantity;
        if (actionType === 'check-out') {
            if (item.available_quantity < quantity) throw new InventoryServiceError('Insufficient availability', 400);
            newAvailable -= quantity;
        } else if (actionType === 'check-in') {
            newAvailable += quantity;
        }

        // 2. Perform update and log
        const { error: logError } = await supabase
            .from('inventory_logs')
            .insert({ item_id: itemId, action_type: actionType, quantity, person_name: personName, notes });

        if (logError) throw new InventoryServiceError('Failed to record inventory log', 500);

        const { error: updateError } = await supabase
            .from('inventory_items')
            .update({ available_quantity: newAvailable })
            .eq('id', itemId);

        if (updateError) throw new InventoryServiceError('Failed to update inventory availability', 500);

        return { success: true };
    }
}
