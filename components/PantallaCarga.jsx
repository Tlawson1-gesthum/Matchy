'use client';

import { useEffect, useState } from 'react';
import IsotipoMatchy from './IsotipoMatchy';

// Momento en que se cerró la última pantalla de carga. Sirve para que, si una
// carga sigue inmediatamente a otra (primero se verifica la cuenta y después se
// traen los datos), la animación continúe con las figuras ya unidas en lugar
// de volver a empezar.
let ultimoCierre = 0;

// Pantalla de carga con el isotipo animado:
// 1. las dos figuras entran desde los costados y se unen,
// 2. aparece la pieza de unión,
// 3. la unión late tres veces, descansa, y repite mientras siga cargando.
//
// Espera un instante antes de mostrarse: si la página carga enseguida,
// no aparece y se evita un parpadeo innecesario.
export default function PantallaCarga({ texto = 'Cargando...', retraso = 180 }) {
  const [continua] = useState(() => Date.now() - ultimoCierre < 800);
  const [visible, setVisible] = useState(retraso === 0 || continua);

  useEffect(() => {
    let t;
    if (!visible) t = setTimeout(() => setVisible(true), retraso);
    return () => {
      clearTimeout(t);
      ultimoCierre = Date.now();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clases = ['pantalla-carga', visible ? 'visible' : '', continua ? 'continua' : ''].filter(Boolean).join(' ');

  return (
    <div className={clases} role="status" aria-live="polite" aria-busy="true">
      <IsotipoMatchy className="carga-isotipo" animado />
      <p className="carga-texto">{texto}</p>
    </div>
  );
}
