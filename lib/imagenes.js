// Comprime una imagen en el navegador antes de subirla.
// Una foto de celular de 4 MB queda en unos 150 KB, sin pérdida visible para un CV.

export async function comprimirImagen(archivo, { maxLado = 800, calidad = 0.82 } = {}) {
  // Los PDF y lo que no sea imagen se suben tal cual
  if (!archivo || !archivo.type.startsWith('image/')) return archivo;

  try {
    const bitmap = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
    const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
    const ancho = Math.round(bitmap.width * escala);
    const alto = Math.round(bitmap.height * escala);

    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext('2d');

    // Los PNG pueden tener transparencia (logos): se mantienen como PNG.
    // El resto pasa a JPG, que es el formato que mejor comprime fotos.
    const esPng = archivo.type === 'image/png';
    if (!esPng) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, ancho, alto);
    }
    ctx.drawImage(bitmap, 0, 0, ancho, alto);
    bitmap.close?.();

    const tipo = esPng ? 'image/png' : 'image/jpeg';
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, tipo, calidad));
    if (!blob || blob.size >= archivo.size) return archivo; // si no ganamos nada, va el original

    const nombre = archivo.name.replace(/\.[^.]+$/, '') + (esPng ? '.png' : '.jpg');
    return new File([blob], nombre, { type: tipo });
  } catch {
    // Si el navegador no puede procesarla, se sube el original y la validación decide
    return archivo;
  }
}
