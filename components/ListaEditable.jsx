'use client';

import { useState } from 'react';

// Lista editable con botón "Agregar" y "Quitar".
// Si se le pasa "niveles", cada elemento guarda {nombre, nivel};
// si no, guarda strings sueltos.
export default function ListaEditable({ items, onChange, niveles, placeholder }) {
  const [texto, setTexto] = useState('');
  const [nivel, setNivel] = useState(niveles ? niveles[0].value : null);

  function agregar() {
    const limpio = texto.trim();
    if (!limpio) return;
    const nuevo = niveles ? { nombre: limpio, nivel } : limpio;
    onChange([...(items || []), nuevo]);
    setTexto('');
    if (niveles) setNivel(niveles[0].value);
  }

  function quitar(i) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  function manejarTecla(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      agregar();
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          style={{ flex: '1 1 180px', padding: '10px 12px', borderRadius: 6, border: '1px solid #ccc2a8' }}
          value={texto}
          placeholder={placeholder}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={manejarTecla}
        />
        {niveles && (
          <select
            value={nivel}
            onChange={(e) => setNivel(e.target.value)}
            style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #ccc2a8' }}
          >
            {niveles.map((n) => (
              <option key={n.value} value={n.value}>{n.label}</option>
            ))}
          </select>
        )}
        <button type="button" className="btn-accion" onClick={agregar}>Agregar</button>
      </div>

      {(items || []).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {items.map((it, i) => (
            <span
              key={i}
              style={{
                background: '#F2F0EA',
                border: '1px solid #E2DED6',
                borderRadius: 20,
                padding: '6px 12px',
                fontSize: '0.88rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {niveles ? `${it.nombre} · ${niveles.find((n) => n.value === it.nivel)?.label || it.nivel}` : it}
              <button
                type="button"
                onClick={() => quitar(i)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#B5432A', fontWeight: 700 }}
                aria-label="Quitar"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
