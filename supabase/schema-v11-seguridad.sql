-- MATCHY — versión 11: SEGURIDAD
-- Principio: el navegador no decide nada importante, decide la base.
-- Correr DESPUÉS de schema-v10.sql. Se puede correr las veces que haga falta.
-- Después de correrlo, corré probar-seguridad.sql para confirmar que todo quedó bloqueado.

-- ============================================================
-- 0. FUNCIONES DE APOYO
--    Las marcadas "security definer" leen datos sin pasar por las reglas,
--    y se usan dentro de las reglas para no generar bucles entre tablas.
-- ============================================================

create or replace function es_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from administradores a where a.id = auth.uid());
$$;

create or replace function rol_actual()
returns text language sql stable security definer set search_path = public as $$
  select role from perfiles where id = auth.uid();
$$;

-- Verdadero cuando el pedido llega desde la web (usuario logueado o anónimo) y no es admin.
-- Cuando la base se toca desde el SQL Editor o desde una función interna, no restringe.
-- Importante: NO es security definer, así current_user refleja quién llama.
create or replace function restriccion_activa()
returns boolean language sql stable as $$
  select current_user in ('authenticated', 'anon') and not es_admin();
$$;

create or replace function local_aprobado(p_local uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from empleadores e where e.id = p_local and e.estado = 'aprobado');
$$;

create or replace function vacante_abierta(p_vacante uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from vacantes v
    join empleadores e on e.id = v.empleador_id
    where v.id = p_vacante
      and v.estado = 'activa'
      and e.estado = 'aprobado'
      and (v.cierra_at is null or v.cierra_at > now())
  );
$$;

create or replace function es_dueno_vacante(p_vacante uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from vacantes v where v.id = p_vacante and v.empleador_id = auth.uid());
$$;

create or replace function postulado_en(p_vacante uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from postulaciones p where p.vacante_id = p_vacante and p.candidato_id = auth.uid());
$$;

create or replace function postulacion_propia(p_postulacion uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from postulaciones p where p.id = p_postulacion and p.candidato_id = auth.uid());
$$;

create or replace function postulacion_de_mi_vacante(p_postulacion uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from postulaciones p join vacantes v on v.id = p.vacante_id
    where p.id = p_postulacion and v.empleador_id = auth.uid()
  );
$$;

create or replace function avanzo_con_candidato(p_candidato uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from postulaciones p join vacantes v on v.id = p.vacante_id
    where p.candidato_id = p_candidato
      and v.empleador_id = auth.uid()
      and p.estado = 'preseleccionado'
  );
$$;

create or replace function telefono_confirmado(p_usuario uuid)
returns boolean language sql stable security definer set search_path = public, auth as $$
  select exists (select 1 from auth.users u where u.id = p_usuario and u.phone_confirmed_at is not null);
$$;

grant execute on function es_admin(), rol_actual(), restriccion_activa(), local_aprobado(uuid),
  vacante_abierta(uuid), es_dueno_vacante(uuid), postulado_en(uuid), postulacion_propia(uuid),
  postulacion_de_mi_vacante(uuid), avanzo_con_candidato(uuid), telefono_confirmado(uuid)
  to authenticated, anon;

-- ============================================================
-- 1. PERFILES: el rol no se puede cambiar
-- ============================================================
drop policy if exists "cada uno ve y edita su propio perfil" on perfiles;
drop policy if exists "perfil: ver el propio" on perfiles;
drop policy if exists "perfil: crear el propio" on perfiles;
drop policy if exists "perfil: editar el propio" on perfiles;

create policy "perfil: ver el propio" on perfiles for select
  using (id = auth.uid() or es_admin());
create policy "perfil: crear el propio" on perfiles for insert
  with check (id = auth.uid() and role in ('candidato', 'empleador'));
create policy "perfil: editar el propio" on perfiles for update
  using (id = auth.uid()) with check (id = auth.uid());

