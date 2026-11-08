/* ==========================================================================
   Mylla Paolucci · Portfólio · inicialização
   Carregado no <head> SEM defer: roda antes da primeira pintura, para que os
   elementos que vão entrar animados já comecem escondidos (sem piscar).
   ========================================================================== */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');

  /* Quem pediu movimento reduzido vê a página estática desde o início. */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  root.classList.add('motion');

  /* Rede de segurança: se o main.js (ou as bibliotecas de animação) não
     assumir em 4 s, por erro ou rede lenta, mostra tudo sem animação. */
  setTimeout(function () {
    if (!root.classList.contains('motion-ready')) root.classList.remove('motion');
  }, 4000);
})();
