import { NextRequest } from 'next/server';
import { InventoryRoutes } from '@/modules/inventory/inventory.routes';

export async function GET(req: NextRequest) {
    return InventoryRoutes.LIST_ITEMS(req);
}

export async function POST(req: NextRequest) {
    return InventoryRoutes.ADD_ITEM(req);
}
