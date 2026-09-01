import { Platform } from 'react-native';

/**
 * Injeta estilos CSS globais para personalizar e garantir a visibilidade
 * das barras de rolagem (scrollbars) quando a aplicação é executada na Web.
 */
export const injectWebScrollbarStyles = (): void => {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return;
  }

  const styleId = 'readsub-web-scrollbars';
  if (document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Scrollbars para navegadores modernos (Firefox, etc) */
    * {
      scrollbar-width: thin;
      scrollbar-color: #3B82F6 #0F172A;
    }

    /* Scrollbars para WebKit e Chromium (Chrome, Edge, Safari, Brave, Opera) */
    ::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }

    ::-webkit-scrollbar-track {
      background: #090D16;
      border-radius: 5px;
    }

    ::-webkit-scrollbar-thumb {
      background: #334155;
      border-radius: 5px;
      border: 2px solid #090D16;
      min-height: 30px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: #3B82F6;
    }

    ::-webkit-scrollbar-thumb:active {
      background: #2563EB;
    }

    ::-webkit-scrollbar-corner {
      background: #090D16;
    }

    /* Garante rolagem fluida e sem bloqueios na Web */
    html, body {
      background-color: #090D16;
      overflow-y: auto !important;
      scrollbar-color: #3B82F6 #0F172A;
    }

    #root {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
  `;

  document.head.appendChild(style);
};
