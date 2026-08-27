import { HomeworkService } from '../homework.service';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/supabase/config', () => ({ getSupabaseServerEnv: () => ({ url: 'https://project.supabase.co' }) }));

import { createClient } from '@/lib/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

const relation = (data: unknown, error: unknown = null) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
  maybeSingle: jest.fn().mockResolvedValue({ data, error }),
});
const validHomework = { class_id: 'class-id', subject_id: 'subject-id', teacher_id: 'teacher-id', title: 'Read chapter', due_date: '2026-08-27T12:00:00Z', academic_year: '2026' };
const validRelationships = () => [
  relation({ id: 'class-id' }), relation({ id: 'subject-id' }), relation({ id: 'teacher-id' }),
  relation({ id: 'year-id', start_date: '2026-01-01', end_date: '2026-12-31', is_closed: false }),
  relation({ id: 'assignment-id' }), relation({ id: 'timetable-id' }),
];

describe('HomeworkService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects attachments that are not Supabase homework uploads', async () => {
    await expect(HomeworkService.createHomework({ class_id: 'class-id', subject_id: 'subject-id', teacher_id: 'teacher-id', title: 'Read chapter', due_date: '2026-08-27T12:00:00Z', attachment_url: 'https://evil.example/file.pdf', academic_year: '2026' })).rejects.toMatchObject({ message: 'Homework attachments must be uploaded from your device', status: 400 });
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('creates homework after all relationships and duplicate checks pass', async () => {
    const relationships = validRelationships();
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

  it.each([
    ['class', 0, 'Class not found', 404], ['subject', 1, 'Subject not found', 404],
    ['teacher', 2, 'Teacher not found', 404], ['year', 3, 'Academic year not found', 404],
    ['assignment', 4, 'A matching subject assignment is required for this class, subject, teacher, and academic year', 409],
    ['timetable', 5, 'A matching timetable entry is required for this homework assignment', 409],
  ])('rejects when the %s relationship is missing', async (_name, index, message, status) => {
    const relationships = validRelationships();
    relationships[index as number] = relation(null);
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockImplementation((table: string) => relationships[['classes', 'subjects', 'teachers', 'academic_years', 'subject_assignments', 'timetable_entries'].indexOf(table)]) } as never);
    await expect(HomeworkService.createHomework({ class_id: 'class-id', subject_id: 'subject-id', teacher_id: 'teacher-id', title: 'Read chapter', due_date: '2026-08-27T12:00:00Z', academic_year: '2026' })).rejects.toMatchObject({ message, status });
  });

  it('rejects invalid dates and relationship or duplicate database errors', async () => {
    await expect(HomeworkService.createHomework({ class_id: 'class-id', subject_id: 'subject-id', teacher_id: 'teacher-id', title: 'Read chapter', due_date: 'invalid', academic_year: '2026' })).rejects.toMatchObject({ message: 'Invalid due date', status: 400 });
    const relationships = validRelationships(); relationships[2] = relation(null, { message: 'down' });
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockImplementation((table: string) => relationships[['classes', 'subjects', 'teachers', 'academic_years', 'subject_assignments', 'timetable_entries'].indexOf(table)]) } as never);
    await expect(HomeworkService.createHomework({ class_id: 'class-id', subject_id: 'subject-id', teacher_id: 'teacher-id', title: 'Read chapter', due_date: '2026-08-27T12:00:00Z', academic_year: '2026' })).rejects.toMatchObject({ message: 'Failed to validate homework relationships', status: 500 });
  });

  it('lists filtered homework and handles sanitized empty searches', async () => {
    const list = relation(null); list.range.mockResolvedValue({ data: [{ id: 'h1' }], error: null, count: 21 });
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockImplementationOnce(() => list).mockImplementationOnce(() => relation([{ id: 'teacher-id' }])).mockImplementationOnce(() => relation([])).mockImplementationOnce(() => relation([])) } as never);
    await expect(HomeworkService.listHomework({ page: 2, class_id: 'class-id', teacher_id: 'teacher-id', subject_id: 'subject-id', academic_year: '2026', due_before: '2026-12-01', due_after: '2026-01-01', search: 'John' })).resolves.toMatchObject({ data: [{ id: 'h1' }], page: 2, totalPages: 2 });
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(relation(null)) } as never);
    await expect(HomeworkService.listHomework({ page: 1, search: '%,_' })).resolves.toMatchObject({ data: [], total: 0 });
  });
});