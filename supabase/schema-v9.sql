-- MATCHY — actualización de esquema (versión 9)
-- Procedimiento ante reportes de vacantes sospechosas.
-- Correr DESPUÉS de schema-v8.sql. Se puede correr las veces que haga falta.

-- ============================================================
-- 1. ESTADO "SUSPENDIDA" PARA LAS VACANTES
--    Distinto de "cubierta": la cubierta se llenó, la suspendida
--    está bajo revisión por un reporte.
-- ============================================================
alter table vacantes drop constraint if exists vacantes_estado_check;
alter table vacantes add constraint vacantes_estado_check
  check (estado in ('activa', 'cubierta', 'suspendida'));

alter table vacantes add column if not exists suspendida_at timestamptz;
alter table vacantes add column if not exists suspendida_motivo text;

-- Trazabilidad de la resolución del reporte
alter table reportes add column if not exists resuelto_at timestamptz;
alter table reportes add column if not exists resuelto_por uuid;
alter table reportes add column if not exists accion_tomada text;

-- ============================================================
-- 2. SUSPENSIÓN AUTOMÁTICA POR REPORTES REPETIDOS
--    Tres personas distintas reportando la misma vacante la bajan
--    del listado hasta que un administrador la revise.
-- ============================================================
create or replace function suspender_vacante_muy_reportada()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  distintos int;
begin
  if new.vacante_id is null then
    return new;
  end if;

  select count(distinct reportante_id) into distintos
  from reportes
  where vacante_id = new.vacante_id and estado = 'abierto';

  if distintos >= 3 then
    update vacantes
    set estado = 'suspendida',
        suspendida_at = now(),
        suspendida_motivo = 'Suspendida automáticamente por ' || distintos || ' reportes de personas distintas'
    where id = new.vacante_id and estado = 'activa';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_suspender_reportada on reportes;
create trigger trg_suspender_reportada
  after insert on reportes
  for each row execute function suspender_vacante_muy_reportada();

-- ============================================================
-- 3. PERMISOS PARA QUE EL ADMINISTRADOR ACTÚE
-- ============================================================
drop policy if exists "los administradores gestionan vacantes" on vacantes;
create policy "los administradores gestionan vacantes"
  on vacantes for update
  using (exists (select 1 from administradores a where a.id = auth.uid()))
  with check (exists (select 1 from administradores a where a.id = auth.uid()));

-- ============================================================
-- 4. Datos del reporte para el panel del administrador
--    Devuelve el reporte junto con la vacante y el local.
-- ============================================================
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
      'vacante_puesto', v.puesto,
      'vacante_estado', v.estado,
      'empleador_id', e.id,
      'local_nombre', e.nombre_local,
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

-- ============================================================
-- 5. Diagnóstico
-- ============================================================
select 'reportes abiertos' as chequeo, count(*)::text as resultado from reportes where estado = 'abierto'
union all
select 'vacantes suspendidas', count(*)::text from vacantes where estado = 'suspendida';
