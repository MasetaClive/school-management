import { NextRequest } from 'next/server';
import { AcademicYearController } from './academicYear.controller';

export async function listAcademicYearsRoute(req: NextRequest) {
  return AcademicYearController.list(req);
}

export async function createAcademicYearRoute(req: NextRequest) {
  return AcademicYearController.create(req);
}

export async function updateAcademicYearRoute(req: NextRequest, id: string) {
  return AcademicYearController.update(req, id);
}
