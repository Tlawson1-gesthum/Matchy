-- VORAL — script único de puesta al día (versión 6)
-- Incluye todo lo necesario. Se puede correr las veces que haga falta.
-- Supabase → SQL Editor → New query → pegar todo → Run

-- ============================================================
-- 1. COLUMNAS QUE USA EL FORMULARIO DE REGISTRO DE LOCALES
-- ============================================================
alter table empleadores add column if not exists nombre_responsable text;
alter table empleadores add column if not exists cuit text;
alter table empleadores add column if not exists razon_social text;
alter table empleadores add column if not exists direccion text;
alter table empleadores add column if not exists telefono text;
alter table empleadores add column if not exists red_social text;
alter table empleadores add column if not exists estado text default 'pendiente';
alter table empleadores add column if not exists acepto_tyc_at timestamptz;
alter table empleadores add column if not exists declara_mayor_edad boolean default false;
alter table empleadores add column if not exists declaracion_jurada_at timestamptz;
alter table empleadores add column if not exists declaracion_fraude_at timestamptz;
alter table empleadores add column if not exists verificado_at timestamptz;
alter table empleadores add column if not exists verificado_por uuid;
alter table empleadores add column if not exists verificacion_notas text;
alter table empleadores add column if not exists motivo_rechazo text;

alter table cvs add column if not exists acepto_tyc_at timestamptz;
alter table cvs add column if not exists declara_mayor_edad boolean default false;
alter table cvs add column if not exists herramientas_nivel jsonb default '[]';
alter table cvs add column if not exists idiomas_nivel jsonb default '[]';
alter table cvs add column if not exists certificado_url text;

alter table vacantes add column if not exists dias_trabajo text;
alter table vacantes add column if not exists puesto_otro text;
alter table postulaciones add column if not exists puesto_otro text;

-- estado válido
alter table empleadores drop constraint if exists empleadores_estado_check;
alter table empleadores add constraint empleadores_estado_check
  check (estado in ('pendiente', 'aprobado', 'rechazado'));

-- ============================================================
-- 2. LOCALIDADES: SOLO POSADAS Y GARUPÁ
-- ============================================================
update empleadores set ciudad = 'Posadas'
  where ciudad is null or ciudad not in ('Posadas', 'Garupá');

alter table empleadores drop constraint if exists empleadores_ciudad_permitida;
alter table empleadores add constraint empleadores_ciudad_permitida
  check (ciudad is null or ciudad in ('Posadas', 'Garupá'));

-- ============================================================
-- 3. UN CUIT, UN LOCAL
-- ============================================================
create unique index if not exists empleadores_cuit_unico
  on empleadores (cuit) where cuit is not null;

-- ============================================================
-- 4. PERMISOS SOBRE LOCALES
-- ============================================================
alter table empleadores enable row level security;

drop policy if exists "el empleador edita su propio registro" on empleadores;
drop policy if exists "cualquiera autenticado ve los locales" on empleadores;
drop policy if exists "el empleador crea su propio registro" on empleadores;
drop policy if exists "los administradores aprueban locales" on empleadores;

create policy "cualquiera autenticado ve los locales"
  on empleadores for select using (true);

create policy "el empleador crea su propio registro"
  on empleadores for insert with check (auth.uid() = id);

create policy "el empleador edita su propio registro"
  on empleadores for update using (auth.uid() = id) with check (auth.uid() = id);

-- ============================================================
-- 5. ADMINISTRADORES
-- ============================================================
create table if not exists administradores (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
);

alter table administradores enable row level security;

drop policy if exists "cualquiera autenticado puede consultar si es admin" on administradores;
create policy "cualquiera autenticado puede consultar si es admin"
  on administradores for select using (true);

create policy "los administradores aprueban locales"
  on empleadores for update
  using (exists (select 1 from administradores a where a.id = auth.uid()))
  with check (exists (select 1 from administradores a where a.id = auth.uid()));

-- Deja como superusuario solo a gozzasabores@gmail.com
delete from administradores where email is distinct from 'gozzasabores@gmail.com';

insert into administradores (id, email)
select id, email from auth.users
where lower(email) = 'gozzasabores@gmail.com'
on conflict (id) do nothing;

