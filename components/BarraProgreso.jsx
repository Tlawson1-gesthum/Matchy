// Barra de progreso simple: muestra qué tan completo está un perfil.
// Verde cuando llega al 100%, ámbar mientras falta.
export default function BarraProgreso({ pct, margin = '6px 0 0' }) {
  const valor = Math.max(0, Math.min(100, pct || 0));
  return (
    <div
      style={{ background: '#EFEDE8', borderRadius: 6, height: 8, margin }}
      role="progressbar"
      aria-valuenow={valor}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        style={{
          width: `${valor}%`,
          background: valor === 100 ? '#2B4632' : '#D9A441',
          height: 8,
          borderRadius: 6,
        }}
      />
    </div>
  );
}
