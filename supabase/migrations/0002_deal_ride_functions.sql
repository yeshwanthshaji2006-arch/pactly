-- Atomic helpers called only by the server (service role).

create or replace function public.increment_completed(uids uuid[]) returns void
language sql security definer set search_path = public as $$
  update public.profiles set completed_deals = completed_deals + 1 where id = any(uids);
$$;

-- Books seats on an offered ride atomically (row lock on the post). Returns remaining seats.
create or replace function public.book_ride(p_post uuid, p_passenger uuid, p_seats int)
returns table (seats_left int, fare int, already boolean)
language plpgsql security definer set search_path = public as $$
declare
  p public.posts;
  left_now int;
  existing public.ride_bookings;
begin
  select * into p from public.posts where id = p_post for update;
  if not found or p.type <> 'ride' or p.details ->> 'ride_kind' <> 'offer' then
    raise exception 'Not an offered ride';
  end if;
  if p.author_id = p_passenger then raise exception 'You are driving this ride'; end if;
  if coalesce(p.details ->> 'ride_status', 'scheduled') <> 'scheduled' or p.status not in ('open', 'in_deal') then
    raise exception 'This ride is no longer taking bookings';
  end if;
  select * into existing from public.ride_bookings where post_id = p_post and passenger_id = p_passenger;
  if found and existing.status = 'booked' then
    return query select (p.details ->> 'seats_left')::int, existing.fare, true;
    return;
  end if;
  left_now := coalesce((p.details ->> 'seats_left')::int, 0);
  if p_seats < 1 or p_seats > left_now then raise exception 'Only % seat(s) left', left_now; end if;

  insert into public.ride_bookings (post_id, passenger_id, seats, fare, status)
  values (p_post, p_passenger, p_seats, p_seats * p.price, 'booked')
  on conflict (post_id, passenger_id) do update set seats = excluded.seats, fare = excluded.fare, status = 'booked', created_at = now();

  update public.posts
     set details = jsonb_set(details, '{seats_left}', to_jsonb(left_now - p_seats)),
         status = case when left_now - p_seats = 0 then 'in_deal' else status end
   where id = p_post;
  return query select left_now - p_seats, p_seats * p.price, false;
end $$;

revoke execute on function public.increment_completed(uuid[]) from public, anon, authenticated;
revoke execute on function public.book_ride(uuid, uuid, int) from public, anon, authenticated;
grant execute on function public.increment_completed(uuid[]) to service_role;
grant execute on function public.book_ride(uuid, uuid, int) to service_role;
