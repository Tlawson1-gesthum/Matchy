-- VORAL — versión 16: SUELDO OPCIONAL EN LA VACANTE Y ARREGLO DEL TELÉFONO
-- Correr DESPUÉS de schema-v15.sql. Se puede correr las veces que haga falta.

-- ============================================================
-- 1. SUELDO (opcional)
--    Texto libre y corto, por ejemplo "$450.000 por mes + propinas".
--    Si está vacío, no se muestra en el aviso.
-- ============================================================
alter table vacantes add column if not exists sueldo text;

alter table vacantes drop constraint if exists vacantes_sueldo_largo;
alter table vacantes add constraint vacantes_sueldo_largo
  check (sueldo is null or char_length(sueldo) <= 120);

-- ============================================================
-- 2. TELÉFONO: se saca de los datos fijos del local
--    La versión 15 lo bloqueaba, pero el local lo cambia al verificar un número
--    nuevo por SMS (componente VerificarTelefono). proteger_local() ya se ocupa de
--    que solo figure verificado si Supabase lo confirmó.
-- ============================================================
create or replace function fijar_datos_verificados_local()
returns trigger language plpgsql as $$
begin
  if not restriccion_activa() then
    return new;
  end if;

  new.nombre_local := old.nombre_local;
  new.razon_social := old.razon_social;
  new.cuit := old.cuit;
  new.nombre_responsable := old.nombre_responsable;
  return new;
end;
$$;
