-- VORAL — versión 17: MAIL DE CONTACTO hola@somosvoral.com.ar
-- Correr DESPUÉS de schema-v16.sql. Se puede correr las veces que haga falta.
-- Solo cambia el mail que muestra el aviso de límite de reportes (antes decía el Gmail).

create or replace function limitar_reportes()
returns trigger language plpgsql as $$
begin
  if restriccion_activa() and (
    select count(*) from reportes
    where reportante_id = new.reportante_id and created_at > now() - interval '24 hours'
  ) >= 5 then
    raise exception 'Llegaste al límite de reportes por hoy. Si es urgente, escribinos a hola@somosvoral.com.ar.';
  end if;
  return new;
end;
$$;

select 'schema-v17 aplicado' as estado;
