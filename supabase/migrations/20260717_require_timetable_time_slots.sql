-- Timetable entries are not schedulable without a time slot.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.timetable_entries WHERE time_slot_id IS NULL) THEN
    RAISE EXCEPTION 'Assign a time slot to every timetable entry before applying this migration';
  END IF;
END;
$$;

ALTER TABLE public.timetable_entries
  ALTER COLUMN time_slot_id SET NOT NULL;
