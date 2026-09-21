'use client';

import { useId, useState } from 'react';

function IconoOjo({ tachado }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {tachado && <path d="M3 3l18 18" />}
    </svg>
  );
}

// Campo de contraseña con botón para mostrarla u ocultarla.
// El texto de ayuda queda asociado al campo para los lectores de pantalla.
export default function CampoContrasena({
  value, onChange, etiqueta = 'Contraseña', ayuda, autoComplete = 'current-password', minLength,
}) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const idAyuda = `${id}-ayuda`;

  return (
    <div className="form-field">
      <label htmlFor={id}>{etiqueta}</label>
      <div className="campo-contrasena">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          aria-describedby={ayuda ? idAyuda : undefined}
        />
        <button
          type="button"
          className="boton-ojo"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
        >
          <IconoOjo tachado={visible} />
        </button>
      </div>
      {ayuda && <p id={idAyuda} className="ayuda-contraste">{ayuda}</p>}
    </div>
  );
}
