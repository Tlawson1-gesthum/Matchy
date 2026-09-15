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
      setError(errAuth.message);
      setCargando(false);
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
          <label>Ciudad</label>
          <input value={form.ciudad} onChange={(e) => set('ciudad', e.target.value)} />
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
        ¿Ya tenés cuenta? <Link href="/empleador/login">Iniciá sesión</Link>
      </p>
    </div>
  );
}
