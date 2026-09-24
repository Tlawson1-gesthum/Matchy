import Encabezado from '../components/Encabezado';
import Pie from '../components/Pie';

function IconoEscudo() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z" />
      <path d="M8.8 12.2l2.2 2.2 4.2-4.4" />
    </svg>
  );
}

function IconoBandera() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 21V4" />
      <path d="M5 4h11l-2 4 2 4H5" />
    </svg>
  );
}

export default function Home() {
  return (
    <div>
      <Encabezado links={[]} />

      <main className="container portada">
        <section className="hero" aria-labelledby="titulo-portada">
          <div className="hero-ilustracion">
            <img
              src="/portada-cocina.jpg"
              alt="Un cocinero de espaldas revuelve una olla en la cocina de un local, rodeado de ilustraciones de hojas, utensilios y el logo de Voral en una notebook."
              width="1200"
              height="600"
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
            <p className="tarjeta-sello">
              <IconoEscudo /> Todos los locales están verificados
            </p>
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
          <h2 id="titulo-confianza">Cómo te cuidamos</h2>
          <ul className="confianza-lista">
            <li>
              <span className="confianza-icono"><IconoEscudo /></span>
              <div>
                <h3>Verificamos cada local</h3>
                <p>Antes de que publique, chequeamos su CUIT y lo llamamos. Si algo no cierra, no se aprueba.</p>
              </div>
            </li>
            <li>
              <span className="confianza-icono"><IconoBandera /></span>
              <div>
                <h3>Si algo te da mala espina, lo reportás</h3>
                <p>Con tres reportes distintos, la vacante se suspende sola.</p>
              </div>
            </li>
          </ul>
        </section>
      </main>

      <Pie />
    </div>
  );
}
