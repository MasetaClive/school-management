alter table public.time_slots
  add constraint time_slots_valid_range
  check (start_time < end_time);

create or replace function public.prevent_time_slot_overlap()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from public.time_slots
    where day_of_week = new.day_of_week
      and start_time < new.end_time
      and end_time > new.start_time
      and id is distinct from new.id
  ) then
    raise exception 'Time slot overlaps an existing slot on this day' using errcode = '23P01';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_time_slot_overlap on public.time_slots;
create trigger prevent_time_slot_overlap
before insert or update on public.time_slots
for each row execute function public.prevent_time_slot_overlap();

create or replace function public.prevent_time_slot_delete_with_timetable_entries()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from public.timetable_entries where time_slot_id = old.id) then
    raise exception 'Cannot delete time slot because it is used in the timetable';
  end if;
  return old;
end;
$$;

drop trigger if exists prevent_time_slot_delete_with_timetable_entries on public.time_slots;
create trigger prevent_time_slot_delete_with_timetable_entries
before delete on public.time_slots
for each row execute function public.prevent_time_slot_delete_with_timetable_entries();
