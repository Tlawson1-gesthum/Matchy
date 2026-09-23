-- VORAL — PRUEBA DE SEGURIDAD
-- Crea usuarios de prueba, intenta cada ataque haciéndose pasar por ellos,
-- y al final DESHACE TODO. No deja ningún dato en la base.
--
-- IMPORTANTE: el resultado aparece como un "ERROR". Es a propósito:
-- terminar con un error es lo que garantiza que se borre todo lo creado.
-- Leé el texto del error: cada línea dice OK o FALLA.
--
-- Supabase → SQL Editor → New query → pegar todo → Run

do $$
declare
  a uuid := gen_random_uuid();   -- local
  b uuid := gen_random_uuid();   -- candidato
  c uuid := gen_random_uuid();   -- segundo local, para probar el alta
  v uuid;                        -- vacante
  p uuid;                        -- postulación
  r text := E'\n\nRESULTADO DE LA PRUEBA DE SEGURIDAD\n\n';
  txt text;
  n int;
  num numeric;
  flag boolean;
  fallas int := 0;
begin
  -- ---------- Preparación (como administrador de la base) ----------
  insert into auth.users (id, email, created_at)
  values (a, 'prueba-a-' || a || '@voral.test', now()),
         (b, 'prueba-b-' || b || '@voral.test', now()),
         (c, 'prueba-c-' || c || '@voral.test', now());

  insert into perfiles (id, role, email) values
    (a, 'empleador', 'a@voral.test'),
    (b, 'candidato', 'b@voral.test'),
    (c, 'empleador', 'c@voral.test');

  insert into empleadores (id, nombre_local, ciudad, cuit, telefono, estado)
  values (a, 'Local de prueba', 'Posadas', '30500010912', '3764000000', 'pendiente');

  insert into cvs (id, nombre, experiencia, puestos)
  values (b, 'Candidato de prueba',
    '[{"puesto":"Mozo/a","empresa":"X","desde":"2024-01","actual":true,"ref_nombre":"Referencia secreta","ref_celular":"3764111111"}]'::jsonb,
    array['Mozo/a']);

  -- =================================================================
  -- Como el LOCAL (a)
  -- =================================================================
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  update empleadores set estado = 'aprobado' where id = a;
  execute 'reset role';
  select estado into txt from empleadores where id = a;
  if txt = 'pendiente' then r := r || 'OK     Un local no puede autoaprobarse' || E'\n';
  else r := r || 'FALLA  Un local pudo autoaprobarse' || E'\n'; fallas := fallas + 1; end if;

  execute 'set local role authenticated';
  update perfiles set role = 'candidato' where id = a;
  execute 'reset role';
  select role into txt from perfiles where id = a;
  if txt = 'empleador' then r := r || 'OK     Nadie puede cambiarse el rol' || E'\n';
  else r := r || 'FALLA  Se pudo cambiar el rol' || E'\n'; fallas := fallas + 1; end if;

  execute 'set local role authenticated';
  insert into vacantes (empleador_id, puesto, estado) values (a, 'Mozo/a', 'activa') returning id into v;
  execute 'reset role';

  -- =================================================================
  -- Como el SEGUNDO LOCAL (c): intenta darse de alta ya aprobado
  -- =================================================================
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  insert into empleadores (id, nombre_local, ciudad, estado) values (c, 'Local trucho', 'Posadas', 'aprobado');
  execute 'reset role';
  select estado into txt from empleadores where id = c;
  if txt = 'pendiente' then r := r || 'OK     Un local nuevo no puede nacer aprobado' || E'\n';
  else r := r || 'FALLA  Un local nuevo nació aprobado' || E'\n'; fallas := fallas + 1; end if;

  -- =================================================================
  -- Como el CANDIDATO (b)
  -- =================================================================
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  select count(*) into n from empleadores;
  if n = 0 then r := r || 'OK     Un candidato no puede leer CUIT ni teléfonos de los locales' || E'\n';
  else r := r || 'FALLA  Un candidato puede leer datos privados de ' || n || ' locales' || E'\n'; fallas := fallas + 1; end if;

  begin
    update locales_publicos set nombre_local = 'Hackeado' where id = a;
    r := r || 'FALLA  Se pudo modificar un local a través de la vista pública' || E'\n'; fallas := fallas + 1;
  exception when others then
    r := r || 'OK     Nadie puede modificar locales a través de la vista pública' || E'\n';
  end;

  begin
    update cvs_publicos set nombre = 'Hackeado' where id = b;
    r := r || 'FALLA  Se pudo modificar un CV ajeno a través de la vista' || E'\n'; fallas := fallas + 1;
  exception when others then
    r := r || 'OK     Nadie puede modificar CVs ajenos a través de la vista' || E'\n';
  end;

  select count(*) into n from administradores;
  if n = 0 then r := r || 'OK     Nadie puede ver la lista de administradores' || E'\n';
  else r := r || 'FALLA  Se puede ver la lista de administradores' || E'\n'; fallas := fallas + 1; end if;

  select count(*) into n from vacantes where id = v;
  if n = 0 then r := r || 'OK     No se ven vacantes de locales sin aprobar' || E'\n';
  else r := r || 'FALLA  Se ve una vacante de un local sin aprobar' || E'\n'; fallas := fallas + 1; end if;

  begin
    insert into postulaciones (vacante_id, candidato_id) values (v, b);
    r := r || 'FALLA  Se pudo postular a una vacante de un local sin aprobar' || E'\n'; fallas := fallas + 1;
  exception when others then
    r := r || 'OK     No se puede postular a un local sin aprobar' || E'\n';
  end;

  execute 'reset role';

  -- El administrador de la base aprueba el local (desde el SQL Editor se permite)
  update empleadores set estado = 'aprobado' where id = a;

  execute 'set local role authenticated';

  insert into postulaciones (vacante_id, candidato_id, puntaje, cv_snapshot)
  values (v, b, 100, '{"nombre":"Inventado","anios_experiencia":40}'::jsonb)
  returning id into p;
  execute 'reset role';
  select puntaje, cv_snapshot->>'nombre' into num, txt from postulaciones where id = p;
  if num is null and txt = 'Candidato de prueba' then
    r := r || 'OK     El puntaje y la copia del CV los arma la base, no el candidato' || E'\n';
  else
    r := r || 'FALLA  El candidato pudo inventar su puntaje o su copia del CV' || E'\n'; fallas := fallas + 1;
  end if;

  select (cv_snapshot::text like '%Referencia secreta%') into flag from postulaciones where id = p;
  if not flag then r := r || 'OK     La copia del CV no expone los contactos de referencia' || E'\n';
  else r := r || 'FALLA  La copia del CV expone los contactos de referencia' || E'\n'; fallas := fallas + 1; end if;

  execute 'set local role authenticated';
  update postulaciones set puntaje = 100 where id = p;
  execute 'reset role';
  select puntaje into num from postulaciones where id = p;
  if num is null then r := r || 'OK     El candidato no puede editar su postulación' || E'\n';
  else r := r || 'FALLA  El candidato pudo cambiar su puntaje' || E'\n'; fallas := fallas + 1; end if;

  execute 'set local role authenticated';
  begin
    perform resumen_ia from postulaciones where id = p;
    r := r || 'FALLA  El candidato pudo leer el resumen de IA de su postulación' || E'\n'; fallas := fallas + 1;
  exception when others then
    r := r || 'OK     El candidato no puede leer el resumen de IA ni las razones internas' || E'\n';
  end;
  execute 'reset role';

  select nombre_bloqueado into flag from cvs where id = b;
  execute 'set local role authenticated';
  update cvs set nombre = 'Otro nombre', nombre_bloqueado = false where id = b;
  execute 'reset role';
  select nombre into txt from cvs where id = b;
  if flag and txt = 'Candidato de prueba' then r := r || 'OK     El nombre queda bloqueado después de postularse' || E'\n';
  else r := r || 'FALLA  Se pudo cambiar el nombre bloqueado' || E'\n'; fallas := fallas + 1; end if;

  execute 'set local role authenticated';
  update cvs set anios_experiencia = 50 where id = b;
  execute 'reset role';
  select anios_experiencia into num from cvs where id = b;
  if num < 10 then r := r || 'OK     Los años de experiencia los calcula la base (' || num || ')' || E'\n';
  else r := r || 'FALLA  Se pudieron inflar los años de experiencia (' || num || ')' || E'\n'; fallas := fallas + 1; end if;

  execute 'set local role authenticated';
  begin
    insert into entrevistas (postulacion_id, horario_propuesto, propuesta_por) values (p, now(), 'empleador');
    r := r || 'FALLA  Un candidato pudo crearse una entrevista' || E'\n'; fallas := fallas + 1;
  exception when others then
    r := r || 'OK     Un candidato no puede crearse entrevistas' || E'\n';
  end;
  execute 'reset role';

  -- =================================================================
  -- Vacante suspendida: el local intenta reactivarla
  -- =================================================================
  update vacantes set estado = 'suspendida' where id = v;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  update vacantes set estado = 'activa' where id = v;
  execute 'reset role';
  select estado into txt from vacantes where id = v;
  if txt = 'suspendida' then r := r || 'OK     Un local no puede reactivar una vacante suspendida' || E'\n';
  else r := r || 'FALLA  Un local reactivó una vacante suspendida' || E'\n'; fallas := fallas + 1; end if;

  -- =================================================================
  -- Visitante sin cuenta
  -- =================================================================
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  execute 'set local role anon';
  begin
    select count(*) into n from cvs_publicos;
    r := r || 'FALLA  Un visitante sin cuenta puede listar ' || n || ' CVs' || E'\n'; fallas := fallas + 1;
  exception when others then
    r := r || 'OK     Un visitante sin cuenta no puede descargar la lista de CVs' || E'\n';
  end;

  select (cv_publico(b) is not null) into flag;
  if flag then r := r || 'OK     El enlace compartible de un CV sigue funcionando' || E'\n';
  else r := r || 'FALLA  El enlace compartible de un CV dejó de funcionar' || E'\n'; fallas := fallas + 1; end if;
  execute 'reset role';

  -- ---------- Resumen y deshacer todo ----------
  if fallas = 0 then
    r := r || E'\nTODO BIEN: las 19 protecciones funcionan.\n';
  else
    r := r || E'\nATENCION: ' || fallas || ' protecciones fallaron. Pasale este texto a Claude.\n';
  end if;
  r := r || E'Nada de esta prueba quedó guardado en la base.\n';

  raise exception '%', r;
end $$;
