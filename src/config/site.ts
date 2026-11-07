export const site = {
  // One switch removes the gallery/switcher and generates /ro/ and /en/ routes.
  presentation: true,
  productionOrigin: '', // Only set after domain and real content approval.
  brand: {
    name: 'Security SRL',
    logo: '',
    colors: {
      background: '#08090B',
      surface: '#141619',
      text: '#F5F5F2',
      muted: '#A9ADB3',
      gold: '#C5A46D',
    },
  },
  contact: {
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    socials: [] as { label: string; url: string }[],
  },
  heroVideo: { mp4: '', webm: '', objectPosition: '80% 50%' },
  featuredOrder: ['commercial', 'perimeter'],
} as const;
