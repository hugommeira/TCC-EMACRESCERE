// Fotos do site num lugar só. Todas locais (public/photos), vindas do Pexels:
// licença livre para uso comercial, sem atribuição obrigatória
// (https://www.pexels.com/license/). Créditos completos em docs/fotos/BRIEFING.md.

export const PHOTOS = {
  // Topo no celular (foto vertical). pexels.com/photo/7330711 — MART PRODUCTION
  heroMobile: "/photos/heroMobile.jpg",
  // pexels.com/photo/4474047 — Ketut Subiyanto
  videoCall:  "/photos/videoCall.jpg",
  // pexels.com/photo/724300 — Cats Coming
  food:       "/photos/food.jpg",
  // pexels.com/photo/8376291 — Tima Miroshnichenko
  doctorDesk: "/photos/doctorDesk.jpg",
} as const;

// Telas de autenticação: cada uma com foto própria, sem repetir as da landing.
export const AUTH_PHOTOS = {
  // pexels.com/photo/4939431 — Nataliya Vaitkevich
  login:          "/photos/login.jpg",
  // pexels.com/photo/5495142 — Anastasia Shuraeva
  register:       "/photos/register.jpg",
  // pexels.com/photo/7579831 — cottonbro studio
  registerDoctor: "/photos/registerDoctor.jpg",
  // pexels.com/photo/27176011 — Helena Lopes
  password:       "/photos/password.jpg",
} as const;
