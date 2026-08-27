import { TimeSlotService } from '../timeSlot.service';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

import { createClient } from '@/lib/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('TimeSlotService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a time slot when no overlap exists', async () => {
    const overlap = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), lt: jest.fn().mockReturnThis(), gt: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'slot-id' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(overlap).mockReturnValueOnce(insert) } as never);

    await expect(TimeSlotService.createTimeSlot({ day_of_week: 1, start_time: '09:00', end_time: '10:00' })).resolves.toEqual({ id: 'slot-id' });
    expect(insert.insert).toHaveBeenCalledWith({ day_of_week: 1, start_time: '09:00', end_time: '10:00' });
  });

  it('rejects an overlapping time slot', async () => {
    const overlap = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), lt: jest.fn().mockReturnThis(), gt: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'existing' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(overlap) } as never);

    await expect(TimeSlotService.createTimeSlot({ day_of_week: 1, start_time: '09:00', end_time: '10:00' })).rejects.toMatchObject({ message: 'Time slot overlaps an existing slot on this day', status: 409 });
  });

  it('rejects an update with an end time before its start time', async () => {
    const lookup = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'slot-id', day_of_week: 1, start_time: '09:00', end_time: '10:00' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(lookup) } as never);

    await expect(TimeSlotService.updateTimeSlot('slot-id', { end_time: '08:00' })).rejects.toMatchObject({ message: 'End time must be after start time', status: 400 });
  });

  it('blocks deletion when the slot is used in the timetable', async () => {
    const lookup = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'slot-id' }, error: null }) };
    const dependency = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ count: 1, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(lookup).mockReturnValueOnce(dependency) } as never);

    await expect(TimeSlotService.deleteTimeSlot('slot-id')).rejects.toMatchObject({ message: 'Cannot delete time slot because it is used in the timetable', status: 409 });
  });
});