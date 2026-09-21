-- MATCHY — actualización de esquema (versión 7)
-- Congelado del CV al postularse, nombre bloqueado, verificación de teléfono.
-- Correr DESPUÉS de schema-v6.sql. Se puede correr las veces que haga falta.

-- ============================================================
-- 1. CONGELAR EL CV AL MOMENTO DE POSTULARSE
--    Guardamos una copia de los datos con los que se calculó el puntaje.
--    Editar el CV después no cambia las postulaciones ya enviadas.
-- ============================================================
alter table postulaciones add column if not exists cv_snapshot jsonb;
alter table postulaciones add column if not exists razones_positivas jsonb default '[]';
alter table postulaciones add column if not exists razones_negativas jsonb default '[]';
alter table postulaciones add column if not exists cv_editado_despues boolean default false;

-- ============================================================
-- 2. NOMBRE DEL CANDIDATO
--    Se bloquea después de la primera postulación.
-- ============================================================
alter table cvs add column if not exists nombre_bloqueado boolean default false;

-- ============================================================
-- 3. TELÉFONO VERIFICADO (candidatos y locales)
-- ============================================================
alter table cvs add column if not exists telefono text;
alter table cvs add column if not exists telefono_verificado_at timestamptz;
alter table empleadores add column if not exists telefono_verificado_at timestamptz;

-- ============================================================
-- 4. Al postularse, bloquear el nombre automáticamente
-- ============================================================
create or replace function bloquear_nombre_al_postularse()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update cvs set nombre_bloqueado = true
  where id = new.candidato_id and nombre_bloqueado is distinct from true;
  return new;
end;
$$;

drop trigger if exists trg_bloquear_nombre on postulaciones;
create trigger trg_bloquear_nombre
  after insert on postulaciones
  for each row execute function bloquear_nombre_al_postularse();

-- ============================================================
-- 5. Marcar las postulaciones cuando el CV se edita después
-- ============================================================
create or replace function marcar_cv_editado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update postulaciones
  set cv_editado_despues = true
  where candidato_id = new.id
    and created_at < now() - interval '1 minute';
  return new;
end;
$$;

drop trigger if exists trg_cv_editado on cvs;
create trigger trg_cv_editado
  after update on cvs
  for each row
  when (old.experiencia is distinct from new.experiencia
     or old.puestos is distinct from new.puestos
     or old.habilidades is distinct from new.habilidades
     or old.herramientas is distinct from new.herramientas
     or old.disponibilidad_horaria is distinct from new.disponibilidad_horaria
     or old.movilidad_propia is distinct from new.movilidad_propia
     or old.certificado_manipulacion is distinct from new.certificado_manipulacion)
  execute function marcar_cv_editado();

-- ============================================================
-- 6. Diagnóstico
-- ============================================================
select 'postulaciones con copia del CV' as chequeo, count(*)::text as resultado
from postulaciones where cv_snapshot is not null
union all
select 'candidatos con nombre bloqueado', count(*)::text from cvs where nombre_bloqueado = true;
