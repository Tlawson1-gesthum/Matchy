-- MATCHY — actualización de esquema (versión 8)
-- Datos reales para las señales de urgencia: fecha de cierre, cantidad de
-- puestos, vistas verificables y actividad de la plataforma.
-- Correr DESPUÉS de schema-v7.sql. Se puede correr las veces que haga falta.

-- ============================================================
-- 1. CIERRE Y CANTIDAD DE PUESTOS
-- ============================================================
alter table vacantes add column if not exists cierra_at timestamptz;
alter table vacantes add column if not exists cantidad_puestos int default 1;

-- ============================================================
-- 2. VISTAS REALES DE CADA VACANTE
--    Una fila por persona y por día: así el número no se infla
--    si alguien recarga la página diez veces.
-- ============================================================
create table if not exists vacante_vistas (
  id uuid primary key default gen_random_uuid(),
  vacante_id uuid not null references vacantes(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  dia date not null default current_date,
  created_at timestamptz default now(),
  unique (vacante_id, usuario_id, dia)
);

alter table vacante_vistas enable row level security;

drop policy if exists "cualquiera autenticado registra su vista" on vacante_vistas;
create policy "cualquiera autenticado registra su vista"
  on vacante_vistas for insert
  with check (auth.uid() = usuario_id);

drop policy if exists "cualquiera autenticado lee las vistas" on vacante_vistas;
create policy "cualquiera autenticado lee las vistas"
  on vacante_vistas for select using (true);

-- ============================================================
-- 3. FUNCIONES DE CONTEO
--    Devuelven números verificables contra la base. Nada estimado.
-- ============================================================

-- Vistas de los últimos 7 días, por vacante
create or replace function vistas_por_vacante()
returns table (vacante_id uuid, vistas bigint)
language sql
security definer
set search_path = public
as $$
  select v.vacante_id, count(distinct v.usuario_id)
  from vacante_vistas v
  where v.dia >= current_date - interval '7 days'
  group by v.vacante_id;
$$;

grant execute on function vistas_por_vacante() to authenticated;

-- Actividad reciente de toda la plataforma, para el ticker
create or replace function actividad_reciente()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'postulaciones_ultima_hora', (
      select count(*) from postulaciones where created_at >= now() - interval '1 hour'
    ),
    'postulaciones_hoy', (
      select count(*) from postulaciones where created_at >= current_date
    ),
    'postulaciones_semana', (
      select count(*) from postulaciones where created_at >= now() - interval '7 days'
    ),
    'entrevistas_confirmadas_semana', (
      select count(*) from entrevistas
      where estado = 'confirmada' and updated_at >= now() - interval '7 days'
    ),
    'vacantes_nuevas_semana', (
      select count(*) from vacantes
      where created_at >= now() - interval '7 days' and estado = 'activa'
    ),
    'vacantes_cierran_pronto', (
      select count(*) from vacantes
      where estado = 'activa' and cierra_at is not null
        and cierra_at between now() and now() + interval '48 hours'
    )
  );
$$;

grant execute on function actividad_reciente() to authenticated;

-- ============================================================
-- 4. Cerrar automáticamente las vacantes vencidas
-- ============================================================
create or replace function cerrar_vacantes_vencidas()
returns void
language sql
security definer
set search_path = public
as $$
  update vacantes set estado = 'cubierta'
  where estado = 'activa' and cierra_at is not null and cierra_at < now();
$$;

grant execute on function cerrar_vacantes_vencidas() to authenticated;

-- ============================================================
-- 5. Diagnóstico
-- ============================================================
select 'vacantes con fecha de cierre' as chequeo, count(*)::text as resultado
from vacantes where cierra_at is not null
union all
select 'vistas registradas', count(*)::text from vacante_vistas;
