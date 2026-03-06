alter table users
  add column full_name varchar(160);

update users
set full_name = btrim(split_part(email, '@', 1))
where full_name is null;

alter table users
  alter column full_name set not null;

alter table users
  add constraint ck_users_full_name_not_blank
    check (btrim(full_name) <> '');

alter table branches
  add column active boolean not null default true;
