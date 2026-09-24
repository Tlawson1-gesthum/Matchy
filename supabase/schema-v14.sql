-- VORAL — versión 14: ACCESIBILIDAD (dato sensible, opcional) Y TIPO DE FORMACIÓN
-- Correr DESPUÉS de schema-v13.sql. Se puede correr las veces que haga falta.

-- ============================================================
-- 1. ACCESIBILIDAD
--    Dato sensible en el sentido de la Ley 25.326 (salud). Es opcional para
--    el candidato y requiere su propio consentimiento, separado del
--    consentimiento general (columna accesibilidad_consentimiento_at).
--
--    Seguridad: la tabla cvs ya tiene una sola política de SELECT ("cv: ver
--    el propio", en schema-v11-seguridad.sql) que solo deja leer la fila al
--    dueño. Estas columnas nuevas quedan automáticamente protegidas por esa
--    misma política: nadie más puede leerlas directo de la tabla. La vista
--    cvs_publicos y las funciones cv_publico/cvs_para_empleador tienen una
--    lista explícita de columnas y no incluyen estas, así que tampoco se ven
--    en el CV público ni en el listado de postulantes. La única forma de que
--    un local las vea es la función de abajo, con la misma condición que ya
--    se usa para referencias y certificado: haber avanzado con la persona.
-- ============================================================
alter table cvs add column if not exists tiene_discapacidad boolean default false;
alter table cvs add column if not exists tipos_discapacidad text[] default '{}';
alter table cvs add column if not exists posee_cud boolean default false;
alter table cvs add column if not exists accesibilidad_consentimiento_at timestamptz;

create or replace function accesibilidad_de_candidato(p_candidato_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  habilitado boolean;
begin
  select avanzo_con_candidato(p_candidato_id) into habilitado;
  if not habilitado then
    return null;
  end if;

  return (
    select jsonb_build_object(
      'tiene_discapacidad', c.tiene_discapacidad,
      'tipos_discapacidad', c.tipos_discapacidad,
      'posee_cud', c.posee_cud
    )
    from cvs c
    where c.id = p_candidato_id
  );
end;
$$;

grant execute on function accesibilidad_de_candidato(uuid) to authenticated;

-- ============================================================
-- 2. TIPO DE FORMACIÓN
--    Antes todo entraba en un único campo de texto libre ("Secundario
--    completo" tipeado a mano, mezclado con cursos cortos). Se agrega un
--    campo "tipo" y uno de "carrera" opcional para los estudios formales.
--    No hace falta ninguna migración de datos: es jsonb, los registros
--    viejos simplemente no tienen "tipo" y el frontend los trata como
--    "curso" por defecto.
-- ============================================================
select 'schema-v14 aplicado' as estado;