-- ============================================================
-- 6. REPORTES DE AVISOS SOSPECHOSOS
-- ============================================================
create table if not exists reportes (
  id uuid primary key default gen_random_uuid(),
  reportante_id uuid references auth.users(id) on delete set null,
  vacante_id uuid references vacantes(id) on delete cascade,
  empleador_id uuid references empleadores(id) on delete cascade,
  motivo text not null,
  detalle text,
  estado text default 'abierto' check (estado in ('abierto', 'revisado', 'desestimado')),
  created_at timestamptz default now()
);

alter table reportes enable row level security;

drop policy if exists "cualquiera autenticado puede reportar" on reportes;
create policy "cualquiera autenticado puede reportar"
  on reportes for insert with check (auth.uid() = reportante_id);

drop policy if exists "el reportante ve sus reportes" on reportes;
create policy "el reportante ve sus reportes"
  on reportes for select using (auth.uid() = reportante_id);

drop policy if exists "los administradores ven todos los reportes" on reportes;
create policy "los administradores ven todos los reportes"
  on reportes for select
  using (exists (select 1 from administradores a where a.id = auth.uid()));

drop policy if exists "los administradores actualizan reportes" on reportes;
create policy "los administradores actualizan reportes"
  on reportes for update
  using (exists (select 1 from administradores a where a.id = auth.uid()));

-- ============================================================
-- 7. CV PÚBLICO SIN CONTACTOS DE REFERENCIA
-- ============================================================
drop policy if exists "cualquiera autenticado puede ver cvs publicos" on cvs;

create or replace view cvs_publicos as
select
  c.id, c.nombre, c.foto_url, c.edad, c.ciudad, c.contacto,
  c.puestos, c.presentacion,
  (
    select coalesce(
      jsonb_agg(e - 'ref_nombre' - 'ref_email' - 'ref_celular' - 'ref_relacion' - 'contacto_referencia'),
      '[]'::jsonb
    )
    from jsonb_array_elements(coalesce(c.experiencia, '[]'::jsonb)) e
  ) as experiencia,
  c.formacion, c.habilidades, c.herramientas, c.idiomas,
  c.herramientas_nivel, c.idiomas_nivel,
  c.disponibilidad_horaria, c.turno, c.movilidad_propia, c.disponible_desde,
  c.pretension_salarial, c.certificado_manipulacion, c.certificado_url,
  c.anios_experiencia, c.perfil_completo_pct, c.publico, c.updated_at
from cvs c
where c.publico = true;

grant select on cvs_publicos to authenticated, anon;

-- ============================================================
-- 8. REFERENCIAS SOLO PARA QUIEN AVANZÓ CON EL CANDIDATO
-- ============================================================
create or replace function referencias_de_candidato(p_candidato_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  habilitado boolean;
  resultado jsonb;
begin
  select exists (
    select 1 from postulaciones p
    join vacantes v on v.id = p.vacante_id
    where p.candidato_id = p_candidato_id
      and v.empleador_id = auth.uid()
      and p.estado = 'preseleccionado'
  ) into habilitado;

  if not habilitado then
    return '[]'::jsonb;
  end if;

  select coalesce(
    jsonb_agg(jsonb_build_object(
      'empresa', e->>'empresa',
      'puesto', e->>'puesto',
      'ref_nombre', e->>'ref_nombre',
      'ref_email', e->>'ref_email',
      'ref_celular', e->>'ref_celular',
      'ref_relacion', e->>'ref_relacion'
    )), '[]'::jsonb
  ) into resultado
  from cvs c, jsonb_array_elements(coalesce(c.experiencia, '[]'::jsonb)) e
  where c.id = p_candidato_id
    and (e->>'ref_nombre' is not null and e->>'ref_nombre' <> '');

  return resultado;
end;
$$;

grant execute on function referencias_de_candidato(uuid) to authenticated;

-- ============================================================
-- 9. DIAGNÓSTICO — mirá estos resultados
-- ============================================================
select 'superusuarios cargados' as chequeo, count(*)::text as resultado from administradores
union all
select 'cuentas de usuario creadas', count(*)::text from auth.users
union all
select 'locales registrados', count(*)::text from empleadores
union all
select 'locales esperando aprobacion', count(*)::text from empleadores where estado = 'pendiente'
union all
select 'perfiles con rol empleador', count(*)::text from perfiles where role = 'empleador';
