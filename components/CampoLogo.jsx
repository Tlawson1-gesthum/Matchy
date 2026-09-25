'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { validarArchivo, extension, TIPOS_IMAGEN } from '../lib/archivos';
import { comprimirImagen, medirImagen } from '../lib/imagenes';
import { traducirError } from '../lib/errores';
import CabeceraLocal from './CabeceraLocal';

// Campo para subir el logo del local, con consejos y la vista previa de cómo
// queda en las vacantes. Lo usan el alta del local y "Mi local".
export default function CampoLogo({ logoUrl, onCambio, local, setError }) {
  const [subiendo, setSubiendo] = useState(false);

  async function subir(e) {
    const original = e.target.files[0];
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!original || !uid) return;
    if (!TIPOS_IMAGEN.includes(original.type)) {
      setError(validarArchivo(original, { tipos: TIPOS_IMAGEN, maxMB: 2 })); e.target.value = ''; return;
    }
    // El logo se muestra grande en cada vacante: uno chico se ve pixelado.
    const medidas = await medirImagen(original);
    if (medidas && Math.min(medidas.ancho, medidas.alto) < 300) {
      setError(`El logo es muy chico (${medidas.ancho} × ${medidas.alto} px) y se vería borroso. Subí uno de al menos 300 × 300 px, idealmente el archivo original del diseño.`);
      e.target.value = '';
      return;
    }
    setError('');
    const file = await comprimirImagen(original, { maxLado: 800, calidad: 0.9 });
    const problema = validarArchivo(file, { tipos: TIPOS_IMAGEN, maxMB: 2 });
    if (problema) { setError(problema); e.target.value = ''; return; }
    setSubiendo(true);
    const path = `${uid}/logo.${extension(file)}`;
    const { error: errUp } = await supabase.storage
      .from('logos-locales').upload(path, file, { upsert: true, contentType: file.type });
    if (!errUp) {
      const { data } = supabase.storage.from('logos-locales').getPublicUrl(path);
      onCambio(`${data.publicUrl}?t=${Date.now()}`);
    } else {
      setError('No se pudo subir el logo: ' + traducirError(errUp.message));
    }
    setSubiendo(false);
  }

  return (
    <div className="form-field">
      <label htmlFor="campo-logo">Logo del local (recomendado)</label>
      <p className="ayuda-campo" style={{ marginTop: 0 }}>
        Es lo primero que ve el candidato en cada vacante. Un aviso con un buen logo transmite un lugar serio.
      </p>
      <ul className="ayuda-campo lista-consejos-logo">
        <li>Usá el archivo original del logo, no una foto del cartel ni una captura de pantalla.</li>
        <li>Mejor cuadrado, de al menos 300 × 300 px, en PNG con fondo transparente o blanco.</li>
        <li>Que el logo ocupe casi todo el cuadro, sin bordes vacíos.</li>
      </ul>
      <input id="campo-logo" type="file" accept="image/jpeg,image/png,image/webp" onChange={subir} />
      {subiendo && <p className="ayuda-campo">Subiendo...</p>}
      <div className="vista-previa-logo">
        <p className="ficha-bloque-titulo" style={{ margin: 0 }}>Así se ve en tus vacantes</p>
        <CabeceraLocal local={{ ...local, logo_url: logoUrl }} />
      </div>
    </div>
  );
}
