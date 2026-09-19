'use client';

// Barra de actividad real de la plataforma. Todos los números salen de
// consultas a la base: si no hay actividad que mostrar, no se muestra nada.
export default function TickerActividad({ datos }) {
  if (!datos) return null;

  const frases = [];

  if (datos.postulaciones_ultima_hora > 0) {
    frases.push(
      `${datos.postulaciones_ultima_hora} ${datos.postulaciones_ultima_hora === 1 ? 'persona se postuló' : 'personas se postularon'} en la última hora`
    );
  } else if (datos.postulaciones_hoy > 0) {
    frases.push(
      `${datos.postulaciones_hoy} ${datos.postulaciones_hoy === 1 ? 'postulación' : 'postulaciones'} en lo que va del día`
    );
  } else if (datos.postulaciones_semana > 0) {
    frases.push(
      `${datos.postulaciones_semana} ${datos.postulaciones_semana === 1 ? 'postulación' : 'postulaciones'} esta semana`
    );
  }

  if (datos.vacantes_cierran_pronto > 0) {
    frases.push(
      `${datos.vacantes_cierran_pronto} ${datos.vacantes_cierran_pronto === 1 ? 'vacante cierra' : 'vacantes cierran'} en las próximas 48 horas`
    );
  }

  if (datos.entrevistas_confirmadas_semana > 0) {
    frases.push(
      `${datos.entrevistas_confirmadas_semana} ${datos.entrevistas_confirmadas_semana === 1 ? 'entrevista confirmada' : 'entrevistas confirmadas'} esta semana`
    );
  }

  if (datos.vacantes_nuevas_semana > 0) {
    frases.push(
      `${datos.vacantes_nuevas_semana} ${datos.vacantes_nuevas_semana === 1 ? 'vacante nueva' : 'vacantes nuevas'} en los últimos 7 días`
    );
  }

  if (frases.length === 0) return null;

  return (
    <div className="ticker" role="status">
      <span className="ticker-icono" aria-hidden="true">⚡</span>
      <span className="ticker-texto">{frases.join('  ·  ')}</span>
    </div>
  );
}
