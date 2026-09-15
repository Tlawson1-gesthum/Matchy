'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { TIPOS_LOCAL, cuitValido } from '../../../lib/opciones';

function traducirError(msg) {
  const m = (msg || '').toLowerCase();
  if (m.includes('rate limit')) {
    return 'Se alcanzó el límite de emails por hora. Esperá un rato e intentá de nuevo.';
  }
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'Ese email ya tiene una cuenta. Probá iniciando sesión.';
  }
  if (m.includes('password')) return 'La contraseña tiene que tener al menos 6 caracteres.';
  return msg;
}

export default function RegistroEmpleador() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '', password: '',
    nombre_responsable: '', cuit: '', razon_social: '',
    nombre_local: '', tipo_local: 'resto', direccion: '',
    telefono: '', red_social: '', contacto: '',
  });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!cuitValido(form.cuit)) {
      setError('El CUIT/CUIL no es válido. Revisá que tenga 11 dígitos y esté bien copiado.');
      return;
    }

    setCargando(true);
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
      setError('Tu cuenta se creó, pero falta confirmar el email. Revisá tu casilla (y el spam) y volvé a iniciar sesión.');
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      await supabase.from('perfiles').insert({ id: userId, role: 'empleador', email: form.email });
      await supabase.from('empleadores').insert({
        id: userId,
        nombre_responsable: form.nombre_responsable,
        cuit: form.cuit.replace(/[^0-9]/g, ''),
        razon_social: form.razon_social,
        nombre_local: form.nombre_local,
        tipo_local: form.tipo_local,
        direccion: form.direccion,
        telefono: form.telefono,
        red_social: form.red_social,
        contacto: form.contacto,
        ciudad: 'Posadas',
        estado: 'pendiente',
      });
    }

    setCargando(false);
    router.push('/empleador/vacantes');
  }

  return (
    <div>
      <div className="navbar">
        <a className="logo" href="/">Matchy</a>
      </div>
      <div className="container" style={{ maxWidth: 520 }}>
        <h1>Registrá tu local</h1>
        <p>¿Ya sos usuario? <Link href="/empleador/login">Iniciá sesión</Link>.</p>
        <div className="tip">
          Pedimos estos datos para confirmar que el local existe de verdad. Revisamos cada alta a mano antes de
          habilitar la publicación de vacantes: normalmente lo resolvemos dentro del día.
        </div>

        <form onSubmit={handleSubmit} className="card">
          <h3>Sobre vos</h3>
          <div className="form-field">
            <label>Nombre y apellido del responsable</label>
            <input required value={form.nombre_responsable} onChange={(e) => set('nombre_responsable', e.target.value)} />
          </div>

          <h3 style={{ marginTop: 20 }}>Sobre el local</h3>
          <div className="form-field">
            <label>Nombre de fantasía (como lo conoce la gente)</label>
            <input required value={form.nombre_local} onChange={(e) => set('nombre_local', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Razón social</label>
            <input required value={form.razon_social} onChange={(e) => set('razon_social', e.target.value)} />
          </div>
          <div className="form-field">
            <label>CUIT / CUIL con el que opera</label>
            <input required placeholder="30-12345678-9" value={form.cuit} onChange={(e) => set('cuit', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Tipo de local</label>
            <select value={form.tipo_local} onChange={(e) => set('tipo_local', e.target.value)}>
              {TIPOS_LOCAL.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Dirección exacta del local</label>
            <input required placeholder="Calle, número, barrio" value={form.direccion} onChange={(e) => set('direccion', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Teléfono del local</label>
            <input required value={form.telefono} onChange={(e) => set('telefono', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Instagram o Facebook del local</label>
            <input required placeholder="@tulocal" value={form.red_social} onChange={(e) => set('red_social', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Contacto que van a ver los candidatos</label>
            <input required value={form.contacto} onChange={(e) => set('contacto', e.target.value)} />
          </div>

          <h3 style={{ marginTop: 20 }}>Tu cuenta</h3>
          <div className="form-field">
            <label>Email</label>
            <input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Contraseña</label>
            <input type="password" required minLength={6} value={form.password} onChange={(e) => set('password', e.target.value)} />
          </div>

          {error && <p style={{ color: '#B5432A' }}>{error}</p>}
          <button className="btn" type="submit" disabled={cargando}>
            {cargando ? 'Creando cuenta...' : 'Registrar local'}
          </button>
        </form>

        <p style={{ marginTop: 16, marginBottom: 40 }}>
          Si no tenés una cuenta, completá el formulario de arriba para registrar tu local.
        </p>
      </div>
    </div>
  );
}
