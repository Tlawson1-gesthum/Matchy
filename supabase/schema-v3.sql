-- VORAL — actualización de esquema (versión 3)
-- Corrige: los candidatos no podían ver los datos del local dueño de una vacante,
-- y no había forma de aprobar locales.
-- Este script se puede correr las veces que haga falta sin romper nada.
-- Cómo usar: Supabase Dashboard → SQL Editor → New query → pegar todo → Run

-- ============================================================
-- 1. Permisos sobre la tabla de locales
--    Ver: cualquiera autenticado (para mostrar el local en cada vacante).
--    Editar: solo el dueño.
-- ============================================================
drop policy if exists "el empleador edita su propio registro" on empleadores;
drop policy if exists "cualquiera autenticado ve los locales" on empleadores;
drop policy if exists "el empleador crea su propio registro" on empleadores;
drop policy if exists "los administradores aprueban locales" on empleadores;

create policy "cualquiera autenticado ve los locales"
  on empleadores for select
  using (true);

create policy "el empleador crea su propio registro"
  on empleadores for insert
  with check (auth.uid() = id);

create policy "el empleador edita su propio registro"
  on empleadores for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
-- 2. Administradores: quiénes pueden aprobar locales
-- ============================================================
create table if not exists administradores (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
);

alter table administradores enable row level security;

drop policy if exists "cualquiera autenticado puede consultar si es admin" on administradores;
create policy "cualquiera autenticado puede consultar si es admin"
  on administradores for select
  using (true);

create policy "los administradores aprueban locales"
  on empleadores for update
  using (exists (select 1 from administradores a where a.id = auth.uid()))
  with check (exists (select 1 from administradores a where a.id = auth.uid()));

-- ============================================================
-- 3. IMPORTANTE — date de alta como administrador
--    Cambiá el email de abajo por el email con el que creaste tu cuenta
--    DENTRO de Voral (la de empleador), si es distinto al que está puesto.
-- ============================================================
insert into administradores (id, email)
select id, email from auth.users
where email = 'tomaslawson1@gmail.com'
on conflict (id) do nothing;

-- ============================================================
-- 4. Dejar aprobados los locales que ya existen, para poder seguir probando
-- ============================================================
update empleadores set estado = 'aprobado' where estado is null or estado = 'pendiente';

-- ============================================================
-- 5. Verificación: esto tiene que devolver tu email.
--    Si vuelve vacío, el email del paso 3 no coincide con ninguna cuenta.
-- ============================================================
select email as sos_admin from administradores;
