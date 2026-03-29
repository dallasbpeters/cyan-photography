/** Seed rows — `category` is a slug that must exist in `categories` (e.g. film, photography). */
export type SeedPhotoRow = {
  url: string;
  title: string;
  category: string;
  order: number;
};

export const INITIAL_PHOTOS_SEED: SeedPhotoRow[] = [
  { url: 'https://picsum.photos/seed/sxi1/1920/1080', title: 'C&W x Torten Rituale', category: 'film', order: 1 },
  { url: 'https://picsum.photos/seed/sxi2/1920/1080', title: 'OACE x TONED', category: 'photography', order: 2 },
  { url: 'https://picsum.photos/seed/sxi3/1920/1080', title: 'Minor x Der Moment...', category: 'film', order: 3 },
  { url: 'https://picsum.photos/seed/sxi4/1920/1080', title: 'OACE - Ambition x Nylon', category: 'photography', order: 4 },
  { url: 'https://picsum.photos/seed/sxi5/1920/1080', title: 'FLF x Launch Campaign', category: 'film', order: 5 },
  { url: 'https://picsum.photos/seed/sxi6/1920/1080', title: 'ALDI Nord x Original 2.0', category: 'film', order: 6 },
  { url: 'https://picsum.photos/seed/sxi7/1920/1080', title: 'REWE x Zwei Für REWE', category: 'film', order: 7 },
  { url: 'https://picsum.photos/seed/sxi8/1920/1080', title: 'GIANT x Tony Martin', category: 'photography', order: 8 },
  { url: 'https://picsum.photos/seed/sxi9/1920/1080', title: 'Vorwerk x Kobold SP600', category: 'film', order: 9 },
  { url: 'https://picsum.photos/seed/sxi10/1920/1080', title: 'DFB x Die Mannschaft', category: 'film', order: 10 },
  { url: 'https://picsum.photos/seed/sxi11/1920/1080', title: 'MIELE x Monatsthemen', category: 'photography', order: 11 },
  { url: 'https://picsum.photos/seed/sxi12/1920/1080', title: 'Handelsblatt x Für dich.', category: 'film', order: 12 },
  { url: 'https://picsum.photos/seed/sxi13/1920/1080', title: 'Urban Silence', category: 'photography', order: 13 },
  { url: 'https://picsum.photos/seed/sxi14/1920/1080', title: 'Neon Nights', category: 'photography', order: 14 },
  { url: 'https://picsum.photos/seed/sxi15/1920/1080', title: 'Desert Bloom', category: 'photography', order: 15 },
  { url: 'https://picsum.photos/seed/sxi16/1920/1080', title: 'Mountain Echo', category: 'photography', order: 16 },
  { url: 'https://picsum.photos/seed/sxi17/1920/1080', title: 'Ocean Breeze', category: 'photography', order: 17 },
  { url: 'https://picsum.photos/seed/sxi18/1920/1080', title: 'Forest Whisper', category: 'photography', order: 18 },
  { url: 'https://picsum.photos/seed/sxi19/1920/1080', title: 'Golden Hour', category: 'photography', order: 19 },
  { url: 'https://picsum.photos/seed/sxi20/1920/1080', title: 'Silver Lining', category: 'photography', order: 20 },
  { url: 'https://picsum.photos/seed/sxi21/1920/1080', title: 'Velvet Sky', category: 'photography', order: 21 },
  { url: 'https://picsum.photos/seed/sxi22/1920/1080', title: 'Crystal Clear', category: 'photography', order: 22 },
  { url: 'https://picsum.photos/seed/sxi23/1920/1080', title: 'Midnight Blue', category: 'photography', order: 23 },
  { url: 'https://picsum.photos/seed/sxi24/1920/1080', title: 'Emerald Green', category: 'photography', order: 24 },
  { url: 'https://picsum.photos/seed/sxi25/1920/1080', title: 'Ruby Red', category: 'photography', order: 25 },
  { url: 'https://picsum.photos/seed/sxi26/1920/1080', title: 'Amber Glow', category: 'photography', order: 26 },
  { url: 'https://picsum.photos/seed/sxi27/1920/1080', title: 'Sapphire Soul', category: 'photography', order: 27 },
  { url: 'https://picsum.photos/seed/sxi28/1920/1080', title: 'Quartz Quest', category: 'photography', order: 28 },
  { url: 'https://picsum.photos/seed/sxi29/1920/1080', title: 'Topaz Trail', category: 'photography', order: 29 },
  { url: 'https://picsum.photos/seed/sxi30/1920/1080', title: 'Opal Orbit', category: 'photography', order: 30 },
  { url: 'https://picsum.photos/seed/sxi31/1920/1080', title: 'Jade Journey', category: 'photography', order: 31 },
  { url: 'https://picsum.photos/seed/sxi32/1920/1080', title: 'Pearl Path', category: 'photography', order: 32 },
];
