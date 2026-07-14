import { NextRequest } from 'next/server';
import {
  listAcademicYearsRoute,
  createAcademicYearRoute,
} from '@/modules/academic-years/academicYear.routes';

export async function GET(req: NextRequest) {
  return listAcademicYearsRoute(req);
}

export async function POST(req: NextRequest) {
  return createAcademicYearRoute(req);
}
