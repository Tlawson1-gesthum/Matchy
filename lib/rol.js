import { supabase } from './supabaseClient';

// Devuelve { uid, role, empleador, cv } o null si no hay sesión.
// Una cuenta tiene un solo rol: o es candidato, o es local (opción A).
export async function obtenerSesion() {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) return null;

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('id, role, email')
    .eq('id', uid)
    .maybeSingle();

  return { uid, role: perfil?.role || null, email: perfil?.email || userData.user.email };
}

// Verifica que la sesión actual tenga el rol esperado.
// Si no lo tiene, devuelve el mensaje de error que hay que mostrar.
export function mensajeRolIncorrecto(rolActual, rolEsperado) {
  if (!rolActual || rolActual === rolEsperado) return null;
  if (rolEsperado === 'empleador') {
    return 'Esta cuenta está registrada como candidato. Para publicar vacantes necesitás registrar tu local con otro email.';
  }
  return 'Esta cuenta está registrada como local. Para armar un CV necesitás registrarte como candidato con otro email.';
}
