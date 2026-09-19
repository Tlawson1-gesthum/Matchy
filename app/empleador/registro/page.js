'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { TIPOS_LOCAL, LOCALIDADES, cuitValido } from '../../../lib/opciones';
import Encabezado from '../../../components/Encabezado';
import Pie from '../../../components/Pie';

function traducirError(msg) {
  const m = (msg || '').toLowerCase();
  if (m.includes('rate limit')) return 'Se alcanzó el límite de intentos por hora. Esperá un rato y probá de nuevo.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Ese email ya tiene una cuenta. Iniciá sesión.';
  if (m.includes('password')) return 'La contraseña tiene que tener al menos 6 caracteres.';
  if (m.includes('cuit_unico') || m.includes('duplicate key')) {
    return 'Ya existe un local registrado con ese CUIT. Si es tu local y perdiste el acceso, escribinos a gozzasabores@gmail.com.';
  }
  if (m.includes('column') || m.includes('schema cache')) {
    return 'La base de datos está desactualizada y le falta una columna. Avisale al administrador que tiene que correr el script schema-v6.sql. Detalle técnico: ' + msg;
  }
  if (m.includes('ciudad_permitida')) return 'Por ahora Matchy funciona solo en Posadas y Garupá.';
  if (m.includes('row-level security') || m.includes('violates row-level')) {
    return 'No tenés permisos para crear el local. Cerrá sesión, volvé a entrar y probá de nuevo.';
  }
  return msg;
}

const FORM_VACIO = {
  email: '', password: '',
  nombre_responsable: '', cuit: '', razon_social: '',
  nombre_local: '', tipo_local: 'resto', ciudad: 'Posadas', direccion: '',
  telefono: '', red_social: '', contacto: '',
};

