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

export const TIPOS_FORMACION = [
  { value: 'curso', label: 'Curso o capacitación' },
  { value: 'secundario', label: 'Secundario' },
  { value: 'terciario', label: 'Terciario' },
  { value: 'universitario', label: 'Universitario' },
  { value: 'posgrado', label: 'Posgrado' },
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

export const LOCALIDADES = ['Posadas', 'Garupá'];

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

// Prefijos válidos de CUIT/CUIL en Argentina.
// 20, 23, 24, 27: personas físicas. 30, 33, 34: personas jurídicas.
const PREFIJOS_VALIDOS = ['20', '23', '24', '27', '30', '33', '34'];

// Revisa un CUIT y devuelve qué está mal, para poder decírselo a la persona.
// No prueba que la empresa exista: eso se verifica a mano contra el padrón de AFIP.
export function revisarCuit(cuit) {
  const limpio = (cuit || '').replace(/[^0-9]/g, '');

  if (limpio.length === 0) return { valido: false, mensaje: '' };
  if (limpio.length < 11) {
    return { valido: false, mensaje: `Faltan ${11 - limpio.length} dígitos. Un CUIT tiene 11 en total.` };
  }
  if (limpio.length > 11) {
    return { valido: false, mensaje: `Sobran ${limpio.length - 11} dígitos. Un CUIT tiene 11 en total.` };
  }
  if (!PREFIJOS_VALIDOS.includes(limpio.slice(0, 2))) {
    return {
      valido: false,
      mensaje: `Un CUIT no empieza con ${limpio.slice(0, 2)}. Empiezan con 20, 23, 24 o 27 si es una persona, y con 30, 33 o 34 si es una empresa.`,
    };
  }

  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let suma = 0;
  for (let i = 0; i < 10; i++) suma += Number(limpio[i]) * pesos[i];
  const resto = suma % 11;
  let verificador = 11 - resto;
  if (verificador === 11) verificador = 0;
  if (verificador === 10) verificador = 9;

  if (verificador !== Number(limpio[10])) {
    return {
      valido: false,
      mensaje: 'El último dígito no corresponde. Revisá que lo hayas copiado bien del CUIT completo.',
    };
  }

  const esEmpresa = ['30', '33', '34'].includes(limpio.slice(0, 2));
  return {
    valido: true,
    mensaje: esEmpresa ? 'CUIT de empresa, correcto.' : 'CUIL de persona física, correcto.',
    formateado: `${limpio.slice(0, 2)}-${limpio.slice(2, 10)}-${limpio.slice(10)}`,
    esEmpresa,
  };
}

export function cuitValido(cuit) {
  return revisarCuit(cuit).valido;
}

// Reconoce la red social a partir de la URL y verifica que sea una dirección real.
const REDES = [
  { dominio: 'instagram.com', nombre: 'Instagram' },
  { dominio: 'facebook.com', nombre: 'Facebook' },
  { dominio: 'fb.com', nombre: 'Facebook' },
  { dominio: 'tiktok.com', nombre: 'TikTok' },
  { dominio: 'maps.google.com', nombre: 'Google Maps' },
  { dominio: 'goo.gl', nombre: 'Google Maps' },
  { dominio: 'maps.app.goo.gl', nombre: 'Google Maps' },
  { dominio: 'x.com', nombre: 'X' },
  { dominio: 'twitter.com', nombre: 'X' },
  { dominio: 'linkedin.com', nombre: 'LinkedIn' },
  { dominio: 'wa.me', nombre: 'WhatsApp' },
];

export function revisarRedSocial(valor) {
  const texto = (valor || '').trim();
  if (!texto) return { valido: false, mensaje: '' };

  if (texto.startsWith('@') || !texto.includes('.')) {
    return {
      valido: false,
      mensaje: 'Pegá la dirección completa, no el usuario. Por ejemplo: https://instagram.com/tulocal',
    };
  }

  let url;
  try {
    url = new URL(texto.startsWith('http') ? texto : `https://${texto}`);
  } catch {
    return { valido: false, mensaje: 'Esa dirección no parece válida. Copiala desde la barra del navegador.' };
  }

  const host = url.hostname.replace(/^www\./, '');
  if (!host.includes('.')) {
    return { valido: false, mensaje: 'Falta el dominio. Por ejemplo: instagram.com/tulocal' };
  }

  const red = REDES.find((r) => host === r.dominio || host.endsWith('.' + r.dominio));
  const soloDominio = url.pathname === '/' || url.pathname === '';

  if (red && soloDominio) {
    return {
      valido: false,
      mensaje: `Esa es la página principal de ${red.nombre}, no la de tu local. Necesitamos el enlace a tu perfil.`,
    };
  }

  return {
    valido: true,
    mensaje: red ? `${red.nombre} detectado.` : 'Sitio web detectado.',
    normalizada: url.href,
    red: red?.nombre || 'Sitio web',
  };
}
