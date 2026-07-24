CREATE OR REPLACE FUNCTION public.validate_and_grade_result()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE exam_record public.exams%ROWTYPE; student_record public.students%ROWTYPE; percentage NUMERIC;
BEGIN
  SELECT * INTO exam_record FROM public.exams WHERE id = NEW.exam_id;
  SELECT * INTO student_record FROM public.students WHERE id = NEW.student_id;
  IF exam_record.id IS NULL OR student_record.id IS NULL THEN RAISE EXCEPTION 'Result requires an existing exam and student'; END IF;
  IF student_record.class_id IS DISTINCT FROM exam_record.class_id OR student_record.academic_year <> exam_record.academic_year THEN RAISE EXCEPTION 'Student is not eligible for this exam'; END IF;
  IF NEW.marks_obtained < 0 OR NEW.marks_obtained > exam_record.max_marks THEN RAISE EXCEPTION 'Marks obtained must be between zero and the exam maximum'; END IF;
  percentage := (NEW.marks_obtained / exam_record.max_marks) * 100;
  NEW.grade := CASE WHEN percentage >= 80 THEN 'A' WHEN percentage >= 70 THEN 'B' WHEN percentage >= 60 THEN 'C' WHEN percentage >= 50 THEN 'D' ELSE 'F' END;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS validate_and_grade_result ON public.results;
CREATE TRIGGER validate_and_grade_result BEFORE INSERT OR UPDATE OF exam_id, student_id, marks_obtained ON public.results FOR EACH ROW EXECUTE FUNCTION public.validate_and_grade_result();
