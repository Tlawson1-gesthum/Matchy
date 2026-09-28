-- VORAL — BORRAR TODAS LAS CUENTAS Y EMPEZAR DE CERO
-- ⚠️  Borra datos y no se puede deshacer. Deja solo hola@somosvoral.com.ar como superusuario.
-- Antes de correrlo, la cuenta hola@somosvoral.com.ar tiene que existir (registrada y con
-- el mail confirmado). Si no existe, el script se frena sin borrar nada.
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
  mail_admin text := 'hola@somosvoral.com.ar';
begin
  select id into id_admin from auth.users where lower(email) = mail_admin limit 1;
  if id_admin is null then
    raise exception 'No existe la cuenta %. Registrala primero en la web y volvé a correr este script. No se borró nada.', mail_admin;
  end if;

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

  if to_regclass('public.perfiles') is not null then
    delete from public.perfiles where id <> id_admin;
  end if;

  delete from auth.users where id <> id_admin;

  if to_regclass('public.administradores') is not null then
    insert into public.administradores (id, email) values (id_admin, mail_admin)
    on conflict (id) do nothing;
  end if;
  if to_regclass('public.perfiles') is not null then
    insert into public.perfiles (id, role, email) values (id_admin, 'empleador', mail_admin)
    on conflict (id) do update set role = 'empleador';
  end if;
end $$;

select 'cuentas' as tabla, count(*)::text as cantidad from auth.users
union all select 'perfiles', count(*)::text from perfiles
union all select 'cvs', count(*)::text from cvs
union all select 'locales', count(*)::text from empleadores
union all select 'vacantes', count(*)::text from vacantes
union all select 'superusuarios', count(*)::text from administradores;
