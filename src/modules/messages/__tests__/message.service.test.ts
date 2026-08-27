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

  it.each([
    [[], 'Users not found'],
    [[{ id: 'admin-id', role: 'admin' }], 'Recipient not found'],
  ])('rejects incomplete user lookups', async (users, message) => {
    const userQuery = { select: jest.fn().mockReturnThis(), in: jest.fn().mockResolvedValue({ data: users, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(userQuery) } as never);
    await expect(MessageService.sendMessage('admin-id', { recipient_id: 'recipient-id', body: 'Hello' })).rejects.toMatchObject({ status: 404, message });
  });

  it('rejects unknown roles and supports parent messaging a teacher', async () => {
    const unknown = { select: jest.fn().mockReturnThis(), in: jest.fn().mockResolvedValue({ data: [{ id: 'user-id', role: 'librarian' }, { id: 'recipient-id', role: 'teacher' }], error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(unknown) } as never);
    await expect(MessageService.sendMessage('user-id', { recipient_id: 'recipient-id', body: 'Hello' })).rejects.toMatchObject({ status: 403, message: 'Unauthorized role' });
    const users = { select: jest.fn().mockReturnThis(), in: jest.fn().mockResolvedValue({ data: [{ id: 'parent-id', role: 'parent' }, { id: 'teacher-id', role: 'teacher' }], error: null }) };
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'message-id' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(users).mockReturnValueOnce(insert) } as never);
    await expect(MessageService.sendMessage('parent-id', { recipient_id: 'teacher-id', body: 'Hello' })).resolves.toEqual({ id: 'message-id' });
  });

  it('lists users by role/search and handles database errors', async () => {
    const query = { select: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), ilike: jest.fn().mockReturnThis(), in: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [{ id: 'teacher-id' }], error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(query) } as never);
    await expect(MessageService.listUsers('student', 'Ada')).resolves.toEqual([{ id: 'teacher-id' }]);
    const hiddenQuery = { select: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis() };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(hiddenQuery) } as never);
    await expect(MessageService.listUsers('staff')).resolves.toEqual([]);
    const failed = { select: jest.fn().mockReturnThis(), order: jest.fn().mockResolvedValue({ data: null, error: { message: 'db' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(failed) } as never);
    await expect(MessageService.listUsers('admin')).rejects.toMatchObject({ status: 500 });
  });

  it('handles inbox, sent, access, read, and delete branches', async () => {
    const list = (error: unknown = null) => ({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), range: jest.fn().mockResolvedValue({ data: [], count: 0, error }) });
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(list()) } as never);
    await expect(MessageService.getInbox('user-id', { page: 2 })).resolves.toMatchObject({ page: 2, totalPages: 1 });
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(list({ message: 'db' })) } as never);
    await expect(MessageService.getSentMessages('user-id', {})).rejects.toMatchObject({ status: 500 });
    const message = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'm', sender_id: 'a', recipient_id: 'b', is_read: false }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(message) } as never);
    await expect(MessageService.getMessageById('m', 'outsider')).rejects.toMatchObject({ status: 403 });
    const readMessage = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'm', sender_id: 'a', recipient_id: 'b', is_read: false }, error: null }), update: jest.fn().mockReturnThis() };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(readMessage) } as never);
    await expect(MessageService.getMessageById('m', 'b')).resolves.toMatchObject({ is_read: true });
    const removeLookup = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(removeLookup) } as never);
    await expect(MessageService.deleteMessage('m', 'a')).rejects.toMatchObject({ status: 404 });
  });
});