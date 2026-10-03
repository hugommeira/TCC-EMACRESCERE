// Fotos da página inicial num lugar só, pra trocar por fotos próprias depois.
// Unsplash está liberado no CSP (next.config.mjs) e em images.remotePatterns.
const unsplash = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const PHOTOS = {
  // Local: não depende de CDN, é a primeira imagem que o visitante vê.
  hero:        "/hero-mobile.jpg",
  doctor:      unsplash("1559839734-2b71ea197ec2"),
  videoCall:   unsplash("1576091160399-112ba8d25d1d"),
  tablet:      unsplash("1576091160550-2173dba999ef"),
  food:        unsplash("1490645935967-10de6ba17061"),
  activity:    unsplash("1571019613454-1cb2f99b2d8b"),
  doctorDesk:  unsplash("1612349317150-e413f6a5b16d", 1400),
} as const;
