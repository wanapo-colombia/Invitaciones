(function(){
  const body = document.body;
  const introScreen = document.getElementById('intro-screen');
  const envelope = document.getElementById('envelope');
  const countdown = document.getElementById('countdown');
  const musicBtn = document.getElementById('music-btn');
  const musicHint = document.getElementById('music-hint');
  const audio = document.getElementById('bg-music');
  const floatingLayer = document.getElementById('floating-layer');
  const rsvpForm = document.getElementById('rsvp-form');
  const rsvpFeedback = document.getElementById('rsvp-feedback');
  const personasField = document.getElementById('personas-field');
  const personasSelect = document.getElementById('personas');
  const asisteRadios = document.querySelectorAll('input[name="asistencia"]');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const paseReservado = document.getElementById('pase-reservado');
  const paseReservadoNombre = document.getElementById('pase-reservado-nombre');
  const paseReservadoPersonas = document.getElementById('pase-reservado-personas');
  const invitadoIdInput = document.getElementById('invitado-id');
  const nombreInput = document.getElementById('nombre');
  const introGuest = document.getElementById('intro-guest');
  const introGuestNombre = document.getElementById('intro-guest-nombre');

  // Fecha del evento: 18 de Octubre, 2026, 6:00 PM hora de Bogotá (UTC-05:00)
  const EVENT_DATE = new Date('2026-10-18T18:00:00-05:00').getTime();

  // URL de tu Google Apps Script Web App (ver instrucciones "google-sheet-setup.md")
  // Reemplaza esto con la URL que te da Google al desplegar el script.
  const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbwh5PUJsWzo-Mr_SIP9-ZYDvJ8WU8-X1mlH11GCpseScRpAyVYysdF-sNwdYEKohtEgAA/exec';

  const INTRO_EXIT_DELAY = 640;
  const FLOAT_INTERVAL = 1400;
  const FLOAT_SYMBOLS = ['✦', '❖', '✿'];

  const state = {
    invitationOpened: false,
    audioBlocked: false,
    floatTimer: null,
    autoOpenTimer: null,
    countdownTimer: null,
    hintTimer: null
  };

  // Si comentas el bloque de audio en el HTML, estos elementos serán null.
  // Todas las funciones de abajo revisan que existan antes de usarlos.
  if (audio) {
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0.85;
  }

  function updateMusicButton(isPlaying){
    if (!musicBtn) return;

    musicBtn.classList.add('visible');
    musicBtn.classList.toggle('is-playing', isPlaying);
    const icon = musicBtn.querySelector('i');
    const label = musicBtn.querySelector('.music-btn__text');

    if (isPlaying) {
      if (icon) icon.className = 'fas fa-compact-disc';
      if (label) label.textContent = 'Pausar música';
    } else {
      if (icon) icon.className = 'fas fa-music';
      if (label) label.textContent = state.audioBlocked ? 'Activar música' : 'Reproducir música';
    }
  }

  function showMusicHint(message){
    if (!musicHint) return;

    if (message) {
      musicHint.innerHTML = '<strong>Tip:</strong> ' + message;
    }
    musicHint.classList.add('show');
    clearTimeout(state.hintTimer);
    state.hintTimer = setTimeout(() => {
      musicHint.classList.remove('show');
    }, 4200);
  }

  function hideMusicHint(){
    if (!musicHint) return;
    musicHint.classList.remove('show');
  }

  async function attemptPlayAudio(fromGesture = false){
    if (!audio) return false;

    try {
      await audio.play();
      state.audioBlocked = false;
      updateMusicButton(true);
      hideMusicHint();
      return true;
    } catch (error) {
      state.audioBlocked = true;
      updateMusicButton(false);
      if (!fromGesture) {
        showMusicHint('si no escuchas la canción, toca el botón para activarla.');
      }
      return false;
    }
  }

  async function toggleMusic(){
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      updateMusicButton(false);
      return;
    }

    const played = await attemptPlayAudio(true);
    if (!played) {
      showMusicHint('el navegador necesita un toque claro. Presiona nuevamente el botón de música.');
    }
  }

  function renderCountdown(){
    const now = Date.now();
    const diff = EVENT_DATE - now;

    if (diff <= 0) {
      countdown.innerHTML = `
        <div class="time-box" style="grid-column:1 / -1;">
          <div class="time-value">¡Hoy nos casamos!</div>
          <div class="time-label">Gracias por celebrar con nosotros</div>
        </div>
      `;
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    const values = [
      { value: days, label: 'Días' },
      { value: hours, label: 'Horas' },
      { value: minutes, label: 'Minutos' },
      { value: seconds, label: 'Segundos' }
    ];

    countdown.innerHTML = values.map(item => `
      <div class="time-box">
        <div class="time-value">${String(item.value).padStart(2, '0')}</div>
        <div class="time-label">${item.label}</div>
      </div>
    `).join('');
  }

  function createFloatingItem(){
    if (!floatingLayer) return;
    if (prefersReducedMotion.matches || document.hidden) return;

    if (floatingLayer.childElementCount > 12) {
      floatingLayer.firstElementChild?.remove();
    }

    const el = document.createElement('span');
    el.className = 'float-item';
    el.textContent = FLOAT_SYMBOLS[Math.floor(Math.random() * FLOAT_SYMBOLS.length)];

    const size = Math.floor(Math.random() * 14) + 14;
    const left = Math.random() * 88 + 6;
    const duration = Math.floor(Math.random() * 2600) + 8200;
    const drift = Math.floor(Math.random() * 60) - 30;
    const rotate = Math.floor(Math.random() * 40) - 20;

    el.style.left = left + 'vw';
    el.style.fontSize = size + 'px';
    el.style.setProperty('--drift', drift + 'px');
    el.style.setProperty('--rotate', rotate + 'deg');
    el.style.animationDuration = duration + 'ms';

    floatingLayer.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  function startFloating(){
    if (!floatingLayer) return;
    if (state.floatTimer || prefersReducedMotion.matches) return;

    for (let i = 0; i < 4; i += 1) {
      setTimeout(createFloatingItem, i * 260);
    }

    state.floatTimer = window.setInterval(createFloatingItem, FLOAT_INTERVAL);
  }

  function stopFloating(){
    if (state.floatTimer) {
      clearInterval(state.floatTimer);
      state.floatTimer = null;
    }
  }

  function unlockScroll(){
    body.classList.remove('locked');
  }

  function openInvitation(source = 'manual'){
    if (state.invitationOpened) return;

    state.invitationOpened = true;
    envelope.classList.add('open');
    if (musicBtn) musicBtn.classList.add('visible');
    startFloating();

    clearTimeout(state.autoOpenTimer);

    window.setTimeout(() => {
      introScreen.classList.add('slide-up');
      unlockScroll();
      initScrollReveal();
    }, INTRO_EXIT_DELAY);

    attemptPlayAudio(source === 'gesture');
  }

  function handleEnvelopeKey(event){
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openInvitation('gesture');
    }
  }

  function handleFirstUserGesture(){
    if (audio && audio.paused && state.audioBlocked) {
      attemptPlayAudio(true);
    }
  }

  // Revela las secciones con fade-in al hacer scroll
  function initScrollReveal(){
    const items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || prefersReducedMotion.matches) {
      items.forEach(el => el.classList.add('in-view'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    items.forEach(el => observer.observe(el));
  }

  // Lee el link del invitado (ej. tusitio.com/?n=Fam.%20Martinez&p=2) UNA SOLA VEZ
  // y guarda los datos para usarlos tanto en la pantalla del sobre como en el formulario.
  function getInvitadoDesdeLink(){
    const params = new URLSearchParams(window.location.search);
    const nombre = params.get('n');
    const pasesRaw = params.get('p');
    const pases = pasesRaw ? parseInt(pasesRaw, 10) : null;

    if (!nombre || !pases || pases < 1) return null;
    return { nombre, pases };
  }

  // Muestra "Invitación para [nombre]" en la pantalla del sobre, si el link trae los datos.
  function setupSobreConNombre(invitado){
    if (!invitado || !introGuest || !introGuestNombre) return;
    introGuestNombre.textContent = invitado.nombre;
    introGuest.classList.remove('hidden');
  }

  // Muestra "Pase reservado para..." y limita el <select> de personas al tope asignado.
  // Si el link no trae los datos, el formulario se queda genérico (como antes).
  function setupInvitadoDesdeLink(invitado){
    if (!invitado) return;
    const { nombre: nombreInvitado, pases } = invitado;

    // Guarda un identificador legible para que la respuesta quede ligada a este pase
    if (invitadoIdInput) invitadoIdInput.value = nombreInvitado;

    // Muestra el cintillo "Pase reservado para..."
    if (paseReservado && paseReservadoNombre && paseReservadoPersonas) {
      paseReservadoNombre.textContent = nombreInvitado;
      paseReservadoPersonas.textContent = pases === 1 ? '1 persona' : `${pases} personas`;
      paseReservado.classList.remove('hidden');
    }

    // Precarga el nombre (el invitado lo puede ajustar, ej. escribir solo quién de la familia va)
    if (nombreInput && !nombreInput.value) {
      nombreInput.value = nombreInvitado;
    }

    // Reconstruye el <select> de personas para que el tope sea el que le asignaron
    if (personasSelect) {
      personasSelect.innerHTML = '';
      for (let i = 1; i <= pases; i++) {
        const option = document.createElement('option');
        option.value = String(i);
        option.textContent = i === 1 ? '1 Persona' : `${i} Personas`;
        if (i === pases) option.selected = true;
        personasSelect.appendChild(option);
      }
    }
  }

  // Muestra u oculta el campo de número de personas según la confirmación
  function handleAsistenciaChange(){
    const selected = document.querySelector('input[name="asistencia"]:checked');
    if (selected && selected.value === 'no') {
      personasField.classList.add('hidden');
    } else {
      personasField.classList.remove('hidden');
    }
  }

  function showRsvpFeedback(){
    const nombre = document.getElementById('nombre').value.trim();
    const selected = document.querySelector('input[name="asistencia"]:checked');
    const asiste = selected && selected.value === 'si';

    const nombreCorto = nombre ? nombre.split(' ')[0] : '';

    rsvpFeedback.innerHTML = asiste
      ? `
        <div class="rsvp-feedback__title">
          <span>💌</span>
          <span>¡Gracias${nombreCorto ? ', ' + nombreCorto : ''}!</span>
        </div>
        <p class="rsvp-feedback__text">
          Confirmamos tu asistencia con mucha alegría. Nos vemos el 18 de octubre de 2026, ¡será un día inolvidable!
        </p>
      `
      : `
        <div class="rsvp-feedback__title">
          <span>💌</span>
          <span>Gracias por avisarnos</span>
        </div>
        <p class="rsvp-feedback__text">
          Lamentamos que no puedas acompañarnos. Te vamos a extrañar, ¡gracias por tu cariño de siempre!
        </p>
      `;

    rsvpFeedback.classList.add('show');
  }

  function handleRsvpSubmit(event){
    event.preventDefault();

    const submitBtn = rsvpForm.querySelector('.rsvp-submit');
    const originalBtnText = submitBtn.textContent;

    if (!GOOGLE_SHEET_URL || GOOGLE_SHEET_URL.indexOf('PEGA_AQUI') !== -1) {
      // Aún no se configuró la URL: solo muestra el mensaje de agradecimiento local.
      console.warn('Falta configurar GOOGLE_SHEET_URL en main.js para guardar las confirmaciones.');
      showRsvpFeedback();
      rsvpForm.reset();
      handleAsistenciaChange();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    const formData = new FormData(rsvpForm);

    fetch(GOOGLE_SHEET_URL, {
      method: 'POST',
      mode: 'no-cors', // Apps Script no responde con headers CORS; no-cors evita el bloqueo del navegador
      body: formData
    })
      .then(() => {
        showRsvpFeedback();
        rsvpForm.reset();
        handleAsistenciaChange();
      })
      .catch((err) => {
        console.error('Error al enviar confirmación:', err);
        rsvpFeedback.innerHTML = `
          <div class="rsvp-feedback__title">
            <span>⚠️</span>
            <span>No se pudo enviar</span>
          </div>
          <p class="rsvp-feedback__text">
            Ocurrió un error al guardar tu confirmación. Por favor intenta de nuevo en unos segundos.
          </p>
        `;
        rsvpFeedback.classList.add('show');
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      });
  }

  function init(){
    const invitado = getInvitadoDesdeLink();
    setupSobreConNombre(invitado);
    setupInvitadoDesdeLink(invitado);
    renderCountdown();
    state.countdownTimer = window.setInterval(renderCountdown, 1000);

    envelope.addEventListener('click', () => openInvitation('gesture'));
    envelope.addEventListener('keydown', handleEnvelopeKey);

    if (musicBtn) musicBtn.addEventListener('click', toggleMusic);

    if (audio) {
      audio.addEventListener('play', () => updateMusicButton(true));
      audio.addEventListener('pause', () => updateMusicButton(false));
      audio.addEventListener('ended', () => updateMusicButton(false));
    }

    document.addEventListener('pointerdown', handleFirstUserGesture, { passive: true });
    document.addEventListener('keydown', handleFirstUserGesture);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      if (!state.invitationOpened) return;
      if (!state.floatTimer) startFloating();
    });

    prefersReducedMotion.addEventListener?.('change', (event) => {
      if (event.matches) {
        stopFloating();
        if (floatingLayer) floatingLayer.innerHTML = '';
      } else if (state.invitationOpened) {
        startFloating();
      }
    });

    asisteRadios.forEach(radio => radio.addEventListener('change', handleAsistenciaChange));
    rsvpForm.addEventListener('submit', handleRsvpSubmit);

    // Antes la invitación se abría sola después de AUTO_OPEN_DELAY.
    // Ahora se queda esperando a que el invitado toque el sobre (ver openInvitation()).

    updateMusicButton(false);
  }

  init();
  window.toggleMusic = toggleMusic;
})();
