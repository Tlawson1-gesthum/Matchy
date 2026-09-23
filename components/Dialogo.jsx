'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Reemplazo de las ventanitas del navegador (confirm, alert, prompt).
// Usa el elemento nativo <dialog>: bloquea el resto de la página mientras está
// abierto, se cierra con Escape y los lectores de pantalla lo anuncian.
//
// Uso:
//   const { dialogo, confirmar, avisar, pedirTexto } = useDialogo();
//   if (await confirmar('¿Seguro?')) { ... }
//   ...y renderizar {dialogo} en algún lugar de la página.
export function useDialogo() {
  const [estado, setEstado] = useState(null);
  const resolver = useRef(null);

  const abrir = useCallback(
    (opciones) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setEstado(opciones);
      }),
    []
  );

  const cerrar = useCallback((valor) => {
    const r = resolver.current;
    resolver.current = null;
    setEstado(null);
    if (r) r(valor);
  }, []);

  const confirmar = useCallback((mensaje, opciones = {}) => abrir({ tipo: 'confirmar', mensaje, ...opciones }), [abrir]);
  const avisar = useCallback((mensaje, opciones = {}) => abrir({ tipo: 'avisar', mensaje, ...opciones }), [abrir]);
  const pedirTexto = useCallback((mensaje, opciones = {}) => abrir({ tipo: 'texto', mensaje, ...opciones }), [abrir]);

  const dialogo = estado ? <Dialogo {...estado} onCerrar={cerrar} /> : null;
  return { dialogo, confirmar, avisar, pedirTexto };
}

function Dialogo({ tipo, titulo, mensaje, textoAceptar, textoCancelar, peligro, placeholder, onCerrar }) {
  const ref = useRef(null);
  const [texto, setTexto] = useState('');

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  function cancelar() {
    onCerrar(tipo === 'confirmar' ? false : tipo === 'texto' ? null : undefined);
  }

  function aceptar() {
    onCerrar(tipo === 'confirmar' ? true : tipo === 'texto' ? texto.trim() : undefined);
  }

  const tituloFinal = titulo || (tipo === 'avisar' ? 'Aviso' : tipo === 'texto' ? 'Contanos' : '¿Estás seguro?');
  const claseAceptar = peligro ? 'btn-peligro' : 'btn';

  return (
    <dialog
      ref={ref}
      className="dialogo"
      aria-labelledby="dialogo-titulo"
      aria-describedby="dialogo-mensaje"
      onCancel={(e) => { e.preventDefault(); cancelar(); }}
    >
      <h2 id="dialogo-titulo" className="dialogo-titulo">{tituloFinal}</h2>
      <p id="dialogo-mensaje" className="dialogo-mensaje">{mensaje}</p>

      {tipo === 'texto' && (
        <textarea
          className="dialogo-texto"
          rows={4}
          value={texto}
          placeholder={placeholder}
          onChange={(e) => setTexto(e.target.value)}
          aria-label={tituloFinal}
          autoFocus
        />
      )}

      <div className="dialogo-botones">
        {tipo !== 'avisar' && (
          <button type="button" className="btn-accion" onClick={cancelar}>
            {textoCancelar || 'Cancelar'}
          </button>
        )}
        <button
          type="button"
          className={claseAceptar}
          onClick={aceptar}
          disabled={tipo === 'texto' && !texto.trim()}
          autoFocus={tipo !== 'texto'}
        >
          {textoAceptar || (tipo === 'avisar' ? 'Entendido' : 'Aceptar')}
        </button>
      </div>
    </dialog>
  );
}
