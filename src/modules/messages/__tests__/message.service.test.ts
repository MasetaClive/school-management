import { MessageService } from '../message.service';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

import { createClient } from '@/lib/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('MessageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows an admin to message any user', async () => {
    const userQuery = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({
        data: [
          { id: 'admin-id', role: 'admin' },
          { id: 'teacher-id', role: 'teacher' },
        ],
        error: null,
      }),
    };
    const message = { id: 'message-id', body: 'Hello' };
    const insertQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: message, error: null }),
    };

    mockCreateClient.mockResolvedValue({
      from: jest.fn()
        .mockReturnValueOnce(userQuery)
        .mockReturnValueOnce(insertQuery),
    } as never);

    await expect(
      MessageService.sendMessage('admin-id', {
        recipient_id: 'teacher-id',
        subject: '',
        body: 'Hello',
      }),
    ).resolves.toEqual(message);

    expect(insertQuery.insert).toHaveBeenCalledWith({
      sender_id: 'admin-id',
      recipient_id: 'teacher-id',
      subject: null,
      body: 'Hello',
      is_read: false,
    });
  });

  it('allows a teacher to message a student', async () => {
    const userQuery = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({
        data: [
          { id: 'teacher-id', role: 'teacher' },
          { id: 'student-id', role: 'student' },
        ],
        error: null,
      }),
    };
    const insertQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 'message-id' }, error: null }),
    };

    mockCreateClient.mockResolvedValue({
      from: jest.fn()
        .mockReturnValueOnce(userQuery)
        .mockReturnValueOnce(insertQuery),
    } as never);

    await expect(
      MessageService.sendMessage('teacher-id', {
        recipient_id: 'student-id',
        body: 'Homework reminder',
      }),
    ).resolves.toEqual({ id: 'message-id' });
  });

  it('rejects a teacher messaging another teacher', async () => {
    const userQuery = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({
        data: [
          { id: 'teacher-id', role: 'teacher' },
          { id: 'other-teacher-id', role: 'teacher' },
        ],
        error: null,
      }),
    };

    mockCreateClient.mockResolvedValue({
      from: jest.fn().mockReturnValue(userQuery),
    } as never);

    await expect(
      MessageService.sendMessage('teacher-id', {
        recipient_id: 'other-teacher-id',
        body: 'Hello',
      }),
    ).rejects.toMatchObject({
      message: 'Teachers can only message students and parents',
      status: 403,
    });
  });

  it('rejects a student messaging a parent', async () => {
    const userQuery = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({
        data: [
          { id: 'student-id', role: 'student' },
          { id: 'parent-id', role: 'parent' },
        ],
        error: null,
      }),
    };

    mockCreateClient.mockResolvedValue({
      from: jest.fn().mockReturnValue(userQuery),
    } as never);

    await expect(
      MessageService.sendMessage('student-id', {
        recipient_id: 'parent-id',
        body: 'Hello',
      }),
    ).rejects.toMatchObject({
      message: 'Students can only message teachers',
      status: 403,
    });
  });

  it('throws not found when the user query fails', async () => {
    const userQuery = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
    };

    mockCreateClient.mockResolvedValue({
      from: jest.fn().mockReturnValue(userQuery),
    } as never);

    await expect(
      MessageService.sendMessage('teacher-id', {
        recipient_id: 'student-id',
        body: 'Hello',
      }),
    ).rejects.toMatchObject({ message: 'Users not found', status: 404 });
  });

  it('throws a server error when message insertion fails', async () => {
    const userQuery = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({
        data: [
          { id: 'admin-id', role: 'admin' },
          { id: 'student-id', role: 'student' },
        ],
        error: null,
      }),
    };
    const insertQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    };

    mockCreateClient.mockResolvedValue({
      from: jest.fn()
        .mockReturnValueOnce(userQuery)
        .mockReturnValueOnce(insertQuery),
    } as never);

    await expect(
      MessageService.sendMessage('admin-id', {
        recipient_id: 'student-id',
        body: 'Hello',
      }),
    ).rejects.toMatchObject({ message: 'Failed to send message', status: 500 });
  });
});