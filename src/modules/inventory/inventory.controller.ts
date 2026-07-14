import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { InventoryService, InventoryServiceError } from './inventory.service';

function toJsonError(e: unknown) {
    if (e instanceof InventoryServiceError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('[inventory] unexpected error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export const InventoryController = {
    async listItems(req: NextRequest) {
        try {
            const data = await InventoryService.listItems();
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    },

    async addItem(req: NextRequest) {
        try {
            const body = await req.json();
            const data = await InventoryService.addItem(body);
            return NextResponse.json(data, { status: 201 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async recordLog(req: NextRequest) {
        try {
            const body = await req.json();
            const data = await InventoryService.recordLog(body.item_id, body.action_type, body.quantity, body.person_name, body.notes);
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    }
};
