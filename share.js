/**
 * Utilidad para compartir documentos y enlaces por WhatsApp
 * Soporta:
 * 1. Envío de archivo real (PDF) vía navigator.share() en dispositivos móviles compatibles.
 * 2. Envío de mensaje preformateado con enlace a través de wa.me.
 * 3. Modal interactivo con memoria de número de teléfono y selección de contactos.
 */

(function () {
  // Estructura del modal y del indicador de carga
  let modalInitialized = false;
  let currentDoc = { nombre: '', url: '', esCarpeta: false };

  function initShareUI() {
    if (modalInitialized) return;
    modalInitialized = true;

    // Toast de carga
    const toast = document.createElement('div');
    toast.id = 'shareToast';
    toast.className = 'share-toast';
    toast.innerHTML = `
      <div class="share-spinner"></div>
      <span id="shareToastMsg">Preparando archivo para compartir...</span>
    `;
    document.body.appendChild(toast);

    // Modal para ingresar número o elegir contacto
    const modal = document.createElement('div');
    modal.id = 'shareModal';
    modal.className = 'share-modal-overlay';
    modal.innerHTML = `
      <div class="share-modal-card" role="dialog" aria-modal="true">
        <div class="share-modal-header">
          <div class="share-modal-title">
            <i class="ph-fill ph-whatsapp-logo" style="color: #25D366; font-size: 26px;"></i>
            <h3>Compartir por WhatsApp</h3>
          </div>
          <button type="button" class="share-modal-close" id="shareCloseBtn" aria-label="Cerrar">&times;</button>
        </div>

        <div class="share-modal-body">
          <div class="share-doc-preview">
            <i id="shareDocIcon" class="ph ph-file-pdf"></i>
            <div>
              <strong id="shareDocNombre">Documento</strong>
              <small id="shareDocTipo">Archivo PDF</small>
            </div>
          </div>

          <label for="sharePhoneInput" class="share-input-label">Número de WhatsApp (10 dígitos):</label>
          <div class="share-input-group">
            <span class="share-input-prefix">+52</span>
            <input type="tel" id="sharePhoneInput" placeholder="Ej. 4811234567" maxlength="15" autocomplete="tel" />
          </div>

          <button type="button" id="shareSendDirectBtn" class="share-btn share-btn-primary">
            <i class="ph ph-paper-plane-right"></i> Enviar a este número
          </button>

          <div class="share-divider"><span>o elige tu chat</span></div>

          <button type="button" id="shareChooseContactBtn" class="share-btn share-btn-secondary">
            <i class="ph ph-chats-circle"></i> Elegir contacto en WhatsApp
          </button>

          <button type="button" id="shareCopyLinkBtn" class="share-btn share-btn-ghost">
            <i class="ph ph-copy"></i> Copiar enlace al portapapeles
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Eventos del modal
    const closeBtn = document.getElementById('shareCloseBtn');
    const sendDirectBtn = document.getElementById('shareSendDirectBtn');
    const chooseContactBtn = document.getElementById('shareChooseContactBtn');
    const copyLinkBtn = document.getElementById('shareCopyLinkBtn');
    const phoneInput = document.getElementById('sharePhoneInput');

    closeBtn.addEventListener('click', cerrarModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) cerrarModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        cerrarModal();
      }
    });

    sendDirectBtn.addEventListener('click', () => {
      const raw = phoneInput.value.replace(/\D/g, '');
      if (!raw || raw.length < 10) {
        alert('Por favor introduce un número válido a 10 dígitos.');
        phoneInput.focus();
        return;
      }
      // Guardar último número usado
      localStorage.setItem('last_wa_phone', raw);

      const phone = raw.length === 10 ? '52' + raw : raw;
      const mensaje = armarMensajeTexto(currentDoc.nombre, currentDoc.url);
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`, '_blank');
      cerrarModal();
    });

    chooseContactBtn.addEventListener('click', () => {
      const mensaje = armarMensajeTexto(currentDoc.nombre, currentDoc.url);
      window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
      cerrarModal();
    });

    copyLinkBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(currentDoc.url).then(() => {
        const originalText = copyLinkBtn.innerHTML;
        copyLinkBtn.innerHTML = '<i class="ph ph-check"></i> ¡Enlace copiado!';
        setTimeout(() => {
          copyLinkBtn.innerHTML = originalText;
        }, 2000);
      });
    });

    // Enter en input envía directo
    phoneInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        sendDirectBtn.click();
      }
    });
  }

  function mostrarToast(mensaje) {
    const toast = document.getElementById('shareToast');
    const msg = document.getElementById('shareToastMsg');
    if (toast && msg) {
      msg.textContent = mensaje;
      toast.classList.add('visible');
    }
  }

  function ocultarToast() {
    const toast = document.getElementById('shareToast');
    if (toast) {
      toast.classList.remove('visible');
    }
  }

  function abrirModal(nombre, url, esCarpeta) {
    initShareUI();
    currentDoc = { nombre, url, esCarpeta };

    const modal = document.getElementById('shareModal');
    const nombreEl = document.getElementById('shareDocNombre');
    const tipoEl = document.getElementById('shareDocTipo');
    const iconEl = document.getElementById('shareDocIcon');
    const phoneInput = document.getElementById('sharePhoneInput');

    nombreEl.textContent = nombre;
    tipoEl.textContent = esCarpeta ? 'Carpeta de Google Drive' : 'Documento PDF';
    iconEl.className = esCarpeta ? 'ph ph-folder' : 'ph ph-file-pdf';

    const savedPhone = localStorage.getItem('last_wa_phone') || '';
    phoneInput.value = savedPhone;

    modal.classList.add('active');
    setTimeout(() => phoneInput.focus(), 150);
  }

  function cerrarModal() {
    const modal = document.getElementById('shareModal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  function armarMensajeTexto(nombre, url) {
    return `Hola, te comparto el documento *${nombre}* de Región CD Valles:\n${url}`;
  }

  function extraerDriveFileId(url) {
    if (!url) return null;
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) return fileMatch[1];
    const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idParamMatch) return idParamMatch[1];
    return null;
  }

  /**
   * Función principal que se invoca desde los botones de compartir
   * @param {string} nombre - Nombre del documento
   * @param {string} url - Enlace original del documento o carpeta
   * @param {boolean} [esCarpeta=false] - Si es una carpeta de Drive
   */
  async function compartirDocumento(nombre, url, esCarpeta = false) {
    initShareUI();

    const fileId = !esCarpeta ? extraerDriveFileId(url) : null;

    // Verificar si el navegador móvil soporta compartir archivos nativos
    let puedeCompartirArchivos = false;
    if (navigator.canShare && fileId) {
      try {
        const dummyFile = new File([''], 'test.pdf', { type: 'application/pdf' });
        puedeCompartirArchivos = navigator.canShare({ files: [dummyFile] });
      } catch (e) {
        puedeCompartirArchivos = false;
      }
    }

    // 1. Si soporta compartir archivos directamente (típico en celulares con WhatsApp instalado)
    if (puedeCompartirArchivos && fileId) {
      mostrarToast('Descargando archivo PDF para WhatsApp...');
      try {
        const directUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;
        const res = await fetch(directUrl);
        if (res.ok) {
          const blob = await res.blob();
          const cleanName = nombre.toLowerCase().endsWith('.pdf') ? nombre : `${nombre}.pdf`;
          const file = new File([blob], cleanName, { type: 'application/pdf' });

          ocultarToast();
          await navigator.share({
            files: [file],
            title: nombre,
            text: `Te comparto: ${nombre}`
          });
          return; // Compartido exitosamente como archivo adjunto
        }
      } catch (err) {
        ocultarToast();
        // Si el usuario canceló la hoja de compartir nativa, no hacemos nada
        if (err.name === 'AbortError') {
          return;
        }
        console.warn('No se pudo compartir como archivo, intentando enlace...', err);
      }
    }

    // 2. Si soporta navigator.share solo para enlaces (celular compartiendo texto/url)
    if (navigator.share) {
      try {
        await navigator.share({
          title: nombre,
          text: `Te comparto el documento *${nombre}*:`,
          url: url
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') {
          return;
        }
      }
    }

    // 3. Fallback para PC o navegadores sin navigator.share: abrir modal con número de WhatsApp
    ocultarToast();
    abrirModal(nombre, url, esCarpeta);
  }

  // Exponer globalmente
  window.compartirDocumento = compartirDocumento;
  window.abrirModalWhatsApp = abrirModal;

  // Inicializar listeners cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShareUI);
  } else {
    initShareUI();
  }
})();
