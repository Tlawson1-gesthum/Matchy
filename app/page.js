import Encabezado from '../components/Encabezado';
import Pie from '../components/Pie';

export default function Home() {
  return (
    <div>
      <Encabezado links={[]} />

      <main className="container portada">
        <section className="hero" aria-labelledby="titulo-portada">
          <div className="hero-ilustracion">
            <img
              src="/ilustracion-portada.webp"
              alt="Una persona arma su CV en una computadora con el logo de Matchy, rodeada de íconos gastronómicos y piezas de rompecabezas que encajan."
              width="1024"
              height="512"
              fetchPriority="high"
            />
          </div>

          <div className="hero-texto">
            <h1 id="titulo-portada" className="portada-titular">
              Encontrá tu match laboral en Posadas. Rápido y efectivo.
            </h1>
            <p className="portada-subtitulo">
              El punto de encuentro para el talento gastronómico y los locales de la ciudad.
            </p>
          </div>
        </section>

        <div className="tarjetas-portada">
          <section className="tarjeta-portada" aria-labelledby="tarjeta-candidato">
            <h2 id="tarjeta-candidato">¿Buscás empleo?</h2>
            <p>Armá tu CV digital, compartilo al instante y destacá en el mercado local.</p>
            <a className="btn-portada verde" href="/candidato/registro">Crear CV gratis</a>
            <p className="tarjeta-acceso">
              ¿Ya tenés cuenta? <a href="/candidato/login">Iniciar sesión</a>
              <span aria-hidden="true"> · </span>
              <a href="/cv-modelo">Ver un CV de ejemplo</a>
            </p>
          </section>

          <section className="tarjeta-portada" aria-labelledby="tarjeta-local">
            <h2 id="tarjeta-local">¿Ofrecés empleo?</h2>
            <p>Publicá vacantes y accedé a candidatos precalificados y ordenados por expectativas.</p>
            <a className="btn-portada oxido" href="/empleador/registro">Publicar vacante</a>
            <p className="tarjeta-acceso">
              ¿Ya tenés cuenta? <a href="/empleador/login">Iniciar sesión</a>
            </p>
          </section>
        </div>
      </main>

      <Pie />
    </div>
  );
}
