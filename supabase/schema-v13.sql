-- VORAL — versión 13: MAYORÍA DE EDAD CON REGISTRO REAL Y NOTAS INTERNAS PROTEGIDAS
-- Correr DESPUÉS de schema-v12.sql. Se puede correr las veces que haga falta.
-- Después de correrlo, corré probar-seguridad.sql para confirmar que sigue todo bien
-- (ahora son 19 protecciones, antes eran 18).

-- ============================================================
-- 1. MAYORÍA DE EDAD: queda registro de cuándo se declaró, no solo el booleano
--    (antes la app grababa "declara_mayor_edad: true" fijo, sin fecha ni
--    reflejar el valor real tildado en el formulario)
-- ============================================================
alter table cvs add column if not exists declaracion_edad_at timestamptz;
alter table empleadores add column if not exists declaracion_edad_at timestamptz;

-- ============================================================
-- 2. POSTULACIONES: el candidato no puede leer las notas internas para el local
--    (resumen de IA y razones a favor/en contra). El candidato sigue viendo su
--    propio puntaje, que no cambia; esto solo saca columnas que nunca estuvieron
--    pensadas para él y que la política de RLS no excluía explícitamente.
--
--    Nota técnica: un REVOKE por columna no alcanza si el rol todavía tiene el
--    permiso de SELECT sobre toda la tabla (ese permiso más amplio sigue
--    cubriendo la columna). Por eso primero se saca el permiso de la tabla
--    entera y se lo reemplaza por uno columna por columna.
-- ============================================================
revoke select on postulaciones from authenticated;
grant select (
  id, vacante_id, candidato_id, puntaje, estado, created_at,
  puesto_otro, cv_snapshot, cv_editado_despues
) on postulaciones to authenticated;

-- El local sigue necesitando esas columnas para decidir a quién entrevistar
-- primero. Esta función se las devuelve, verificando primero que la vacante
-- sea suya (misma idea que cvs_para_empleador con cvs_publicos).
create or replace function postulaciones_para_empleador(p_vacante_id uuid)
returns setof postulaciones
language sql stable security definer set search_path = public as $$
  select * from postulaciones
  where vacante_id = p_vacante_id and es_dueno_vacante(p_vacante_id);
$$;

grant execute on function postulaciones_para_empleador(uuid) to authenticated;

-- Usada por /api/summarize para leer (y después completar) el resumen de una
-- postulación puntual, verificando que sea de una vacante propia del local.
create or replace function postulacion_para_resumen(p_postulacion_id uuid)
returns table(id uuid, vacante_id uuid, cv_snapshot jsonb, resumen_ia text)
language sql stable security definer set search_path = public as $$
  select p.id, p.vacante_id, p.cv_snapshot, p.resumen_ia
  from postulaciones p
  where p.id = p_postulacion_id and postulacion_de_mi_vacante(p_postulacion_id);
$$;

grant execute on function postulacion_para_resumen(uuid) to authenticated;

select 'schema-v13 aplicado' as estado;
