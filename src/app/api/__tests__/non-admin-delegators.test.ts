import { NextRequest } from 'next/server';

const response = new Response('delegated', { status: 207 });
const mockCreateMessageRoute = jest.fn();
const mockGetMessageRoute = jest.fn();
const mockUpdateMessageRoute = jest.fn();
const mockDeleteMessageRoute = jest.fn();
const mockGetInboxRoute = jest.fn();
const mockGetSentRoute = jest.fn();
const mockGetUsersRoute = jest.fn();
const mockListNotifications = jest.fn();
const mockMarkNotificationRead = jest.fn();

jest.mock('@/modules/messages/message.routes', () => ({
  createMessageRoute: mockCreateMessageRoute,
  getMessageRoute: mockGetMessageRoute,
  updateMessageRoute: mockUpdateMessageRoute,
  deleteMessageRoute: mockDeleteMessageRoute,
  getInboxRoute: mockGetInboxRoute,
  getSentRoute: mockGetSentRoute,
  getUsersRoute: mockGetUsersRoute,
}));
jest.mock('@/modules/notifications/notification.routes', () => ({
  NotificationRoutes: { LIST: mockListNotifications, MARK_READ: mockMarkNotificationRead },
}));

import * as messages from '../messages/route';
import * as messageById from '../messages/[id]/route';
import * as inbox from '../messages/inbox/route';
import * as sent from '../messages/sent/route';
import * as users from '../users/route';
import * as notifications from '../notifications/route';
import * as notificationById from '../notifications/[id]/route';

const request = new NextRequest('http://localhost/api/messages', { method: 'POST' });
const params = { params: Promise.resolve({ id: 'message-1' }) };

describe('non-admin delegator routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    [mockCreateMessageRoute, mockGetMessageRoute, mockUpdateMessageRoute, mockDeleteMessageRoute,
      mockGetInboxRoute, mockGetSentRoute, mockGetUsersRoute, mockListNotifications, mockMarkNotificationRead]
      .forEach((mock) => mock.mockResolvedValue(response));
  });

  it.each([
    ['messages POST', messages.POST, mockCreateMessageRoute, [request]],
    ['messages GET by id', messageById.GET, mockGetMessageRoute, [request, 'message-1']],
    ['messages PATCH by id', messageById.PATCH, mockUpdateMessageRoute, [request, 'message-1']],
    ['messages DELETE by id', messageById.DELETE, mockDeleteMessageRoute, [request, 'message-1']],
    ['messages inbox GET', inbox.GET, mockGetInboxRoute, [request]],
    ['messages sent GET', sent.GET, mockGetSentRoute, [request]],
    ['users GET', users.GET, mockGetUsersRoute, [request]],
    ['notifications GET', notifications.GET, mockListNotifications, [request]],
  ])('%s passes request through and preserves the exact response', async (_name, handler, delegated, expected) => {
    const result = expected.length === 1
      ? await (handler as Function)(expected[0])
      : await (handler as Function)(expected[0], params);
    expect(result).toBe(response);
    expect(delegated).toHaveBeenCalledWith(...expected);
  });

  it('passes awaited notification route params in the route-specific shape', async () => {
    expect(await notificationById.PATCH(request, params)).toBe(response);
    expect(mockMarkNotificationRead).toHaveBeenCalledWith(request, { params: { id: 'message-1' } });
  });
});