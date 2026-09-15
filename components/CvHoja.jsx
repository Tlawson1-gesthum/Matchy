import { NIVELES_HERRAMIENTA, NIVELES_IDIOMA, etiqueta, DISPONIBILIDAD, DISPONIBLE_DESDE, TURNOS } from '../lib/opciones';

// CV de una sola página, pensado para imprimir en A4.
// Orden: NOMBRE grande → contacto chico → línea → presentación →
// competencias/habilidades/herramientas → experiencia → formación.
export default function CvHoja({ cv }) {
  const herramientas = cv.herramientas_nivel?.length
    ? cv.herramientas_nivel
    : (cv.herramientas || []).map((h) => ({ nombre: h, nivel: null }));
  const idiomas = cv.idiomas_nivel?.length
    ? cv.idiomas_nivel
    : (cv.idiomas || []).map((i) => ({ nombre: i, nivel: null }));

  return (
    <div className="hoja-cv">
      <header style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h1 className="cv-nombre">{cv.nombre || 'NOMBRE APELLIDO'}</h1>
          <p className="cv-contacto">
            {[cv.contacto, cv.ciudad, cv.edad ? `${cv.edad} años` : null]
              .filter(Boolean)
              .join('  ·  ')}
          </p>
          {cv.puestos?.length > 0 && (
            <p className="cv-puestos">{cv.puestos.join('  ·  ')}</p>
          )}
        </div>
        {cv.foto_url && <img className="cv-foto" src={cv.foto_url} alt="" />}
      </header>

      <hr className="cv-linea" />

      {cv.presentacion && <p className="cv-presentacion">{cv.presentacion}</p>}

      {(cv.habilidades?.length > 0 || herramientas.length > 0 || idiomas.length > 0) && (
        <section>
          <h2 className="cv-seccion">Competencias y herramientas</h2>
          {cv.habilidades?.length > 0 && (
            <p className="cv-linea-dato"><strong>Habilidades:</strong> {cv.habilidades.join(' · ')}</p>
          )}
          {herramientas.length > 0 && (
            <p className="cv-linea-dato">
              <strong>Herramientas:</strong>{' '}
              {herramientas
                .map((h) => (h.nivel ? `${h.nombre} (${etiqueta(NIVELES_HERRAMIENTA, h.nivel)})` : h.nombre))
                .join(' · ')}
            </p>
          )}
          {idiomas.length > 0 && (
            <p className="cv-linea-dato">
              <strong>Idiomas:</strong>{' '}
              {idiomas
                .map((i) => (i.nivel ? `${i.nombre} (${etiqueta(NIVELES_IDIOMA, i.nivel)})` : i.nombre))
                .join(' · ')}
            </p>
          )}
        </section>
      )}

      {cv.experiencia?.length > 0 && (
        <section>
          <h2 className="cv-seccion">Experiencia</h2>
          {cv.experiencia.map((exp, i) => (
            <div key={i} className="cv-item">
              <div className="cv-item-titulo">
                <strong>{exp.puesto}</strong>
                {exp.empresa ? ` — ${exp.empresa}` : ''}
                <span className="cv-fechas">
                  {exp.desde} {exp.desde && (exp.actual || exp.hasta) ? 'a' : ''}{' '}
                  {exp.actual ? 'actualidad' : exp.hasta}
                </span>
              </div>
              {exp.descripcion && <p className="cv-item-texto">{exp.descripcion}</p>}
            </div>
          ))}
        </section>
      )}

      {cv.formacion?.length > 0 && (
        <section>
          <h2 className="cv-seccion">Formación</h2>
          {cv.formacion.map((f, i) => {
            const detalle = [f.anio, f.estado === 'en_curso' ? 'en curso' : null]
              .filter(Boolean)
              .join(', ');
            return (
              <p key={i} className="cv-linea-dato">
                {f.titulo}
                {f.institucion ? ` — ${f.institucion}` : ''}
                {detalle ? ` (${detalle})` : ''}
              </p>
            );
          })}
        </section>
      )}

      <section>
        <h2 className="cv-seccion">Disponibilidad</h2>
        <p className="cv-linea-dato">
          {[
            etiqueta(DISPONIBILIDAD, cv.disponibilidad_horaria),
            cv.turno ? `turno ${etiqueta(TURNOS, cv.turno).toLowerCase()}` : null,
            cv.disponible_desde ? `disponible ${etiqueta(DISPONIBLE_DESDE, cv.disponible_desde).toLowerCase()}` : null,
            cv.movilidad_propia ? 'movilidad propia' : null,
            cv.certificado_manipulacion ? 'certificado de manipulación de alimentos vigente' : null,
          ]
            .filter(Boolean)
            .join('  ·  ')}
        </p>
      </section>

      <footer className="cv-pie">Hecho con Matchy · matchy.com.ar</footer>
    </div>
  );
}
