-- Attendance must always be recorded against the student's current class.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.student_attendance AS attendance
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.students AS student
      WHERE student.id = attendance.student_id
        AND student.class_id = attendance.class_id
    )
  ) THEN
    RAISE EXCEPTION 'Resolve attendance records whose class does not match the student assignment before applying this migration';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_student_attendance_class()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.students
    WHERE id = NEW.student_id AND class_id = NEW.class_id
  ) THEN
    RAISE EXCEPTION 'Attendance class must match the student class assignment';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_student_attendance_class ON public.student_attendance;
CREATE TRIGGER validate_student_attendance_class
  BEFORE INSERT OR UPDATE OF student_id, class_id
  ON public.student_attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_student_attendance_class();
