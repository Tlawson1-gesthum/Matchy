'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { TIPOS_LOCAL, LOCALIDADES, revisarCuit, revisarRedSocial } from '../../../lib/opciones';
import { validarArchivo, extension, TIPOS_IMAGEN } from '../../../lib/archivos';
import { comprimirImagen } from '../../../lib/imagenes';
import BotonGoogle from '../../../components/BotonGoogle';
import CampoContrasena from '../../../components/CampoContrasena';
import GuardiaRol from '../../../components/GuardiaRol';
import Encabezado from '../../../components/Encabezado';
import Pie from '../../../components/Pie';
import PantallaCarga from '../../../components/PantallaCarga';
import SeccionAcordeon from '../../../components/SeccionAcordeon';

function traducirError(msg) {
  const m = (msg || '').toLowerCase();
  if (m.includes('rate limit')) return 'Se alcanzó el límite de intentos por hora. Esperá un rato y probá de nuevo.';
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'Ese email ya tiene una cuenta. Iniciá sesión y vas a poder completar los datos del local.';
  }
  if (m.includes('password')) return 'La contraseña tiene que tener al menos 6 caracteres.';
  if (m.includes('cuit_unico') || m.includes('duplicate key')) {
    return 'Ya existe un local registrado con ese CUIT. Si es tu local y perdiste el acceso, escribinos a gozzasabores@gmail.com.';
  }
  if (m.includes('column') || m.includes('schema cache')) {
    return 'La base de datos está desactualizada. Avisale al administrador que corra el último script de esquema. Detalle: ' + msg;
  }
  if (m.includes('ciudad_permitida')) return 'Por ahora Voral funciona solo en Posadas y Garupá.';
  if (m.includes('row-level security')) return 'No tenés permisos para crear el local. Cerrá sesión, volvé a entrar y probá de nuevo.';
  return msg;
}

const LOCAL_VACIO = {
  nombre_responsable: '', cuit: '', razon_social: '',
  nombre_local: '', tipo_local: 'resto', ciudad: 'Posadas', direccion: '',
  telefono: '', red_social: '', contacto: '',
};

