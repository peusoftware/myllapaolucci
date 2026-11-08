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
  var ICON_SOUND_OFF = '<svg class="i-sound-off" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M20.5145 6.3164C20.892 6.14605 21.3362 6.31403 21.5065 6.6916C21.9736 7.72674 22.5 9.45958 22.5 12C22.5 14.1916 22.1082 15.7829 21.7 16.8442C21.4962 17.374 21.2894 17.7692 21.1275 18.039C21.0466 18.1738 20.977 18.2772 20.9248 18.3504C20.8986 18.3869 20.8769 18.4159 20.8602 18.4375C20.8518 18.4483 20.8448 18.4572 20.8391 18.4643L20.8316 18.4736L20.8286 18.4772L20.8273 18.4788C20.8273 18.4788 20.8262 18.4801 20.25 18L20.8262 18.4801C20.561 18.7983 20.0881 18.8413 19.7699 18.5762C19.4532 18.3123 19.4091 17.8426 19.67 17.5245C19.67 17.5245 19.6718 17.5222 19.6735 17.52C19.6788 17.5132 19.6893 17.4994 19.7042 17.4785C19.7339 17.4368 19.7815 17.3668 19.8413 17.2673C19.9606 17.0683 20.1288 16.751 20.3 16.3058C20.6418 15.4171 21 14.0084 21 12C21 9.67366 20.5194 8.15099 20.1393 7.30849C19.9689 6.93093 20.1369 6.48675 20.5145 6.3164Z" clip-rule="evenodd"/><path fill="currentColor" fill-rule="evenodd" d="M18.414 9.26566C18.8196 9.18146 19.2166 9.44198 19.3008 9.84754C19.4109 10.378 19.5 11.0889 19.5 12C19.5 13.1101 19.3678 13.9228 19.2265 14.4738C19.1559 14.749 19.0833 14.9579 19.0245 15.1051C18.9951 15.1786 18.9691 15.2367 18.9486 15.2797C18.9384 15.3012 18.9295 15.3189 18.9223 15.333L18.9126 15.3514L18.9088 15.3585L18.9071 15.3615L18.9063 15.3629C18.9063 15.3629 18.9056 15.3642 18.25 15L18.9056 15.3642C18.7045 15.7263 18.2479 15.8568 17.8858 15.6556C17.5268 15.4562 17.3955 15.0056 17.5893 14.645L17.5943 14.6348C17.6012 14.6204 17.6143 14.5917 17.6318 14.548C17.6667 14.4608 17.7191 14.3135 17.7735 14.1012C17.8822 13.6772 18 12.9899 18 12C18 11.1873 17.9206 10.5787 17.8321 10.1525C17.7479 9.74689 18.0084 9.34986 18.414 9.26566Z" clip-rule="evenodd"/><path fill="currentColor" d="M21.7803 3.53033C22.0732 3.23744 22.0732 2.76256 21.7803 2.46967C21.4874 2.17678 21.0126 2.17678 20.7197 2.46967L16.2705 6.91886C16.2246 6.39532 16.1646 5.93197 16.077 5.52977C15.9052 4.74135 15.6003 4.05581 14.9609 3.60646C14.7259 3.44128 14.4642 3.30809 14.1923 3.21531C13.3741 2.9361 12.5608 3.15928 11.7348 3.56055C10.9212 3.95576 9.93412 4.60663 8.70324 5.41822L8.43647 5.59411C7.98856 5.88944 7.83448 5.98815 7.67513 6.05848C7.50452 6.13378 7.3252 6.18757 7.14132 6.21862C6.96956 6.24762 6.7866 6.25003 6.25008 6.25003L6.08906 6.24998C4.87215 6.24933 4.02659 6.24889 3.27496 6.59664C2.58016 6.9181 1.91141 7.54732 1.54828 8.22128C1.15566 8.94996 1.10959 9.712 1.04409 10.7955L1.03618 10.926C1.01373 11.2943 1 11.6585 1 12C1 12.3416 1.01373 12.7058 1.03618 13.0741L1.04409 13.2045C1.10959 14.2881 1.15566 15.0501 1.54828 15.7788C1.91141 16.4527 2.58016 17.082 3.27496 17.4034C3.88551 17.6859 4.55803 17.7386 5.44121 17.7481L2.71967 20.4697C2.42678 20.7626 2.42678 21.2374 2.71967 21.5303C3.01256 21.8232 3.48744 21.8232 3.78033 21.5303L21.7803 3.53033Z"/><path fill="currentColor" d="M16.5 12C16.5 11.5858 16.1642 11.25 15.75 11.25C15.5554 11.25 15.3781 11.3241 15.2448 11.4457L15.1735 11.5203L9.17494 17.7941C8.82947 18.1554 8.90952 18.7441 9.33893 19.0001C10.3777 19.6808 11.2375 20.2247 11.9704 20.549C12.7127 20.8773 13.4503 21.0379 14.1923 20.7847C14.4642 20.6919 14.7259 20.5588 14.9609 20.3936C15.667 19.8974 15.9659 19.1134 16.1278 18.2139C16.287 17.3296 16.3414 16.1576 16.4092 14.6977L16.4119 14.6402C16.4637 13.5252 16.5 12.552 16.5 12Z"/></svg>';
  var ICON_SOUND_ON = '<svg class="i-sound-on" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9.64844 6.19164C11.9868 4.54764 13.1563 3.72547 14.1377 4.08227C14.3259 4.15074 14.5082 4.2504 14.6709 4.37231C15.5192 5.00819 15.584 6.48716 15.7129 9.44555C15.7606 10.541 15.793 11.4787 15.793 12.0002C15.793 12.5218 15.7606 13.4594 15.7129 14.5549C15.584 17.5133 15.5192 18.9923 14.6709 19.6282C14.5082 19.7501 14.3259 19.8497 14.1377 19.9182C13.1563 20.275 11.9868 19.4528 9.64844 17.8088C9.05567 17.3921 8.75916 17.1838 8.42871 17.0627C8.36014 17.0376 8.29091 17.0146 8.2207 16.9954C7.88238 16.9025 7.52711 16.9026 6.81738 16.9026C4.83047 16.9026 3.83649 16.9029 3.08398 16.2678C2.94663 16.1519 2.78259 15.9801 2.6709 15.8362C2.05918 15.0477 2.04026 14.1264 2.00293 12.2844C2.00097 12.1878 2 12.0929 2 12.0002C2 11.9076 2.00097 11.8127 2.00293 11.7161C2.04026 9.87406 2.05918 8.95276 2.6709 8.1643C2.78259 8.02038 2.94663 7.84862 3.08398 7.73266C3.83649 7.09753 4.83047 7.09789 6.81738 7.09789C7.52711 7.09789 7.88238 7.098 8.2207 7.00512C8.29091 6.98584 8.36014 6.96285 8.42871 6.93774C8.75916 6.81667 9.05567 6.6084 9.64844 6.19164Z"/><path fill="currentColor" d="M19.2744 5.42406C19.5925 5.15898 20.0658 5.2018 20.3311 5.51977L19.8369 5.93188C20.3264 5.524 20.332 5.52077 20.332 5.52074L20.3369 5.5266C20.339 5.52917 20.341 5.53294 20.3438 5.53637C20.3494 5.54342 20.357 5.55207 20.3652 5.56274C20.3819 5.58427 20.4037 5.61322 20.4297 5.64965C20.4819 5.72277 20.5519 5.82636 20.6328 5.96117C20.7947 6.23097 21.0014 6.62684 21.2051 7.15649C21.6132 8.21784 22.0049 9.80904 22.0049 12.0002C22.0049 14.1914 21.6132 15.7826 21.2051 16.844C21.0014 17.3736 20.7947 17.7695 20.6328 18.0393C20.5519 18.1741 20.4819 18.2777 20.4297 18.3508C20.4037 18.3873 20.3819 18.4162 20.3652 18.4377C20.357 18.4484 20.3494 18.457 20.3438 18.4641C20.341 18.4675 20.339 18.4713 20.3369 18.4739L20.332 18.4788C20.3308 18.4779 20.3046 18.4584 19.7549 18.0002L20.3311 18.4807C20.0659 18.7987 19.5926 18.8415 19.2744 18.5764C18.9762 18.3277 18.9201 17.8963 19.1328 17.5813L19.1748 17.5256L19.1758 17.5237L19.1777 17.5217L19.1787 17.5198C19.1841 17.5128 19.1944 17.4991 19.209 17.4788C19.2387 17.4371 19.2861 17.3671 19.3457 17.2678C19.4651 17.0689 19.6335 16.7511 19.8047 16.3059C20.1465 15.4173 20.5049 14.0086 20.5049 12.0002C20.5049 9.99187 20.1465 8.58319 19.8047 7.69457C19.6335 7.2494 19.4651 6.93158 19.3457 6.73266C19.2861 6.6334 19.2387 6.56336 19.209 6.52172L19.1787 6.48071L19.1328 6.41918C18.9201 6.10411 18.9762 5.67273 19.2744 5.42406Z"/><path fill="currentColor" d="M17.7568 8.41625C18.0897 8.21905 18.5103 8.34655 18.6953 8.70141V8.70336L18.6963 8.70434L18.6982 8.70727L18.7012 8.7141L18.71 8.73266C18.7166 8.74638 18.725 8.7635 18.7344 8.78442C18.7532 8.8266 18.7776 8.88418 18.8047 8.95629C18.8588 9.10056 18.9254 9.30584 18.9902 9.57543C19.1201 10.1156 19.2412 10.9122 19.2412 12.0002C19.2412 13.0886 19.1201 13.8858 18.9902 14.426C18.9254 14.6958 18.8588 14.9009 18.8047 15.0452C18.7777 15.1172 18.7532 15.1739 18.7344 15.2161C18.725 15.2371 18.7166 15.255 18.71 15.2688L18.7012 15.2864L18.6982 15.2932L18.6963 15.2961L18.6953 15.2981C18.6924 15.2966 18.6521 15.2736 18.0918 14.9416L18.6953 15.2981C18.5103 15.6531 18.0898 15.7824 17.7568 15.5852C17.4268 15.3896 17.3062 14.9475 17.4844 14.594L17.4893 14.5842C17.4955 14.5701 17.5075 14.5419 17.5234 14.4993C17.5555 14.4137 17.6042 14.2689 17.6543 14.0608C17.7543 13.645 17.8623 12.9707 17.8623 12.0002C17.8623 11.0302 17.7542 10.3565 17.6543 9.94067C17.6042 9.73252 17.5555 9.5877 17.5234 9.50219C17.5074 9.45954 17.4956 9.43138 17.4893 9.41723L17.4844 9.40746C17.3062 9.05402 17.4269 8.61191 17.7568 8.41625Z"/></svg>';

  /* Som: os vídeos começam mudos (regra dos navegadores). Ligado pelo botão,
     o som acompanha o vídeo que estiver tocando; só um vídeo com som por vez. */
  var soundOn = false;
  var soundVideo = null;
  function playSafely(v) {
    var pr = v.play();
    if (pr && pr.catch) pr.catch(function () {
      /* navegador recusou tocar com som: volta ao mudo em vez de não tocar */
      if (v.muted) return;
      v.muted = true;
      if (soundVideo === v) { soundOn = false; soundVideo = null; }
      v.play().catch(function () {});
    });
  }
  function giveSoundTo(v, restart) {
    if (soundVideo && soundVideo !== v) soundVideo.muted = true;
    soundVideo = v;
    if (v.muted && restart) v.currentTime = 0; /* edição se ouve do começo */
    v.muted = false;
  }

  /* Toca só o que está à vista. Na fita de trabalhos, só o vídeo ativo
     (o de brilho total) toca; os vizinhos ficam pausados na capa. */
  function syncPlayback(frame) {
    var v = frame.__video;
    if (!v) return;
    var reel = frame.closest('.reel');
    var isActiveReel = !reel || !works.hasAttribute('data-has-active') || reel.hasAttribute('data-active');
    var shouldPlay = frame.__inView && isActiveReel && !v.__userPaused && !reduce;
    if (shouldPlay && v.paused) {
      if (soundOn) giveSoundTo(v, true);
      playSafely(v);
    } else if (!shouldPlay && !v.paused) v.pause();
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
      if (v.paused) { v.__userPaused = false; playSafely(v); }
      else { v.__userPaused = true; v.pause(); }
    });
    sync();
    frame.appendChild(btn);

    /* botão de som, ao lado do de pausa */
    var snd = document.createElement('button');
    snd.type = 'button';
    snd.className = 'frame__toggle frame__sound';
    snd.innerHTML = ICON_SOUND_OFF + ICON_SOUND_ON;
    var syncSound = function () {
      var on = !v.muted;
      snd.setAttribute('data-state', on ? 'on' : 'off');
      snd.setAttribute('aria-label', (on ? 'Desativar som de ' : 'Ativar som de ') + name);
    };
    v.addEventListener('volumechange', syncSound);
    snd.addEventListener('click', function () {
      if (!v.muted) { v.muted = true; soundOn = false; soundVideo = null; return; }
      soundOn = true;
      v.__userPaused = false;
      giveSoundTo(v, true);
      playSafely(v);
    });
    syncSound();
    frame.appendChild(snd);
    frame.__video = v;
    videoIO.observe(frame);
  });

  /* ------------------------------------------------------------
     Views (preenchidas à mão em js/views.js). A chave é o nome do
     arquivo do vídeo: assets/videos/01.mp4 → '01'. Sem número, nada aparece.
     ------------------------------------------------------------ */
  var VIEWS = window.PORTFOLIO_VIEWS || {};
  var viewsFmt = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
  var shownViews = 0;
  /* Aceita o número do jeito que for digitado: 3171, '3,171', '3.171', '12 mil', '1,2 mi', '15k'. */
  function parseViews(value) {
    if (typeof value === 'number') return isFinite(value) ? Math.round(value) : 0;
    if (typeof value !== 'string') return 0;
    var t = value.trim().toLowerCase();
    /* sufixos: "mi", "milhões", "M" (1,4M) e "mil", "k" (15k) */
    var mult = /(\d|\s)(mi|milh[õo]es|milh[ãa]o|m)\s*$/.test(t) ? 1e6 : (/(\d|\s)(mil|k)\s*$/.test(t) ? 1e3 : 1);
    var digits = t.replace(/[^\d.,]/g, '');
    if (!digits) return 0;
    if (mult > 1) return Math.round(parseFloat(digits.replace(/\./g, '').replace(',', '.')) * mult) || 0;
    return parseInt(digits.replace(/[.,]/g, ''), 10) || 0; /* "3,171" e "3.171" = 3171 */
  }
  function viewsOfFrame(frame) {
    var key = (frame.getAttribute('data-video') || '').split('/').pop().replace(/\.[^.]+$/, '');
    return parseViews(VIEWS.videos && VIEWS.videos[key]);
  }
  var totalViews = 0;
  var siteByNetwork = { instagram: 0, tiktok: 0 };

  /* A fita segue a ordem do HTML (01, 02… 08). Para mudar a ordem,
     mova os blocos <li class="reel"> no index.html. */

  $$('.frame[data-video]').forEach(function (frame) {
    var n = viewsOfFrame(frame);
    if (n <= 0) return;
    /* soma por rede (pelo link do crédito: tiktok.com ou instagram.com) */
    var creditLink = frame.closest('.reel') ? $('.reel__link', frame.closest('.reel')) : $('.hero__credit .reel__link');
    siteByNetwork[creditLink && /tiktok\.com/.test(creditLink.href) ? 'tiktok' : 'instagram'] += n;
    /* no lugar do "REEL_xx" no canto da moldura */
    var hudLabel = $('.frame__hud--top span', frame);
    if (!hudLabel) return;
    hudLabel.className = 'frame__views';
    hudLabel.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.4086 9.35258C23.5305 10.5065 23.5305 13.4935 21.4086 14.6474L8.59662 21.6145C6.53435 22.736 4 21.2763 4 18.9671L4 5.0329C4 2.72368 6.53435 1.26402 8.59661 2.38548L21.4086 9.35258Z"/></svg>';
    hudLabel.appendChild(document.createTextNode(viewsFmt.format(n) + ' views'));
    /* o canto é decorativo (aria-hidden); leitores de tela ouvem junto do título */
    var sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = ', ' + n.toLocaleString('pt-BR') + ' visualizações';
    var reel = frame.closest('.reel');
    var titleEl = reel ? $('.reel__title', reel) : $('.hero__credit-title');
    if (titleEl) titleEl.appendChild(sr);
    shownViews++;
  });
  /* Total nas redes: para cada rede, o maior entre o total informado em
     views.js (redes) e a soma dos vídeos daquela rede que estão no site.
     Os dois são pisos verdadeiros, então "mais de" continua correto. */
  var NETWORKS = [['instagram', 'Instagram'], ['tiktok', 'TikTok']];
  var usedNetworks = [];
  NETWORKS.forEach(function (net) {
    var v = Math.max(parseViews((VIEWS.redes || {})[net[0]]), siteByNetwork[net[0]]);
    if (v > 0) { totalViews += v; usedNetworks.push(net[1]); }
  });
  var totalEl = $('[data-views-total]');
  if (totalEl && totalViews > 0) {
    /* "mais de X": X arredondado PARA BAIXO, para a frase ser sempre verdadeira
       (1.603.509 → "mais de 1,6 mi"; 1.599.000 → "mais de 1,5 mi") */
    var step = totalViews >= 1e6 ? 1e5 : (totalViews >= 1e3 ? 100 : 1);
    var shown = Math.floor(totalViews / step) * step;
    var numEl = $('[data-views-total-num]', totalEl);
    if (shown < totalViews) {
      var prefix = document.createElement('span');
      prefix.className = 'works__total-unit';
      prefix.textContent = 'mais de ';
      numEl.appendChild(prefix);
    }
    /* a vírgula do Bodoni é fina demais e parece ponto: desenha com a fonte do texto */
    viewsFmt.format(shown).split(/(,)/).forEach(function (part) {
      if (part !== ',') { numEl.appendChild(document.createTextNode(part)); return; }
      var sep = document.createElement('span');
      sep.className = 'works__total-sep';
      sep.textContent = ',';
      numEl.appendChild(sep);
    });
    /* a linha de baixo tem os links das duas redes: vira "somadas no Instagram e no TikTok"
       só quando as duas entraram na soma; senão continua "Ver mais no…" */
    var lead = $('[data-views-lead]');
    if (lead && usedNetworks.length === 2) lead.textContent = 'somadas no';
    totalEl.title = totalViews.toLocaleString('pt-BR') + ' visualizações no total';
    totalEl.hidden = false;
  }

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
