// Muestra un texto libre escrito por un usuario con formato básico, sin
// interpretar HTML (que permitiría inyectar código en la página).
//
// Reglas:
// - Un renglón en blanco separa párrafos.
// - Las líneas que empiezan con "-", "*" o "•" forman una lista con viñetas.
// - Un salto de línea simple dentro de un párrafo se respeta.

const MARCA_LISTA = /^\s*[-*•]\s+/;

function bloques(texto) {
  const lineas = (texto || '').replace(/\r\n/g, '\n').split('\n');
  const resultado = [];
  let actual = null;

  const cerrar = () => {
    if (actual && actual.lineas.length) resultado.push(actual);
    actual = null;
  };

  for (const linea of lineas) {
    if (!linea.trim()) { cerrar(); continue; }
    const esItem = MARCA_LISTA.test(linea);
    const tipo = esItem ? 'lista' : 'parrafo';
    if (!actual || actual.tipo !== tipo) { cerrar(); actual = { tipo, lineas: [] }; }
    actual.lineas.push(esItem ? linea.replace(MARCA_LISTA, '') : linea.trim());
  }
  cerrar();
  return resultado;
}

export default function TextoFormateado({ texto, className = '' }) {
  const partes = bloques(texto);
  if (!partes.length) return null;

  return (
    <div className={`texto-formateado ${className}`.trim()}>
      {partes.map((b, i) =>
        b.tipo === 'lista' ? (
          <ul key={i}>
            {b.lineas.map((l, j) => <li key={j}>{l}</li>)}
          </ul>
        ) : (
          <p key={i}>{b.lineas.join('\n')}</p>
        )
      )}
    </div>
  );
}
