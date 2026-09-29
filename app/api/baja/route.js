import { createClient } from '@supabase/supabase-js';

// Baja "de un clic" que usan Gmail, Outlook y otros para su botón
// "Anular suscripción" (encabezado List-Unsubscribe-Post). Solo por POST:
// los antivirus que abren los enlaces de los mails hacen GET y no dan de baja a nadie.
export async function POST(req) {
  const token = new URL(req.url).searchParams.get('t') || '';
  if (!/^[0-9a-f-]{36}$/i.test(token)) return new Response('Pedido inválido.', { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
  const { error } = await supabase.rpc('preferencia_mails', { p_token: token, p_recibir: false });
  if (error) return new Response('No se pudo procesar la baja.', { status: 500 });
  return new Response('Listo, te dimos de baja de los avisos por mail de Voral.');
}

// Si alguien abre la dirección en el navegador, lo llevamos a la página con el botón
export async function GET(req) {
  const url = new URL(req.url);
  return Response.redirect(`${url.origin}/baja?t=${encodeURIComponent(url.searchParams.get('t') || '')}`, 302);
}
