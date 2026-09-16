// Listas compartidas. Al estar en un solo lugar, el CV y las vacantes
// siempre usan exactamente las mismas opciones, que es lo que permite
// que el match funcione bien.

export const PUESTOS = [
  'Mozo/a',
  'Cocinero/a',
  'Ayudante de cocina',
  'Bachero/a',
  'Bartender',
  'Barista',
  'Pizzero/a',
  'Parrillero/a',
  'Pastelero/a',
  'Cadete/delivery',
  'Encargado/a',
  'Cajero/a',
  'Recepcionista',
  'Limpieza',
  'Otro',
];

export const NIVELES_HERRAMIENTA = [
  { value: 'principiante', label: 'Principiante' },
  { value: 'medio', label: 'Medio' },
  { value: 'medio_avanzado', label: 'Medio avanzado' },
  { value: 'avanzado', label: 'Avanzado' },
  { value: 'experto', label: 'Experto' },
];

export const NIVELES_IDIOMA = [
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
];

export const TURNOS = [
  { value: '', label: 'Sin preferencia' },
  { value: 'manana', label: 'Mañana' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noche', label: 'Noche' },
  { value: 'rotativo', label: 'Rotativo' },
];

export const DIAS_TRABAJO = [
  { value: '', label: 'A definir' },
  { value: 'lunes_viernes', label: 'Lunes a viernes' },
  { value: 'lunes_sabado', label: 'Lunes a sábado' },
  { value: 'martes_domingo', label: 'Martes a domingo' },
  { value: 'miercoles_domingo', label: 'Miércoles a domingo' },
  { value: 'fines_de_semana', label: 'Solo fines de semana' },
  { value: 'rotativo', label: 'Días rotativos' },
];

export const DISPONIBILIDAD = [
  { value: 'tiempo_completo', label: 'Tiempo completo' },
  { value: 'medio_tiempo', label: 'Medio tiempo' },
  { value: 'fines_de_semana', label: 'Fines de semana' },
  { value: 'flexible', label: 'Flexible' },
];

export const DISPONIBLE_DESDE = [
  { value: 'inmediata', label: 'Inmediata' },
  { value: '15_dias', label: 'En 15 días' },
  { value: '30_dias', label: 'En 30 días' },
  { value: 'a_definir', label: 'A definir' },
];

export const URGENCIAS = [
  { value: 'hoy', label: 'Urgente, para esta semana' },
  { value: 'esta_semana', label: 'Esta semana' },
  { value: 'este_mes', label: 'Este mes' },
  { value: 'sin_apuro', label: 'Sin apuro' },
];

export const LOCALIDADES = [
  'Posadas',
  'Garupá',
  'Candelaria',
  'Fachinal',
  'San Ignacio',
  'Santa Ana',
  'Profundidad',
];

export const TIPOS_LOCAL = [
  { value: 'bar', label: 'Bar' },
  { value: 'resto', label: 'Restaurante' },
  { value: 'resto_bar', label: 'Resto-bar' },
  { value: 'cafeteria', label: 'Cafetería' },
  { value: 'cadena', label: 'Cadena' },
  { value: 'catering', label: 'Catering' },
  { value: 'otro', label: 'Otro' },
];

export function etiqueta(lista, value) {
  return lista.find((x) => x.value === value)?.label || value || '';
}

// Valida el dígito verificador de un CUIT/CUIL argentino.
// No prueba que el local exista, pero descarta números inventados.
export function cuitValido(cuit) {
  const limpio = (cuit || '').replace(/[^0-9]/g, '');
  if (limpio.length !== 11) return false;
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let suma = 0;
  for (let i = 0; i < 10; i++) suma += Number(limpio[i]) * pesos[i];
  const resto = suma % 11;
  let verificador = 11 - resto;
  if (verificador === 11) verificador = 0;
  if (verificador === 10) verificador = 9;
  return verificador === Number(limpio[10]);
}
