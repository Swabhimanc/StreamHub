// Countries used to curate region-specific rows via TMDB's
// `with_origin_country` discover filter. '' means Global (no filtering).
export const GLOBAL_COUNTRY = ''

export const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'IN', name: 'India' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'MX', name: 'Mexico' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CN', name: 'China' },
  { code: 'NG', name: 'Nigeria' },
]

export const countryName = (code) =>
  COUNTRIES.find((c) => c.code === code)?.name || code
