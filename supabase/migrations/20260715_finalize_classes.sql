create or replace function public.prevent_class_delete_with_dependencies()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from public.students where class_id = old.id)
    or exists (select 1 from public.class_teachers where class_id = old.id)
    or exists (select 1 from public.subject_assignments where class_id = old.id)
    or exists (select 1 from public.timetable_entries where class_id = old.id)
    or exists (select 1 from public.student_attendance where class_id = old.id)
    or exists (select 1 from public.homework where class_id = old.id)
    or exists (select 1 from public.exams where class_id = old.id) then
    raise exception 'Cannot delete class with dependent records';
  end if;
  return old;
end;
$$;

drop trigger if exists prevent_class_delete_with_dependencies on public.classes;
create trigger prevent_class_delete_with_dependencies
before delete on public.classes
for each row execute function public.prevent_class_delete_with_dependencies();
