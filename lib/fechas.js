// Manejo de horarios de entrevista.
//
// El selector datetime-local devuelve la hora sin zona ("2026-09-22T14:20").
// Si se guarda así, la base la interpreta como hora de Greenwich y al mostrarla
// en Argentina aparece corrida tres horas. Por eso siempre convertimos antes
// de guardar y siempre mostramos con la zona de Argentina explícita.

const ZONA = 'America/Argentina/Buenos_Aires';

// Del valor del selector a un instante exacto con zona, listo para guardar.
export function horarioParaGuardar(valorSelector) {
  if (!valorSelector) return null;
  const fecha = new Date(valorSelector); // el navegador lo interpreta como hora local
  if (Number.isNaN(fecha.getTime())) return null;
  return fecha.toISOString();
}

// "22/9/2026 a las 14:20 hs"
export function formatearHorario(valor) {
  if (!valor) return '';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '';
  const dia = new Intl.DateTimeFormat('es-AR', {
    timeZone: ZONA, day: 'numeric', month: 'numeric', year: 'numeric',
  }).format(fecha);
  const hora = new Intl.DateTimeFormat('es-AR', {
    timeZone: ZONA, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(fecha);
  return `${dia} a las ${hora} hs`;
}

// Valor mínimo para el selector: ahora mismo, así no se pueden proponer horarios pasados.
export function minimoSelector() {
  const ahora = new Date();
  ahora.setSeconds(0, 0);
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
