-- MATCHY — versión 12
-- Conteo real de postulantes, borrado de cuenta y destinatarios de los avisos por mail.
-- Correr DESPUÉS de schema-v11-seguridad.sql. Se puede correr las veces que haga falta.

-- ============================================================
-- 1. CONTEO REAL DE POSTULANTES POR VACANTE
--    Antes el listado contaba solo las postulaciones propias del candidato
--    (las únicas que puede ver), así que siempre mostraba 0 o 1.
-- ============================================================
create or replace function conteo_postulaciones()
returns table (vacante_id uuid, total bigint)
language sql stable security definer set search_path = public as $$
  select p.vacante_id, count(*)
  from postulaciones p
  join vacantes v on v.id = p.vacante_id
  where v.estado = 'activa'
  group by p.vacante_id;
$$;

grant execute on function conteo_postulaciones() to authenticated;

-- ============================================================
-- 2. BORRAR LA PROPIA CUENTA (derecho de supresión, Ley 25.326)
--    Al borrar la cuenta se borran en cascada el perfil, el CV o el local,
--    las vacantes, las postulaciones y las entrevistas.
--    Los archivos se borran antes desde la web, porque Supabase no permite
--    borrarlos por SQL.
-- ============================================================
create or replace function borrar_mi_cuenta()
returns void
language plpgsql security definer set search_path = public, auth as $$
declare
  yo uuid := auth.uid();
begin
  if yo is null then
    raise exception 'No hay una sesión activa.';
  end if;
  if exists (select 1 from administradores where id = yo) then
    raise exception 'La cuenta de administrador no se puede borrar desde la web.';
  end if;

  -- Los reportes que hizo esta persona se conservan sin su identidad
  update reportes set reportante_id = null where reportante_id = yo;

  delete from auth.users where id = yo;
end;
$$;

revoke all on function borrar_mi_cuenta() from anon;
grant execute on function borrar_mi_cuenta() to authenticated;

-- Los reportes sobreviven al borrado: si un local denunciado borra su cuenta,
-- la evidencia no debe desaparecer con él. Se guarda una copia de sus datos.
alter table reportes add column if not exists local_nombre_copia text;
alter table reportes add column if not exists local_cuit_copia text;
alter table reportes add column if not exists vacante_puesto_copia text;

alter table reportes drop constraint if exists reportes_empleador_id_fkey;
alter table reportes add constraint reportes_empleador_id_fkey
  foreign key (empleador_id) references empleadores(id) on delete set null;

alter table reportes drop constraint if exists reportes_vacante_id_fkey;
alter table reportes add constraint reportes_vacante_id_fkey
  foreign key (vacante_id) references vacantes(id) on delete set null;

create or replace function copiar_datos_reporte()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select e.nombre_local, e.cuit into new.local_nombre_copia, new.local_cuit_copia
  from empleadores e
  where e.id = coalesce(new.empleador_id, (select v.empleador_id from vacantes v where v.id = new.vacante_id));

  select coalesce(nullif(v.puesto_otro, ''), v.puesto) into new.vacante_puesto_copia
  from vacantes v where v.id = new.vacante_id;

  return new;
end;
$$;

drop trigger if exists trg_copiar_datos_reporte on reportes;
create trigger trg_copiar_datos_reporte before insert on reportes
  for each row execute function copiar_datos_reporte();

-- Completar la copia en los reportes que ya existen
update reportes r
set local_nombre_copia = e.nombre_local, local_cuit_copia = e.cuit
from empleadores e
where e.id = r.empleador_id and r.local_nombre_copia is null;

update reportes r
set vacante_puesto_copia = coalesce(nullif(v.puesto_otro, ''), v.puesto)
from vacantes v
where v.id = r.vacante_id and r.vacante_puesto_copia is null;

