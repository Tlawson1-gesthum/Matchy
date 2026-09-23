-- VORAL — esquema de base de datos para Supabase
-- Cómo usar: Supabase Dashboard → SQL Editor → pegar todo este archivo → Run

-- Extensión para generar UUIDs
create extension if not exists "pgcrypto";

-- ============================================================
-- PERFILES (uno por usuario autenticado, define el rol)
-- ============================================================
create table if not exists perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('candidato', 'empleador')),
  email text not null,
  created_at timestamptz default now()
);

alter table perfiles enable row level security;

create policy "cada uno ve y edita su propio perfil"
  on perfiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
-- CVs (uno por candidato)
-- ============================================================
create table if not exists cvs (
  id uuid primary key references perfiles(id) on delete cascade,
  nombre text,
  foto_url text,
  edad int,
  ciudad text,
  contacto text,
  puestos text[] default '{}',
  presentacion text,
  experiencia jsonb default '[]',   -- [{empresa, puesto, desde, hasta, actual, descripcion, contacto_referencia}]
  formacion jsonb default '[]',     -- [{institucion, titulo, estado, anio}]
  habilidades text[] default '{}',
  herramientas text[] default '{}',
  idiomas text[] default '{}',
  disponibilidad_horaria text,      -- tiempo_completo | medio_tiempo | fines_de_semana | flexible
  turno text,                       -- manana | tarde | noche | rotativo
  movilidad_propia boolean default false,
  disponible_desde text,            -- inmediata | 15_dias | 30_dias | a_definir
  pretension_salarial text,
  certificado_manipulacion boolean default false,
  anios_experiencia numeric default 0,   -- calculado en el front a partir de "experiencia"
  perfil_completo_pct int default 0,     -- calculado en el front
  consentimiento_at timestamptz,         -- fecha/hora de aceptación del consentimiento (trazabilidad legal)
  publico boolean default true,          -- visible en "buscar candidatos" y en el link público
  updated_at timestamptz default now()
);

alter table cvs enable row level security;

create policy "el candidato edita su propio cv"
  on cvs for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "cualquiera autenticado puede ver cvs publicos"
  on cvs for select
  using (publico = true);

-- ============================================================
-- EMPLEADORES (datos del local, uno por cuenta empleadora)
-- ============================================================
create table if not exists empleadores (
  id uuid primary key references perfiles(id) on delete cascade,
  nombre_local text,
  tipo_local text,      -- bar | resto | resto_bar | cadena | catering | otro
  ciudad text,
  contacto text,
  plan text default 'free' check (plan in ('free', 'destacado')),
  created_at timestamptz default now()
);

alter table empleadores enable row level security;

create policy "el empleador edita su propio registro"
  on empleadores for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
-- VACANTES
-- ============================================================
create table if not exists vacantes (
  id uuid primary key default gen_random_uuid(),
  empleador_id uuid not null references empleadores(id) on delete cascade,
  puesto text not null,
  turno text,                     -- manana | tarde | noche | rotativo
  tipo_local text,
  urgencia text,                  -- hoy | esta_semana | este_mes | sin_apuro
  horario_detalle text,
  experiencia_minima_anios numeric default 0,
  disponibilidad_requerida text,
  movilidad_requerida boolean default false,
  certificado_requerido boolean default false,
  herramientas_buscadas text[] default '{}',
  descripcion text,
  contacto text,
  estado text default 'activa' check (estado in ('activa', 'cubierta')),
  created_at timestamptz default now()
);

alter table vacantes enable row level security;

create policy "cualquiera autenticado ve vacantes activas"
  on vacantes for select
  using (true);

create policy "el empleador crea sus vacantes"
  on vacantes for insert
  with check (auth.uid() = empleador_id);

create policy "el empleador edita y borra sus propias vacantes"
  on vacantes for update
  using (auth.uid() = empleador_id);

create policy "el empleador borra sus propias vacantes"
  on vacantes for delete
  using (auth.uid() = empleador_id);

-- ============================================================
-- POSTULACIONES (candidato -> vacante, con puntaje y resumen IA)
-- ============================================================
create table if not exists postulaciones (
  id uuid primary key default gen_random_uuid(),
  vacante_id uuid not null references vacantes(id) on delete cascade,
  candidato_id uuid not null references perfiles(id) on delete cascade,
  puntaje numeric default 0,
  resumen_ia text,
  estado text default 'postulado' check (estado in ('postulado', 'preseleccionado', 'descartado')),
  created_at timestamptz default now(),
  unique (vacante_id, candidato_id)
);

alter table postulaciones enable row level security;

create policy "el candidato ve y crea sus propias postulaciones"
  on postulaciones for all
  using (auth.uid() = candidato_id)
  with check (auth.uid() = candidato_id);

create policy "el empleador ve postulaciones de sus vacantes"
  on postulaciones for select
  using (
    exists (
      select 1 from vacantes v
      where v.id = postulaciones.vacante_id
      and v.empleador_id = auth.uid()
    )
  );

create policy "el empleador actualiza estado de postulaciones a sus vacantes"
  on postulaciones for update
  using (
    exists (
      select 1 from vacantes v
      where v.id = postulaciones.vacante_id
      and v.empleador_id = auth.uid()
    )
  );

-- ============================================================
-- ENTREVISTAS (el empleador propone, el candidato responde)
-- ============================================================
create table if not exists entrevistas (
  id uuid primary key default gen_random_uuid(),
  postulacion_id uuid not null references postulaciones(id) on delete cascade,
  horario_propuesto timestamptz not null,
  horario_alternativo timestamptz,
  estado text default 'pendiente' check (estado in ('pendiente', 'confirmada', 'rechazada', 'reagendar_propuesto')),
  propuesta_por text not null check (propuesta_por in ('empleador', 'candidato')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table entrevistas enable row level security;

create policy "el candidato ve y responde entrevistas de sus postulaciones"
  on entrevistas for all
  using (
    exists (
      select 1 from postulaciones p
      where p.id = entrevistas.postulacion_id
      and p.candidato_id = auth.uid()
    )
  );

create policy "el empleador ve y crea entrevistas de sus vacantes"
  on entrevistas for all
  using (
    exists (
      select 1 from postulaciones p
      join vacantes v on v.id = p.vacante_id
      where p.id = entrevistas.postulacion_id
      and v.empleador_id = auth.uid()
    )
  );

-- ============================================================
-- STORAGE (fotos de perfil)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('fotos-perfil', 'fotos-perfil', true)
on conflict (id) do nothing;

create policy "cualquiera puede ver fotos de perfil"
  on storage.objects for select
  using (bucket_id = 'fotos-perfil');

create policy "el usuario sube su propia foto"
  on storage.objects for insert
  with check (bucket_id = 'fotos-perfil' and auth.uid()::text = (storage.foldername(name))[1]);
