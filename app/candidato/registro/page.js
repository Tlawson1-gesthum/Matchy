'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import BotonGoogle from '../../../components/BotonGoogle';
import CampoContrasena from '../../../components/CampoContrasena';
import GuardiaRol from '../../../components/GuardiaRol';
import Encabezado from '../../../components/Encabezado';
import Pie from '../../../components/Pie';

function traducirError(msg) {
  const m = (msg || '').toLowerCase();
  if (m.includes('rate limit')) return 'Se alcanzó el límite de intentos por hora. Esperá un rato y probá de nuevo.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Ese email ya tiene una cuenta. Iniciá sesión.';
  if (m.includes('password')) return 'La contraseña tiene que tener al menos 6 caracteres.';
  if (m.includes('invalid') && m.includes('email')) return 'Ese email no parece válido.';
  return msg;
}

function RegistroCandidatoContenido() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [aceptaTyc, setAceptaTyc] = useState(false);
  const [esMayor, setEsMayor] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setAviso('');

    if (!nombre.trim() || !apellido.trim()) {
      setError('Completá tu nombre y tu apellido.');
      return;
    }
    if (password !== password2) {
      setError('Las contraseñas no coinciden. Escribilas de nuevo.');
      return;
    }
    if (!esMayor) {
      setError('Para usar Voral tenés que ser mayor de 18 años.');
      return;
    }
    if (!aceptaTyc) {
      setError('Necesitamos que aceptes los términos y la política de privacidad para crear tu cuenta.');
      return;
    }

    setCargando(true);

    const nombreCompleto = `${nombre.trim()} ${apellido.trim()}`;
    const ahora = new Date().toISOString();
    // El nombre y las declaraciones viajan con la cuenta: si hay que confirmar el
    // email, el perfil se crea después (en /auth/callback) con estos mismos datos.
    const { data, error: errAuth } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: nombreCompleto, nombre: nombre.trim(), apellido: apellido.trim(), declara_mayor_edad: esMayor, acepto_tyc_at: ahora },
        emailRedirectTo: `${window.location.origin}/auth/callback?rol=candidato`,
      },
    });
    if (errAuth) {
      setError(traducirError(errAuth.message));
      setCargando(false);
      return;
    }

    if (!data.session) {
      setCargando(false);
      setAviso(`Te mandamos un mail a ${email} para confirmar tu cuenta. Tocá el enlace del mail y seguís desde ahí. Si no lo ves, revisá el spam.`);
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      await supabase.from('perfiles').insert({ id: userId, role: 'candidato', email });
      await supabase.from('cvs').insert({
        id: userId,
        nombre: nombreCompleto,
        acepto_tyc_at: ahora,
        declara_mayor_edad: esMayor,
        declaracion_edad_at: ahora,
      });
    }

    setCargando(false);
    router.push('/candidato/consentimiento');
  }

  return (
    <div>
      <Encabezado links={[{ href: '/cv-modelo', texto: 'CV de ejemplo' }]} />

      <div className="panel-auth" style={{ paddingTop: 36 }}>
        <h1>Creá tu cuenta</h1>
        <p className="auth-intro">
          Gratis para siempre si buscás trabajo. En diez minutos tenés un CV listo para descargar y para postularte
          a los locales de Posadas.
        </p>

        <div className="card">
          <p style={{ marginTop: 0, fontSize: '0.9rem' }}>
            ¿Ya sos usuario? <Link href="/candidato/login">Iniciá sesión</Link>.
          </p>

          <BotonGoogle rol="candidato" texto="Continuar con Google" destacado />

          <div className="linea-o">o con tu email</div>

          <form onSubmit={handleSubmit}>
            <div className="fila-nombre">
              <div className="form-field">
                <label htmlFor="registro-nombre">Nombre</label>
                <input id="registro-nombre" required autoComplete="given-name" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </div>
              <div className="form-field">
                <label htmlFor="registro-apellido">Apellido</label>
                <input id="registro-apellido" required autoComplete="family-name" value={apellido} onChange={(e) => setApellido(e.target.value)} />
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="registro-email">Email</label>
              <input
                id="registro-email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <CampoContrasena
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              ayuda="Mínimo 6 caracteres."
            />
            <CampoContrasena
              etiqueta="Repetir contraseña"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              ayuda={password2 && password2 !== password ? 'Todavía no coincide con la contraseña.' : undefined}
            />

            <label className="casilla-legal">
              <input type="checkbox" checked={esMayor} onChange={(e) => setEsMayor(e.target.checked)} />
              <span>
                Declaro bajo mi responsabilidad que soy mayor de 18 años. Sé que una declaración falsa puede tener
                consecuencias legales y que Voral da de baja las cuentas de menores de edad apenas las detecta.
              </span>
            </label>

            <label className="casilla-legal">
              <input type="checkbox" checked={aceptaTyc} onChange={(e) => setAceptaTyc(e.target.checked)} />
              <span>
                Leí y acepto los <a href="/legal/terminos" target="_blank">términos y condiciones</a> y la{' '}
                <a href="/legal/privacidad" target="_blank">política de privacidad</a>, incluida la transferencia
                de mis datos a servidores ubicados fuera del país que allí se detalla.
              </span>
            </label>

            {error && <p className="mensaje-error" role="alert">{error}</p>}
            {aviso && <p className="tip" role="status">{aviso}</p>}

            <button className="btn ancho" type="submit" disabled={cargando || !!aviso}>
              {cargando ? 'Creando tu cuenta...' : 'Crear cuenta y armar mi CV'}
            </button>
          </form>
        </div>

        <p className="ayuda-contraste" style={{ marginTop: 16 }}>
          Antes de publicar nada te vamos a explicar exactamente qué datos quedan visibles, y solo seguís si estás
          de acuerdo.
        </p>
      </div>
      <Pie />
    </div>
  );
}

export default function RegistroCandidato(props) {
  return (
    <GuardiaRol rol="candidato">
      <RegistroCandidatoContenido {...props} />
    </GuardiaRol>
  );
}
