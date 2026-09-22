import { supabase } from './supabaseClient';

// Pide al servidor que mande el aviso por mail de un evento.
// No bloquea ni muestra errores: si el mail no sale, la novedad igual
// está en el panel de la otra persona.
export async function enviarAviso(evento, id) {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token || !id) return;
    await fetch('/api/avisos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ evento, id }),
    });
  } catch {
    /* el aviso por mail es un extra: si falla, no interrumpe nada */
  }
}