create or replace function proteger_perfil()
returns trigger language plpgsql as $$
begin
  if restriccion_activa() then
    new.role := old.role;
    new.id := old.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_proteger_perfil on perfiles;
create trigger trg_proteger_perfil before update on perfiles
  for each row execute function proteger_perfil();

-- ============================================================
-- 2. ADMINISTRADORES: nadie ve la lista, cada uno solo se ve a sí mismo
-- ============================================================
drop policy if exists "cualquiera autenticado puede consultar si es admin" on administradores;
drop policy if exists "admin: verse a sí mismo" on administradores;
create policy "admin: verse a sí mismo" on administradores for select
  using (id = auth.uid());

-- ============================================================
-- 3. LOCALES: nadie se autoaprueba y los datos privados no se exponen
-- ============================================================
drop policy if exists "cualquiera autenticado ve los locales" on empleadores;
drop policy if exists "el empleador crea su propio registro" on empleadores;
drop policy if exists "el empleador edita su propio registro" on empleadores;
drop policy if exists "los administradores aprueban locales" on empleadores;
drop policy if exists "local: ver el propio" on empleadores;
drop policy if exists "local: crear el propio" on empleadores;
drop policy if exists "local: editar el propio" on empleadores;
drop policy if exists "local: el admin edita" on empleadores;

create policy "local: ver el propio" on empleadores for select
  using (id = auth.uid() or es_admin());
create policy "local: crear el propio" on empleadores for insert
  with check (id = auth.uid() and rol_actual() = 'empleador');
create policy "local: editar el propio" on empleadores for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy "local: el admin edita" on empleadores for update
  using (es_admin()) with check (es_admin());

create or replace function proteger_local()
returns trigger language plpgsql as $$
begin
  if not restriccion_activa() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.estado := 'pendiente';
    new.verificado_at := null;
    new.verificado_por := null;
    new.verificacion_notas := null;
    new.motivo_rechazo := null;
    new.telefono_verificado_at := case when telefono_confirmado(new.id) then now() else null end;
    return new;
  end if;

  -- UPDATE hecho por el propio local: los campos de verificación no se tocan
  new.id := old.id;
  new.estado := old.estado;
  new.verificado_at := old.verificado_at;
  new.verificado_por := old.verificado_por;
  new.verificacion_notas := old.verificacion_notas;
  new.motivo_rechazo := old.motivo_rechazo;

  -- El teléfono solo figura verificado si Supabase lo confirmó de verdad
  if not telefono_confirmado(new.id) then
    new.telefono_verificado_at := null;
  elsif old.telefono_verificado_at is not null then
    new.telefono_verificado_at := old.telefono_verificado_at;
  else
    new.telefono_verificado_at := now();
  end if;

  -- Si un local aprobado cambia su CUIT o su razón social, vuelve a revisión
  if old.estado = 'aprobado'
     and (new.cuit is distinct from old.cuit or new.razon_social is distinct from old.razon_social) then
    new.estado := 'pendiente';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_proteger_local on empleadores;
create trigger trg_proteger_local before insert or update on empleadores
  for each row execute function proteger_local();

-- Datos públicos de los locales: lo único que ven los candidatos.
-- Sin CUIT, razón social, teléfono del responsable ni notas de verificación.
create or replace view locales_publicos as
select id, nombre_local, tipo_local, ciudad, direccion, red_social, contacto, logo_url, estado
from empleadores
where estado = 'aprobado';

-- Las vistas nacen con permiso de escritura para todos por defecto, y escribir a través
-- de una vista se saltea las reglas de la tabla. Se quita todo y se deja solo lectura.
revoke all on locales_publicos from anon, authenticated;
grant select on locales_publicos to authenticated;

