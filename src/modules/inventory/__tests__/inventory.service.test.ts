import { InventoryService } from '../inventory.service';
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
import { createClient } from '@/lib/supabase/server';
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
describe('InventoryService', () => {
  beforeEach(() => jest.clearAllMocks());
  it('adds an item with all quantity initially available', async () => {
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'item-id' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(insert) } as never);
    await expect(InventoryService.addItem({ name: 'Chairs', total_quantity: 10 })).resolves.toEqual({ id: 'item-id' });
    expect(insert.insert).toHaveBeenCalledWith({ name: 'Chairs', total_quantity: 10, available_quantity: 10 });
  });
  it('prevents checking out more than is available', async () => {
    const lookup = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { available_quantity: 2 }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(lookup) } as never);
    await expect(InventoryService.recordLog('item-id', 'check-out', 3)).rejects.toMatchObject({ message: 'Insufficient availability', status: 400 });
  });
  it('updates availability after recording a check-in', async () => {
    const lookup = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { available_quantity: 2 }, error: null }) };
    const log = { insert: jest.fn().mockResolvedValue({ error: null }) };
    const update = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(lookup).mockReturnValueOnce(log).mockReturnValueOnce(update) } as never);
    await expect(InventoryService.recordLog('item-id', 'check-in', 3)).resolves.toEqual({ success: true });
    expect(update.update).toHaveBeenCalledWith({ available_quantity: 5 });
  });

  it('lists items and records a checkout with optional log details', async () => {
    const list = { select: jest.fn().mockReturnThis(), order: jest.fn().mockResolvedValue({ data: [], error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(list) } as never);
    await expect(InventoryService.listItems()).resolves.toEqual([]);
    const lookup = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { available_quantity: 5 }, error: null }) };
    const log = { insert: jest.fn().mockResolvedValue({ error: null }) };
    const update = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(lookup).mockReturnValueOnce(log).mockReturnValueOnce(update) } as never);
    await expect(InventoryService.recordLog('item', 'check-out', 2, 'Jane', 'Loan')).resolves.toEqual({ success: true });
    expect(update.update).toHaveBeenCalledWith({ available_quantity: 3 });
    expect(log.insert).toHaveBeenCalledWith({ item_id: 'item', action_type: 'check-out', quantity: 2, person_name: 'Jane', notes: 'Loan' });
  });

  it('maps inventory lookup, log, update, and list errors', async () => {
    const missing = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error: { message: 'db' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(missing) } as never);
    await expect(InventoryService.recordLog('item', 'check-in', 1)).rejects.toMatchObject({ status: 404 });
    const list = { select: jest.fn().mockReturnThis(), order: jest.fn().mockResolvedValue({ data: null, error: { message: 'db' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(list) } as never);
    await expect(InventoryService.listItems()).rejects.toMatchObject({ status: 500 });
  });
});