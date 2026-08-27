import { TimetableService } from '../timetable.service';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
import { createClient } from '@/lib/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const relation = (data: unknown, error: unknown = null) => ({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data, error }) });
const input = { class_id: 'class-id', subject_id: 'subject-id', teacher_id: 'teacher-id', time_slot_id: 'slot-id', academic_year: '2026' };
const validReferences = () => [relation({ id: 'class-id' }), relation({ id: 'slot-id' }), relation({ id: 'year-id', is_closed: false }), relation({ id: 'assignment-id' })];

describe('TimetableService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates an entry when references and both conflict checks pass', async () => {
    const references = validReferences();
    const conflicts = [relation(null), relation(null)];
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'entry-id' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockImplementationOnce(() => references[0]).mockImplementationOnce(() => references[1]).mockImplementationOnce(() => references[2]).mockImplementationOnce(() => references[3]).mockImplementationOnce(() => conflicts[0]).mockImplementationOnce(() => conflicts[1]).mockImplementationOnce(() => insert) } as never);

    await expect(TimetableService.createTimetableEntry(input)).resolves.toEqual({ id: 'entry-id' });
    expect(insert.insert).toHaveBeenCalledWith(input);
  });

  it('rejects entries without a matching subject assignment', async () => {
    const references = [relation({ id: 'class-id' }), relation({ id: 'slot-id' }), relation({ id: 'year-id', is_closed: false }), relation(null)];
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockImplementation((table: string) => references[['classes', 'time_slots', 'academic_years', 'subject_assignments'].indexOf(table)]) } as never);

    await expect(TimetableService.createTimetableEntry(input)).rejects.toMatchObject({ status: 409, message: 'The selected teacher, subject, class, and academic year do not form a valid subject assignment' });
  });

  it('rejects a class schedule conflict', async () => {
    const references = validReferences();
    const conflicts = [relation({ id: 'existing-entry' }), relation(null)];
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockImplementationOnce(() => references[0]).mockImplementationOnce(() => references[1]).mockImplementationOnce(() => references[2]).mockImplementationOnce(() => references[3]).mockImplementationOnce(() => conflicts[0]).mockImplementationOnce(() => conflicts[1]) } as never);

    await expect(TimetableService.createTimetableEntry(input)).rejects.toMatchObject({ status: 409, message: 'Class already has a schedule in this time slot' });
  });

  it('returns no entries when a requested day has no time slots', async () => {
    const listQuery = { select: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis() };
    const slots = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [], error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(listQuery).mockReturnValueOnce(slots) } as never);

    await expect(TimetableService.listTimetables({ page: 1, day_of_week: 2 })).resolves.toMatchObject({ data: [], total: 0, totalPages: 1 });
  });
});