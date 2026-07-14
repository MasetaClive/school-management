import { NextRequest } from 'next/server';
import { InventoryController } from './inventory.controller';

export const InventoryRoutes = {
    async LIST_ITEMS(req: NextRequest) {
        return InventoryController.listItems(req);
    },
    async ADD_ITEM(req: NextRequest) {
        return InventoryController.addItem(req);
    },
    async RECORD_LOG(req: NextRequest) {
        return InventoryController.recordLog(req);
    }
};
