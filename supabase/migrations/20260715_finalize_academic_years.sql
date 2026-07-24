with ranked_active_years as (
  select id, row_number() over (order by created_at desc) as row_number
  from public.academic_years
  where is_active
)
update public.academic_years
set is_active = false
where id in (select id from ranked_active_years where row_number > 1);

alter table public.academic_years
  add constraint academic_year_dates_valid
  check (start_date is null or end_date is null or start_date <= end_date);

create unique index academic_years_one_active_year
  on public.academic_years (is_active)
  where is_active;

create or replace function public.set_active_academic_year(p_id uuid)
returns setof public.academic_years
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.academic_years where id = p_id and not is_closed) then
    raise exception 'Academic year not found or closed';
  end if;

  update public.academic_years set is_active = false where is_active;
  update public.academic_years set is_active = true where id = p_id;
  return query select * from public.academic_years where id = p_id;
end;
$$;
