/* ==========================================================================
   Mylla Paolucci · Portfólio · comportamento
   Depende de js/boot.js (no <head>). GSAP 3.12.5 + ScrollTrigger + Lenis 1.1.20
   vêm por CDN e são opcionais: sem eles a página continua completa e estática.
   Script clássico (não module) para funcionar também abrindo o arquivo direto.
   ========================================================================== */

(function () {
  'use strict';

  /* ============================================================
     EDITAR: mensagens prontas do WhatsApp e assunto do e-mail.
     {pacote} é trocado pelo nome do pacote do botão clicado.
     ============================================================ */
  var MENSAGEM_CONTATO = 'Olá, Mylla! Vi seu portfólio e quero conversar sobre edição de vídeos.';
  var MENSAGEM_PACOTE = 'Olá, Mylla! Vi seu portfólio e tenho interesse no pacote {pacote}. Pode me passar mais detalhes?';
  var ASSUNTO_EMAIL = 'Orçamento de edição de vídeo';

  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = mqReduce.matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var motion = root.classList.contains('motion') && hasGsap;
  var lenis = null;

  /* Sem GSAP: remove os estados ocultos e mantém tudo visível.
     Com GSAP: avisa o boot.js que as animações assumiram (cancela a rede de segurança). */
  if (motion) root.classList.add('motion-ready');
  else root.classList.remove('motion');

  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* ------------------------------------------------------------
     Divisão de palavras acessível: o texto completo fica num
     span só para leitores de tela; as palavras visuais ficam
     com aria-hidden. Preserva <em> e <span class="line">.
     ------------------------------------------------------------ */
  function splitWords(el, useMask) {
    if (el.__words) return el.__words;
    var words = [];
    var label = [];
    var visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');

    function walk(node, target) {
      Array.prototype.forEach.call(node.childNodes, function (child) {
        if (child.nodeType === 3) {
          label.push(child.textContent);
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { target.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span');
            w.className = 'w';
            w.textContent = part;
            if (useMask) {
              var m = document.createElement('span');
              m.className = 'w-mask';
              m.appendChild(w);
              target.appendChild(m);
            } else {
              target.appendChild(w);
            }
            words.push(w);
          });
        } else if (child.nodeType === 1) {
          if (child.tagName === 'BR') { label.push(' '); target.appendChild(document.createElement('br')); return; }
          var clone = child.cloneNode(false);
          target.appendChild(clone);
          walk(child, clone);
        }
      });
    }
    walk(el, visual);
    var sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = label.join('').replace(/\s+/g, ' ').trim();
    el.textContent = '';
    el.appendChild(sr);
    el.appendChild(visual);
    el.__words = words;
    return words;
  }

  /* ------------------------------------------------------------
     Timecode: a página é um reel de 30 segundos.
     ------------------------------------------------------------ */
  var TOTAL = 30, FPS = 30;
  var tcNodes = $$('[data-tc-now]');
  var progressFill = $('.progress__fill');
  var progressVar = $$('[data-progress-var]');
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function maxScroll() { return Math.max(1, document.documentElement.scrollHeight - window.innerHeight); }
  function fmt(seconds, frames) {
    var s = Math.floor(seconds);
    var m = Math.floor(s / 60);
    var out = pad(m) + ':' + pad(s % 60);
    if (frames) out += ':' + pad(Math.min(FPS - 1, Math.floor((seconds - s) * FPS)));
    return out;
  }
  var tcTicking = false;
  function renderTimecode() {
    tcTicking = false;
    var p = Math.min(1, Math.max(0, window.scrollY / maxScroll()));
    var t = fmt(p * TOTAL, true);
    for (var i = 0; i < tcNodes.length; i++) tcNodes[i].textContent = t;
    if (progressFill) progressFill.style.scale = p + ' 1';
    progressVar.forEach(function (el) { el.style.setProperty('--p', p); });
  }
  function requestTimecode() {
    if (!tcTicking) { tcTicking = true; requestAnimationFrame(renderTimecode); }
  }
  window.addEventListener('scroll', requestTimecode, { passive: true });
  window.addEventListener('resize', requestTimecode, { passive: true });

  /* Marca de tempo de cada capítulo calculada a partir da posição real. */
  function updateChapterTimes() {
    var max = maxScroll();
    $$('[data-chapter]').forEach(function (section) {
      var id = section.getAttribute('data-chapter');
      var top = section.getBoundingClientRect().top + window.scrollY;
      var t = fmt(Math.min(1, Math.max(0, top / max)) * TOTAL, false);
      $$('[data-tc-for="' + id + '"]').forEach(function (el) { el.textContent = t; });
    });
    renderTimecode();
  }

  /* ------------------------------------------------------------
     Navegação: seção atual e tema escuro sob a barra.
     ------------------------------------------------------------ */
  var spyLinks = $$('[data-spy]');
  var spyIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var id = entry.target.getAttribute('data-chapter');
      spyLinks.forEach(function (a) {
        if (a.getAttribute('data-spy') === id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -54% 0px' });
  $$('[data-chapter]').forEach(function (s) { spyIO.observe(s); });

  var darkHits = new Set();
  var navIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) darkHits.add(e.target); else darkHits.delete(e.target); });
    root.classList.toggle('nav-on-dark', darkHits.size > 0);
  }, { rootMargin: '-40px 0px -92% 0px' });
  $$('.chapter[data-theme="dark"]').forEach(function (s) { navIO.observe(s); });

  /* ------------------------------------------------------------
     Menu móvel (padrão de divulgação + fundo inerte).
     ------------------------------------------------------------ */
  var toggle = $('.nav__toggle');
  var toggleLabel = $('[data-toggle-label]');
  var menu = $('#menu');
  var inertTargets = [$('#conteudo'), $('.skip')];
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggleLabel.textContent = open ? 'Fechar menu' : 'Abrir menu';
    menu.classList.toggle('is-open', open);
    inertTargets.forEach(function (el) { if (el) el.inert = open; });
    if (lenis) { open ? lenis.stop() : lenis.start(); }
    if (open) {
      var first = $('a', menu);
      if (first) setTimeout(function () { first.focus(); }, 60);
    }
  }
  toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 900px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });

  /* ------------------------------------------------------------
     Âncoras: rolagem suave (Lenis ou nativa) e foco no destino.
     ------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    var hash = a.getAttribute('href');
    var target = hash === '#topo' ? document.body : $(hash);
    if (!target) return;
    e.preventDefault();
    if (menu.classList.contains('is-open')) setMenu(false);
    var offset = hash === '#topo' || hash === '#conteudo' ? 0 : -72;
    var focusTarget = target === document.body ? $('.nav__brand') : (target.matches('main') ? target : ($('h1, h2', target) || target));
    var done = function () {
      if (focusTarget && focusTarget !== document.activeElement) {
        if (!focusTarget.matches('a, button, main')) focusTarget.setAttribute('tabindex', '-1');
        focusTarget.focus({ preventScroll: true });
      }
    };
    if (lenis) {
      lenis.scrollTo(target === document.body ? 0 : target, { offset: offset, duration: 1.4, onComplete: done });
    } else {
      var top = target === document.body ? 0 : target.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
      setTimeout(done, reduce ? 0 : 700);
    }
    if (history.pushState && hash !== '#conteudo') history.pushState(null, '', hash === '#topo' ? location.pathname : hash);
  });

  /* ------------------------------------------------------------
     Botão "Copiar" (email): copia o texto do elemento
     apontado por aria-describedby, com retorno visível e anunciado.
     ------------------------------------------------------------ */
  $$('.copy').forEach(function (btn) {
    var label = $('[data-copy-label]', btn);
    var original = label.textContent;
    var source = document.getElementById(btn.getAttribute('aria-describedby'));
    var status = $('[data-copy-status]');
    var timer;
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy') || (source ? source.textContent.trim() : '');
      var ok = function () {
        btn.setAttribute('data-state', 'copied');
        label.textContent = 'Copiado';
        status.textContent = (btn.getAttribute('data-copy-done') || 'Copiado') + ': ' + text;
        clearTimeout(timer);
        timer = setTimeout(function () {
          btn.removeAttribute('data-state');
          label.textContent = original;
          status.textContent = '';
        }, 2400);
      };
      var fail = function () {
        if (source) {
          var range = document.createRange();
          range.selectNodeContents(source);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
        status.textContent = 'Não foi possível copiar automaticamente. O texto ficou selecionado: copie com Ctrl+C (⌘+C no Mac).';
      };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, fail);
      else fail();
    });
  });

  /* ------------------------------------------------------------
     WhatsApp e e-mail: só agem quando a linha foi preenchida e o
     atributo hidden foi removido no HTML.
     ------------------------------------------------------------ */
  var waLink = $('[data-contact="whatsapp"]:not([hidden]) a[href*="wa.me/"]');
  var waMatch = waLink && waLink.getAttribute('href').match(/wa\.me\/(\d{10,15})/);
  if (waMatch) {
    var waUrl = function (message) { return 'https://wa.me/' + waMatch[1] + '?text=' + encodeURIComponent(message); };
    waLink.href = waUrl(MENSAGEM_CONTATO);
    /* cada "Pedir orçamento" abre a conversa já citando o pacote */
    $$('[data-plan-cta]').forEach(function (a) {
      a.href = waUrl(MENSAGEM_PACOTE.replace('{pacote}', a.getAttribute('data-plan-cta')));
      a.target = '_blank';
      a.rel = 'noopener';
      var note = document.createElement('span');
      note.className = 'sr-only';
      note.textContent = ' (abre o WhatsApp em nova aba)';
      a.appendChild(note);
    });
  }
  var mailLink = $('[data-contact="email"]:not([hidden]) a[href^="mailto:"]');
  if (mailLink && mailLink.getAttribute('href').indexOf('?') === -1 && !/SEU@EMAIL/i.test(mailLink.getAttribute('href'))) {
    mailLink.href = mailLink.getAttribute('href') + '?subject=' + encodeURIComponent(ASSUNTO_EMAIL);
  }

  /* ------------------------------------------------------------
     Vídeos: ativados pelo atributo data-video. Prévia sem som só
     quando visível e com movimento permitido; sempre com pausa.
     ------------------------------------------------------------ */
  var ICON_PLAY = '<svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.4086 9.35258C23.5305 10.5065 23.5305 13.4935 21.4086 14.6474L8.59662 21.6145C6.53435 22.736 4 21.2763 4 18.9671L4 5.0329C4 2.72368 6.53435 1.26402 8.59661 2.38548L21.4086 9.35258Z"/></svg>';
  var ICON_PAUSE = '<svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M2 6C2 4.11438 2 3.17157 2.58579 2.58579C3.17157 2 4.11438 2 6 2C7.88562 2 8.82843 2 9.41421 2.58579C10 3.17157 10 4.11438 10 6V18C10 19.8856 10 20.8284 9.41421 21.4142C8.82843 22 7.88562 22 6 22C4.11438 22 3.17157 22 2.58579 21.4142C2 20.8284 2 19.8856 2 18V6Z"/><path fill="currentColor" d="M14 6C14 4.11438 14 3.17157 14.5858 2.58579C15.1716 2 16.1144 2 18 2C19.8856 2 20.8284 2 21.4142 2.58579C22 3.17157 22 4.11438 22 6V18C22 19.8856 22 20.8284 21.4142 21.4142C20.8284 22 19.8856 22 18 22C16.1144 22 15.1716 22 14.5858 21.4142C14 20.8284 14 19.8856 14 18V6Z"/></svg>';
  /* Toca só o que está à vista. Na fita de trabalhos, só o vídeo ativo
     (o de brilho total) toca; os vizinhos ficam pausados na capa. */
  function syncPlayback(frame) {
    var v = frame.__video;
    if (!v) return;
    var reel = frame.closest('.reel');
    var isActiveReel = !reel || !works.hasAttribute('data-has-active') || reel.hasAttribute('data-active');
    var shouldPlay = frame.__inView && isActiveReel && !v.__userPaused && !reduce;
    if (shouldPlay && v.paused) v.play().catch(function () {});
    else if (!shouldPlay && !v.paused) v.pause();
  }
  var videoIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      e.target.__inView = e.isIntersecting;
      syncPlayback(e.target);
    });
  }, { threshold: 0.6 });
  $$('.frame[data-video]').forEach(function (frame) {
    var src = (frame.getAttribute('data-video') || '').trim();
    if (!src) return;
    var name = frame.getAttribute('data-label') || 'Vídeo';
    var v = document.createElement('video');
    v.src = src;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.preload = 'metadata';
    var poster = (frame.getAttribute('data-poster') || '').trim();
    if (poster) v.poster = poster;
    v.setAttribute('aria-label', name);
    var screen = $('.frame__screen', frame);
    screen.replaceChildren(v);
    frame.classList.add('has-video');
    /* Vídeo horizontal numa moldura vertical: mostra o quadro inteiro (sem cortar
       quem está na borda) sobre a própria capa desfocada, e corrige o rótulo 9:16. */
    /* endereço absoluto: url() numa variável CSS seria resolvido a partir de css/ */
    if (poster) screen.style.setProperty('--poster', 'url("' + new URL(poster, document.baseURI).href + '")');
    v.addEventListener('loadedmetadata', function () {
      if (v.videoWidth <= v.videoHeight) return;
      frame.classList.add('is-landscape');
      $$('.frame__hud span', frame).forEach(function (s) { if (s.textContent === '9:16') s.textContent = '16:9'; });
    });

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'frame__toggle';
    btn.innerHTML = ICON_PLAY + ICON_PAUSE;
    var sync = function () {
      var paused = v.paused;
      btn.setAttribute('data-state', paused ? 'paused' : 'playing');
      btn.setAttribute('aria-label', (paused ? 'Reproduzir ' : 'Pausar ') + name);
    };
    v.addEventListener('play', sync);
    v.addEventListener('pause', sync);
    btn.addEventListener('click', function () {
      if (v.paused) { v.__userPaused = false; v.play().catch(function () {}); }
      else { v.__userPaused = true; v.pause(); }
    });
    sync();
    frame.appendChild(btn);
    frame.__video = v;
    videoIO.observe(frame);
  });

  /* ------------------------------------------------------------
     Fita de vídeos: indicador do vídeo ativo.
     ------------------------------------------------------------ */
  var works = $('.works');
  var reels = $$('.reel');
  var nowEl = $('[data-now]');
  var meterEl = $('[data-works-meter]');
  var viewport = $('.works__viewport');
  var prevBtn = $('[data-works-prev]');
  var nextBtn = $('[data-works-next]');
  var worksStatus = $('[data-works-status]');
  var currentIndex = 0;
  var stripST = null; /* ScrollTrigger da fita fixada (só no desktop com movimento) */
  $$('[data-total]').forEach(function (el) { el.textContent = pad(reels.length); });
  function updateStripButtons() {
    if (prevBtn) prevBtn.disabled = currentIndex <= 0;
    if (nextBtn) nextBtn.disabled = currentIndex >= reels.length - 1;
  }
  var lastActive = -1;
  function setActive(index, progress) {
    currentIndex = index;
    works.setAttribute('data-has-active', '');
    reels.forEach(function (r, i) { if (i === index) r.setAttribute('data-active', ''); else r.removeAttribute('data-active'); });
    if (index !== lastActive) {
      lastActive = index;
      reels.forEach(function (r) { var f = $('.frame', r); if (f) syncPlayback(f); });
    }
    if (nowEl) nowEl.textContent = pad(index + 1);
    if (meterEl) meterEl.style.setProperty('--p', progress);
    updateStripButtons();
  }
  updateStripButtons();
  function activeFromCenter(refX) {
    var best = 0, bestD = Infinity;
    reels.forEach(function (r, i) {
      var b = r.getBoundingClientRect();
      var d = Math.abs(b.left + b.width / 2 - refX);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }
  /* modo nativo (celular, tablet, movimento reduzido): rolagem lateral */
  var nativeTick = false;
  viewport.addEventListener('scroll', function () {
    if (root.classList.contains('strip-pinned') || nativeTick) return;
    nativeTick = true;
    requestAnimationFrame(function () {
      nativeTick = false;
      var max = Math.max(1, viewport.scrollWidth - viewport.clientWidth);
      var p = viewport.scrollLeft / max;
      var vb = viewport.getBoundingClientRect();
      var padStart = parseFloat(getComputedStyle(viewport).scrollPaddingInlineStart) || 0;
      /* referência = centro do vídeo encaixado no início da fita */
      setActive(pickIndex(vb.left + padStart + reels[0].offsetWidth / 2, p), p);
    });
  }, { passive: true });

  /* Nas pontas da fita, o primeiro/último vídeo é sempre o ativo
     (o último nem sempre alcança o ponto de referência). */
  function pickIndex(refX, p) {
    if (p >= 0.985) return reels.length - 1;
    if (p <= 0.015) return 0;
    return activeFromCenter(refX);
  }

  /* Botões anterior/próximo: caminho por teclado e toque para a fita,
     nos dois modos (rolagem lateral nativa ou fita fixada no desktop). */
  function goToReel(i) {
    i = Math.max(0, Math.min(reels.length - 1, i));
    var card = reels[i];
    if (stripST) {
      /* fita fixada: cada vídeo ocupa uma fração igual da rolagem (como uma timeline) */
      var p = reels.length > 1 ? i / (reels.length - 1) : 0;
      var y = stripST.start + (stripST.end - stripST.start) * p;
      if (lenis) lenis.scrollTo(y, { duration: 1.1 });
      else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    } else {
      var padStart = parseFloat(getComputedStyle(viewport).scrollPaddingInlineStart) || 0;
      var left = card.getBoundingClientRect().left - viewport.getBoundingClientRect().left + viewport.scrollLeft - padStart;
      viewport.scrollTo({ left: left, behavior: reduce ? 'auto' : 'smooth' });
    }
    var title = $('.reel__title', card);
    if (worksStatus) worksStatus.textContent = 'Vídeo ' + (i + 1) + ' de ' + reels.length + (title ? ': ' + title.textContent : '');
  }
  if (prevBtn) prevBtn.addEventListener('click', function () { goToReel(currentIndex - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { goToReel(currentIndex + 1); });
  /* Foco num controle dentro de um vídeo (ex.: pausar) traz esse vídeo para a vista. */
  viewport.addEventListener('focusin', function (e) {
    var reel = e.target.closest('.reel');
    if (reel && stripST) goToReel(reels.indexOf(reel));
  });

  /* ------------------------------------------------------------
     MOVIMENTO (GSAP + ScrollTrigger + Lenis). Só roda se
     o usuário aceita movimento e as bibliotecas carregaram.
     ------------------------------------------------------------ */
  if (!motion) {
    updateChapterTimes();
    window.addEventListener('load', updateChapterTimes);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  var EASE = 'power3.out';

  /* 1. Abertura: entrada coreografada. Navegação e CTA legíveis em < 1 s. */
  var heroTitle = $('#hero-title');
  var heroWords = splitWords(heroTitle, true);
  gsap.set(heroTitle, { visibility: 'visible' });
  /* Só "opacity" (nunca autoAlpha/visibility): conteúdo em espera de revelação
     continua na árvore de acessibilidade para leitores de tela. */
  var intro = gsap.timeline({ defaults: { ease: EASE } });
  intro
    .fromTo('.nav', { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.7 }, 0)
    .fromTo(heroWords, { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.09 }, 0.1)
    .fromTo('.hero [data-intro]', { opacity: 0, y: 24, filter: 'blur(6px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, stagger: 0.08, clearProps: 'filter' }, 0.35)
    .fromTo('.frame--main', { clipPath: 'inset(100% 0% 0% 0% round 24px)' },
      { clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: 1.2, ease: 'power4.inOut' }, 0.15)
    .from('.frame--back', { x: 0, y: 0, rotation: 0, opacity: 0, duration: 1.1, stagger: 0.07 }, 0.75)
    .from('.hero__tag', { opacity: 0, y: 12, filter: 'blur(4px)', duration: 0.6, clearProps: 'filter' }, 1.15);

  /* Ao sair da abertura, a pilha sobe devagar e a etiqueta se afasta. */
  gsap.to('.hero__stack', {
    yPercent: -10, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.hero__copy', {
    yPercent: -6, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  /* 2. Manifesto: cada palavra acende na ordem de leitura. */
  var manifesto = $('[data-words]');
  if (manifesto) {
    var mWords = splitWords(manifesto, false);
    gsap.set(mWords, { opacity: 0.22 });
    gsap.to(mWords, {
      opacity: 1, ease: 'power2.out', stagger: 0.12, duration: 0.6,
      scrollTrigger: { trigger: manifesto, start: 'top 80%', end: 'bottom 50%', scrub: 0.6 }
    });
  }

  /* 3. Títulos com palavras mascaradas. */
  $$('[data-split]').forEach(function (el) {
    if (el === heroTitle) return;
    var w = splitWords(el, true);
    gsap.set(el, { visibility: 'visible' });
    gsap.fromTo(w, { yPercent: 110 }, {
      yPercent: 0, duration: 1, ease: 'power4.out', stagger: 0.06,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  /* 4. Grupos que entram em sequência. */
  $$('[data-reveal]').forEach(function (group) {
    var items = group.children;
    group.__reveal = gsap.fromTo(items, { opacity: 0, y: 32, filter: 'blur(6px)' }, {
      opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: EASE, stagger: 0.08,
      clearProps: 'filter,transform',
      scrollTrigger: { trigger: group, start: 'top 86%', once: true }
    });
  });

  /* 5. Retrato em arco revelado de baixo para cima. */
  $$('[data-clip]').forEach(function (el) {
    gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power4.inOut',
      scrollTrigger: { trigger: el, start: 'top 82%', once: true }
    });
    var inner = el.firstElementChild;
    if (inner) gsap.fromTo(inner, { scale: 1.12 }, { scale: 1, duration: 1.6, ease: EASE, scrollTrigger: { trigger: el, start: 'top 82%', once: true } });
  });

  /* 6. Capítulos escuros se expandem até as bordas ao entrar. */
  $$('[data-expand] > .chapter__bg').forEach(function (bg) {
    gsap.fromTo(bg,
      { clipPath: function () {
          var g = Math.min(64, Math.max(16, window.innerWidth * 0.04)); /* = var(--gutter) */
          return 'inset(0px ' + g + 'px 0px ' + g + 'px round 32px)';
        } },
      { clipPath: 'inset(0px 0px 0px 0px round 0px)', ease: 'none',
        scrollTrigger: { trigger: bg.parentElement, start: 'top bottom', end: 'top 20%', scrub: true, invalidateOnRefresh: true } }
    );
  });

  /* 7. Faixa de formatos ligada à rolagem (não roda sozinha). */
  var band = $('[data-band]');
  if (band) {
    gsap.fromTo(band, { xPercent: 0 }, {
      xPercent: -50, ease: 'none',
      scrollTrigger: { trigger: band.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.8 }
    });
  }

  /* 8. Trabalhos: no desktop, a rolagem vertical passa a fita como numa timeline. */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', function () {
    root.classList.add('strip-pinned');
    var track = $('.works__track');
    var clip = $('.works__clip');
    var distance = function () { return Math.max(0, track.scrollWidth - clip.clientWidth); };
    /* onUpdate no tween (e não no gatilho): roda a cada quadro do scrub,
       então o vídeo ativo acompanha a fita mesmo depois de um salto de rolagem. */
    var stripTween = gsap.to(track, {
      x: function () { return -distance(); },
      ease: 'none',
      onUpdate: function () {
        var p = this.progress();
        setActive(Math.round(p * (reels.length - 1)), p);
      },
      scrollTrigger: {
        trigger: '.works__pin',
        start: 'top top',
        end: function () { return '+=' + Math.max(distance(), window.innerHeight * 0.5); },
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true
      }
    });
    stripST = stripTween.scrollTrigger;
    setActive(0, 0);
    return function () {
      stripST = null;
      root.classList.remove('strip-pinned');
      works.removeAttribute('data-has-active');
      reels.forEach(function (r) { r.removeAttribute('data-active'); });
    };
  });

  /* Os vídeos sobem em sequência quando o capítulo chega. */
  var reelsReveal = gsap.fromTo('.reel', { opacity: 0, y: 48 }, {
    opacity: 1, y: 0, duration: 0.9, ease: EASE, stagger: 0.08,
    scrollTrigger: { trigger: '.works', start: 'top 70%', once: true }
  });

  /* O foco do teclado nunca cai em algo ainda invisível: se o Tab chegar
     antes da animação, a revelação daquele grupo termina na hora. */
  document.addEventListener('focusin', function (e) {
    if (intro.progress() < 1) intro.progress(1);
    var group = e.target.closest && e.target.closest('[data-reveal]');
    if (group && group.__reveal && group.__reveal.progress() < 1) group.__reveal.progress(1);
    if (e.target.closest && e.target.closest('.works') && reelsReveal.progress() < 1) reelsReveal.progress(1);
  });

  /* Recalcular depois de fontes e imagens. */
  ScrollTrigger.addEventListener('refresh', updateChapterTimes);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  updateChapterTimes();

  /* Se o usuário ativar movimento reduzido no meio da visita, recarrega estático. */
  mqReduce.addEventListener('change', function (e) { if (e.matches) location.reload(); });
})();