-- ============================================================
-- 4. VACANTES: solo se ven las de locales aprobados, y una suspendida no se reactiva
-- ============================================================
drop policy if exists "cualquiera autenticado ve vacantes activas" on vacantes;
drop policy if exists "el empleador crea sus vacantes" on vacantes;
drop policy if exists "el empleador edita y borra sus propias vacantes" on vacantes;
drop policy if exists "el empleador borra sus propias vacantes" on vacantes;
drop policy if exists "los administradores gestionan vacantes" on vacantes;
drop policy if exists "vacante: ver" on vacantes;
drop policy if exists "vacante: crear" on vacantes;
drop policy if exists "vacante: editar la propia" on vacantes;
drop policy if exists "vacante: borrar la propia" on vacantes;
drop policy if exists "vacante: el admin edita" on vacantes;

create policy "vacante: ver" on vacantes for select
  using (
    empleador_id = auth.uid()
    or es_admin()
    or (estado = 'activa' and local_aprobado(empleador_id))
    or postulado_en(id)
  );
create policy "vacante: crear" on vacantes for insert
  with check (empleador_id = auth.uid() and rol_actual() = 'empleador');
create policy "vacante: editar la propia" on vacantes for update
  using (empleador_id = auth.uid()) with check (empleador_id = auth.uid());
create policy "vacante: borrar la propia" on vacantes for delete
  using (empleador_id = auth.uid());
create policy "vacante: el admin edita" on vacantes for update
  using (es_admin()) with check (es_admin());

create or replace function proteger_vacante()
returns trigger language plpgsql as $$
begin
  if not restriccion_activa() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.estado := 'activa';
    new.suspendida_at := null;
    new.suspendida_motivo := null;
    return new;
  end if;

  new.id := old.id;
  new.empleador_id := old.empleador_id;
  new.created_at := old.created_at;
  new.suspendida_at := old.suspendida_at;
  new.suspendida_motivo := old.suspendida_motivo;

  -- Una vacante suspendida por un reporte solo la reactiva un administrador
  if old.estado = 'suspendida' then
    new.estado := 'suspendida';
  elsif new.estado = 'suspendida' then
    new.estado := old.estado;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_proteger_vacante on vacantes;
create trigger trg_proteger_vacante before insert or update on vacantes
  for each row execute function proteger_vacante();

-- ============================================================
-- 5. CV: años de experiencia calculados por la base y nombre bloqueado de verdad
-- ============================================================
drop policy if exists "el candidato edita su propio cv" on cvs;
drop policy if exists "cv: ver el propio" on cvs;
drop policy if exists "cv: crear el propio" on cvs;
drop policy if exists "cv: editar el propio" on cvs;
drop policy if exists "cv: borrar el propio" on cvs;

create policy "cv: ver el propio" on cvs for select using (id = auth.uid());
create policy "cv: crear el propio" on cvs for insert
  with check (id = auth.uid() and rol_actual() = 'candidato');
create policy "cv: editar el propio" on cvs for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy "cv: borrar el propio" on cvs for delete using (id = auth.uid());

create or replace function calcular_anios_experiencia(p_experiencia jsonb)
returns numeric language plpgsql stable as $$
declare
  e jsonb;
  d date;
  h date;
  meses int;
  total int := 0;
begin
  for e in select value from jsonb_array_elements(coalesce(p_experiencia, '[]'::jsonb)) loop
    if coalesce(e->>'desde', '') = '' then
      continue;
    end if;
    begin
      d := to_date(e->>'desde' || '-01', 'YYYY-MM-DD');
    exception when others then
      continue;
    end;

    if e->>'actual' = 'true' or coalesce(e->>'hasta', '') = '' then
      h := current_date;
    else
      begin
        h := to_date(e->>'hasta' || '-01', 'YYYY-MM-DD');
      exception when others then
        h := current_date;
      end;
    end if;

    meses := (extract(year from h)::int - extract(year from d)::int) * 12
           + (extract(month from h)::int - extract(month from d)::int);
    if meses > 0 then
      total := total + meses;
    end if;
  end loop;

  return least(round(total / 12.0, 1), 60);
end;
$$;

