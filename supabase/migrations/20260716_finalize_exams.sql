-- Associate each exam with the teacher who owns its teaching assignment.
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.teachers(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS exam_type TEXT NOT NULL DEFAULT 'assessment';

-- Backfill only unambiguous historical assignments.
UPDATE public.exams AS exam
SET teacher_id = assignment.teacher_id
FROM public.subject_assignments AS assignment
WHERE exam.teacher_id IS NULL
  AND assignment.class_id = exam.class_id
  AND assignment.subject_id = exam.subject_id
  AND assignment.academic_year = exam.academic_year
  AND NOT EXISTS (
    SELECT 1 FROM public.subject_assignments AS other_assignment
    WHERE other_assignment.class_id = exam.class_id
      AND other_assignment.subject_id = exam.subject_id
      AND other_assignment.academic_year = exam.academic_year
      AND other_assignment.teacher_id <> assignment.teacher_id
  );

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.exams AS exam
    WHERE exam.teacher_id IS NULL
       OR NOT EXISTS (
         SELECT 1 FROM public.subject_assignments AS assignment
         WHERE assignment.class_id = exam.class_id AND assignment.subject_id = exam.subject_id
           AND assignment.teacher_id = exam.teacher_id AND assignment.academic_year = exam.academic_year
       )
       OR NOT EXISTS (
         SELECT 1 FROM public.timetable_entries AS timetable
         WHERE timetable.class_id = exam.class_id AND timetable.subject_id = exam.subject_id
           AND timetable.teacher_id = exam.teacher_id AND timetable.academic_year = exam.academic_year
       )
       OR NOT EXISTS (
         SELECT 1 FROM public.academic_years AS year
         WHERE year.year = exam.academic_year
       )
  ) THEN
    RAISE EXCEPTION 'Resolve exams without a unique teacher assignment, timetable entry, or academic year before applying this migration';
  END IF;
END;
$$;

ALTER TABLE public.exams
  ALTER COLUMN teacher_id SET NOT NULL,
  DROP CONSTRAINT IF EXISTS exams_exam_type_check,
  ADD CONSTRAINT exams_exam_type_check CHECK (exam_type IN ('assessment', 'quiz', 'test', 'midterm', 'final', 'practical')),
  ADD CONSTRAINT exams_max_marks_range_check CHECK (max_marks > 0 AND max_marks <= 1000);

CREATE UNIQUE INDEX IF NOT EXISTS exams_class_subject_date_year_key
  ON public.exams (class_id, subject_id, exam_date, academic_year);

-- Results must block exam deletion instead of being cascaded away.
ALTER TABLE public.results
  DROP CONSTRAINT IF EXISTS results_exam_id_fkey,
  ADD CONSTRAINT results_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE RESTRICT;

CREATE OR REPLACE FUNCTION public.validate_exam_relationships()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.subject_assignments
    WHERE class_id = NEW.class_id AND subject_id = NEW.subject_id
      AND teacher_id = NEW.teacher_id AND academic_year = NEW.academic_year
  ) THEN
    RAISE EXCEPTION 'Exam requires a matching subject assignment';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.timetable_entries
    WHERE class_id = NEW.class_id AND subject_id = NEW.subject_id
      AND teacher_id = NEW.teacher_id AND academic_year = NEW.academic_year
  ) THEN
    RAISE EXCEPTION 'Exam requires a matching timetable entry';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.academic_years
    WHERE year = NEW.academic_year AND is_closed = FALSE
      AND (start_date IS NULL OR NEW.exam_date >= start_date)
      AND (end_date IS NULL OR NEW.exam_date <= end_date)
  ) THEN
    RAISE EXCEPTION 'Exam date must fall in an open academic year';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_exam_relationships ON public.exams;
CREATE TRIGGER validate_exam_relationships
  BEFORE INSERT OR UPDATE OF class_id, subject_id, teacher_id, exam_date, academic_year
  ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.validate_exam_relationships();
