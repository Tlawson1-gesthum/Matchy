import { etiqueta, TIPOS_LOCAL } from '../lib/opciones';

export function iniciales(nombre) {
  const palabras = (nombre || '').trim().split(/\s+/).filter((p) => /^[\p{L}\d]/u.test(p));
  return palabras.slice(0, 2).map((p) => p[0].toUpperCase()).join('') || 'V';
}

// Sello de local verificado: la pieza de unión del isotipo de Voral, sin las
// figuras, como indica el manual de marca para las insignias de confianza.
export function SelloVerificado() {
  return (
    <span className="sello-verificado">
      <svg viewBox="330 326 154 132" width="18" height="16" aria-hidden="true" focusable="false">
        <path
          d="M395.7 360.4 A13 13 0 0 0 418.3 360.4 A64 64 0 1 1 418.3 423.6 A13 13 0 0 0 395.7 423.6 A64 64 0 1 1 395.7 360.4 Z"
          fill="currentColor"
        />
      </svg>
      Local verificado
    </span>
  );
}

// Cabecera de la vacante: logo (o iniciales), nombre, rubro y sello.
// La usan la lista de vacantes y la vista previa del logo.
export default function CabeceraLocal({ local }) {
  const nombre = local?.nombre_local || 'Tu local';
  return (
    <div className="vacante-identidad">
      {local?.logo_url ? (
        <img className="vacante-logo" src={local.logo_url} alt={`Logo de ${nombre}`} />
      ) : (
        <span className="vacante-logo inicial" aria-hidden="true">{iniciales(local?.nombre_local)}</span>
      )}
      <div style={{ minWidth: 0 }}>
        <span className="vacante-local">{nombre}</span>
        <span className="vacante-tipo">
          {[etiqueta(TIPOS_LOCAL, local?.tipo_local) || 'Gastronomía', local?.ciudad, local?.direccion]
            .filter(Boolean).join(' • ')}
        </span>
        {local?.estado === 'aprobado' && <SelloVerificado />}
      </div>
    </div>
  );
}
