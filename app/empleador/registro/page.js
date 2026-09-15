'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';

const TIPOS_LOCAL = [
  { value: 'bar', label: 'Bar' },
  { value: 'resto', label: 'Restaurante' },
  { value: 'resto_bar', label: 'Resto-bar' },
  { value: 'cadena', label: 'Cadena' },
  { value: 'catering', label: 'Catering' },
  { value: 'otro', label: 'Otro' },
];

function traducirError(msg) {
  const m = (msg || '').toLowerCase();
  if (m.includes('rate limit')) {
    return 'Se alcanzó el límite de emails por hora de Supabase. Esperá un rato o desactivá la confirmación por email en Supabase (Authentication → Providers → Email).';
  }
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'Ese email ya tiene una cuenta. Probá iniciando sesión.';
  }
  if (m.includes('password')) {
    return 'La contraseña tiene que tener al menos 6 caracteres.';
  }
  return msg;
}

export default function RegistroEmpleador() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: '',
    nombre_local: '',
    tipo_local: 'resto',
    ciudad: 'Posadas',
    contacto: '',
  });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
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
      setError(
        'Tu cuenta se creó, pero falta confirmar el email. Revisá tu casilla (y la carpeta de spam) y volvé a iniciar sesión.'
      );
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      await supabase.from('perfiles').insert({ id: userId, role: 'empleador', email: form.email });
      await supabase.from('empleadores').insert({
        id: userId,
        nombre_local: form.nombre_local,
        tipo_local: form.tipo_local,
        ciudad: form.ciudad,
        contacto: form.contacto,
      });
    }

    setCargando(false);
    router.push('/empleador/vacantes');
  }

  return (
    <div className="container" style={{ maxWidth: 460 }}>
      <h1>Registrá tu local</h1>
      <p>¿Ya sos usuario? <Link href="/empleador/login">Iniciá sesión</Link>.</p>
      <form onSubmit={handleSubmit} className="card">
        <div className="form-field">
          <label>Nombre del local</label>
          <input
            required
            value={form.nombre_local}
            onChange={(e) => set('nombre_local', e.target.value)}
          />
        </div>
        <div className="form-field">
          <label>Tipo de local</label>
          <select value={form.tipo_local} onChange={(e) => set('tipo_local', e.target.value)}>
            {TIPOS_LOCAL.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label>Contacto (WhatsApp o email visible para candidatos)</label>
          <input required value={form.contacto} onChange={(e) => set('contacto', e.target.value)} />
        </div>
        <div className="form-field">
          <label>Email de la cuenta</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
          />
        </div>
        <div className="form-field">
          <label>Contraseña</label>
          <input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
          />
        </div>
        {error && <p style={{ color: '#B5432A' }}>{error}</p>}
        <button className="btn" type="submit" disabled={cargando}>
          {cargando ? 'Creando cuenta...' : 'Crear cuenta de empleador'}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        Si no tenés una cuenta, completá el formulario de arriba para registrar tu local.
      </p>
    </div>
  );
}
