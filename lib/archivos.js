// Utilidades para archivos subidos.

export const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];
export const TIPOS_CERTIFICADO = [...TIPOS_IMAGEN, 'application/pdf'];

// Revisa tipo y tamaño antes de subir. Devuelve un mensaje de error o null si está bien.
// La base aplica los mismos límites: esto es solo para avisar antes y ahorrar la subida.
export function validarArchivo(archivo, { tipos, maxMB }) {
  if (!archivo) return 'No se eligió ningún archivo.';
  if (!tipos.includes(archivo.type)) {
    const legibles = tipos.map((t) => t.split('/')[1].toUpperCase().replace('JPEG', 'JPG')).join(', ');
    return `Ese tipo de archivo no se acepta. Usá ${legibles}.`;
  }
  if (archivo.size > maxMB * 1024 * 1024) {
    return `El archivo pesa ${(archivo.size / 1024 / 1024).toFixed(1)} MB. El máximo es ${maxMB} MB.`;
  }
  return null;
}

// El certificado se guarda como ruta privada ("id/certificado.pdf").
// Los CVs viejos pueden tener la dirección pública completa: la convertimos a ruta.
export function rutaCertificado(valor) {
  if (!valor) return null;
  const texto = String(valor);
  if (!texto.startsWith('http')) return texto;
  const marca = '/certificados/';
  const i = texto.indexOf(marca);
  if (i === -1) return null;
  return texto.slice(i + marca.length).split('?')[0];
}

export function extension(archivo) {
  const porTipo = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };
  return porTipo[archivo.type] || 'bin';
}
