import { HomeworkService } from '../homework.service';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/supabase/config', () => ({ getSupabaseServerEnv: () => ({ url: 'https://project.supabase.co' }) }));

import { createClient } from '@/lib/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

const relation = (data: unknown, error: unknown = null) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockResolvedValue({ data, error }),
});

describe('HomeworkService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects attachments that are not Supabase homework uploads', async () => {
    await expect(HomeworkService.createHomework({ class_id: 'class-id', subject_id: 'subject-id', teacher_id: 'teacher-id', title: 'Read chapter', due_date: '2026-08-27T12:00:00Z', attachment_url: 'https://evil.example/file.pdf', academic_year: '2026' })).rejects.toMatchObject({ message: 'Homework attachments must be uploaded from your device', status: 400 });
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('creates homework after all relationships and duplicate checks pass', async () => {
    const relationships = [
      relation({ id: 'class-id' }), relation({ id: 'subject-id' }), relation({ id: 'teacher-id' }),
      relation({ id: 'year-id', start_date: '2026-01-01', end_date: '2026-12-31', is_closed: false }),
      relation({ id: 'assignment-id' }), relation({ id: 'timetable-id' }),
    ];
    const duplicate = relation(null);
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'homework-id' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockImplementationOnce(() => relationships[0]).mockImplementationOnce(() => relationships[1]).mockImplementationOnce(() => relationships[2]).mockImplementationOnce(() => relationships[3]).mockImplementationOnce(() => relationships[4]).mockImplementationOnce(() => relationships[5]).mockImplementationOnce(() => duplicate).mockImplementationOnce(() => insert) } as never);

    await expect(HomeworkService.createHomework({ class_id: 'class-id', subject_id: 'subject-id', teacher_id: 'teacher-id', title: 'Read chapter', due_date: '2026-08-27T12:00:00Z', academic_year: '2026' })).resolves.toEqual({ id: 'homework-id' });
    expect(insert.insert).toHaveBeenCalledWith(expect.objectContaining({ due_date: '2026-08-27T12:00:00.000Z', description: null, attachment_url: null }));
  });

  it('rejects homework in a closed academic year', async () => {
    const relationships = [
      relation({ id: 'class-id' }), relation({ id: 'subject-id' }), relation({ id: 'teacher-id' }),
      relation({ id: 'year-id', start_date: null, end_date: null, is_closed: true }), relation({ id: 'assignment-id' }), relation({ id: 'timetable-id' }),
    ];
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockImplementation((table: string) => relationships[['classes', 'subjects', 'teachers', 'academic_years', 'subject_assignments', 'timetable_entries'].indexOf(table)]) } as never);

    await expect(HomeworkService.createHomework({ class_id: 'class-id', subject_id: 'subject-id', teacher_id: 'teacher-id', title: 'Read chapter', due_date: '2026-08-27T12:00:00Z', academic_year: '2026' })).rejects.toMatchObject({ message: 'Cannot assign homework in a closed academic year', status: 409 });
  });

  it('rejects a due date outside the academic year', async () => {
    const relationships = [
      relation({ id: 'class-id' }), relation({ id: 'subject-id' }), relation({ id: 'teacher-id' }),
      relation({ id: 'year-id', start_date: '2026-01-01', end_date: '2026-06-30', is_closed: false }), relation({ id: 'assignment-id' }), relation({ id: 'timetable-id' }),
    ];
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockImplementation((table: string) => relationships[['classes', 'subjects', 'teachers', 'academic_years', 'subject_assignments', 'timetable_entries'].indexOf(table)]) } as never);

    await expect(HomeworkService.createHomework({ class_id: 'class-id', subject_id: 'subject-id', teacher_id: 'teacher-id', title: 'Read chapter', due_date: '2026-08-27T12:00:00Z', academic_year: '2026' })).rejects.toMatchObject({ message: 'Due date must fall within the academic year', status: 400 });
  });
});