/* ==========================================================================
   EDITAR: views
   - Pode escrever do jeito que quiser: 12400, "3,171", "23 mil", "1,4 mi".
   - Deixe null para não mostrar nada (nunca aparece "0").
   ========================================================================== */
window.PORTFOLIO_VIEWS = {
  /* Total de cada rede: soma de TODOS os vídeos do perfil, não só os do site.
     É o número do "mais de X mi views somadas no Instagram e no TikTok".
     Se ficar null, o site usa a soma dos vídeos daquela rede que estão no site. */
  redes: {
    instagram: 25660, // soma dos 10 reels do perfil @paoluucci (print de 08/11/2026)
    tiktok: 1857131,     // EDITAR: soma de todos os vídeos do perfil @milapaolucci
  },

  /* Views de cada vídeo do site (aparecem no canto do vídeo) */
  videos: {
    destaque: 3174, // Your next opponent is you
    "01": 3465,     // Bubblegum: Sweet & Sour
    "02": 3537,     // Correntes Invisíveis
    "03": 1994,     // Desfile Afrocentrado
    "04": 3885,     // Design de Moda · CEFET-MG
    "05": 3545,     // Maréa Arte
    "06": 182200,   // CIA 2026 (TikTok)
    "07": 1714,     // Press Kit Maréa Arte
    "08": 1400000,  // Calourada (TikTok)
  },
};
