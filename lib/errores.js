// Traduce mensajes técnicos de Supabase/Postgres a texto que entiende cualquiera.
// Pensado para los errores que aparecen al leer o guardar datos (no en los
// formularios de registro, que ya tienen su propia traducción más específica
// para cada paso).
export function traducirError(msg) {
  const m = (msg || '').toLowerCase();
  if (m.includes('failed to fetch') || m.includes('network')) {
    return 'No pudimos conectarnos. Revisá tu conexión a internet y probá de nuevo.';
  }
  if (m.includes('rate limit')) return 'Se alcanzó el límite de intentos por hora. Esperá un rato y probá de nuevo.';
  if (m.includes('row-level security') || m.includes('permission denied')) {
    return 'No tenés permisos para hacer esto. Cerrá sesión, volvé a entrar y probá de nuevo.';
  }
  if (m.includes('jwt') || (m.includes('session') && m.includes('expired'))) {
    return 'Tu sesión venció. Volvé a iniciar sesión.';
  }
  return msg || 'Ocurrió un error inesperado. Probá de nuevo en un rato.';
}
