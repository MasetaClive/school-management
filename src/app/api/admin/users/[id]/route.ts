import { NextRequest, NextResponse } from 'next/server';
import { UserController } from '@/modules/users/user.controller';

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    return NextResponse.json({ error: 'Single user fetch not implemented via API yet' }, { status: 501 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    return await UserController.update(req, id);
  } catch (error: any) {
    console.error('[API Route PATCH] Crash:', error);
    return NextResponse.json({ 
        error: 'Internal Server Error', 
        message: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    return await UserController.delete(req, id);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
