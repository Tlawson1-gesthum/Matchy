-- VORAL — versión 15: DATOS FIJOS DEL LOCAL
-- Correr DESPUÉS de schema-v14.sql. Se puede correr las veces que haga falta.
--
-- Con la pantalla "Mi local" el local puede editar sus datos variables (logo,
-- dirección, localidad, tipo de local, enlace y contacto). Los datos con los
-- que se lo verificó quedan fijos: nombre, razón social, CUIT, responsable y
-- teléfono. Si hay que cambiarlos, lo hace un administrador.
--
-- Se agrega como un trigger aparte para no tocar proteger_local().

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
  new.telefono := old.telefono;
  return new;
end;
$$;

drop trigger if exists trg_fijar_datos_verificados_local on empleadores;
create trigger trg_fijar_datos_verificados_local before update on empleadores
  for each row execute function fijar_datos_verificados_local();
