import { NextRequest } from 'next/server';
import { deleteAcademicYearRoute, getAcademicYearRoute, updateAcademicYearRoute } from '@/modules/academic-years/academicYear.routes';

type Params = { id: string };

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { id } = await params;
  return updateAcademicYearRoute(req, id);
}

export async function GET(req: NextRequest, { params }: { params: Promise<Params> }) {
  return getAcademicYearRoute(req, (await params).id);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<Params> }) {
  return deleteAcademicYearRoute(req, (await params).id);
}
