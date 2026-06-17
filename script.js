/* ==========================================================================
   INTERACCIONES EN JAVASCRIPT: DAMEDIA WEB
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================================================
  // 1. SISTEMA DE AUDIO DE INTERFAZ (SINTETIZADO CON WEB AUDIO API)
  // ==========================================================================
  let audioCtx = null;
  let sfxEnabled = false;

  const soundToggleBtn = document.getElementById('sound-toggle');
  const soundIcon = soundToggleBtn.querySelector('i');
  const soundText = soundToggleBtn.querySelector('span');

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function toggleSound() {
    initAudio();
    sfxEnabled = !sfxEnabled;
    
    if (sfxEnabled) {
      soundToggleBtn.classList.add('enabled');
      soundIcon.className = 'fas fa-volume-up';
      soundText.textContent = 'SFX ON';
      playSynthesizedSound(600, 1200, 0.1, 'sine'); // Feedback de encendido
    } else {
      soundToggleBtn.classList.remove('enabled');
      soundIcon.className = 'fas fa-volume-mute';
      soundText.textContent = 'SFX OFF';
    }
  }

  soundToggleBtn.addEventListener('click', toggleSound);

  // Función genérica para sintetizar pitidos de interfaz futurista
  function playSynthesizedSound(startFreq, endFreq, duration, type = 'sine', volume = 0.05) {
    if (!sfxEnabled || !audioCtx) return;
    
    try {
      initAudio();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
      // Rampa de frecuencia para efecto barrido (sweep)
      osc.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + duration);
      
      gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("AudioContext bloqueado o no soportado.", e);
    }
  }

  // Sonidos predefinidos
  const playHoverSound = () => playSynthesizedSound(1000, 1400, 0.04, 'sine', 0.03);
  const playClickSound = () => playSynthesizedSound(800, 300, 0.08, 'triangle', 0.07);
  const playSuccessSound = () => {
    // Acorde futurista ascendente
    setTimeout(() => playSynthesizedSound(523.25, 1046.50, 0.15, 'sine', 0.06), 0); // C5 -> C6
    setTimeout(() => playSynthesizedSound(659.25, 1318.51, 0.15, 'sine', 0.06), 50); // E5 -> E6
    setTimeout(() => playSynthesizedSound(783.99, 1567.98, 0.2, 'sine', 0.06), 100); // G5 -> G6
  };
  const playErrorSound = () => {
    playSynthesizedSound(180, 100, 0.25, 'sawtooth', 0.08);
  };

  // Añadir eventos de sonido a los elementos interactivos
  const interactiveSelector = 'a, button, .selector-card, .btn-sug, .nav-item, input[type="range"], input[type="checkbox"]';
  
  document.body.addEventListener('mouseenter', (e) => {
    if (e.target.matches(interactiveSelector)) {
      playHoverSound();
    }
  }, true);

  document.body.addEventListener('click', (e) => {
    if (e.target.matches(interactiveSelector) && e.target !== soundToggleBtn) {
      playClickSound();
    }
  }, true);


  // ==========================================================================
  // 2. FONDO DE PARTÍCULAS INTERACTIVAS (CANVAS NEURAL)
  // ==========================================================================
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');

  let particlesArray = [];
  const maxDistance = 120; // Distancia máxima para dibujar líneas de conexión
  
  const mouse = {
    x: null,
    y: null,
    radius: 150
  };

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
  });

  // Ajustar tamaño del lienzo
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles();
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Clase Partícula
  class Particle {
    constructor(x, y, directionX, directionY, size, color) {
      this.x = x;
      this.y = y;
      this.directionX = directionX;
      this.directionY = directionY;
      this.size = size;
      this.color = color;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
      ctx.fillStyle = this.color;
      ctx.fill();
    }

    update() {
      // Rebotar en bordes
      if (this.x > canvas.width || this.x < 0) {
        this.directionX = -this.directionX;
      }
      if (this.y > canvas.height || this.y < 0) {
        this.directionY = -this.directionY;
      }

      // Colisión sutil con el cursor del ratón
      let dx = mouse.x - this.x;
      let dy = mouse.y - this.y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < mouse.radius + this.size) {
        if (mouse.x < this.x && this.x < canvas.width - this.size * 10) {
          this.x += 2;
        }
        if (mouse.x > this.x && this.x > this.size * 10) {
          this.x -= 2;
        }
        if (mouse.y < this.y && this.y < canvas.height - this.size * 10) {
          this.y += 2;
        }
        if (mouse.y > this.y && this.y > this.size * 10) {
          this.y -= 2;
        }
      }

      this.x += this.directionX;
      this.y += this.directionY;
      this.draw();
    }
  }

  // Inicializar partículas
  function initParticles() {
    particlesArray = [];
    // Cantidad adaptativa según resolución
    const numberOfParticles = Math.min(Math.floor((canvas.width * canvas.height) / 13000), 110);
    
    for (let i = 0; i < numberOfParticles; i++) {
      const size = Math.random() * 2 + 1;
      const x = Math.random() * (canvas.width - size * 2) + size;
      const y = Math.random() * (canvas.height - size * 2) + size;
      const directionX = (Math.random() * 0.4) - 0.2;
      const directionY = (Math.random() * 0.4) - 0.2;
      
      // Colores de acento cian/azul translúcido
      const color = Math.random() > 0.5 ? 'rgba(0, 240, 255, 0.3)' : 'rgba(0, 102, 255, 0.2)';
      
      particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
    }
  }

  // Dibujar líneas conectoras
  function connectParticles() {
    let opacityValue = 1;
    for (let a = 0; a < particlesArray.length; a++) {
      for (let b = a; b < particlesArray.length; b++) {
        let dx = particlesArray[a].x - particlesArray[b].x;
        let dy = particlesArray[a].y - particlesArray[b].y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxDistance) {
          opacityValue = 1 - (distance / maxDistance);
          ctx.strokeStyle = `rgba(0, 240, 255, ${opacityValue * 0.12})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
          ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
          ctx.stroke();
        }
      }
    }
  }

  // Bucle de animación a 60fps
  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
      particlesArray[i].update();
    }
    connectParticles();
    requestAnimationFrame(animateParticles);
  }

  animateParticles();


  // ==========================================================================
  // 3. EFECTO DE PARALAJE / TILT EN LA TARJETA HOLOGRÁFICA
  // ==========================================================================
  const holoCard = document.getElementById('holo-card');
  
  if (holoCard) {
    const parent = holoCard.parentElement;
    
    parent.addEventListener('mousemove', (e) => {
      const rect = parent.getBoundingClientRect();
      const x = e.clientX - rect.left; // posición x dentro del elemento
      const y = e.clientY - rect.top;  // posición y dentro del elemento
      
      const width = rect.width;
      const height = rect.height;
      
      // Calcular ángulos de inclinación (max 15 grados)
      const rotateY = ((x / width) - 0.5) * 20;
      const rotateX = -(((y / height) - 0.5) * 20);
      
      holoCard.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(15px)`;
    });
    
    parent.addEventListener('mouseleave', () => {
      holoCard.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0)';
    });
  }


  // ==========================================================================
  // 4. MENU DE NAVEGACIÓN MÓVIL Y ESTADOS DE SCROLL
  // ==========================================================================
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');
  const header = document.querySelector('.navbar');

  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
  });

  // Cerrar menú al hacer clic en un enlace
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      navMenu.classList.remove('active');
    });
  });

  // Clase navbar compacta en scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    highlightNavOnScroll();
  });

  // Resaltado de ítems del menú según la sección actual en pantalla
  const sections = document.querySelectorAll('section');
  const navItems = document.querySelectorAll('.nav-item');

  function highlightNavOnScroll() {
    let scrollPos = window.scrollY + 120;
    
    sections.forEach(section => {
      if (scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight) {
        navItems.forEach(item => {
          item.classList.remove('active');
          if (item.getAttribute('href') === `#${section.id}`) {
            item.classList.add('active');
          }
        });
      }
    });
  }


  // ==========================================================================
  // 5. ASISTENTE DE FORMULARIO INTELIGENTE POR PASOS
  // ==========================================================================
  const form = document.getElementById('smart-order-form');
  const steps = form.querySelectorAll('.form-step');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const nextBtns = form.querySelectorAll('.next-step-btn');
  const prevBtns = form.querySelectorAll('.prev-step-btn');
  const charCounter = document.getElementById('char-counter');
  const descTextarea = document.getElementById('descripcion-proyecto');

  let currentStepIndex = 0;

  // Actualizar UI del formulario por pasos
  function showStep(index) {
    steps.forEach((step, i) => {
      step.classList.toggle('step-active', i === index);
    });

    tabBtns.forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
      // Habilitar pestañas previas y deshabilitar siguientes no rellenadas
      if (i <= index) {
        btn.removeAttribute('disabled');
      } else {
        btn.setAttribute('disabled', 'true');
      }
    });
    
    currentStepIndex = index;
  }

  // Inicializar estado de pestañas
  showStep(0);

  // Validación de Campos por Paso
  function validateStep(stepIndex) {
    if (stepIndex === 0) {
      // El radio button tiene valor por defecto seleccionable, siempre es válido
      return true;
    }
    
    if (stepIndex === 1) {
      // Validar área de descripción
      const text = descTextarea.value.trim();
      if (text.length < 15) {
        alert("Por favor, proporciona una descripción detallada (mínimo 15 caracteres) para procesar tu solicitud adecuadamente.");
        playErrorSound();
        descTextarea.focus();
        return false;
      }
      return true;
    }
    
    return true;
  }

  // Eventos para botón Siguiente
  nextBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (validateStep(currentStepIndex)) {
        showStep(currentStepIndex + 1);
      }
    });
  });

  // Eventos para botón Atrás
  prevBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      showStep(currentStepIndex - 1);
    });
  });

  // Clic directo en pestañas de la consola
  tabBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      // Solo permite navegar directamente a pestañas previas o si pasa la validación actual
      if (i < currentStepIndex) {
        showStep(i);
      } else if (i === currentStepIndex + 1) {
        if (validateStep(currentStepIndex)) {
          showStep(i);
        }
      } else if (i === 2 && currentStepIndex === 0) {
        if (validateStep(0) && validateStep(1)) {
          showStep(2);
        }
      }
    });
  });

  // Contador de caracteres para la descripción del proyecto
  descTextarea.addEventListener('input', () => {
    const length = descTextarea.value.length;
    charCounter.textContent = `${length} / 500 caracteres`;
    
    if (length > 450) {
      charCounter.style.color = 'var(--color-warning)';
    } else if (length >= 500) {
      charCounter.style.color = 'var(--color-error)';
    } else {
      charCounter.style.color = 'var(--text-muted)';
    }
  });

  // Sugerencias Rápidas de Texto (Prompt Engineering)
  const sugBtns = document.querySelectorAll('.btn-sug');
  sugBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const appendText = btn.getAttribute('data-add');
      
      if (descTextarea.value.length + appendText.length <= 500) {
        descTextarea.value += appendText;
        // Lanzar evento input para actualizar contador
        descTextarea.dispatchEvent(new Event('input'));
        descTextarea.focus();
      }
    });
  });

  // Enlace desde las Tarjetas de Servicio
  const serviceCards = document.querySelectorAll('.service-card');
  serviceCards.forEach(card => {
    const btn = card.querySelector('.service-select-btn');
    const serviceName = card.getAttribute('data-service');
    
    btn.addEventListener('click', () => {
      // Buscar el radio button correspondiente en el formulario
      let radioValue = "Páginas Web Premium";
      if (serviceName === "software") radioValue = "Sistemas y Software Empresarial";
      if (serviceName === "app") radioValue = "Aplicaciones Móviles";
      if (serviceName === "ai") radioValue = "IA & Automatizaciones";
      
      const radioInput = form.querySelector(`input[name="servicio"][value="${radioValue}"]`);
      if (radioInput) {
        radioInput.checked = true;
      }
      
      // Ir al paso 2 directamente
      showStep(1);
      
      // Desplazamiento suave al formulario
      document.getElementById('cotizar').scrollIntoView({ behavior: 'smooth' });
      
      // Enfoque en textarea
      setTimeout(() => {
        descTextarea.focus();
      }, 800);
    });
  });


  // ==========================================================================
  // 6. SIMULACIÓN DE CONSOLA DE TRANSMISIÓN DE DATOS (SUBMIT)
  // ==========================================================================
  const loader = document.getElementById('terminal-loader');
  const consoleBox = document.getElementById('console-box');
  const loaderTitle = document.getElementById('loader-title');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Bloquear y mostrar pantalla de procesamiento
    loader.classList.add('active');
    consoleBox.innerHTML = '';
    loaderTitle.textContent = "Procesando Solicitud...";
    
    // Datos ingresados
    const serviceType = form.elements['servicio'].value;
    const clientName = document.getElementById('nombre-cliente').value.trim();
    const clientEmail = document.getElementById('email-cliente').value.trim();
    
    // Líneas de consola simuladas
    const consoleLines = [
      { text: `[SYSTEM] INICIANDO TRANSMISIÓN DE PAQUETE DIGITAL...`, delay: 100, color: 'text-blue' },
      { text: `[CONN] Conectando a la pasarela DAMEDIA Secure Node... [OK]`, delay: 500, color: 'text-green' },
      { text: `[AUTH] Verificando credenciales de enlace cliente...`, delay: 900, color: 'text-cyan' },
      { text: `[AUTH] Identidad cliente cargada: "${clientName}"`, delay: 1200, color: 'text-cyan' },
      { text: `[DATA] Encapsulando especificaciones del proyecto: [${serviceType}]`, delay: 1600, color: 'text-yellow' },
      { text: `[DATA] Cifrado de canal SSL de 256 bits... COMPLETO`, delay: 2000, color: 'text-green' },
      { text: `[DB] Guardando registro temporal en AWS RDS... [PENDIENTE]`, delay: 2400, color: 'text-blue' },
      { text: `[DB] Registro guardado con ID transacción #${Math.floor(Math.random() * 90000) + 10000}`, delay: 2800, color: 'text-green' },
      { text: `[SEND] Notificando a ingenieros de desarrollo vía webhook...`, delay: 3300, color: 'text-yellow' },
      { text: `[CONN] Desconectando sesión segura...`, delay: 3700, color: 'text-muted' },
      { text: `================================================`, delay: 4000, color: 'text-muted' },
      { text: `[SUCCESS] PEDIDO TRANSMITIDO CON ÉXITO A DAMEDIA.`, delay: 4300, color: 'text-green' },
      { text: `[SYSTEM] Un agente tecnológico te contactará en: ${clientEmail}`, delay: 4600, color: 'text-cyan' }
    ];

    // Reproducir sonidos periódicos durante la simulación de terminal
    const soundInterval = setInterval(() => {
      if (loader.classList.contains('active') && loaderTitle.textContent !== "¡Envío Exitoso!") {
        playSynthesizedSound(300, 450, 0.05, 'square', 0.02);
      }
    }, 400);

    // Agregar líneas a la consola recursivamente
    consoleLines.forEach((line) => {
      setTimeout(() => {
        const p = document.createElement('p');
        p.className = `console-line ${line.color || ''}`;
        p.innerHTML = `<span class="cmd-prompt">></span> ${line.text}`;
        consoleBox.appendChild(p);
        // Scroll automático al fondo de la consola
        consoleBox.scrollTop = consoleBox.scrollHeight;
        
        // Efecto sonido de tecleo de consola
        playSynthesizedSound(600, 300, 0.02, 'sine', 0.03);
      }, line.delay);
    });

    // Éxito Final
    setTimeout(() => {
      clearInterval(soundInterval);
      playSuccessSound();
      loaderTitle.textContent = "¡Envío Exitoso!";
      
      // Crear botón de cierre / reiniciar en la terminal
      const closeBtn = document.createElement('button');
      closeBtn.className = 'btn btn-primary btn-sm';
      closeBtn.style.marginTop = '1.5rem';
      closeBtn.innerHTML = '<i class="fas fa-check"></i> Finalizar Proceso';
      
      closeBtn.addEventListener('click', () => {
        loader.classList.remove('active');
        form.reset();
        // Resetear contador de caracteres
        charCounter.textContent = `0 / 500 caracteres`;
        charCounter.style.color = 'var(--text-muted)';
        // Volver al paso 1
        showStep(0);
      });
      
      loader.querySelector('.loader-content').appendChild(closeBtn);
      
    }, 5000);
  });


  // ==========================================================================
  // 7. INICIALIZACIONES MENORES
  // ==========================================================================
  // Actualizar año de copyright dinámicamente
  const copyYear = document.getElementById('copy-year');
  if (copyYear) {
    copyYear.textContent = new Date().getFullYear();
  }

});
