// ─────────────────────────────────────────────────────────────
// Pakistani cities grouped by province
// ─────────────────────────────────────────────────────────────

export const CITIES_BY_PROVINCE: Record<string, string[]> = {
  'Islamabad Capital Territory': ['Islamabad'],

  Punjab: [
    'Lahore', 'Faisalabad', 'Rawalpindi', 'Gujranwala', 'Multan',
    'Bahawalpur', 'Sargodha', 'Sialkot', 'Sheikhupura', 'Gujrat',
    'Jhang', 'Rahim Yar Khan', 'Kasur', 'Dera Ghazi Khan', 'Sahiwal',
    'Okara', 'Hafizabad', 'Chiniot', 'Khushab', 'Mianwali',
    'Pakpattan', 'Vehari', 'Khanewal', 'Muzaffargarh', 'Attock',
    'Chakwal', 'Jhelum', 'Narowal', 'Nankana Sahib', 'Toba Tek Singh',
    'Wah Cantt', 'Taxila', 'Kamalia', 'Daska',
  ],

  Sindh: [
    'Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Mirpur Khas',
    'Nawabshah', 'Jacobabad', 'Khairpur', 'Shikarpur', 'Dadu',
    'Thatta', 'Badin', 'Kotri', 'Matiari', 'Sanghar',
    'Umerkot', 'Naushahro Feroze', 'Qambar',
  ],

  'Khyber Pakhtunkhwa': [
    'Peshawar', 'Abbottabad', 'Mardan', 'Mingora', 'Nowshera',
    'Kohat', 'Dera Ismail Khan', 'Haripur', 'Mansehra', 'Chitral',
    'Swabi', 'Malakand', 'Buner', 'Dir', 'Bannu', 'Karak',
    'Hangu', 'Lakki Marwat', 'Tank',
  ],

  Balochistan: [
    'Quetta', 'Gwadar', 'Turbat', 'Khuzdar', 'Hub', 'Chaman',
    'Zhob', 'Loralai', 'Nushki', 'Dalbandin', 'Panjgur', 'Dera Bugti',
    'Kharan', 'Sibi', 'Mastung',
  ],

  'Azad Kashmir': [
    'Muzaffarabad', 'Mirpur (AJK)', 'Rawalakot', 'Kotli', 'Bhimber',
  ],

  'Gilgit-Baltistan': [
    'Gilgit', 'Skardu', 'Hunza', 'Ghanche', 'Diamer',
  ],
}

export const ALL_CITIES: string[] = Object.values(CITIES_BY_PROVINCE)
  .flat()
  .sort((a, b) => a.localeCompare(b))

// ─────────────────────────────────────────────────────────────
// Role metadata
// ─────────────────────────────────────────────────────────────

export const ROLE_META = {
  BUSINESS_OWNER: {
    label:    'Business Owner',
    emoji:    '🏢',
    tagline:  'List and grow your business',
    desc:     'Showcase your business to thousands of verified investors and strategic buyers across Pakistan.',
    redirect: '/dashboard/business',
    color:    'amber',
  },
  INVESTOR: {
    label:    'Investor',
    emoji:    '💰',
    tagline:  'Discover high-potential SMEs',
    desc:     'Access curated investment opportunities across 15 industries and 7 provinces. Deploy capital with confidence.',
    redirect: '/dashboard/investor',
    color:    'green',
  },
  BUYER: {
    label:    'Buyer',
    emoji:    '🤝',
    tagline:  'Acquire an established business',
    desc:     'Find profitable SMEs ready for acquisition. Skip the startup grind — buy proven cashflow.',
    redirect: '/dashboard/buyer',
    color:    'blue',
  },
  BUSINESS_EXPERT: {
    label:    'Business Expert',
    emoji:    '🎯',
    tagline:  'Run and grow someone else\'s business',
    desc:     'Offer your operational and leadership skills to owners who need a skilled CEO or operator.',
    redirect: '/dashboard/expert',
    color:    'purple',
  },
} as const

export type AppRole = keyof typeof ROLE_META

export const ROLE_REDIRECTS: Record<string, string> = {
  BUSINESS_OWNER:  '/dashboard/business',
  INVESTOR:        '/dashboard/investor',
  BUYER:           '/dashboard/buyer',
  BUSINESS_EXPERT: '/dashboard/expert',
  ADMIN:           '/admin',
}

export function getRoleRedirect(role: string): string {
  return ROLE_REDIRECTS[role] ?? '/dashboard/business'
}

// ─────────────────────────────────────────────────────────────
// Cookie
// ─────────────────────────────────────────────────────────────

export const AUTH_COOKIE = 'finvest_token'
export const JWT_EXPIRY_SECONDS = 60 * 60 * 24 * 7 // 7 days
