-- MATCHY — BORRAR TODAS LAS CUENTAS Y EMPEZAR DE CERO
-- ⚠️  Borra datos y no se puede deshacer. Deja solo gozzasabores@gmail.com como superusuario.
-- Los archivos (fotos, certificados, logos) se borran aparte desde el panel: Storage.

do $$
declare
  tablas text[] := array[
    'entrevistas', 'postulaciones', 'vacante_vistas', 'reportes',
    'vacantes', 'empleadores', 'cvs'
  ];
  t text;
  borradas int;
  id_admin uuid;
  mail_admin text := 'gozzasabores@gmail.com';
begin
  foreach t in array tablas loop
    if to_regclass('public.' || t) is not null then
      execute format('delete from public.%I', t);
      get diagnostics borradas = row_count;
      raise notice 'Tabla %: % filas borradas', t, borradas;
    end if;
  end loop;

  if to_regclass('public.administradores') is not null then
    delete from public.administradores;
  end if;

  select id into id_admin from auth.users where lower(email) = mail_admin limit 1;

  if to_regclass('public.perfiles') is not null then
    delete from public.perfiles where id_admin is null or id <> id_admin;
  end if;

  delete from auth.users where id_admin is null or id <> id_admin;

  if id_admin is not null then
    if to_regclass('public.administradores') is not null then
      insert into public.administradores (id, email) values (id_admin, mail_admin)
      on conflict (id) do nothing;
    end if;
    if to_regclass('public.perfiles') is not null then
      insert into public.perfiles (id, role, email) values (id_admin, 'empleador', mail_admin)
      on conflict (id) do nothing;
    end if;
  end if;
end $$;

select 'cuentas' as tabla, count(*)::text as cantidad from auth.users
union all select 'perfiles', count(*)::text from perfiles
union all select 'cvs', count(*)::text from cvs
union all select 'locales', count(*)::text from empleadores
union all select 'vacantes', count(*)::text from vacantes
union all select 'superusuarios', count(*)::text from administradores;
