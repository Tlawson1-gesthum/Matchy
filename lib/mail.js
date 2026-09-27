// Envío de mails automáticos a través de Resend (resend.com).
// Solo se usa desde el servidor. Si faltan las variables de entorno, no envía
// nada y devuelve { enviado: false }: la web sigue funcionando igual.
//
// Variables a cargar en Vercel cuando se active:
//   RESEND_API_KEY   la clave que da Resend
//   MAIL_REMITENTE   Voral <avisos@somosvoral.com.ar>

// Logo del encabezado: public/mail/voral-logo-mail.png (exportado a 3x para pantallas nítidas)
const LOGO_MAIL = 'https://somosvoral.com.ar/mail/voral-logo-mail.png';

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
  return `<!doctype html><html lang="es"><body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#43443C">
<div style="max-width:520px;margin:0 auto;padding:28px 20px">
  <a href="https://somosvoral.com.ar" style="text-decoration:none"><img src="${LOGO_MAIL}" alt="Voral" width="150" height="33" style="display:block;border:0;width:150px;height:33px;margin:0 0 20px"></a>
  <div style="background:#ffffff;border:1px solid #E6E3DA;border-radius:18px;padding:26px 24px">
    <h1 style="font-family:Georgia,serif;font-size:21px;color:#26402C;margin:0 0 14px">${escapar(titulo)}</h1>
    ${cuerpo}${cta}
  </div>
  <div style="width:44px;height:3px;background:#C9A33F;margin:22px 4px 12px;font-size:0;line-height:0">&nbsp;</div>
  <p style="font-size:12px;color:#55564B;line-height:1.5;margin:0 4px 8px">
    <a href="https://somosvoral.com.ar" style="color:#A6461F;text-decoration:none;font-weight:bold">somosvoral.com.ar</a>
    &nbsp;·&nbsp;
    <a href="mailto:hola@somosvoral.com.ar" style="color:#55564B;text-decoration:none">hola@somosvoral.com.ar</a>
  </p>
  <p style="font-size:11px;color:#8E8C80;line-height:1.5;margin:0 4px">
    Recibís este mail porque tenés una cuenta en Voral. Voral conecta a quienes buscan trabajo con locales
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
