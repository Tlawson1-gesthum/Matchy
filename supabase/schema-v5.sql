-- VORAL — actualización de esquema (versión 5): cumplimiento legal y antifraude
-- Se puede correr las veces que haga falta.
-- Supabase Dashboard → SQL Editor → New query → pegar todo → Run

-- ============================================================
-- 1. CONSENTIMIENTO Y MAYORÍA DE EDAD
-- ============================================================
alter table cvs add column if not exists acepto_tyc_at timestamptz;
alter table cvs add column if not exists declara_mayor_edad boolean default false;

alter table empleadores add column if not exists acepto_tyc_at timestamptz;
alter table empleadores add column if not exists declara_mayor_edad boolean default false;
alter table empleadores add column if not exists declaracion_jurada_at timestamptz;

-- ============================================================
-- 2. ANTIFRAUDE EN EL REGISTRO DE LOCALES
-- ============================================================

-- Un mismo CUIT no puede tener dos cuentas de local
create unique index if not exists empleadores_cuit_unico
  on empleadores (cuit) where cuit is not null;

-- Trazabilidad de la verificación manual
alter table empleadores add column if not exists verificado_at timestamptz;
alter table empleadores add column if not exists verificado_por uuid;
alter table empleadores add column if not exists verificacion_notas text;
alter table empleadores add column if not exists motivo_rechazo text;

-- ============================================================
-- 3. DENUNCIAS DE VACANTES O LOCALES SOSPECHOSOS
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
  on reportes for insert
  with check (auth.uid() = reportante_id);

drop policy if exists "el reportante ve sus reportes" on reportes;
create policy "el reportante ve sus reportes"
  on reportes for select
  using (auth.uid() = reportante_id);

drop policy if exists "los administradores ven todos los reportes" on reportes;
create policy "los administradores ven todos los reportes"
  on reportes for select
  using (exists (select 1 from administradores a where a.id = auth.uid()));

drop policy if exists "los administradores actualizan reportes" on reportes;
create policy "los administradores actualizan reportes"
  on reportes for update
  using (exists (select 1 from administradores a where a.id = auth.uid()));

-- ============================================================
-- 4. CONTACTOS DE REFERENCIA: NO SON PÚBLICOS
--    Se crea una vista del CV sin los datos de referencia.
--    La tabla cruda pasa a ser visible solo para su dueño.
-- ============================================================

drop policy if exists "cualquiera autenticado puede ver cvs publicos" on cvs;

create or replace view cvs_publicos as
select
  c.id, c.nombre, c.foto_url, c.edad, c.ciudad, c.contacto,
  c.puestos, c.presentacion,
  -- se quitan los campos de referencia de cada experiencia
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
-- 5. LAS REFERENCIAS SE ENTREGAN SOLO SI EL LOCAL AVANZÓ
--    Devuelve los contactos de referencia únicamente si quien consulta
--    es el dueño de una vacante donde ese candidato fue preseleccionado.
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
    select 1
    from postulaciones p
    join vacantes v on v.id = p.vacante_id
    where p.candidato_id = p_candidato_id
      and v.empleador_id = auth.uid()
      and p.estado = 'preseleccionado'
  ) into habilitado;

  if not habilitado then
    return '[]'::jsonb;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'empresa', e->>'empresa',
        'puesto', e->>'puesto',
        'ref_nombre', e->>'ref_nombre',
        'ref_email', e->>'ref_email',
        'ref_celular', e->>'ref_celular',
        'ref_relacion', e->>'ref_relacion'
      )
    ), '[]'::jsonb
  )
  into resultado
  from cvs c, jsonb_array_elements(coalesce(c.experiencia, '[]'::jsonb)) e
  where c.id = p_candidato_id
    and (e->>'ref_nombre' is not null and e->>'ref_nombre' <> '');

  return resultado;
end;
$$;

grant execute on function referencias_de_candidato(uuid) to authenticated;

-- ============================================================
-- 6. Verificación
-- ============================================================
select 'vista cvs_publicos creada' as estado;