create or replace function proteger_cv()
returns trigger language plpgsql as $$
begin
  -- Siempre, venga de donde venga: los años salen de las fechas cargadas
  new.anios_experiencia := calcular_anios_experiencia(new.experiencia);

  if not restriccion_activa() then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    new.id := old.id;
    if old.nombre_bloqueado then
      new.nombre := old.nombre;
      new.nombre_bloqueado := true;
    end if;
  end if;

  if not telefono_confirmado(new.id) then
    new.telefono_verificado_at := null;
  elsif tg_op = 'UPDATE' and old.telefono_verificado_at is not null then
    new.telefono_verificado_at := old.telefono_verificado_at;
  else
    new.telefono_verificado_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists trg_proteger_cv on cvs;
create trigger trg_proteger_cv before insert or update on cvs
  for each row execute function proteger_cv();

-- Recalcular los años de los CVs que ya existen
update cvs set anios_experiencia = calcular_anios_experiencia(experiencia);

-- ============================================================
-- 6. POSTULACIONES: el candidato no puede tocar su puntaje ni su copia del CV
-- ============================================================
drop policy if exists "el candidato ve y crea sus propias postulaciones" on postulaciones;
drop policy if exists "el empleador ve postulaciones de sus vacantes" on postulaciones;
drop policy if exists "el empleador actualiza estado de postulaciones a sus vacantes" on postulaciones;
drop policy if exists "postulación: el candidato ve las suyas" on postulaciones;
drop policy if exists "postulación: el candidato se postula" on postulaciones;
drop policy if exists "postulación: el candidato la retira" on postulaciones;
drop policy if exists "postulación: el local ve las de sus vacantes" on postulaciones;
drop policy if exists "postulación: el local actualiza las de sus vacantes" on postulaciones;
drop policy if exists "postulación: el admin ve todas" on postulaciones;

create policy "postulación: el candidato ve las suyas" on postulaciones for select
  using (candidato_id = auth.uid());
create policy "postulación: el candidato se postula" on postulaciones for insert
  with check (candidato_id = auth.uid() and rol_actual() = 'candidato' and vacante_abierta(vacante_id));
create policy "postulación: el candidato la retira" on postulaciones for delete
  using (candidato_id = auth.uid());
create policy "postulación: el local ve las de sus vacantes" on postulaciones for select
  using (es_dueno_vacante(vacante_id));
create policy "postulación: el local actualiza las de sus vacantes" on postulaciones for update
  using (es_dueno_vacante(vacante_id)) with check (es_dueno_vacante(vacante_id));
create policy "postulación: el admin ve todas" on postulaciones for select
  using (es_admin());

create or replace function proteger_postulacion()
returns trigger language plpgsql as $$
declare
  copia jsonb;
begin
  if tg_op = 'INSERT' then
    -- La copia del CV la arma la base con los datos reales, sin contactos de referencia.
    select jsonb_build_object(
      'nombre', c.nombre,
      'puestos', c.puestos,
      'experiencia', (
        select coalesce(
          jsonb_agg(x - 'ref_nombre' - 'ref_email' - 'ref_celular' - 'ref_relacion' - 'contacto_referencia'),
          '[]'::jsonb
        )
        from jsonb_array_elements(coalesce(c.experiencia, '[]'::jsonb)) x
      ),
      'anios_experiencia', c.anios_experiencia,
      'habilidades', c.habilidades,
      'herramientas', c.herramientas,
      'disponibilidad_horaria', c.disponibilidad_horaria,
      'turno', c.turno,
      'movilidad_propia', c.movilidad_propia,
      'certificado_manipulacion', c.certificado_manipulacion,
      'certificado_url', c.certificado_url,
      'congelado_at', now()
    )
    into copia
    from cvs c
    where c.id = new.candidato_id;

    new.cv_snapshot := copia;
    new.puntaje := null;
    new.resumen_ia := null;
    new.razones_positivas := '[]'::jsonb;
    new.razones_negativas := '[]'::jsonb;
    new.estado := 'postulado';
    new.cv_editado_despues := false;
    return new;
  end if;

  -- UPDATE: lo que identifica a la postulación y su copia congelada no cambian nunca
  new.id := old.id;
  new.candidato_id := old.candidato_id;
  new.vacante_id := old.vacante_id;
  new.cv_snapshot := old.cv_snapshot;
  new.puesto_otro := old.puesto_otro;
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists trg_proteger_postulacion on postulaciones;
create trigger trg_proteger_postulacion before insert or update on postulaciones
  for each row execute function proteger_postulacion();

