// Calcula un puntaje de 0 a 100 de qué tan bien un CV matchea una vacante,
// y junta las razones en frases cortas para mostrarle al empleador.
// Los pesos suman 100 y están pensados para poder ajustarse fácil más adelante.

const PESOS = {
  puesto: 30,
  experiencia: 25,
  disponibilidad: 15,
  movilidad: 10,
  certificado: 10,
  herramientas: 10,
};

export function calcularPuntaje(vacante, cv) {
  let puntaje = 0;
  const razonesPositivas = [];
  const razonesNegativas = [];

  // Puesto
  const puestos = (cv.puestos || []).map((p) => p.toLowerCase());
  if (puestos.includes((vacante.puesto || '').toLowerCase())) {
    puntaje += PESOS.puesto;
    razonesPositivas.push(`se postula al puesto de ${vacante.puesto}`);
  } else {
    razonesNegativas.push('no tiene ese puesto entre los que busca');
  }

  // Experiencia
  const minima = Number(vacante.experiencia_minima_anios) || 0;
  const anios = Number(cv.anios_experiencia) || 0;
  if (minima === 0) {
    puntaje += PESOS.experiencia;
  } else if (anios >= minima) {
    puntaje += PESOS.experiencia;
    razonesPositivas.push(`cumple la experiencia mínima pedida (${anios} años)`);
  } else if (anios >= minima * 0.6) {
    puntaje += PESOS.experiencia * 0.5;
    razonesNegativas.push(`le falta algo de experiencia (tiene ${anios}, se piden ${minima})`);
  } else {
    razonesNegativas.push(`no llega a la experiencia mínima pedida (${minima} años)`);
  }

  // Disponibilidad / turno
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

  // Movilidad
  if (!vacante.movilidad_requerida) {
    puntaje += PESOS.movilidad;
  } else if (cv.movilidad_propia) {
    puntaje += PESOS.movilidad;
    razonesPositivas.push('tiene movilidad propia');
  } else {
    razonesNegativas.push('no tiene movilidad propia y el puesto la requiere');
  }

  // Certificado de manipulación de alimentos
  if (!vacante.certificado_requerido) {
    puntaje += PESOS.certificado;
  } else if (cv.certificado_manipulacion) {
    puntaje += PESOS.certificado;
    razonesPositivas.push('tiene el certificado de manipulación de alimentos vigente');
  } else {
    razonesNegativas.push('no tiene el certificado de manipulación de alimentos');
  }

  // Herramientas / habilidades buscadas
  const buscadas = (vacante.herramientas_buscadas || []).map((h) => h.toLowerCase());
  const tiene = [...(cv.herramientas || []), ...(cv.habilidades || [])].map((h) =>
    h.toLowerCase()
  );
  if (buscadas.length === 0) {
    puntaje += PESOS.herramientas;
  } else {
    const coincidencias = buscadas.filter((b) => tiene.includes(b));
    const proporcion = coincidencias.length / buscadas.length;
    puntaje += PESOS.herramientas * proporcion;
    if (coincidencias.length > 0) {
      razonesPositivas.push(`maneja ${coincidencias.join(', ')}`);
    }
  }

  return {
    puntaje: Math.round(puntaje),
    razonesPositivas,
    razonesNegativas,
  };
}
