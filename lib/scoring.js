// Calcula la compatibilidad entre un CV y una vacante.
//
// Criterio de diseño: los datos que cuestan poco declarar pesan poco.
// Tildar "me interesa este puesto" es un click; tener experiencia cargada
// en ese puesto, con empresa y fechas, es mucho más costoso de inventar
// de forma coherente y además queda verificable contra las referencias.

const PESOS = {
  experiencia_en_puesto: 30, // experiencia real cargada en ese puesto
  experiencia_total: 20,     // años totales contra el mínimo pedido
  interes_en_puesto: 10,     // lo tiene entre los puestos que le interesan
  disponibilidad: 15,
  movilidad: 5,              // pesa poco: no debería ser un filtro fuerte
  certificado: 10,
  herramientas: 10,
};

function mesesEntre(desde, hasta, actual) {
  if (!desde) return 0;
  const d = new Date(desde);
  const h = actual || !hasta ? new Date() : new Date(hasta);
  const m = (h.getFullYear() - d.getFullYear()) * 12 + (h.getMonth() - d.getMonth());
  return m > 0 ? m : 0;
}

// Años de experiencia cargados específicamente en el puesto que pide la vacante
export function aniosEnPuesto(experiencia, puesto) {
  if (!puesto) return 0;
  const objetivo = puesto.toLowerCase().trim();
  let meses = 0;
  for (const exp of experiencia || []) {
    if ((exp.puesto || '').toLowerCase().trim() === objetivo) {
      meses += mesesEntre(exp.desde, exp.hasta, exp.actual);
    }
  }
  return Math.round((meses / 12) * 10) / 10;
}

export function calcularPuntaje(vacante, cv) {
  let puntaje = 0;
  const razonesPositivas = [];
  const razonesNegativas = [];

  const minima = Number(vacante.experiencia_minima_anios) || 0;
  const aniosPuesto = aniosEnPuesto(cv.experiencia, vacante.puesto);
  const aniosTotal = Number(cv.anios_experiencia) || 0;

  // 1. Experiencia real en el puesto pedido
  if (aniosPuesto >= Math.max(minima, 1)) {
    puntaje += PESOS.experiencia_en_puesto;
    razonesPositivas.push(`tiene ${aniosPuesto} años de experiencia cargada como ${vacante.puesto}`);
  } else if (aniosPuesto > 0) {
    puntaje += PESOS.experiencia_en_puesto * 0.6;
    razonesPositivas.push(`tiene algo de experiencia como ${vacante.puesto} (${aniosPuesto} años)`);
  } else if (aniosTotal > 0) {
    puntaje += PESOS.experiencia_en_puesto * 0.25;
    razonesNegativas.push(`no tiene experiencia cargada como ${vacante.puesto}, sí en otros puestos`);
  } else {
    razonesNegativas.push('no tiene experiencia laboral cargada');
  }

  // 2. Experiencia total contra el mínimo pedido
  if (minima === 0) {
    puntaje += PESOS.experiencia_total;
  } else if (aniosTotal >= minima) {
    puntaje += PESOS.experiencia_total;
    razonesPositivas.push(`cumple la experiencia mínima pedida (${aniosTotal} años en total)`);
  } else if (aniosTotal >= minima * 0.6) {
    puntaje += PESOS.experiencia_total * 0.5;
    razonesNegativas.push(`le falta experiencia (tiene ${aniosTotal}, se piden ${minima})`);
  } else {
    razonesNegativas.push(`no llega a la experiencia mínima pedida (${minima} años)`);
  }

  // 3. Interés declarado en el puesto
  const puestos = (cv.puestos || []).map((p) => p.toLowerCase());
  if (puestos.includes((vacante.puesto || '').toLowerCase())) {
    puntaje += PESOS.interes_en_puesto;
  } else {
    razonesNegativas.push('no tiene ese puesto entre los que busca');
  }

  // 4. Disponibilidad y turno
  const turnoOk =
    !vacante.turno ||
    cv.turno === vacante.turno ||
    cv.disponibilidad_horaria === 'flexible' ||
    cv.disponibilidad_horaria === 'tiempo_completo';
  if (turnoOk) {
    puntaje += PESOS.disponibilidad;
    razonesPositivas.push('su disponibilidad calza con el turno pedido');
  } else {
    razonesNegativas.push('su disponibilidad no coincide con el turno pedido');
  }

  // 5. Movilidad
  if (!vacante.movilidad_requerida) {
    puntaje += PESOS.movilidad;
  } else if (cv.movilidad_propia) {
    puntaje += PESOS.movilidad;
    razonesPositivas.push('tiene movilidad propia');
  } else {
    razonesNegativas.push('no tiene movilidad propia y el puesto la requiere');
  }

  // 6. Certificado: declarado suma la mitad, con el archivo cargado suma todo
  if (!vacante.certificado_requerido) {
    puntaje += PESOS.certificado;
  } else if (cv.certificado_url) {
    puntaje += PESOS.certificado;
    razonesPositivas.push('subió el certificado de manipulación de alimentos');
  } else if (cv.certificado_manipulacion) {
    puntaje += PESOS.certificado * 0.5;
    razonesNegativas.push('declara tener el certificado pero no lo subió');
  } else {
    razonesNegativas.push('no tiene el certificado de manipulación de alimentos');
  }

  // 7. Herramientas
  const buscadas = (vacante.herramientas_buscadas || []).map((h) => h.toLowerCase());
  const tiene = [...(cv.herramientas || []), ...(cv.habilidades || [])].map((h) => h.toLowerCase());
  if (buscadas.length === 0) {
    puntaje += PESOS.herramientas;
  } else {
    const coincidencias = buscadas.filter((b) => tiene.includes(b));
    puntaje += PESOS.herramientas * (coincidencias.length / buscadas.length);
    if (coincidencias.length > 0) razonesPositivas.push(`maneja ${coincidencias.join(', ')}`);
  }

  return {
    puntaje: Math.round(puntaje),
    razonesPositivas,
    razonesNegativas,
  };
}

// Qué le falta al candidato para mejorar su compatibilidad con esta vacante.
// Hoy no se muestra en ninguna pantalla. Queda disponible por si más adelante
// se decide usarla en otro lugar, por ejemplo en el panel del candidato.
export function comoMejorar(vacante, cv) {
  const sugerencias = [];
  const aniosPuesto = aniosEnPuesto(cv.experiencia, vacante.puesto);

  if (aniosPuesto === 0) {
    sugerencias.push(`Si trabajaste alguna vez como ${vacante.puesto}, cargá esa experiencia con empresa y fechas.`);
  }
  if (!(cv.puestos || []).map((p) => p.toLowerCase()).includes((vacante.puesto || '').toLowerCase())) {
    sugerencias.push(`Sumá ${vacante.puesto} a los puestos que te interesan, si realmente podés cubrirlo.`);
  }
  if (vacante.certificado_requerido && !cv.certificado_url) {
    sugerencias.push('Subí tu certificado de manipulación de alimentos: declararlo sin el archivo suma la mitad.');
  }
  if (vacante.movilidad_requerida && !cv.movilidad_propia) {
    sugerencias.push('Este puesto pide movilidad propia.');
  }
  if (!cv.disponibilidad_horaria) {
    sugerencias.push('Completá tu disponibilidad horaria.');
  }
  return sugerencias;
}