-- ============================================================
-- 7. ENTREVISTAS: el candidato solo responde, no crea ni cambia el horario del local
-- ============================================================
drop policy if exists "el candidato ve y responde entrevistas de sus postulaciones" on entrevistas;
drop policy if exists "el empleador ve y crea entrevistas de sus vacantes" on entrevistas;
drop policy if exists "entrevista: el candidato ve las suyas" on entrevistas;
drop policy if exists "entrevista: el candidato responde" on entrevistas;
drop policy if exists "entrevista: el local gestiona" on entrevistas;

create policy "entrevista: el candidato ve las suyas" on entrevistas for select
  using (postulacion_propia(postulacion_id));
create policy "entrevista: el candidato responde" on entrevistas for update
  using (postulacion_propia(postulacion_id)) with check (postulacion_propia(postulacion_id));
create policy "entrevista: el local gestiona" on entrevistas for all
  using (postulacion_de_mi_vacante(postulacion_id))
  with check (postulacion_de_mi_vacante(postulacion_id));

create or replace function proteger_entrevista()
returns trigger language plpgsql as $$
begin
  if not restriccion_activa() then
    return new;
  end if;

  new.id := old.id;
  new.postulacion_id := old.postulacion_id;
  new.created_at := old.created_at;

  -- Si quien edita es el candidato (y no el local), solo puede responder
  if postulacion_propia(old.postulacion_id) and not postulacion_de_mi_vacante(old.postulacion_id) then
    new.horario_propuesto := old.horario_propuesto;
    new.propuesta_por := old.propuesta_por;
    if new.estado not in ('confirmada', 'rechazada', 'reagendar_propuesto') then
      new.estado := old.estado;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_proteger_entrevista on entrevistas;
create trigger trg_proteger_entrevista before update on entrevistas
  for each row execute function proteger_entrevista();

-- ============================================================
-- 8. VISTAS: nadie ve quién miró qué; los totales salen de la función
-- ============================================================
drop policy if exists "cualquiera autenticado lee las vistas" on vacante_vistas;
drop policy if exists "vista: ver las propias" on vacante_vistas;
create policy "vista: ver las propias" on vacante_vistas for select
  using (usuario_id = auth.uid());

-- ============================================================
-- 9. CVs: el enlace compartible anda de a uno, pero no se pueden listar todos
-- ============================================================
-- Se quita todo permiso directo sobre la vista, incluido el de escritura que traía por defecto.
revoke all on cvs_publicos from anon, authenticated;

create or replace function cv_publico(p_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select to_jsonb(v) from cvs_publicos v where v.id = p_id;
$$;

-- Los CVs de quienes se postularon a las vacantes del local que consulta
create or replace function cvs_para_empleador(p_ids uuid[])
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(to_jsonb(v)), '[]'::jsonb)
  from cvs_publicos v
  where v.id = any(p_ids)
    and exists (
      select 1 from postulaciones p join vacantes va on va.id = p.vacante_id
      where p.candidato_id = v.id and va.empleador_id = auth.uid()
    );
$$;

grant execute on function cv_publico(uuid) to anon, authenticated;
grant execute on function cvs_para_empleador(uuid[]) to authenticated;

-- ============================================================
-- 10. REPORTES: que no sirvan para sabotear a un competidor
-- ============================================================
-- Un reporte por persona y por vacante (se limpian duplicados si los hubiera)
delete from reportes r
using reportes r2
where r.reportante_id = r2.reportante_id
  and r.vacante_id = r2.vacante_id
  and (r.created_at > r2.created_at or (r.created_at = r2.created_at and r.ctid > r2.ctid));

