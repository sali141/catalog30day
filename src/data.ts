export type CatalogProduct = {
  key: string
  name: string
  code: string
  archetype: 'Base plan' | 'Add-on'
  service: 'Mobile' | 'Protection'
  data: string
  voice: string
  sms: string
  fup: string
  basePrice: number
  status: 'Draft' | 'Active'
}

export type ListingRecord = {
  key: string
  name: string
  code: string
  listingType: 'Base plan' | 'Add-on' | 'Bundle offer' | 'Merchandise item'
  product: string
  categories: string[]
  price: string
  priceRange?: { min: string; max: string }
  variantCount?: number
  promotionCount: number
  status: 'Active' | 'Archived' | 'Draft'
  lastUpdated: string
  updatedBy: string
}

export type CatalogTableRow = {
  key: string
  kind: 'product' | 'bundle'
  name: string
  secondary: string
  typeLabel: string
  category: string
  status: string
  updatedAt: string
  owner: string
  subscriptionType?: string
  duration?: string
  dataAllowance?: string
  variantCount?: number
  componentNames?: string[]
  issues?: string[]
  usedInOffers: number
  usedInBundles: number
}

export const initialProducts: CatalogProduct[] = [
  {
    key: 'p-1',
    name: 'Minimalist',
    code: 'CCI-MIN-01',
    archetype: 'Base plan',
    service: 'Mobile',
    data: '2 GB',
    voice: 'Unlimited',
    sms: 'Unlimited',
    fup: '2 GB at full speed, then 1 Mbps',
    basePrice: 15,
    status: 'Active',
  },
  {
    key: 'p-2',
    name: 'Scroller',
    code: 'CCI-SCR-01',
    archetype: 'Base plan',
    service: 'Mobile',
    data: '20 GB',
    voice: 'Unlimited',
    sms: 'Unlimited',
    fup: '20 GB at full speed, then 1 Mbps',
    basePrice: 35,
    status: 'Active',
  },
  {
    key: 'p-3',
    name: 'Unlimited 50+',
    code: 'CCI-UNL-50',
    archetype: 'Base plan',
    service: 'Mobile',
    data: 'Unlimited',
    voice: 'Unlimited',
    sms: 'Unlimited',
    fup: '50 GB priority data',
    basePrice: 50,
    status: 'Draft',
  },
  {
    key: 'p-4',
    name: 'International calling',
    code: 'CCI-INTL-01',
    archetype: 'Add-on',
    service: 'Mobile',
    data: '—',
    voice: '300 minutes',
    sms: '—',
    fup: 'Stops when allowance is exhausted',
    basePrice: 10,
    status: 'Draft',
  },
]

export const initialListings = listingRows as ListingRecord[]
export const initialCatalogRows = catalogRows as CatalogTableRow[]
import listingRows from './listings.json'
import catalogRows from './catalog.json'
