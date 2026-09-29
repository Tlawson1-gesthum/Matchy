-- VORAL — versión 18: DARSE DE BAJA DE LOS MAILS
-- Correr DESPUÉS de schema-v17.sql. Se puede correr las veces que haga falta.
--
-- Cada cuenta puede dejar de recibir los mails automáticos de Voral (bienvenida,
-- entrevistas, aprobación del local) con un enlace del pie de cada mail, sin
-- iniciar sesión. Los mails de seguridad (confirmar cuenta, cambiar contraseña)
-- los manda Supabase y siguen llegando siempre.

-- ============================================================
-- 1. PREFERENCIA Y CÓDIGO DE BAJA POR CUENTA
--    baja_token es un código al azar que solo aparece en los mails de esa
--    persona: quien lo tiene puede darse de baja (o volver a suscribirse).
-- ============================================================
alter table perfiles add column if not exists mails_avisos boolean not null default true;
alter table perfiles add column if not exists baja_token uuid not null default gen_random_uuid();
create unique index if not exists perfiles_baja_token on perfiles (baja_token);

-- El código no lo puede cambiar el usuario
create or replace function proteger_perfil()
returns trigger language plpgsql as $$
begin
  if restriccion_activa() then
    new.role := old.role;
    new.id := old.id;
    new.baja_token := old.baja_token;
  end if;
  return new;
end;
$$;

-- ============================================================
-- 2. BAJA Y ALTA CON EL CÓDIGO (sin iniciar sesión)
-- ============================================================
create or replace function preferencia_mails(p_token uuid, p_recibir boolean)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update perfiles set mails_avisos = p_recibir where baja_token = p_token;
  return found;
end;
$$;

revoke all on function preferencia_mails(uuid, boolean) from public;
grant execute on function preferencia_mails(uuid, boolean) to anon, authenticated;

-- ============================================================
-- 3. DESTINATARIO DE CADA AVISO: ahora también dice si acepta mails
--    y trae su código de baja para el enlace del pie.
--    Misma lógica de permisos que la versión 12.
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
      'horario', en.horario_propuesto,
      'acepta_mails', coalesce(pf.mails_avisos, true),
      'baja_token', pf.baja_token
    ) into resultado
    from entrevistas en
    join postulaciones po on po.id = en.postulacion_id
    join vacantes va on va.id = po.vacante_id
    join empleadores e on e.id = va.empleador_id
    join auth.users u on u.id = po.candidato_id
    left join cvs c on c.id = po.candidato_id
    left join perfiles pf on pf.id = po.candidato_id
    where en.id = p_id and va.empleador_id = auth.uid();
  -- El candidato respondió: el aviso va al local
  elsif p_evento = 'entrevista_respondida' then
    select jsonb_build_object(
      'email', u.email,
      'nombre', coalesce(c.nombre, ''),
      'puesto', coalesce(nullif(va.puesto_otro, ''), va.puesto),
      'local', e.nombre_local,
      'estado', en.estado,
      'horario', coalesce(en.horario_alternativo, en.horario_propuesto),
      'acepta_mails', coalesce(pf.mails_avisos, true),
      'baja_token', pf.baja_token
    ) into resultado
    from entrevistas en
    join postulaciones po on po.id = en.postulacion_id
    join vacantes va on va.id = po.vacante_id
    join empleadores e on e.id = va.empleador_id
    join auth.users u on u.id = va.empleador_id
    left join cvs c on c.id = po.candidato_id
    left join perfiles pf on pf.id = va.empleador_id
    where en.id = p_id and po.candidato_id = auth.uid();
  -- Un administrador aprobó o rechazó un local: el aviso va al local
  elsif p_evento in ('local_aprobado', 'local_rechazado') then
    if not exists (select 1 from administradores where id = auth.uid()) then
      return null;
    end if;
    select jsonb_build_object(
      'email', u.email, 'local', e.nombre_local, 'responsable', e.nombre_responsable,
      'acepta_mails', coalesce(pf.mails_avisos, true),
      'baja_token', pf.baja_token
    )
    into resultado
    from empleadores e
    join auth.users u on u.id = e.id
    left join perfiles pf on pf.id = e.id
    where e.id = p_id;
  end if;
  return resultado;
end;
$$;

revoke all on function destinatario_aviso(text, uuid) from anon;
grant execute on function destinatario_aviso(text, uuid) to authenticated;

select 'schema-v18 aplicado' as estado;
