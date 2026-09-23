-- VORAL — actualización de esquema (versión 4)
-- 1) Define el superusuario que aprueba locales.
-- 2) Restringe las localidades al Gran Posadas.
-- Se puede correr las veces que haga falta.

-- ============================================================
-- 1. SUPERUSUARIO
--    Solo las cuentas listadas en esta tabla ven la pantalla de
--    aprobación de locales. Ningún otro local tiene acceso.
-- ============================================================

-- Dejamos como administrador únicamente a gozzasabores@gmail.com
delete from administradores
where email is distinct from 'gozzasabores@gmail.com';

insert into administradores (id, email)
select id, email from auth.users
where email = 'gozzasabores@gmail.com'
on conflict (id) do nothing;

-- ============================================================
-- 2. LOCALIDADES PERMITIDAS (Gran Posadas)
--    La base rechaza cualquier localidad fuera de esta lista.
-- ============================================================
alter table empleadores drop constraint if exists empleadores_ciudad_permitida;
alter table empleadores add constraint empleadores_ciudad_permitida
  check (ciudad is null or ciudad in (
    'Posadas', 'Garupá', 'Candelaria', 'Fachinal', 'San Ignacio', 'Santa Ana', 'Profundidad'
  ));

-- ============================================================
-- 3. Verificación: tiene que devolver gozzasabores@gmail.com
--    Si vuelve vacío, esa cuenta todavía no está creada en Voral.
-- ============================================================
select email as superusuario from administradores;
