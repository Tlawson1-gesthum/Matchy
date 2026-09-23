-- VORAL — actualización de esquema (versión 2)
-- Cómo usar: Supabase Dashboard → SQL Editor → New query → pegar esto → Run
-- Es seguro correrlo aunque ya tengas datos cargados: solo agrega columnas.

-- ============================================================
-- CVs: herramientas e idiomas ahora guardan nivel, y el certificado se puede adjuntar
-- ============================================================
alter table cvs add column if not exists herramientas_nivel jsonb default '[]';
-- [{nombre, nivel}] nivel: principiante | medio | medio_avanzado | avanzado | experto

alter table cvs add column if not exists idiomas_nivel jsonb default '[]';
-- [{nombre, nivel}] nivel: principiante | intermedio | avanzado

alter table cvs add column if not exists certificado_url text;

-- ============================================================
-- EMPLEADORES: datos de verificación y estado de aprobación manual
-- ============================================================
alter table empleadores add column if not exists nombre_responsable text;
alter table empleadores add column if not exists cuit text;
alter table empleadores add column if not exists razon_social text;
alter table empleadores add column if not exists direccion text;
alter table empleadores add column if not exists telefono text;
alter table empleadores add column if not exists red_social text;
alter table empleadores add column if not exists estado text default 'pendiente'
  check (estado in ('pendiente', 'aprobado', 'rechazado'));

-- Los locales ya existentes quedan aprobados para no romper lo que ya probaste
update empleadores set estado = 'aprobado' where estado is null;

-- ============================================================
-- POSTULACIONES: el candidato aclara a qué puesto se postula si eligió "Otro"
-- ============================================================
alter table postulaciones add column if not exists puesto_otro text;

-- ============================================================
-- VACANTES: días y franja horaria como opciones cerradas
-- ============================================================
alter table vacantes add column if not exists dias_trabajo text;
alter table vacantes add column if not exists puesto_otro text;

-- ============================================================
-- STORAGE: bucket para el certificado de manipulación de alimentos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('certificados', 'certificados', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'cualquiera puede ver certificados'
  ) then
    create policy "cualquiera puede ver certificados"
      on storage.objects for select
      using (bucket_id = 'certificados');
  end if;

  if not exists (
    select 1 from pg_policies
    where policyname = 'el usuario sube su propio certificado'
  ) then
    create policy "el usuario sube su propio certificado"
      on storage.objects for insert
      with check (bucket_id = 'certificados' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;
end $$;
