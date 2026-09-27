import { createClient } from '@supabase/supabase-js';
import { enviarMail, plantilla, escapar, mailConfigurado } from '../../../lib/mail';
import { formatearHorario } from '../../../lib/fechas';
import { mailBienvenida } from '../../../lib/bienvenida';

const EVENTOS = ['entrevista_propuesta', 'entrevista_actualizada', 'entrevista_respondida', 'local_aprobado', 'local_rechazado', 'bienvenida'];


// Envía el aviso por mail que corresponde a un evento.
// Seguridad: quien llama tiene que estar logueado, y la base solo devuelve el
// destinatario si tiene relación real con esa entrevista o ese local.
export async function POST(req) {
  try {
    if (!mailConfigurado()) return Response.json({ enviado: false, motivo: 'Mails todavía no configurados.' });

    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
    if (!token) return Response.json({ error: 'Falta la sesión.' }, { status: 401 });

    let cuerpo = {};
    try { cuerpo = await req.json(); } catch { /* vacío */ }
    const { evento, id } = cuerpo;
    if (!EVENTOS.includes(evento) || !/^[0-9a-f-]{36}$/i.test(String(id || ''))) {
      return Response.json({ error: 'Pedido inválido.' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
    );

    // Bienvenida: solo para uno mismo (el id tiene que ser el de la sesión)
    if (evento === 'bienvenida') {
      const { data: u } = await supabase.auth.getUser(token);
      if (!u?.user?.email || u.user.id !== id) return Response.json({ error: 'Sin permiso.' }, { status: 403 });
      const { data: perfil } = await supabase.from('perfiles').select('role').eq('id', id).maybeSingle();
      const b = mailBienvenida(perfil?.role, new URL(req.url).origin);
      const html = plantilla({ titulo: b.titulo, parrafos: b.parrafos, pasos: b.pasos, boton: b.boton, cierre: b.cierre });
      const texto = [...b.parrafos, ...b.pasos.map((p, i) => `${i + 1}. ${p}`), b.cierre || '']
        .map((p) => p.replace(/<[^>]+>/g, '')).filter(Boolean).join('\n\n');
      return Response.json(await enviarMail({ para: u.user.email, asunto: b.asunto, html, texto }));
    }

    const { data: d, error } = await supabase.rpc('destinatario_aviso', { p_evento: evento, p_id: id });
    if (error || !d?.email) return Response.json({ error: 'Sin permiso.' }, { status: 403 });

    const base = new URL(req.url).origin;
    const puesto = escapar(d.puesto);
    const local = escapar(d.local);
    const horario = escapar(formatearHorario(d.horario));
    let mail;

    if (evento === 'entrevista_propuesta') {
      mail = {
        asunto: `${d.local} te propone una entrevista`,
        titulo: 'Te proponen una entrevista',
        parrafos: [
          `<strong>${local}</strong> te propone una entrevista para el puesto de <strong>${puesto}</strong>.`,
          `Horario propuesto: <strong>${horario}</strong>${d.direccion ? `, en ${escapar(d.direccion)}` : ''}.`,
          'Entrá a Voral para confirmarla, proponer otro horario o avisar que no podés.',
        ],
        boton: { texto: 'Responder', href: `${base}/candidato/entrevistas` },
      };
    } else if (evento === 'entrevista_actualizada') {
      const confirmada = d.estado === 'confirmada';
      mail = {
        asunto: confirmada ? `${d.local} confirmó tu entrevista` : `${d.local} te propone otro horario`,
        titulo: confirmada ? 'Tu entrevista está confirmada' : 'Hay un horario nuevo',
        parrafos: [
          confirmada
            ? `<strong>${local}</strong> aceptó el horario para la entrevista de <strong>${puesto}</strong>: ${horario}.`
            : `<strong>${local}</strong> te propone un horario nuevo para la entrevista de <strong>${puesto}</strong>: ${horario}.`,
          'Recordá: las entrevistas son en el local y en horario comercial. Nadie puede pedirte dinero.',
        ],
        boton: { texto: 'Ver mis entrevistas', href: `${base}/candidato/entrevistas` },
      };
    } else if (evento === 'entrevista_respondida') {
      const textos = {
        confirmada: `${escapar(d.nombre)} confirmó la entrevista para ${puesto} (${horario}).`,
        rechazada: `${escapar(d.nombre)} avisó que no puede ir a la entrevista para ${puesto}.`,
        reagendar_propuesto: `${escapar(d.nombre)} propone otro horario para la entrevista de ${puesto}: ${horario}.`,
      };
      mail = {
        asunto: `Novedades sobre la entrevista para ${d.puesto}`,
        titulo: 'Un candidato respondió',
        parrafos: [textos[d.estado] || `Hay novedades sobre la entrevista para ${puesto}.`],
        boton: { texto: 'Ver postulantes', href: `${base}/empleador/vacantes` },
      };
    } else if (evento === 'local_aprobado') {
      mail = {
        asunto: `${d.local} ya está habilitado en Voral`,
        titulo: 'Tu local fue aprobado',
        parrafos: [
          `Verificamos los datos de <strong>${local}</strong>. Tus vacantes ya se muestran a los candidatos de Posadas.`,
        ],
        boton: { texto: 'Ir a mis vacantes', href: `${base}/empleador/vacantes` },
      };
    } else {
      mail = {
        asunto: `Sobre el alta de ${d.local} en Voral`,
        titulo: 'No pudimos aprobar tu local',
        parrafos: [
          `No pudimos verificar los datos de <strong>${local}</strong>, así que por ahora no está habilitado para publicar.`,
          'Si creés que es un error, escribinos a hola@somosvoral.com.ar y lo revisamos.',
        ],
      };
    }

    const html = plantilla({ titulo: mail.titulo, parrafos: mail.parrafos, boton: mail.boton });
    const texto = mail.parrafos.map((p) => p.replace(/<[^>]+>/g, '')).join('\n\n');
    const resultado = await enviarMail({ para: d.email, asunto: mail.asunto, html, texto });
    return Response.json(resultado);
  } catch {
    return Response.json({ enviado: false, error: 'Error interno.' }, { status: 500 });
  }
}
