create unique index subjects_unique_name_case_insensitive
  on public.subjects (lower(name));

create unique index subjects_unique_code_case_insensitive
  on public.subjects (upper(code));

create or replace function public.prevent_subject_delete_with_dependencies()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from public.subject_assignments where subject_id = old.id)
    or exists (select 1 from public.timetable_entries where subject_id = old.id)
    or exists (select 1 from public.homework where subject_id = old.id)
    or exists (select 1 from public.exams where subject_id = old.id) then
    raise exception 'Cannot delete subject with dependent records';
  end if;
  return old;
end;
$$;

drop trigger if exists prevent_subject_delete_with_dependencies on public.subjects;
create trigger prevent_subject_delete_with_dependencies
before delete on public.subjects
for each row execute function public.prevent_subject_delete_with_dependencies();