function RegistroEmpleadorContenido() {
  const router = useRouter();
  const [paso, setPaso] = useState('cargando'); // cargando | cuenta | local
  const [usuario, setUsuario] = useState(null);

  // Paso 1
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Paso 2
  const [form, setForm] = useState(LOCAL_VACIO);
  const [declaracion, setDeclaracion] = useState(false);
  const [sinFraude, setSinFraude] = useState(false);
  const [aceptaTyc, setAceptaTyc] = useState(false);
  const [esMayor, setEsMayor] = useState(false);

  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [abiertas, setAbiertas] = useState(new Set(['contacto']));

  const chequeoCuit = revisarCuit(form.cuit);
  const chequeoRed = revisarRedSocial(form.red_social);

  useEffect(() => {
    async function revisar() {
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      if (!u) { setPaso('cuenta'); return; }

      const { data: emp } = await supabase.from('empleadores').select('id').eq('id', u.id).maybeSingle();
      if (emp) { router.push('/empleador/vacantes'); return; }

      setUsuario(u);
      setForm((f) => ({
        ...f,
        nombre_responsable: f.nombre_responsable || u.user_metadata?.full_name || '',
      }));
      setPaso('local');
    }
    revisar();
  }, [router]);

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function subirLogo(e) {
    const original = e.target.files[0];
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!original || !uid) return;
    if (!TIPOS_IMAGEN.includes(original.type)) {
      setError(validarArchivo(original, { tipos: TIPOS_IMAGEN, maxMB: 2 })); e.target.value = ''; return;
    }
    const file = await comprimirImagen(original, { maxLado: 512, calidad: 0.86 });
    const problema = validarArchivo(file, { tipos: TIPOS_IMAGEN, maxMB: 2 });
    if (problema) { setError(problema); e.target.value = ''; return; }
    setSubiendoLogo(true);
    const path = `${uid}/logo.${extension(file)}`;
    const { error: errUp } = await supabase.storage
      .from('logos-locales').upload(path, file, { upsert: true, contentType: file.type });
    if (!errUp) {
      const { data } = supabase.storage.from('logos-locales').getPublicUrl(path);
      setLogoUrl(`${data.publicUrl}?t=${Date.now()}`);
    } else {
      setError('No se pudo subir el logo: ' + errUp.message);
    }
    setSubiendoLogo(false);
  }

  async function crearCuenta(e) {
    e.preventDefault();
    setError('');
    setCargando(true);

    const { data, error: errAuth } = await supabase.auth.signUp({ email, password });
    if (errAuth) {
      setError(traducirError(errAuth.message));
      setCargando(false);
      return;
    }
    if (!data.session) {
      setCargando(false);
      setError('Tu cuenta se creó, pero falta confirmar el email. Revisá tu casilla y el spam, iniciá sesión y volvé acá para cargar los datos del local.');
      return;
    }

    await supabase.from('perfiles').upsert({ id: data.user.id, role: 'empleador', email });
    setUsuario(data.user);
    setCargando(false);
    setPaso('local');
  }

  async function guardarLocal(e) {
    e.preventDefault();
    setError('');

    if (!chequeoCuit.valido) { setError('Revisá el CUIT: ' + chequeoCuit.mensaje); return; }
    if (!chequeoRed.valido) { setError('Revisá el enlace del local: ' + chequeoRed.mensaje); return; }
    if (!esMayor) { setError('Tenés que ser mayor de 18 años para registrar un local.'); return; }
    if (!declaracion) { setError('Necesitamos la declaración jurada sobre la existencia real del local.'); return; }
    if (!sinFraude) { setError('Necesitamos que aceptes el compromiso de uso legítimo de la plataforma.'); return; }
    if (!aceptaTyc) { setError('Necesitamos que aceptes los términos y la política de privacidad.'); return; }

    setCargando(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) { setError('Se cerró tu sesión. Volvé a iniciar sesión.'); setCargando(false); return; }

    await supabase.from('perfiles').upsert({ id: uid, role: 'empleador', email: userData.user.email });

    const ahora = new Date().toISOString();
    const { error: errEmp } = await supabase.from('empleadores').upsert({
      id: uid,
      nombre_responsable: form.nombre_responsable,
      cuit: form.cuit.replace(/[^0-9]/g, ''),
      razon_social: form.razon_social,
      nombre_local: form.nombre_local,
      tipo_local: form.tipo_local,
      ciudad: form.ciudad,
      direccion: form.direccion,
      telefono: form.telefono,
      red_social: chequeoRed.normalizada || form.red_social,
      logo_url: logoUrl || null,
      contacto: form.contacto,
      estado: 'pendiente',
      acepto_tyc_at: ahora,
      declara_mayor_edad: esMayor,
      declaracion_edad_at: ahora,
      declaracion_jurada_at: ahora,
      declaracion_fraude_at: ahora,
    });

    setCargando(false);
    if (errEmp) { setError(traducirError(errEmp.message)); return; }
    router.push('/empleador/vacantes');
  }

  if (paso === 'cargando') return <PantallaCarga texto="Verificando tu cuenta..." />;

  const estados = {
    contacto: form.nombre_responsable.trim() && form.telefono.trim() ? 'completo' : 'pendiente',
    local: form.nombre_local.trim() && form.razon_social.trim() && chequeoCuit.valido &&
      form.direccion.trim() && chequeoRed.valido && form.contacto.trim() ? 'completo' : 'pendiente',
    legal: esMayor && declaracion && sinFraude && aceptaTyc ? 'completo' : 'pendiente',
  };

  function alternarSeccion(id, abierta) {
    setAbiertas((prev) => {
      const nueva = new Set(prev);
      if (abierta) nueva.add(id); else nueva.delete(id);
      return nueva;
    });
  }

  function propsSeccion(id) {
    return { estado: estados[id], abierta: abiertas.has(id), onToggle: alternarSeccion };
  }

  return (
    <div>
      <Encabezado links={[]} />
      <div className="panel-auth" style={{ maxWidth: 540 }}>
        {paso === 'cuenta' && (
          <>
            <h1>Creá tu cuenta</h1>
            <p className="auth-intro">
              Primero la cuenta, después los datos del local. ¿Ya sos usuario?{' '}
              <Link href="/empleador/login">Iniciá sesión</Link>.
            </p>

            <div className="card">
              <BotonGoogle rol="empleador" texto="Continuar con Google" />

              <div className="linea-o">o con tu email</div>

              <form onSubmit={crearCuenta}>
                <div className="form-field">
                  <label htmlFor="registro-local-email">Email</label>
                  <input id="registro-local-email" type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <CampoContrasena
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  ayuda="Mínimo 6 caracteres."
                />
                {error && <p className="mensaje-error" role="alert">{error}</p>}
                <button className="btn-oxido-solido ancho" type="submit" disabled={cargando}>
                  {cargando ? 'Creando cuenta...' : 'Continuar'}
                </button>
              </form>
            </div>
          </>
        )}

        {paso === 'local' && (
          <>
            <h1>Datos de tu local</h1>
            <p className="auth-intro">
              Entraste como {usuario?.email}. Ahora completá los datos para que podamos verificar el local.
            </p>

            <div className="aviso-legal">
              <strong>Por qué pedimos todo esto.</strong> Verificamos a mano cada local antes de habilitarlo. Es lo
              que evita que alguien publique avisos falsos usando el nombre de un comercio que no existe. Hasta que
              aprobemos tu local, tus vacantes no se muestran. Revisamos las altas dentro de las 48 horas hábiles.
            </div>

            <form onSubmit={guardarLocal}>
              <SeccionAcordeon id="contacto" titulo="Tu contacto" {...propsSeccion('contacto')}>
                <div className="form-field">
                  <label>Nombre y apellido</label>
                  <input required value={form.nombre_responsable} onChange={(e) => set('nombre_responsable', e.target.value)} />
                </div>
                <div className="form-field">
                  <label>Tu teléfono de contacto directo</label>
                  <input required inputMode="tel" placeholder="376 4123456" value={form.telefono} onChange={(e) => set('telefono', e.target.value)} />
                  <p className="ayuda-campo">Lo usamos para verificar el alta. No se muestra a los candidatos.</p>
                </div>
              </SeccionAcordeon>

              <SeccionAcordeon id="local" titulo="El local" {...propsSeccion('local')}>
                <div className="form-field">
                  <label>Nombre de fantasía</label>
                  <input required value={form.nombre_local} onChange={(e) => set('nombre_local', e.target.value)} />
                </div>
                <div className="form-field">
                  <label>Logo del local (opcional)</label>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={subirLogo} />
                  {subiendoLogo && <p className="ayuda-campo">Subiendo...</p>}
                  {logoUrl && (
                    <img
                      src={logoUrl}
                      alt=""
                      style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', marginTop: 10, border: '1px solid var(--borde)' }}
                    />
                  )}
                  <p className="ayuda-campo">
                    Aparece junto al nombre en cada vacante. Un aviso con logo se reconoce más rápido.
                  </p>
                </div>

                <div className="form-field">
                  <label>Razón social</label>
                  <input required value={form.razon_social} onChange={(e) => set('razon_social', e.target.value)} />
                </div>

                <div className="form-field">
                  <label>CUIT con el que opera</label>
                  <input
                    required
                    inputMode="numeric"
                    placeholder="30-12345678-9"
                    value={form.cuit}
                    onChange={(e) => set('cuit', e.target.value)}
                  />
                  {form.cuit && (
                    <p className={chequeoCuit.valido ? 'chequeo-ok' : 'chequeo-mal'}>
                      {chequeoCuit.valido ? `${chequeoCuit.formateado} · ${chequeoCuit.mensaje}` : chequeoCuit.mensaje}
                    </p>
                  )}
                  <p className="ayuda-campo">Un CUIT solo puede tener un local registrado.</p>
                </div>

                <div className="form-field">
                  <label>Tipo de local</label>
                  <select value={form.tipo_local} onChange={(e) => set('tipo_local', e.target.value)}>
                    {TIPOS_LOCAL.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Localidad</label>
                  <select value={form.ciudad} onChange={(e) => set('ciudad', e.target.value)}>
                    {LOCALIDADES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Dirección exacta</label>
                  <input required placeholder="Calle, número, barrio" value={form.direccion} onChange={(e) => set('direccion', e.target.value)} />
                  <p className="ayuda-campo">Donde funciona el local, no un domicilio particular.</p>
                </div>

                <div className="form-field">
                  <label>Enlace público del local</label>
                  <input
                    required
                    placeholder="https://instagram.com/tulocal"
                    value={form.red_social}
                    onChange={(e) => set('red_social', e.target.value)}
                  />
                  {form.red_social && (
                    <p className={chequeoRed.valido ? 'chequeo-ok' : 'chequeo-mal'}>{chequeoRed.mensaje}</p>
                  )}
                  <p className="ayuda-campo">
                    Pegá la dirección completa desde la barra del navegador. Sirve Instagram, Facebook, TikTok,
                    Google Maps o el sitio web del local. Lo usamos para confirmar que existe y está en actividad.
                  </p>
                </div>

                <div className="form-field">
                  <label>Contacto que van a ver los candidatos</label>
                  <input required value={form.contacto} onChange={(e) => set('contacto', e.target.value)} />
                </div>
              </SeccionAcordeon>

              <SeccionAcordeon id="legal" titulo="Declaraciones legales" {...propsSeccion('legal')}>
                <p className="ayuda-campo" style={{ marginTop: 0 }}>Antes de publicar, confirmá esto:</p>

                <label className="casilla-legal">
                  <input type="checkbox" checked={esMayor} onChange={(e) => setEsMayor(e.target.checked)} />
                  <span>
                    Declaro bajo mi responsabilidad que soy mayor de 18 años. Sé que una declaración falsa puede
                    tener consecuencias legales y que Voral da de baja las cuentas de menores de edad apenas las
                    detecta.
                  </span>
                </label>

                <label className="casilla-legal">
                  <input type="checkbox" checked={declaracion} onChange={(e) => setDeclaracion(e.target.checked)} />
                  <span>
                    Declaro bajo juramento que el local existe y está en actividad, que estoy autorizado a
                    representarlo, y que las vacantes que publique van a ser reales.
                  </span>
                </label>

                <div className="aviso-legal" style={{ marginBottom: 8 }}>
                  <label className="casilla-legal" style={{ margin: 0, padding: 0 }}>
                    <input type="checkbox" checked={sinFraude} onChange={(e) => setSinFraude(e.target.checked)} />
                    <span>
                      <strong>Compromiso antifraude.</strong> Me comprometo a no pedirle ni ofrecerle dinero a
                      ningún candidato por el puesto o por el proceso de selección, a no solicitar sus claves
                      bancarias ni documentación personal innecesaria, a no exigir trabajo no remunerado a modo de
                      prueba, y a no usar Voral para cometer fraude, estafas, trata de personas ni ningún otro
                      delito. Entiendo que el incumplimiento habilita la baja inmediata de la cuenta y la denuncia
                      ante la autoridad competente.
                    </span>
                  </label>
                </div>

                <label className="casilla-legal">
                  <input type="checkbox" checked={aceptaTyc} onChange={(e) => setAceptaTyc(e.target.checked)} />
                  <span>
                    Leí y acepto los <a href="/legal/terminos" target="_blank">términos y condiciones</a> y la{' '}
                    <a href="/legal/privacidad" target="_blank">política de privacidad</a>.
                  </span>
                </label>
              </SeccionAcordeon>

              {error && <p className="mensaje-error" role="alert">{error}</p>}
              <button className="btn-oxido-solido ancho" type="submit" disabled={cargando}>
                {cargando ? 'Guardando...' : 'Registrar mi local'}
              </button>
            </form>
          </>
        )}
      </div>
      <Pie />
    </div>
  );
}

export default function RegistroEmpleador(props) {
  return (
    <GuardiaRol rol="empleador">
      <RegistroEmpleadorContenido {...props} />
    </GuardiaRol>
  );
}
