import { NextRequest } from 'next/server';
import { MessageController } from './message.controller';

export async function getInboxRoute(req: NextRequest) {
    return MessageController.getInbox(req);
}

export async function getSentRoute(req: NextRequest) {
    return MessageController.getSent(req);
}

export async function createMessageRoute(req: NextRequest) {
    return MessageController.create(req);
}

export async function getMessageRoute(req: NextRequest, id: string) {
    return MessageController.getOne(req, id);
}

export async function updateMessageRoute(req: NextRequest, id: string) {
    return MessageController.markAsRead(req, id);
}

export async function deleteMessageRoute(req: NextRequest, id: string) {
    return MessageController.delete(req, id);
}

export async function getUsersRoute(req: NextRequest) {
    return MessageController.listUsers(req);
}
