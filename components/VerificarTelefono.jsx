'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// Verificación por código de un solo uso enviado por WhatsApp o SMS.
// Requiere que el proveedor de teléfono esté configurado en Supabase
// (Authentication → Sign In / Providers → Phone).
export default function VerificarTelefono({ telefonoInicial = '', verificadoAt, onVerificado }) {
  const [telefono, setTelefono] = useState(telefonoInicial);
  const [codigo, setCodigo] = useState('');
  const [etapa, setEtapa] = useState(verificadoAt ? 'listo' : 'inicio');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  function normalizar(n) {
    const d = (n || '').replace(/[^0-9]/g, '');
    if (!d) return '';
    if (d.startsWith('54')) return '+' + d;
    return '+549' + d.replace(/^0/, '').replace(/^15/, '');
  }

  async function enviarCodigo() {
    setError('');
    const numero = normalizar(telefono);
    if (numero.length < 12) {
      setError('Revisá el número. Poné característica y número, por ejemplo 376 4123456.');
      return;
    }
    setCargando(true);
    const { error: err } = await supabase.auth.updateUser({ phone: numero });
    setCargando(false);
    if (err) {
      setError(
        err.message?.toLowerCase().includes('provider')
          ? 'La verificación por WhatsApp todavía no está habilitada. Avisale al administrador.'
          : 'No pudimos enviar el código: ' + err.message
      );
      return;
    }
    setEtapa('codigo');
  }

  async function confirmarCodigo() {
    setError('');
    setCargando(true);
    const numero = normalizar(telefono);
    const { error: err } = await supabase.auth.verifyOtp({
      phone: numero,
      token: codigo.trim(),
      type: 'phone_change',
    });
    setCargando(false);
    if (err) {
      setError('El código no es correcto o venció. Pedí uno nuevo.');
      return;
    }
    setEtapa('listo');
    if (onVerificado) onVerificado(numero);
  }

  if (etapa === 'listo') {
    return (
      <div className="aviso-postulado">
        <strong>Teléfono verificado.</strong> {telefono ? `Confirmamos el ${telefono}.` : ''}
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <h3>Verificá tu teléfono</h3>
      <p style={{ fontSize: '0.9rem' }}>
        Te mandamos un código por WhatsApp. Verificar el teléfono le da confianza a la otra parte y nos ayuda a
        mantener afuera a las cuentas falsas.
      </p>

      {etapa === 'inicio' && (
        <>
          <div className="form-field">
            <label>Tu número de WhatsApp</label>
            <input
              inputMode="tel"
              placeholder="376 4123456"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>
          {error && <p style={{ color: '#B5432A' }}>{error}</p>}
          <button className="btn" type="button" onClick={enviarCodigo} disabled={cargando}>
            {cargando ? 'Enviando...' : 'Enviarme el código'}
          </button>
        </>
      )}

      {etapa === 'codigo' && (
        <>
          <div className="form-field">
            <label>Código que te llegó</label>
            <input inputMode="numeric" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
          </div>
          {error && <p style={{ color: '#B5432A' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn" type="button" onClick={confirmarCodigo} disabled={cargando}>
              {cargando ? 'Verificando...' : 'Confirmar'}
            </button>
            <button className="btn blanco" type="button" onClick={() => setEtapa('inicio')}>
              Cambiar el número
            </button>
          </div>
        </>
      )}
    </div>
  );
}
