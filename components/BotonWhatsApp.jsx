// Botón sólido para abrir una conversación de WhatsApp.
// Usa un ícono genérico de chat: el texto del botón ya indica que es WhatsApp.
export default function BotonWhatsApp({ href, texto = 'Escribir por WhatsApp' }) {
  if (!href) return null;
  return (
    <a className="btn-whatsapp" href={href} target="_blank" rel="noreferrer">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.6-5.2A8.5 8.5 0 1 1 21 11.5Z" />
        <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5" />
      </svg>
      <span>{texto}</span>
      <span className="solo-lector"> (se abre en otra pestaña)</span>
    </a>
  );
}
