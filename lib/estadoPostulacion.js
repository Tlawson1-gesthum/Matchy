// Traduce el estado de una postulación a lo que ve el candidato.
// `tono` es la clase de .pildora: el mismo sistema de color de estados que el resto de la app.
//
// El "No me interesa" del local no se le muestra al candidato mientras la vacante
// sigue abierta: el local puede cambiar de idea, y el candidato se entera recién
// cuando la búsqueda se cierra.
export function estadoPostulacion(postulacion, vacante, entrevista) {
  if (vacante?.estado === 'suspendida') {
    return {
      tono: 'neutro',
      titulo: 'Aviso dado de baja',
      texto: 'Dimos de baja este aviso mientras lo revisamos. No tenés que hacer nada. Si alguien te contacta por este puesto, no pagues ni des datos bancarios.',
    };
  }
  if (vacante?.estado === 'cubierta') {
    if (postulacion.estado === 'descartado') {
      return {
        tono: 'neutro',
        titulo: 'No quedaste esta vez',
        texto: 'El local cubrió el puesto con otra persona. No habla de lo que valés: seguí postulándote.',
      };
    }
    return {
      tono: 'neutro',
      titulo: 'Búsqueda cerrada',
      texto: 'El local cerró esta búsqueda. Si te eligieron, se van a comunicar con vos.',
    };
  }
  if (entrevista?.estado === 'confirmada') {
    return { tono: 'aprobado', titulo: 'Entrevista confirmada', texto: 'Tenés los detalles en Entrevistas.', accion: true };
  }
  if (entrevista?.estado === 'pendiente') {
    return { tono: 'pendiente', titulo: 'Te proponen una entrevista', texto: 'Respondé en Entrevistas.', accion: true };
  }
  if (entrevista?.estado === 'reagendar_propuesto') {
    return { tono: 'pendiente', titulo: 'Coordinando horario', texto: 'Hay un cambio de horario en curso.', accion: true };
  }
  if (postulacion.estado === 'preseleccionado') {
    return { tono: 'aprobado', titulo: 'Pasaste a la preselección', texto: 'Al local le interesó tu perfil. Puede que te proponga una entrevista.' };
  }
  return { tono: 'neutro', titulo: 'Enviada', texto: 'Tu postulación está en manos del local.' };
}
