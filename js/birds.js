// The birds Gary knows about. Add more here and they show up in the gallery.
export const BIRDS = [
  { id: 'robin', name: 'European Robin', short: 'Robin', latin: 'Erithacus rubecula',
    body: '#8A6A48', breast: '#EE7B3A', head: '#8A6A48', beak: '#2B2340',
    take: 'Looks sweet. Will fight its own reflection. Respect.' },
  { id: 'bluetit', name: 'Eurasian Blue Tit', short: 'Blue Tit', latin: 'Cyanistes caeruleus',
    body: '#8FB86A', breast: '#F2D64B', head: '#4C8FD6', beak: '#2B2340',
    take: 'Tiny. Acrobatic. Steals peanuts with zero shame.' },
  { id: 'magpie', name: 'Eurasian Magpie', short: 'Magpie', latin: 'Pica pica',
    body: '#1F1F2A', breast: '#FFFFFF', head: '#1F1F2A', beak: '#2B2340',
    take: 'Smart, shiny-obsessed, owes me money.' },
  { id: 'blackbird', name: 'Common Blackbird', short: 'Blackbird', latin: 'Turdus merula',
    body: '#1F1F2A', breast: '#2E2E3A', head: '#1F1F2A', beak: '#F2A93B',
    take: 'Gorgeous voice. Knows it. Insufferable.' },
  { id: 'sparrow', name: 'House Sparrow', short: 'Sparrow', latin: 'Passer domesticus',
    body: '#9C7B55', breast: '#CFC6B5', head: '#7D7D7D', beak: '#2B2340',
    take: 'Basically me, but smaller and louder.' },
  { id: 'mallard', name: 'Mallard', short: 'Mallard', latin: 'Anas platyrhynchos',
    body: '#9A8F80', breast: '#7A4A33', head: '#2F7A4A', beak: '#F2D64B',
    take: 'A duck. Big fan of bread. Do not give it bread.' }
];

export const byId = (id) => BIRDS.find((b) => b.id === id);

export function birdSvg(b, size = 120) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" aria-hidden="true">
  <path d="M20 60l-12 6 14 2" stroke="#2B2340" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <ellipse cx="48" cy="58" rx="30" ry="26" fill="${b.body}" stroke="#2B2340" stroke-width="2.5"/>
  <ellipse cx="54" cy="62" rx="20" ry="17" fill="${b.breast}" stroke="#2B2340" stroke-width="2.5"/>
  <circle cx="62" cy="36" r="16" fill="${b.head}" stroke="#2B2340" stroke-width="2.5"/>
  <circle cx="66" cy="33" r="4" fill="#fff"/><circle cx="67" cy="33" r="2.2" fill="#2B2340"/>
  <path d="M77 36l10 3-10 4z" fill="${b.beak}" stroke="#2B2340" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M42 83v9M54 83v9" stroke="#2B2340" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;
}

export function silhouetteSvg(size = 72) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true" fill="#2B2340" opacity="0.2">
  <path d="M20 60l-12 6 14 2z"/><ellipse cx="48" cy="58" rx="30" ry="26"/><circle cx="62" cy="36" r="16"/><path d="M77 36l10 3-10 4z"/>
</svg>`;
}

export function garySvg(size = 44, bg = '#C9D3E6') {
  return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" aria-hidden="true">
  <circle cx="24" cy="24" r="23" fill="${bg}" stroke="#2B2340" stroke-width="2"/>
  <path d="M12 30c0-10 6-17 14-17 7 0 11 5 11 11v2l5 2-5 2c-1 6-7 9-13 9-7 0-12-4-12-9z" fill="#8E9BB8" stroke="#2B2340" stroke-width="2" stroke-linejoin="round"/>
  <path d="M18 30c3 3 9 3 13 0" stroke="#5FBFA0" stroke-width="3" stroke-linecap="round"/>
  <circle cx="29" cy="22" r="4" fill="#FF9A3C" stroke="#2B2340" stroke-width="2"/>
  <circle cx="29" cy="22" r="1.5" fill="#2B2340"/>
</svg>`;
}
