export default function CvVista({ cv }) {
  return (
    <div className="container" style={{ maxWidth: 700 }}>
      <div className="card">
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          {cv.foto_url && (
            <img
              src={cv.foto_url}
              alt={cv.nombre}
              style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover' }}
            />
          )}
          <div>
            <h1 style={{ marginBottom: 4 }}>{cv.nombre}</h1>
            <p className="mono" style={{ margin: 0 }}>
              {cv.ciudad} · {cv.anios_experiencia || 0} años de experiencia
            </p>
            <p className="mono" style={{ margin: 0 }}>{cv.contacto}</p>
          </div>
        </div>

        {cv.puestos?.length > 0 && (
          <p style={{ marginTop: 16 }}>
            <strong>Se postula a:</strong> {cv.puestos.join(', ')}
          </p>
        )}

        {cv.presentacion && (
          <div style={{ marginTop: 16 }}>
            <h3>Presentación</h3>
            <p>{cv.presentacion}</p>
          </div>
        )}

        {cv.experiencia?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h3>Experiencia</h3>
            {cv.experiencia.map((exp, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <strong>{exp.puesto}</strong> — {exp.empresa}
                <div className="mono" style={{ fontSize: '0.8rem' }}>
                  {exp.desde} a {exp.actual ? 'actualidad' : exp.hasta}
                </div>
                <p style={{ margin: '4px 0' }}>{exp.descripcion}</p>
              </div>
            ))}
          </div>
        )}

        {cv.formacion?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h3>Formación</h3>
            {cv.formacion.map((f, i) => (
              <div key={i}>
                {f.titulo} — {f.institucion} ({f.estado === 'completo' ? 'completo' : 'en curso'}, {f.anio})
              </div>
            ))}
          </div>
        )}

        {(cv.habilidades?.length > 0 || cv.herramientas?.length > 0 || cv.idiomas?.length > 0) && (
          <div style={{ marginTop: 16 }}>
            <h3>Habilidades y herramientas</h3>
            {cv.habilidades?.length > 0 && <p><strong>Habilidades:</strong> {cv.habilidades.join(', ')}</p>}
            {cv.herramientas?.length > 0 && <p><strong>Herramientas:</strong> {cv.herramientas.join(', ')}</p>}
            {cv.idiomas?.length > 0 && <p><strong>Idiomas:</strong> {cv.idiomas.join(', ')}</p>}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <h3>Disponibilidad</h3>
          <p>
            {cv.disponibilidad_horaria} · Turno: {cv.turno || 'sin preferencia'} · Disponible desde: {cv.disponible_desde}
            <br />
            Movilidad propia: {cv.movilidad_propia ? 'sí' : 'no'} · Certificado de manipulación: {cv.certificado_manipulacion ? 'sí' : 'no'}
            {cv.pretension_salarial && <> · Pretensión salarial: {cv.pretension_salarial}</>}
          </p>
        </div>
      </div>
    </div>
  );
}
