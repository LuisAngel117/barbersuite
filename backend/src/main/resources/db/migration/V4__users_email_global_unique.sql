do $$
begin
  if exists (
    select lower(email)
    from users
    group by lower(email)
    having count(*) > 1
  ) then
    raise exception 'Cannot enforce global unique user email: duplicate values already exist.';
  end if;
end
$$;

create unique index ux_users_email_global_lower on users (lower(email));
