-- VORAL — actualización de esquema (versión 10)
-- Logo del local.
-- Correr DESPUÉS de schema-v9.sql. Se puede correr las veces que haga falta.

alter table empleadores add column if not exists logo_url text;

-- Bucket para los logos
insert into storage.buckets (id, name, public)
values ('logos-locales', 'logos-locales', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'cualquiera puede ver logos') then
    create policy "cualquiera puede ver logos"
      on storage.objects for select
      using (bucket_id = 'logos-locales');
  end if;

  if not exists (select 1 from pg_policies where policyname = 'el local sube su propio logo') then
    create policy "el local sube su propio logo"
      on storage.objects for insert
      with check (bucket_id = 'logos-locales' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'el local actualiza su propio logo') then
    create policy "el local actualiza su propio logo"
      on storage.objects for update
      using (bucket_id = 'logos-locales' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;
end $$;

select 'listo: columna logo_url y bucket logos-locales' as estado;
