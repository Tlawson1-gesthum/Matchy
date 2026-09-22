// Envío de mails automáticos a través de Resend (resend.com).
// Solo se usa desde el servidor. Si faltan las variables de entorno, no envía
// nada y devuelve { enviado: false }: la web sigue funcionando igual.
//
// Variables a cargar en Vercel cuando se active:
//   RESEND_API_KEY   la clave que da Resend
//   MAIL_REMITENTE   por ejemplo: Matchy <avisos@matchy.com.ar>

export function mailConfigurado() {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_REMITENTE);
}

// Escapa texto cargado por usuarios antes de meterlo en un mail HTML
export function escapar(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function plantilla({ titulo, parrafos, boton }) {
  const cuerpo = parrafos.map((p) => `<p style="margin:0 0 14px;line-height:1.55">${p}</p>`).join('');
  const cta = boton
    ? `<p style="margin:22px 0"><a href="${boton.href}" style="background:#3A5A40;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;display:inline-block">${escapar(boton.texto)}</a></p>`
    : '';
  return `<!doctype html><html lang="es"><body style="margin:0;background:#F2F0E6;font-family:Arial,Helvetica,sans-serif;color:#43443C">
<div style="max-width:520px;margin:0 auto;padding:28px 20px">
  <p style="font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#26402C;margin:0 0 18px">Matchy</p>
  <div style="background:#ffffff;border:1px solid #D3D2BF;border-radius:14px;padding:24px">
    <h1 style="font-family:Georgia,serif;font-size:20px;color:#26402C;margin:0 0 14px">${escapar(titulo)}</h1>
    ${cuerpo}${cta}
  </div>
  <p style="font-size:12px;color:#6E6F63;line-height:1.5;margin:18px 4px 0">
    Recibís este mail porque tenés una cuenta en Matchy. Matchy conecta a quienes buscan trabajo con locales
    gastronómicos de Posadas y alrededores, y no participa de la relación laboral entre las partes.
  </p>
</div></body></html>`;
}

export async function enviarMail({ para, asunto, html, texto }) {
  if (!mailConfigurado()) return { enviado: false, motivo: 'Mails todavía no configurados.' };
  if (!para) return { enviado: false, motivo: 'Sin destinatario.' };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.MAIL_REMITENTE,
      to: [para],
      subject: asunto,
      html,
      text: texto,
    }),
  });

  if (!res.ok) return { enviado: false, motivo: `Resend respondió ${res.status}` };
  return { enviado: true };
}
