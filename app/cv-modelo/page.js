import CvHoja from '../../components/CvHoja';

// CV de ejemplo, para que la persona entienda para qué sirve cargar cada dato
// y cómo va a quedar el resultado final.
const CV_EJEMPLO = {
  nombre: 'Camila Duarte',
  contacto: '376 4123456',
  ciudad: 'Posadas',
  edad: 24,
  puestos: ['Mozo/a', 'Cajero/a'],
  presentacion:
    'Soy tranquila y ordenada, y trabajo bien cuando el salón se llena: prefiero anticiparme a las cosas antes que apagar incendios. Me llevo bien con el equipo de cocina, que es donde suele trabarse el servicio. Busco un lugar con horarios estables donde pueda quedarme varios años y aprender la parte de encargada.',
  habilidades: ['Atención al cliente', 'Manejo de bandeja', 'Cierre de caja', 'Trabajo bajo presión', 'Control de stock'],
  herramientas_nivel: [
    { nombre: 'FUDO', nivel: 'avanzado' },
    { nombre: 'Posnet', nivel: 'experto' },
    { nombre: 'Cafetera express', nivel: 'medio' },
  ],
  idiomas_nivel: [
    { nombre: 'Portugués', nivel: 'intermedio' },
    { nombre: 'Inglés', nivel: 'principiante' },
  ],
  experiencia: [
    {
      puesto: 'Mozo/a',
      empresa: 'Resto-bar La Terraza',
      desde: '2023-03',
      hasta: '',
      actual: true,
      descripcion:
        'Atiendo un sector de 12 mesas en el turno noche, de miércoles a domingo. Tomo pedidos con FUDO, coordino los tiempos con cocina y hago el cierre de caja del sector. Los fines de semana el salón trabaja a full y el equipo es de 6 personas.',
    },
    {
      puesto: 'Cajero/a',
      empresa: 'Café del Centro',
      desde: '2021-08',
      hasta: '2023-02',
      actual: false,
      descripcion:
        'Cobraba en caja y mostrador, armaba el arqueo diario y controlaba el stock de la vitrina. También preparaba cafés de la carta en los momentos de mayor movimiento.',
    },
  ],
  formacion: [
    { titulo: 'Curso de manipulación de alimentos', institucion: 'Municipalidad de Posadas', estado: 'completo', anio: '2024' },
    { titulo: 'Curso de barismo nivel 1', institucion: 'Escuela de Café Misiones', estado: 'en_curso', anio: '2026' },
    { titulo: 'Secundario completo', institucion: 'EPET N°8', estado: 'completo', anio: '2019' },
  ],
  disponibilidad_horaria: 'tiempo_completo',
  turno: 'noche',
  disponible_desde: 'inmediata',
  movilidad_propia: true,
  certificado_manipulacion: true,
};

export default function CvModelo() {
  return (
    <div>
      <header className="cabecera no-imprimir">
        <a className="cabecera-marca" href="/">Matchy</a>
        <nav className="cabecera-iconos">
          <a href="/candidato/cv" style={{ color: 'var(--verde)', textDecoration: 'none', fontSize: '0.92rem' }}>
            Armar el mío
          </a>
        </nav>
      </header>
      <div className="container no-imprimir" style={{ maxWidth: 760 }}>
        <h1 style={{ marginTop: 24 }}>Así queda un CV en Matchy</h1>
        <p>
          Este es un ejemplo con datos inventados. Fijate el nivel de detalle: nadie contrata por adjetivos, contratan
          por lo concreto. Cuando cargues el tuyo, vas a poder descargarlo en PDF con este mismo diseño.
        </p>
        <a className="btn" href="/candidato/cv">Armar mi CV</a>
      </div>
      <CvHoja cv={CV_EJEMPLO} />
      <div style={{ height: 40 }} />
    </div>
  );
}
