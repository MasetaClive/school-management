-- Prevent concurrent class and teacher double-booking at the database layer.
CREATE UNIQUE INDEX IF NOT EXISTS timetable_entries_teacher_time_slot_year_key
  ON public.timetable_entries (teacher_id, time_slot_id, academic_year);

-- Refuse to apply the constraint to already-invalid timetable data.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.timetable_entries AS entry
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.subject_assignments AS assignment
      WHERE assignment.class_id = entry.class_id
        AND assignment.subject_id = entry.subject_id
        AND assignment.teacher_id = entry.teacher_id
        AND assignment.academic_year = entry.academic_year
    )
    OR NOT EXISTS (
      SELECT 1 FROM public.academic_years AS year
      WHERE year.year = entry.academic_year
    )
  ) THEN
    RAISE EXCEPTION 'Resolve timetable entries without a matching subject assignment or academic year before applying this migration';
  END IF;
END;
$$;

-- A timetable row must correspond to an existing teaching assignment.
CREATE OR REPLACE FUNCTION public.validate_timetable_subject_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.subject_assignments
    WHERE class_id = NEW.class_id
      AND subject_id = NEW.subject_id
      AND teacher_id = NEW.teacher_id
      AND academic_year = NEW.academic_year
  ) THEN
    RAISE EXCEPTION 'Timetable entry requires a matching subject assignment';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.academic_years
    WHERE year = NEW.academic_year AND is_closed = FALSE
  ) THEN
    RAISE EXCEPTION 'Timetable entry requires an open academic year';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_timetable_subject_assignment ON public.timetable_entries;
CREATE TRIGGER validate_timetable_subject_assignment
  BEFORE INSERT OR UPDATE OF class_id, subject_id, teacher_id, academic_year
  ON public.timetable_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_timetable_subject_assignment();
