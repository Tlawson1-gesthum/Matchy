'use client';

import Encabezado from '../../components/Encabezado';
import Pie from '../../components/Pie';
import TextoFormateado from '../../components/TextoFormateado';

// Vacante de ejemplo para que el local entienda qué cambia según cómo la complete.
// Los datos son inventados y está aclarado en pantalla.
const BUENA = {
  local: 'Almacén de Barrio',
  tipo: 'RESTO-BAR • POSADAS • JUNÍN 1840',
  puesto: 'Mozo/a',
  etiquetas: ['Turno noche', 'Martes a domingo', 'Tiempo completo', '1 año de experiencia', 'Certificado de manipulación'],
  cierre: 'Cierra en 3 días',
  cupo: 'Solo 1 vacante',
  descripcion:
    'Somos un resto-bar de 14 mesas en el centro, con cocina abierta. El turno noche arranca 19:30 y el equipo es de 6 personas: dos en salón, tres en cocina y el encargado. Jueves, viernes y sábado son los días fuertes, con dos vueltas de mesas.\n\nQué vas a hacer:\n- Tomar pedidos con comandera\n- Armar la mise en place del salón\n- Hacer el cierre de tu sector\n\nQué ofrecemos:\n- Sueldo de convenio en blanco desde el primer día\n- Comida del personal en cada turno\n- Propinas repartidas en partes iguales\n- Francos fijos los lunes y martes\n\nEl encargado actual entró como mozo hace dos años.',
};

const MALA = {
  local: 'Local gastronómico',
  tipo: 'RESTAURANTE • POSADAS',
  puesto: 'Mozo/a',
  etiquetas: ['Turno a definir', 'Días a definir', 'Jornada a definir', 'Sin experiencia previa'],
  descripcion: 'Se busca mozo con experiencia. Enviar CV. Buena presencia.',
};

function Tarjeta({ v, mala }) {
  return (
    <div className="vacante" style={{ marginBottom: 18, opacity: mala ? 0.92 : 1 }}>
      <div className="vacante-cabecera">
        <div className="vacante-identidad">
          <div className="vacante-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-titulos)', color: 'var(--verde)', fontWeight: 700 }}>
            {mala ? '?' : 'A'}
          </div>
          <div style={{ minWidth: 0 }}>
            <span className="vacante-local">{v.local}</span>
            <span className="vacante-tipo">{v.tipo}</span>
          </div>
        </div>
        <div className="etiquetas-vacante">
          {v.cierre && <span className="badge cierra inminente">{v.cierre}</span>}
          {v.cupo && <span className="badge cupo">{v.cupo}</span>}
        </div>
      </div>

      <h3 className="vacante-puesto">{v.puesto}</h3>

      <div className="vacante-datos">
        {v.etiquetas.map((e) => <span key={e}>{e}</span>)}
      </div>

      <TextoFormateado texto={v.descripcion} className="vacante-descripcion" />

      <div className="senales-vacante">
        <span>
          <span className="icono" aria-hidden="true">👁️</span>
          {mala ? '3 personas miraron esta vacante esta semana' : '24 personas miraron esta vacante esta semana'}
        </span>
        <span>
          <span className="icono" aria-hidden="true">🔥</span>
          {mala ? '1 persona ya se postuló' : '11 personas ya se postularon'}
        </span>
      </div>

      <span className="btn" style={{ display: 'block', textAlign: 'center', pointerEvents: 'none' }}>Postularme</span>
    </div>
  );
}

export default function VacanteEjemplo() {
  return (
    <div>
      <Encabezado
        links={[
          { href: '/empleador/vacantes', texto: 'Mis vacantes' },
          { href: '/empleador/vacantes/nueva', texto: 'Publicar vacante' },
        ]}
        campanaHref="/empleador/vacantes"
      />

      <main className="container" style={{ maxWidth: 720 }}>
        <h1>Cómo se ve tu vacante</h1>
        <p>
          Las dos tarjetas de abajo son la misma búsqueda, cargada de dos formas distintas. Los datos son
          inventados. La diferencia no está en el diseño: está en lo que completó cada local.
        </p>

        <h2 style={{ marginTop: 32, fontSize: '1.25rem' }}>Así conviene cargarla</h2>
        <Tarjeta v={BUENA} />

        <div className="aviso-legal">
          <strong>Qué hace que esta funcione.</strong>
          <ul style={{ margin: '10px 0 0', paddingLeft: 18 }}>
            <li>Dice el ritmo real del turno: cuántas mesas, cuánta gente, qué días son fuertes.</li>
            <li>Dice qué va a hacer concretamente la persona, no solo el nombre del puesto.</li>
            <li>Dice qué ofrece más allá del sueldo, que es lo que decide entre dos avisos parecidos.</li>
            <li>Tiene turno, días y jornada cargados, así el candidato sabe si le sirve antes de postularse.</li>
            <li>Tiene fecha de cierre y cantidad de puestos, que es lo que genera que se postulen ahora y no la
            semana que viene.</li>
            <li>El logo hace que el local se reconozca de un vistazo.</li>
          </ul>
        </div>

        <h2 style={{ marginTop: 36, fontSize: '1.25rem' }}>Así no</h2>
        <Tarjeta v={MALA} mala />

        <div className="aviso-legal">
          <strong>Qué le falta.</strong>
          <ul style={{ margin: '10px 0 0', paddingLeft: 18 }}>
            <li>Todo queda "a definir", así que el candidato no sabe si puede cubrir el turno y no se postula.</li>
            <li>"Con experiencia" sin decir cuánta ni en qué: el sistema no puede ordenar bien a los candidatos.</li>
            <li>"Buena presencia" es una frase que en gastronomía suele encubrir criterios discriminatorios.
            Además no dice nada del puesto.</li>
            <li>Sin fecha de cierre no hay ninguna razón para postularse hoy.</li>
            <li>Sin logo ni dirección completa, el local no se reconoce.</li>
          </ul>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
          <a className="btn-oxido-solido" href="/empleador/vacantes/nueva">Publicar mi vacante</a>
          <a className="btn blanco" href="/empleador/vacantes">Volver a mis vacantes</a>
        </div>
      </main>
      <Pie />
    </div>
  );
}