export default function RegistroEmpleador() {
  const router = useRouter();
  const [form, setForm] = useState(FORM_VACIO);
  const [declaracion, setDeclaracion] = useState(false);
  const [sinFraude, setSinFraude] = useState(false);
  const [aceptaTyc, setAceptaTyc] = useState(false);
  const [esMayor, setEsMayor] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  // Si ya hay sesión pero no hay local, solo falta completar los datos del local.
  const [completandoLocal, setCompletandoLocal] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    async function revisar() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (uid) {
        const { data: emp } = await supabase.from('empleadores').select('id').eq('id', uid).maybeSingle();
        if (emp) {
          router.push('/empleador/vacantes');
          return;
        }
        setCompletandoLocal(true);
        setForm((f) => ({ ...f, email: userData.user.email || '' }));
      }
      setVerificando(false);
    }
    revisar();
  }, [router]);

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function guardarLocal(userId) {
    const ahora = new Date().toISOString();
    const { error: errEmp } = await supabase.from('empleadores').insert({
      id: userId,
      nombre_responsable: form.nombre_responsable,
      cuit: form.cuit.replace(/[^0-9]/g, ''),
      razon_social: form.razon_social,
      nombre_local: form.nombre_local,
      tipo_local: form.tipo_local,
      ciudad: form.ciudad,
      direccion: form.direccion,
      telefono: form.telefono,
      red_social: form.red_social,
      contacto: form.contacto,
      estado: 'pendiente',
      acepto_tyc_at: ahora,
      declara_mayor_edad: true,
      declaracion_jurada_at: ahora,
      declaracion_fraude_at: ahora,
    });
    return errEmp;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!cuitValido(form.cuit)) {
      setError('El CUIT no es válido. Revisá que tenga 11 dígitos y esté bien copiado.');
      return;
    }
    if (!esMayor) { setError('Tenés que ser mayor de 18 años para registrar un local.'); return; }
    if (!declaracion) { setError('Necesitamos la declaración jurada sobre la existencia real del local.'); return; }
    if (!sinFraude) { setError('Necesitamos que aceptes el compromiso de uso legítimo de la plataforma.'); return; }
    if (!aceptaTyc) { setError('Necesitamos que aceptes los términos y la política de privacidad.'); return; }

    setCargando(true);

    // Caso A: ya tiene cuenta, solo falta el local
    if (completandoLocal) {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) { setError('Se cerró tu sesión. Volvé a iniciar sesión.'); setCargando(false); return; }

      await supabase.from('perfiles').upsert({ id: uid, role: 'empleador', email: userData.user.email });
      const errEmp = await guardarLocal(uid);
      setCargando(false);
      if (errEmp) { setError(traducirError(errEmp.message)); return; }
      router.push('/empleador/vacantes');
      return;
    }

    // Caso B: cuenta nueva
    const { data, error: errAuth } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    if (errAuth) {
      setError(traducirError(errAuth.message));
      setCargando(false);
      return;
    }

    if (!data.session) {
      setCargando(false);
      setError('Tu cuenta se creó, pero falta confirmar el email. Revisá tu casilla y el spam, iniciá sesión y volvé a esta pantalla para completar los datos del local.');
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      await supabase.from('perfiles').insert({ id: userId, role: 'empleador', email: form.email });
      const errEmp = await guardarLocal(userId);
      if (errEmp) {
        setCargando(false);
        setError(
          'Tu cuenta se creó pero el local no se pudo guardar. No pierdas el viaje: corregí lo que indica el mensaje y volvé a apretar el botón, la cuenta ya está hecha. ' +
          traducirError(errEmp.message)
        );
        setCompletandoLocal(true);
        return;
      }
    }

    setCargando(false);
    router.push('/empleador/vacantes');
  }

  if (verificando) return <div className="container">Cargando...</div>;

  return (
    <div>
      <Encabezado links={[]} />
      <div className="panel-auth" style={{ maxWidth: 540 }}>
        <h1>{completandoLocal ? 'Completá los datos de tu local' : 'Registrá tu local'}</h1>

        {completandoLocal ? (
          <p className="auth-intro">
            Tu cuenta ya existe. Solo falta cargar los datos del local para que podamos verificarlo.
          </p>
        ) : (
          <p className="auth-intro">
            ¿Ya sos usuario? <Link href="/empleador/login">Iniciá sesión</Link>.
          </p>
        )}

        <div className="aviso-legal">
          <strong>Por qué pedimos todos estos datos.</strong> Verificamos a mano cada local antes de habilitarlo a
          publicar vacantes. Es lo que evita que alguien publique avisos falsos usando el nombre de un comercio que
          no existe. Hasta que aprobemos tu local, tus vacantes no se muestran a los candidatos. Revisamos las altas
          dentro de las 48 horas hábiles.
        </div>

        <form onSubmit={handleSubmit} className="card">
          <h3>Responsable del local</h3>
          <div className="form-field">
            <label>Nombre y apellido</label>
            <input required value={form.nombre_responsable} onChange={(e) => set('nombre_responsable', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Tu teléfono de contacto directo</label>
            <input required inputMode="tel" placeholder="376 4123456" value={form.telefono} onChange={(e) => set('telefono', e.target.value)} />
            <p className="ayuda-campo">Lo usamos para verificar el alta. No se muestra a los candidatos.</p>
          </div>

          <h3 style={{ marginTop: 22 }}>Datos del local</h3>
          <div className="form-field">
            <label>Nombre de fantasía</label>
            <input required value={form.nombre_local} onChange={(e) => set('nombre_local', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Razón social</label>
            <input required value={form.razon_social} onChange={(e) => set('razon_social', e.target.value)} />
          </div>
          <div className="form-field">
            <label>CUIT con el que opera</label>
            <input required placeholder="30-12345678-9" value={form.cuit} onChange={(e) => set('cuit', e.target.value)} />
            <p className="ayuda-campo">Validamos el dígito verificador. Un CUIT solo puede tener un local registrado.</p>
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
            <p className="ayuda-campo">Por ahora Matchy funciona en Posadas y Garupá.</p>
          </div>
          <div className="form-field">
            <label>Dirección exacta</label>
            <input required placeholder="Calle, número, barrio" value={form.direccion} onChange={(e) => set('direccion', e.target.value)} />
            <p className="ayuda-campo">Tiene que ser la dirección donde funciona el local, no un domicilio particular.</p>
          </div>
          <div className="form-field">
            <label>Red social o sitio web del local</label>
            <input
              required
              placeholder="@tulocal, facebook.com/tulocal, tusitio.com.ar"
              value={form.red_social}
              onChange={(e) => set('red_social', e.target.value)}
            />
            <p className="ayuda-campo">
              Instagram, Facebook, TikTok, Google Maps, sitio web o lo que uses. Solo necesitamos algo público y
              verificable que muestre que el local existe y está en actividad.
            </p>
          </div>
          <div className="form-field">
            <label>Contacto que van a ver los candidatos</label>
            <input required value={form.contacto} onChange={(e) => set('contacto', e.target.value)} />
          </div>

          {!completandoLocal && (
            <>
              <h3 style={{ marginTop: 22 }}>Tu cuenta</h3>
              <div className="form-field">
                <label>Email</label>
                <input type="email" required autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Contraseña</label>
                <input type="password" required minLength={6} autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)} />
              </div>
            </>
          )}

          <label className="casilla-legal">
            <input type="checkbox" checked={esMayor} onChange={(e) => setEsMayor(e.target.checked)} />
            <span>Declaro que soy mayor de 18 años.</span>
          </label>

          <label className="casilla-legal">
            <input type="checkbox" checked={declaracion} onChange={(e) => setDeclaracion(e.target.checked)} />
            <span>
              Declaro bajo juramento que el local existe y está en actividad, que estoy autorizado a representarlo,
              y que las vacantes que publique van a ser reales.
            </span>
          </label>

          <label className="casilla-legal">
            <input type="checkbox" checked={sinFraude} onChange={(e) => setSinFraude(e.target.checked)} />
            <span>
              Me comprometo a no pedirle ni ofrecerle dinero a ningún candidato por el puesto o por el proceso de
              selección, a no solicitar sus claves bancarias ni documentación personal innecesaria, a no exigir
              trabajo no remunerado a modo de prueba, y a no usar Matchy para cometer fraude, estafas, trata de
              personas ni ningún otro delito. Entiendo que el incumplimiento habilita la baja inmediata de la
              cuenta y la denuncia ante la autoridad competente.
            </span>
          </label>

          <label className="casilla-legal">
            <input type="checkbox" checked={aceptaTyc} onChange={(e) => setAceptaTyc(e.target.checked)} />
            <span>
              Leí y acepto los <a href="/legal/terminos" target="_blank">términos y condiciones</a> y la{' '}
              <a href="/legal/privacidad" target="_blank">política de privacidad</a>.
            </span>
          </label>

          {error && <p style={{ color: '#B5432A' }}>{error}</p>}
          <button className="btn ancho" type="submit" disabled={cargando}>
            {cargando ? 'Guardando...' : completandoLocal ? 'Guardar mi local' : 'Registrar local'}
          </button>
        </form>
      </div>
      <Pie />
    </div>
  );
}
