const placeholders = [
  "https://images.pexels.com/photos/13141008/pexels-photo-13141008.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/34649354/pexels-photo-34649354.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/8994432/pexels-photo-8994432.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/7151514/pexels-photo-7151514.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/30651230/pexels-photo-30651230.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3892912/pexels-photo-3892912.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/14460275/pexels-photo-14460275.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/34649310/pexels-photo-34649310.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/18372923/pexels-photo-18372923.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/15362149/pexels-photo-15362149.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://res.cloudinary.com/dwoklp9vo/image/upload/v1757560924/Screenshot_2025-09-08_152618_m86jwu.avif",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getTournamentPlaceholder(tournamentId?: string): string {
  if (!tournamentId) {
    return placeholders[Math.floor(Math.random() * placeholders.length)];
  }
  return placeholders[hashString(tournamentId) % placeholders.length];
}
