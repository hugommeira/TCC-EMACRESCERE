// Fotos da página inicial num lugar só, pra trocar por fotos próprias depois.
// Pexels: licença livre para uso comercial, sem atribuição obrigatória
// (https://www.pexels.com/license/). O domínio está liberado no CSP e em
// images.remotePatterns (next.config.mjs).
const pexels = (id: number, w = 1400) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

export const PHOTOS = {
  // Local: não depende de CDN, é a primeira imagem que o visitante vê.
  hero:       "/hero-mobile.jpg",
  // Topo no celular (foto vertical).
  // pexels.com/photo/portrait-photo-of-smiling-woman-in-black-t-shirt-and-glasses-using-her-smartphone-3769022
  heroMobile: pexels(3769022, 1000),
  // pexels.com/photo/a-smiling-doctor-in-white-lab-coat-with-stethoscope-on-her-neck-8376309
  doctor:     pexels(8376309),
  // pexels.com/photo/a-doctor-in-a-video-conference-using-a-laptop-8376339
  videoCall:  pexels(8376339),
  // pexels.com/photo/a-doctor-and-patient-looking-the-digital-tablet-6010873
  tablet:     pexels(6010873),
  // pexels.com/photo/photo-of-vegetable-salad-in-bowls-1640770
  food:       pexels(1640770),
  // pexels.com/photo/active-woman-walking-on-the-beach-4939431
  activity:   pexels(4939431, 1800),
  // pexels.com/photo/male-doctor-doing-an-online-consultation-8376152
  doctorDesk: pexels(8376152, 1800),
} as const;

// Telas de autenticação: cada uma com foto própria, sem repetir as da landing.
export const AUTH_PHOTOS = {
  // pexels.com/photo/smiling-woman-using-mobile-phone-at-home-6697318
  login:          pexels(6697318, 1600),
  // pexels.com/photo/woman-preparing-food-on-the-table-3756481
  register:       pexels(3756481, 1600),
  // pexels.com/photo/a-doctor-using-a-laptop-7195379
  registerDoctor: pexels(7195379, 1600),
  // pexels.com/photo/woman-smiling-while-using-phone-on-sofa-in-home-27176011
  password:       pexels(27176011, 1600),
} as const;
