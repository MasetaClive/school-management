import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import {
  createAcademicYearSchema,
  updateAcademicYearSchema,
  listAcademicYearsQuerySchema,
  academicYearIdParamSchema,
} from './academicYear.validation';
import { AcademicYearService, AcademicYearServiceError } from './academicYear.service';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function ensureAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new ApiError('Unauthorized', 401);

  const role = await getUserRole();
  if (role !== 'admin') throw new ApiError('Forbidden', 403);
}

function toJsonError(e: unknown) {
  if (e instanceof ApiError || e instanceof AcademicYearServiceError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  if (e instanceof Error && e.name === 'ZodError') {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
  }
  // eslint-disable-next-line no-console
  console.error('[academic-years] unexpected error', e);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 },
  );
}

export const AcademicYearController = {
  async list(req: NextRequest) {
    try {
      await ensureAdmin();
      const url = new URL(req.url);
      const result = await AcademicYearService.getAcademicYears(listAcademicYearsQuerySchema.parse({ page: url.searchParams.get('page') ?? undefined, search: url.searchParams.get('search') ?? undefined }));
      return NextResponse.json(result, { status: 200 });
    } catch (e) {
      return toJsonError(e);
    }
  },

  async create(req: NextRequest) {
    try {
      await ensureAdmin();
      const body = await req.json();
      const input = createAcademicYearSchema.parse(body);

      const academicYear = await AcademicYearService.createAcademicYear(input);
      return NextResponse.json({ data: academicYear }, { status: 201 });
    } catch (e) {
      return toJsonError(e);
    }
  },

  async update(req: NextRequest, id: string) {
    try {
      await ensureAdmin();
      const body = await req.json();
      const input = updateAcademicYearSchema.parse(body);
      const academicYearId = academicYearIdParamSchema.parse(id);

      let result;
      if (input.is_active !== undefined && input.is_active === true) {
        result = await AcademicYearService.setActiveYear(academicYearId);
      } else if (input.is_closed !== undefined && input.is_closed === true) {
        result = await AcademicYearService.closeAcademicYear(academicYearId);
      } else {
        result = await AcademicYearService.updateAcademicYear(academicYearId, input);
      }
      
      return NextResponse.json({ data: result }, { status: 200 });
    } catch (e) {
      return toJsonError(e);
    }
  },

  async getOne(_req: NextRequest, id: string) {
    try {
      await ensureAdmin();
      return NextResponse.json({ data: await AcademicYearService.getAcademicYearById(academicYearIdParamSchema.parse(id)) });
    } catch (e) { return toJsonError(e); }
  },

  async delete(_req: NextRequest, id: string) {
    try {
      await ensureAdmin();
      return NextResponse.json(await AcademicYearService.deleteAcademicYear(academicYearIdParamSchema.parse(id)));
    } catch (e) { return toJsonError(e); }
  },
};
