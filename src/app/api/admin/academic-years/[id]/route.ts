import { NextRequest } from 'next/server';
import { updateAcademicYearRoute } from '@/modules/academic-years/academicYear.routes';

type Params = { id: string };

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { id } = await params;
  return updateAcademicYearRoute(req, id);
}
