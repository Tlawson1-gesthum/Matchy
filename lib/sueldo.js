// Muestra el sueldo que cargó el local como monto en pesos.
// "1000000" → "$1.000.000"; "450000 por mes + propinas" → "$450.000 por mes + propinas".
// Si el texto no tiene números ("A convenir"), queda como está.
export function formatearSueldo(texto) {
  const t = String(texto || '').trim();
  if (!t) return '';
  return t.replace(/\$?\s*(\d[\d.]*)(?:,\d+)?/, (_, numero) => {
    const valor = Number(numero.replace(/\./g, ''));
    return Number.isFinite(valor) ? `$${valor.toLocaleString('es-AR')}` : _;
  });
}
