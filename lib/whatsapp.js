// Arma un link de WhatsApp a partir de un contacto escrito a mano.
// Si el contacto no parece un teléfono (por ejemplo, es un email), devuelve null.
export function linkWhatsApp(contacto, mensaje) {
  const digitos = (contacto || '').replace(/[^0-9]/g, '');
  if (digitos.length < 8) return null;

  let numero = digitos;
  // Números argentinos escritos como 376xxxxxxx, 3764xxxxxx, 0376..., +54 9 376...
  if (!numero.startsWith('54')) {
    numero = numero.replace(/^0/, '');
    numero = '549' + numero.replace(/^15/, '');
  }
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje || '')}`;
}