create unique index if not exists reportes_uno_por_persona
  on reportes (reportante_id, vacante_id);

-- Máximo 5 reportes por persona por día
create or replace function limitar_reportes()
returns trigger language plpgsql as $$
begin
  if restriccion_activa() and (
    select count(*) from reportes
    where reportante_id = new.reportante_id and created_at > now() - interval '24 hours'
  ) >= 5 then
    raise exception 'Llegaste al límite de reportes por hoy. Si es urgente, escribinos a gozzasabores@gmail.com.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_limitar_reportes on reportes;
create trigger trg_limitar_reportes before insert on reportes
  for each row execute function limitar_reportes();

-- La suspensión automática solo cuenta reportes de candidatos con cuentas de más de 7 días.
-- Tres cuentas creadas hoy ya no alcanzan para bajar el aviso de nadie.
create or replace function suspender_vacante_muy_reportada()
returns trigger language plpgsql security definer set search_path = public, auth as $$
declare
  confiables int;
begin
  if new.vacante_id is null then
    return new;
  end if;

  select count(distinct r.reportante_id) into confiables
  from reportes r
  join auth.users u on u.id = r.reportante_id
  join perfiles pf on pf.id = r.reportante_id
  where r.vacante_id = new.vacante_id
    and r.estado = 'abierto'
    and pf.role = 'candidato'
    and u.created_at < now() - interval '7 days';

  if confiables >= 3 then
    update vacantes
    set estado = 'suspendida',
        suspendida_at = now(),
        suspendida_motivo = 'Suspendida automáticamente por ' || confiables || ' reportes de personas distintas'
    where id = new.vacante_id and estado = 'activa';
  end if;

  return new;
end;
$$;

-- ============================================================
-- 11. ARCHIVOS: límites de tamaño y tipo, y certificados privados
-- ============================================================
do $$
begin
  update storage.buckets
  set file_size_limit = 3145728, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
  where id = 'fotos-perfil';

  update storage.buckets
  set file_size_limit = 2097152, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
  where id = 'logos-locales';

  update storage.buckets
  set public = false,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  where id = 'certificados';
exception when others then
  raise notice 'No se pudieron ajustar los buckets por SQL (%). Hacelo a mano desde Storage: ver la guía.', sqlerrm;
end $$;

create or replace function puede_ver_certificado(p_carpeta text)
returns boolean language plpgsql stable security definer set search_path = public as $$
begin
  if p_carpeta = auth.uid()::text or es_admin() then
    return true;
  end if;
  return avanzo_con_candidato(p_carpeta::uuid);
exception when others then
  return false;
end;
$$;

grant execute on function puede_ver_certificado(text) to authenticated;

do $$
begin
  drop policy if exists "cualquiera puede ver certificados" on storage.objects;
  drop policy if exists "certificado: ver" on storage.objects;
  drop policy if exists "certificado: reemplazar el propio" on storage.objects;
  drop policy if exists "foto: reemplazar la propia" on storage.objects;

  create policy "certificado: ver" on storage.objects for select
    using (bucket_id = 'certificados' and puede_ver_certificado((storage.foldername(name))[1]));

  create policy "certificado: reemplazar el propio" on storage.objects for update
    using (bucket_id = 'certificados' and auth.uid()::text = (storage.foldername(name))[1]);

  create policy "foto: reemplazar la propia" on storage.objects for update
    using (bucket_id = 'fotos-perfil' and auth.uid()::text = (storage.foldername(name))[1]);
end $$;

-- ============================================================
-- 12. Otras reglas que usaban la lista de administradores directamente
-- ============================================================
drop policy if exists "los administradores ven todos los reportes" on reportes;
create policy "los administradores ven todos los reportes" on reportes for select using (es_admin());

drop policy if exists "los administradores actualizan reportes" on reportes;
create policy "los administradores actualizan reportes" on reportes for update using (es_admin());

select 'Seguridad v11 aplicada. Ahora corré probar-seguridad.sql.' as estado;
