const tones = ['violet', 'blue', 'teal', 'amber', 'rose', 'green', 'cyan', 'slate'];
const knownCategories = {
  'job application': 'violet',
  interview: 'blue',
  meeting: 'teal',
  personal: 'amber',
  other: 'rose',
};

export function categoryTone(category = '') {
  const normalized = String(category ?? '').trim().toLowerCase();
  if (knownCategories[normalized]) return knownCategories[normalized];

  const hash = [...normalized].reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 0);
  return tones[hash % tones.length];
}
