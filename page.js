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
              alt="Una persona arma su CV en una computadora con el logo de Voral, rodeada de íconos gastronómicos y piezas de rompecabezas que encajan."
              width="1024"
              height="512"
              fetchPriority="high"
            />
          </div>

          <div className="hero-texto">
            <h1 id="titulo-portada" className="portada-titular">
              Gente de oficio, locales de verdad.
            </h1>
            <p className="portada-subtitulo">
              La bolsa de trabajo de la gastronomía de Posadas y Garupá.
            </p>
          </div>
        </section>

        <div className="tarjetas-portada">
          <section className="tarjeta-portada" aria-labelledby="tarjeta-candidato">
            <h2 id="tarjeta-candidato">¿Buscás trabajo?</h2>
            <p>Armá tu CV una vez, gratis, y postulate a locales que ya verificamos.</p>
            <a className="btn-portada verde" href="/candidato/registro">Crear CV gratis</a>
            <p className="tarjeta-acceso">
              ¿Ya tenés cuenta? <a href="/candidato/login">Iniciar sesión</a>
              <span aria-hidden="true"> · </span>
              <a href="/cv-modelo">Ver un CV de ejemplo</a>
            </p>
          </section>

          <section className="tarjeta-portada" aria-labelledby="tarjeta-local">
            <h2 id="tarjeta-local">¿Ofrecés empleo?</h2>
            <p>Publicá la vacante y recibí a los postulantes ordenados por probabilidad de match, con CV completo y referencias.</p>
            <a className="btn-portada oxido" href="/empleador/registro">Publicar vacante</a>
            <p className="tarjeta-acceso">
              ¿Ya tenés cuenta? <a href="/empleador/login">Iniciar sesión</a>
            </p>
          </section>
        </div>

        <section className="confianza-portada" aria-labelledby="titulo-confianza">
          <h2 id="titulo-confianza">Cómo verificamos</h2>
          <ul className="confianza-lista">
            <li>
              <h3>Verificamos cada local</h3>
              <p>Antes de que publique, chequeamos su CUIT y lo llamamos. Si algo no cierra, no se aprueba.</p>
            </li>
            <li>
              <h3>Si algo te da mala espina, lo reportás</h3>
              <p>Con tres reportes distintos, la vacante se suspende sola.</p>
            </li>
          </ul>
        </section>
      </main>

      <Pie />
    </div>
  );
}