-- El panel de administración muestra la copia si el local ya no existe
create or replace function reportes_detallados()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  resultado jsonb;
begin
  if not exists (select 1 from administradores a where a.id = auth.uid()) then
    return '[]'::jsonb;
  end if;

  select coalesce(jsonb_agg(fila order by fila->>'created_at' desc), '[]'::jsonb)
  into resultado
  from (
    select jsonb_build_object(
      'id', r.id,
      'motivo', r.motivo,
      'estado', r.estado,
      'created_at', r.created_at,
      'vacante_id', r.vacante_id,
      'vacante_puesto', coalesce(v.puesto, r.vacante_puesto_copia),
      'vacante_estado', v.estado,
      'empleador_id', e.id,
      'local_nombre', coalesce(e.nombre_local, r.local_nombre_copia || ' (cuenta borrada)'),
      'local_cuit', coalesce(e.cuit, r.local_cuit_copia),
      'local_estado', e.estado,
      'local_telefono', e.telefono,
      'local_red_social', e.red_social,
      'reportante_email', p.email,
      'reportes_misma_vacante', (
        select count(distinct r2.reportante_id) from reportes r2 where r2.vacante_id = r.vacante_id
      )
    ) as fila
    from reportes r
    left join vacantes v on v.id = r.vacante_id
    left join empleadores e on e.id = coalesce(r.empleador_id, v.empleador_id)
    left join perfiles p on p.id = r.reportante_id
    where r.estado = 'abierto'
  ) sub;

  return resultado;
end;
$$;

grant execute on function reportes_detallados() to authenticated;

-- Permiso para borrar los archivos propios (se usa antes de borrar la cuenta)
do $$
begin
  drop policy if exists "archivo: borrar los propios" on storage.objects;
  create policy "archivo: borrar los propios" on storage.objects for delete
    using (
      bucket_id in ('fotos-perfil', 'certificados', 'logos-locales')
      and auth.uid()::text = (storage.foldername(name))[1]
    );
end $$;

-- ============================================================
-- 3. DESTINATARIO DE CADA AVISO POR MAIL
--    Devuelve el mail de la otra parte solo si quien pide el aviso
--    tiene relación real con esa entrevista o ese local.
--    Así nadie puede usar los avisos para averiguar el mail de un tercero.
-- ============================================================
create or replace function destinatario_aviso(p_evento text, p_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
declare
  resultado jsonb;
begin
  -- El local propuso, cambió o aceptó un horario: el aviso va al candidato
  if p_evento in ('entrevista_propuesta', 'entrevista_actualizada') then
    select jsonb_build_object(
      'email', u.email,
      'nombre', coalesce(c.nombre, ''),
      'puesto', coalesce(nullif(va.puesto_otro, ''), va.puesto),
      'local', e.nombre_local,
      'direccion', e.direccion,
      'estado', en.estado,
      'horario', en.horario_propuesto
    ) into resultado
    from entrevistas en
    join postulaciones po on po.id = en.postulacion_id
    join vacantes va on va.id = po.vacante_id
    join empleadores e on e.id = va.empleador_id
    join auth.users u on u.id = po.candidato_id
    left join cvs c on c.id = po.candidato_id
    where en.id = p_id and va.empleador_id = auth.uid();

  -- El candidato respondió: el aviso va al local
  elsif p_evento = 'entrevista_respondida' then
    select jsonb_build_object(
      'email', u.email,
      'nombre', coalesce(c.nombre, ''),
      'puesto', coalesce(nullif(va.puesto_otro, ''), va.puesto),
      'local', e.nombre_local,
      'estado', en.estado,
      'horario', coalesce(en.horario_alternativo, en.horario_propuesto)
    ) into resultado
    from entrevistas en
    join postulaciones po on po.id = en.postulacion_id
    join vacantes va on va.id = po.vacante_id
    join empleadores e on e.id = va.empleador_id
    join auth.users u on u.id = va.empleador_id
    left join cvs c on c.id = po.candidato_id
    where en.id = p_id and po.candidato_id = auth.uid();

  -- Un administrador aprobó o rechazó un local: el aviso va al local
  elsif p_evento in ('local_aprobado', 'local_rechazado') then
    if not exists (select 1 from administradores where id = auth.uid()) then
      return null;
    end if;
    select jsonb_build_object('email', u.email, 'local', e.nombre_local, 'responsable', e.nombre_responsable)
    into resultado
    from empleadores e
    join auth.users u on u.id = e.id
    where e.id = p_id;
  end if;

  return resultado;
end;
$$;

revoke all on function destinatario_aviso(text, uuid) from anon;
grant execute on function destinatario_aviso(text, uuid) to authenticated;

select 'v12 aplicada' as estado;
