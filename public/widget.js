(function() {
  // Prevent duplicate initialization
  if (window.LibertyBotInitialized) return;
  window.LibertyBotInitialized = true;

  // 1. Get settings
  const settings = window.LIBERTYBOT_SETTINGS || {};
  const primaryColor = settings.primaryColor || '#06b6d4';
  const welcomeMessage = settings.welcomeMessage || '';
  
  // Resolve host url from script src
  const scriptElement = document.currentScript;
  let hostUrl = 'http://localhost:3000';
  if (scriptElement && scriptElement.src) {
    try {
      const url = new URL(scriptElement.src);
      hostUrl = url.origin;
    } catch (e) {
      console.error('Error resolving host URL:', e);
    }
  }

  // 2. Inject CSS
  const style = document.createElement('style');
  style.textContent = `
    .libertybot-launcher {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${primaryColor};
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 999999;
      border: none;
      outline: none;
    }
    .libertybot-launcher:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
    }
    .libertybot-launcher svg {
      width: 26px;
      height: 26px;
      fill: none;
      stroke: white;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      transition: transform 0.3s ease;
    }
    .libertybot-launcher.active svg {
      transform: rotate(90deg);
    }
    
    .libertybot-container {
      position: fixed;
      bottom: 100px;
      right: 24px;
      width: 440px;
      height: 680px;
      max-height: calc(100vh - 120px);
      max-width: calc(100vw - 48px);
      border-radius: 16px;
      background: #09090b;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.05);
      overflow: hidden;
      z-index: 999999;
      opacity: 0;
      transform: translateY(16px) scale(0.95);
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .libertybot-container.active {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }
    .libertybot-iframe {
      width: 100%;
      height: 100%;
      border: none;
      background: transparent;
    }
    
    @media (max-width: 480px) {
      .libertybot-container {
        bottom: 0 !important;
        right: 0 !important;
        width: 100% !important;
        height: 100% !important;
        max-height: 100% !important;
        max-width: 100% !important;
        border-radius: 0 !important;
        border: none !important;
      }
      .libertybot-launcher.active {
        bottom: 24px !important;
        right: 24px !important;
        width: 50px !important;
        height: 50px !important;
        box-shadow: none !important;
      }
    }
  `;
  document.head.appendChild(style);

  // 3. Create elements
  const launcher = document.createElement('button');
  launcher.className = 'libertybot-launcher';
  launcher.setAttribute('aria-label', 'Open support chat');
  launcher.innerHTML = `
    <svg viewBox="0 0 24 24" id="libertybot-icon-chat">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;

  const container = document.createElement('div');
  container.className = 'libertybot-container';

  // Build iframe URL with parameters
  const queryParams = [];
  if (primaryColor) queryParams.push(`color=${encodeURIComponent(primaryColor)}`);
  if (welcomeMessage) queryParams.push(`welcome=${encodeURIComponent(welcomeMessage)}`);
  const iframeUrl = `${hostUrl}/widget${queryParams.length > 0 ? '?' + queryParams.join('&') : ''}`;

  const iframe = document.createElement('iframe');
  iframe.className = 'libertybot-iframe';
  iframe.src = iframeUrl;
  iframe.title = 'Liberty TI Support Chatbot';
  iframe.allow = 'clipboard-write';

  container.appendChild(iframe);
  document.body.appendChild(launcher);
  document.body.appendChild(container);

  // 4. Interaction logic
  let isOpen = false;

  function toggleChat() {
    isOpen = !isOpen;
    if (isOpen) {
      launcher.classList.add('active');
      container.classList.add('active');
      launcher.innerHTML = `
        <svg viewBox="0 0 24 24" id="libertybot-icon-close">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
    } else {
      launcher.classList.remove('active');
      container.classList.remove('active');
      launcher.innerHTML = `
        <svg viewBox="0 0 24 24" id="libertybot-icon-chat">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      `;
    }
  }

  launcher.addEventListener('click', toggleChat);
})();
