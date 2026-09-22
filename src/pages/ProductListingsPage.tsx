import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  AppstoreAddOutlined,
  ArrowLeftOutlined,
  BarsOutlined,
  CloseOutlined,
  DeleteOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import {
  Alert,
  App,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Collapse,
  Divider,
  Dropdown,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Space,
  Steps,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ScopeTag } from '../components/ScopeTag'
import {
  initialListings,
  initialCatalogRows,
  initialProducts,
  type ListingRecord,
} from '../data'

type OfferType = 'BASE_PLAN' | 'ADD_ON' | 'MIXED_BUNDLE'
type OfferSubType = 'FIXED_DATA_TIER' | 'UNLIMITED_TIER' | 'ASSET_ANCHORED'
type ListingStatus = 'Draft'
type PaymentModel = 'Postpaid' | 'Prepaid'
type PaymentPolicy = 'Standard Postpaid' | 'Upfront Card'
type ChargingPolicy = 'Real-Time Policy' | 'Advance Policy' | 'Arrears Policy'
type BillingPolicyOption = 'Bill Cycle Policy'
type ProrationPolicy = 'Daily Proration Policy'
type PricingType = 'RECURRING' | 'ONE TIME' | 'INSTALLMENT'
type FeeDefinition =
  | 'Network Activation Fee'
  | 'Late Payment Fee'
  | 'Compliance Fee'
  | 'Compliance Fee (Phone)'
  | 'Compliance Fee (Smartwatch)'
  | 'Compliance Fee (SpeakEasy)'
  | 'Opt-Out Fee (disable AutoPay)'
  | 'Regulatory Fee'
  | 'USF Cellular'
type PricingStructure = 'Flat' | 'Per Tier'
type PricingBasis = 'FLAT' | 'PER LINE'
type PricingFrequency = 'Monthly' | 'Annually' | 'On Activation'
type TaxTreatment = 'INCLUSIVE' | 'EXCLUSIVE'

type TierDimension = 'Line Count'

type PriceTier = {
  minQty?: number
  maxQty?: number
  amount?: number
}

type ServiceSplitType = 'Data' | 'Voice' | 'SMS'
type EntitlementServiceType = 'Data' | 'Voice' | 'SMS' | 'Insurance'
type AllocationMode = 'Line' | 'Per Line' | 'Shared Pool'
type EntitlementResetFrequency = 'Daily' | 'Monthly' | 'Bill Cycle' | 'None'
type EntitlementExpiry = 'Expire' | 'Carry Over' | 'Replace'
type RevenueSplitMode = 'Equally' | 'By Percentage' | 'By Amount'
type RevenueAllocationMode = 'Mobile (100%)' | 'Split'

type SharingScope = 'Line' | 'Group' | 'Account'
type AllocationUnit = 'GB' | 'MB' | 'KB'

type EntitlementAllocationRow = {
  line: number
  value?: number
  unit?: AllocationUnit
}

type ServiceEntitlement = {
  applicable?: boolean
  allowance?: string
  fupThreshold?: string
  qosAfterFup?: string
  enableSharing?: boolean
  sharingScope?: SharingScope
  allocationMode?: AllocationMode
  allocations?: EntitlementAllocationRow[]
  resetFrequency?: EntitlementResetFrequency
  rolloverAllowed?: boolean
  rolloverLimitValue?: number
  rolloverLimitUnit?: AllocationUnit
  expiry?: EntitlementExpiry
}

type ServicePricingSplit = {
  serviceType: ServiceSplitType
  amount?: number
  percentage?: number
  glCode?: string
  taxId?: string
  taxTreatment?: TaxTreatment
  amountManuallySet?: boolean
}

type PriceComponent = {
  pricingType?: PricingType
  feeDefinition?: FeeDefinition
  componentLabel?: string
  glCode: string
  taxTreatment?: TaxTreatment
  pricingStructure: PricingStructure
  pricingBasis?: PricingBasis
  frequency?: PricingFrequency
  taxId: string
  revenueAllocationMode?: RevenueAllocationMode
  revenueSplitMode?: RevenueSplitMode
  servicePricingSplits?: ServicePricingSplit[]
  amount?: number
  tierDimension?: TierDimension
  tiers?: PriceTier[]
}

type ListingFormValues = {
  name: string
  code: string
  offerType: OfferType
  offerSubType?: OfferSubType
  minLines?: number
  maxLines?: number
  sellable: boolean
  status: ListingStatus
  productKeys: string[]
  paymentModel: PaymentModel
  paymentPolicy: PaymentPolicy
  chargingPolicy: ChargingPolicy
  billingPolicy: BillingPolicyOption
  prorationPolicy: ProrationPolicy
  priceComponents: PriceComponent[]
  entitlements: Record<string, Record<EntitlementServiceType, ServiceEntitlement>>
  displayName: string
  subtitle?: string
  description?: string
  channels: string[]
  productDetailsUrl?: string
  termsAndConditionsUrl?: string
  bannerImageUrl?: string
  listingLabelEnabled?: boolean
  listingLabel?: string
  features: string[]
  galleryImages: GalleryImage[]
  eligibility: EligibilityFormValues
}

type GalleryImage = {
  uid: string
  url: string
  name: string
}

type LocationCompatibilityMode = 'allow' | 'exclude'
type PurchaseCompatibilityMode = 'allow' | 'exclude'
type CustomerAttributeKind = 'Residency status' | 'Membership' | 'Age'
type AttributeMatchMode = 'Include' | 'Exclude'

type CustomerAttributeRule = {
  attribute?: CustomerAttributeKind
  matchMode?: AttributeMatchMode
  values?: string[]
  minValue?: number
  maxValue?: number
}

type EligibilityFormValues = {
  locationAvailabilityEnabled: boolean
  locationCompatibilityMode: LocationCompatibilityMode
  locationSearchBy: string
  locations: string[]
  salesChannelAvailabilityEnabled: boolean
  channelSearchBy: string
  salesChannels: string[]
  subscriptionControlEnabled: boolean
  purchaseCompatibilityEnabled: boolean
  purchaseCompatibilityMode: PurchaseCompatibilityMode
  compatibleProducts: string[]
  customerEligibilityEnabled: boolean
  useCustomerAttributes: boolean
  attributeRules: CustomerAttributeRule[]
  useSegments: boolean
  segments: string[]
  customerJourneyEnabled: boolean
  journeys: string[]
}

const stepItems = [
  { title: 'Offer Details', description: 'Offer and payment' },
  { title: 'Pricing', description: 'Pricing components' },
  { title: 'Entitlement', description: 'Service allowances' },
  { title: 'Eligibility', description: 'Availability rules' },
  { title: 'Display', description: 'Customer-facing content' },
  { title: 'Review', description: 'Confirm and save' },
]

const OFFER_SUBTYPE_OPTIONS: Partial<Record<OfferType, OfferSubType[]>> = {
  BASE_PLAN: ['FIXED_DATA_TIER', 'UNLIMITED_TIER', 'ASSET_ANCHORED'],
}

const OFFER_TYPE_CARDS: Array<{
  value: OfferType
  title: string
  description: string
  icon: ReactNode
}> = [
  {
    value: 'BASE_PLAN',
    title: 'Base plan',
    description: 'Subscriber anchor',
    icon: <HomeOutlined />,
  },
  {
    value: 'ADD_ON',
    title: 'Add-on',
    description: 'Requires anchor',
    icon: <AppstoreAddOutlined />,
  },
  {
    value: 'MIXED_BUNDLE',
    title: 'Mixed Bundle',
    description: 'Combined offer',
    icon: <BarsOutlined />,
  },
]

function offerSubtypesForType(offerType?: OfferType): OfferSubType[] {
  if (!offerType) return []
  return OFFER_SUBTYPE_OPTIONS[offerType] ?? []
}

function offerTypeTitle(offerType?: OfferType): string {
  const card = OFFER_TYPE_CARDS.find((item) => item.value === offerType)
  return card?.title ?? 'Base plan'
}

function generateRandomOfferCodeSegment(length = 8): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const values = new Uint32Array(length)
  crypto.getRandomValues(values)
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join('')
}

function generateOfferCode(): string {
  return `CX-CAT-OFR-${generateRandomOfferCodeSegment(8)}`
}

function OfferTypePicker({
  value,
  onChange,
}: {
  value?: OfferType
  onChange?: (value: OfferType) => void
}) {
  const form = Form.useFormInstance<ListingFormValues>()
  const productKeys = Form.useWatch('productKeys', { form, preserve: true }) as string[] | undefined
  const productCount = productKeys?.length ?? 0
  const availableCards = OFFER_TYPE_CARDS.filter((card) => (
    productCount > 1
      ? card.value === 'MIXED_BUNDLE'
      : card.value === 'BASE_PLAN' || card.value === 'ADD_ON'
  ))

  const handleSelect = (nextValue: OfferType) => {
    const subtypes = offerSubtypesForType(nextValue)
    form.setFieldsValue({
      offerType: nextValue,
      offerSubType: subtypes[0],
      minLines: nextValue === 'BASE_PLAN' ? form.getFieldValue('minLines') ?? 1 : undefined,
      maxLines: nextValue === 'BASE_PLAN' ? form.getFieldValue('maxLines') ?? 3 : undefined,
    })
    onChange?.(nextValue)
  }

  useEffect(() => {
    if (!productCount) return
    const allowedValues = new Set(
      productCount > 1
        ? (['MIXED_BUNDLE'] as OfferType[])
        : (['BASE_PLAN', 'ADD_ON'] as OfferType[]),
    )
    if (value && allowedValues.has(value)) return
    const nextValue = productCount > 1 ? 'MIXED_BUNDLE' : 'BASE_PLAN'
    const subtypes = offerSubtypesForType(nextValue)
    form.setFieldsValue({
      offerType: nextValue,
      offerSubType: subtypes[0],
      minLines: nextValue === 'BASE_PLAN' ? form.getFieldValue('minLines') ?? 1 : undefined,
      maxLines: nextValue === 'BASE_PLAN' ? form.getFieldValue('maxLines') ?? 3 : undefined,
    })
    onChange?.(nextValue)
  }, [productCount, value, form, onChange])

  return (
    <div className="offer-type-picker">
      <div className={`offer-type-grid${availableCards.length === 1 ? ' is-single' : ''}`}>
        {availableCards.map((card) => {
          const isSelected = value === card.value
          return (
            <button
              key={card.value}
              type="button"
              className={`offer-type-card${isSelected ? ' selected' : ''}`}
              onClick={() => handleSelect(card.value)}
            >
              <span className="offer-type-card-icon">{card.icon}</span>
              <Typography.Text className="offer-type-card-title">{card.title}</Typography.Text>
              <Typography.Text type="secondary" className="offer-type-card-description">
                {card.description}
              </Typography.Text>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const PRICING_TYPE_OPTIONS: PricingType[] = ['RECURRING', 'ONE TIME', 'INSTALLMENT']
const FEE_DEFINITION_OPTIONS: FeeDefinition[] = [
  'Network Activation Fee',
  'Late Payment Fee',
  'Compliance Fee',
  'Compliance Fee (Phone)',
  'Compliance Fee (Smartwatch)',
  'Compliance Fee (SpeakEasy)',
  'Opt-Out Fee (disable AutoPay)',
  'Regulatory Fee',
  'USF Cellular',
]
type FeeCatalogOption = {
  label: FeeDefinition
  code: string
  priceLabel: string
  category: string
  amount?: number
  pricingUnit?: PricingBasis
  formula?: boolean
}
const FEE_CATALOG_OPTIONS: FeeCatalogOption[] = [
  {
    label: 'Network Activation Fee',
    code: 'FEE_ACTIVATION',
    priceLabel: '$10.00/ line',
    category: 'ACTIVATION',
    amount: 10,
    pricingUnit: 'PER LINE',
  },
  {
    label: 'Late Payment Fee',
    code: 'FEE_LATE',
    priceLabel: '$5.00',
    category: 'PENALTY',
    amount: 5,
  },
  {
    label: 'Compliance Fee (Phone)',
    code: 'FEE_COMP_PHONE',
    priceLabel: '$3.99/ mo',
    category: 'MONTHLY',
    amount: 3.99,
  },
  {
    label: 'Compliance Fee (Smartwatch)',
    code: 'FEE_COMP_WATCH',
    priceLabel: '$0.62/ mo',
    category: 'MONTHLY',
    amount: 0.62,
  },
  {
    label: 'Compliance Fee (SpeakEasy)',
    code: 'FEE_COMP_SPEAK',
    priceLabel: '$1.99/ mo',
    category: 'MONTHLY',
    amount: 1.99,
  },
  {
    label: 'Opt-Out Fee (disable AutoPay)',
    code: 'FEE_OPT_OUT',
    priceLabel: '$5.00/ mo',
    category: 'MONTHLY',
    amount: 5,
  },
  {
    label: 'Regulatory Fee',
    code: 'FEE_REGULATORY',
    priceLabel: '$0.01/ mo',
    category: 'MONTHLY',
    amount: 0.01,
  },
  {
    label: 'USF Cellular',
    code: 'FEE_USF',
    priceLabel: 'Formula',
    category: 'BILL_CALCULATION',
    formula: true,
  },
]
const TAX_TREATMENT_OPTIONS: TaxTreatment[] = ['INCLUSIVE', 'EXCLUSIVE']
const PRICING_STRUCTURE_OPTIONS: PricingStructure[] = ['Flat', 'Per Tier']
const PRICING_BASIS_OPTIONS: PricingBasis[] = ['FLAT', 'PER LINE']
const FREQUENCY_OPTIONS: PricingFrequency[] = ['Monthly', 'Annually', 'On Activation']
const FEE_FORMULA_EXPRESSION = `{
  "type": "OPERATOR",
  "operator": "MULTIPLY",
  "operands": [
    {
      "type": "OPERATOR",
      "operator": "ADD",
      "operands": [
        { "type": "PRICE_COMPONENT_REF", "service_type_code": "LOCAL_VOICE" },
        { "type": "FEE_REF", "fee_code": "COMPLIANCE_FEE_PHONE" }
      ]
    },
    { "type": "RATE_REF", "rate_code": "TrafficStudyRate" },
    { "type": "RATE_REF", "rate_code": "FedUSFRate" }
  ]
}`
const ENTITLEMENT_SERVICE_TYPES: EntitlementServiceType[] = ['Data', 'Voice', 'SMS']
const MOBILE_PLAN_CATEGORIES = ['Value plans', 'Mobile plans', 'Senior plans']
const PROTECTION_CATEGORIES = ['Protection']
const ENTITLEMENT_PANEL_TITLES: Record<EntitlementServiceType, string> = {
  Data: 'Local Data',
  Voice: 'Local Voice',
  SMS: 'Local SMS',
  Insurance: 'Insurance',
}
const FUP_THRESHOLD_OPTIONS: Record<EntitlementServiceType, string[]> = {
  Data: [
    'CCI 1 GB then throttle',
    'CCI 3 GB then throttle',
    'CCI 5 GB then throttle',
    'CCI 10 GB then throttle',
  ],
  Voice: [
    'CCI Voice — no FUP (unlimited)',
    'CCI Voice — 3,000 min then deprioritise',
    'CCI Voice — unlimited with post-limit throttle (example)',
  ],
  SMS: [
    'CCI SMS — no FUP (unlimited)',
    'CCI SMS — 1,000 SMS/cycle then rate limit',
    'CCI SMS — 500 SMS example throttle',
  ],
  Insurance: [
    'CCI Insurance — standard cover',
    'CCI Insurance — premium cover',
    'CCI Insurance — full replacement',
  ],
}
const QOS_AFTER_FUP_BY_SERVICE: Record<EntitlementServiceType, string> = {
  Data: 'Throttle to 1.5 Mbps for remainder of cycle',
  Voice: 'Deprioritise on congested cells',
  SMS: 'Rate-limit to 30 SMS / hour',
  Insurance: 'Claims processed within SLA',
}
const ENTITLEMENT_THRESHOLD_LABELS: Record<EntitlementServiceType, string> = {
  Data: 'FUP Threshold',
  Voice: 'FUP Threshold',
  SMS: 'FUP Threshold',
  Insurance: 'Coverage Profile',
}
const ENTITLEMENT_FOLLOW_ON_LABELS: Record<EntitlementServiceType, string> = {
  Data: 'QoS after FUP',
  Voice: 'QoS after FUP',
  SMS: 'QoS after FUP',
  Insurance: 'Benefit after claim',
}

function entitlementServicesForCategory(category: string): EntitlementServiceType[] {
  const normalized = category.trim().toLowerCase()
  if (MOBILE_PLAN_CATEGORIES.some((item) => item.toLowerCase() === normalized)) {
    return ['Data', 'Voice', 'SMS']
  }
  if (PROTECTION_CATEGORIES.some((item) => item.toLowerCase() === normalized)) {
    return ['Insurance']
  }
  return []
}
const LOCATION_OPTIONS = [
  { value: 'loc-001', label: 'loc-001 — Colombo' },
  { value: 'loc-002', label: 'loc-002 — Kandy' },
  { value: 'loc-003', label: 'loc-003 — Galle' },
  { value: 'loc-004', label: 'loc-004 — Jaffna' },
]
const SALES_CHANNEL_OPTIONS = [
  { value: 'daraz', label: 'daraz' },
  { value: 'app', label: 'app' },
  { value: 'web', label: 'web' },
  { value: 'retail', label: 'retail' },
]
const COMPATIBLE_PRODUCT_OPTIONS = [
  { value: 'connect', label: 'Connect' },
  { value: 'connect-plus', label: 'Connect+' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'unlimited-50', label: 'Unlimited 50+' },
]
const SEGMENT_OPTIONS = [
  { value: 'new-customers', label: 'New customers' },
  { value: 'prepaid', label: 'Prepaid' },
  { value: 'postpaid', label: 'Postpaid' },
  { value: 'aarp-members', label: 'AARP Members' },
]
const CUSTOMER_ATTRIBUTE_OPTIONS: CustomerAttributeKind[] = ['Residency status', 'Membership', 'Age']
const ATTRIBUTE_MATCH_MODE_OPTIONS: AttributeMatchMode[] = ['Include', 'Exclude']
const RESIDENCY_STATUS_OPTIONS = [
  { value: 'Tourists', label: 'Tourists' },
  { value: 'Working professionals', label: 'Working professionals' },
  { value: 'Residents', label: 'Residents' },
  { value: 'Students', label: 'Students' },
]
const MEMBERSHIP_ATTRIBUTE_OPTIONS = [
  { value: 'AARP', label: 'AARP' },
  { value: 'Military', label: 'Military' },
  { value: 'Student', label: 'Student' },
  { value: 'Senior', label: 'Senior' },
]
const JOURNEY_OPTIONS = [
  { value: 'onAppPurchase', label: 'onAppPurchase' },
  { value: 'onboarding', label: 'onboarding' },
  { value: 'upgrade', label: 'upgrade' },
  { value: 'renewal', label: 'renewal' },
]
const LOCATION_SEARCH_BY_OPTIONS = ['Location ID', 'Name']
const CHANNEL_SEARCH_BY_OPTIONS = ['Name', 'ID']

const LISTING_LABEL_OPTIONS = [
  { value: 'New', label: 'New' },
  { value: 'Popular', label: 'Popular' },
  { value: 'Limited', label: 'Limited' },
  { value: 'Featured', label: 'Featured' },
  { value: 'Best value', label: 'Best value' },
]

function defaultFeatures(): string[] {
  return []
}

function ProductGalleryField({
  value = [],
  onChange,
}: {
  value?: GalleryImage[]
  onChange?: (value: GalleryImage[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dragIndexRef = useRef<number | null>(null)

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return
    const next = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => ({
        uid: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        url: URL.createObjectURL(file),
        name: file.name,
      }))
    if (!next.length) return
    onChange?.([...value, ...next])
  }

  const removeAt = (index: number) => {
    const target = value[index]
    if (target?.url.startsWith('blob:')) {
      URL.revokeObjectURL(target.url)
    }
    onChange?.(value.filter((_, itemIndex) => itemIndex !== index))
  }

  const moveItem = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= value.length || to >= value.length) return
    const next = [...value]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange?.(next)
  }

  return (
    <div className="product-gallery">
      {value.length > 0 ? (
        <div className="product-gallery-grid">
          {value.map((image, index) => (
            <div
              key={image.uid}
              className="product-gallery-item"
              draggable
              onDragStart={() => {
                dragIndexRef.current = index
              }}
              onDragOver={(event) => {
                event.preventDefault()
              }}
              onDrop={(event) => {
                event.preventDefault()
                const from = dragIndexRef.current
                dragIndexRef.current = null
                if (from == null) return
                moveItem(from, index)
              }}
            >
              <img src={image.url} alt={image.name} />
              <button
                type="button"
                className="product-gallery-remove"
                aria-label={`Remove ${image.name}`}
                onClick={() => removeAt(index)}
              >
                <CloseOutlined />
              </button>
              {index === 0 ? <span className="product-gallery-primary">Primary</span> : null}
            </div>
          ))}
        </div>
      ) : null}
      <Typography.Text type="secondary" className="product-gallery-hint">
        Drag images to reorder. First image is automatically set as primary.
      </Typography.Text>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          addFiles(event.target.files)
          event.target.value = ''
        }}
      />
      <Button
        className="product-gallery-add"
        icon={<UploadOutlined />}
        onClick={() => inputRef.current?.click()}
      >
        Add Images
      </Button>
    </div>
  )
}

function defaultEligibility(): EligibilityFormValues {
  return {
    locationAvailabilityEnabled: false,
    locationCompatibilityMode: 'allow',
    locationSearchBy: 'Location ID',
    locations: [],
    salesChannelAvailabilityEnabled: false,
    channelSearchBy: 'Name',
    salesChannels: [],
    subscriptionControlEnabled: false,
    purchaseCompatibilityEnabled: false,
    purchaseCompatibilityMode: 'allow',
    compatibleProducts: [],
    customerEligibilityEnabled: false,
    useCustomerAttributes: false,
    attributeRules: [],
    useSegments: false,
    segments: [],
    customerJourneyEnabled: false,
    journeys: [],
  }
}
const ALLOCATION_MODE_OPTIONS: AllocationMode[] = ['Line', 'Per Line', 'Shared Pool']
const SHARING_SCOPE_OPTIONS: SharingScope[] = ['Line', 'Group', 'Account']
const ALLOCATION_UNIT_OPTIONS: AllocationUnit[] = ['GB', 'MB', 'KB']
const TOTAL_ALLOCATION_AMOUNT = 15
const ENTITLEMENT_RESET_FREQUENCY_OPTIONS: EntitlementResetFrequency[] = ['Daily', 'Monthly', 'Bill Cycle', 'None']
const ENTITLEMENT_EXPIRY_OPTIONS: EntitlementExpiry[] = ['Expire', 'Carry Over', 'Replace']

function defaultServiceEntitlement(applicable = false): ServiceEntitlement {
  return {
    applicable,
    allowance: 'Unlimited',
    enableSharing: false,
    rolloverAllowed: false,
  }
}

function defaultEntitlements(
  serviceTypes: EntitlementServiceType[] = ENTITLEMENT_SERVICE_TYPES,
): Record<EntitlementServiceType, ServiceEntitlement> {
  return Object.fromEntries(
    serviceTypes.map((serviceType) => [serviceType, defaultServiceEntitlement(true)]),
  ) as Record<EntitlementServiceType, ServiceEntitlement>
}

function defaultEntitlementsByProduct(
  items: Array<{ key: string; category: string }>,
  existing?: Record<string, Record<EntitlementServiceType, ServiceEntitlement>>,
): Record<string, Record<EntitlementServiceType, ServiceEntitlement>> {
  return Object.fromEntries(
    items.map((item) => {
      const serviceTypes = entitlementServicesForCategory(item.category)
      const previous = existing?.[item.key]
      const nextServices = Object.fromEntries(
        serviceTypes.map((serviceType) => [
          serviceType,
          previous?.[serviceType] ?? defaultServiceEntitlement(true),
        ]),
      ) as Record<EntitlementServiceType, ServiceEntitlement>
      return [item.key, nextServices]
    }),
  )
}

function equalAllocationValue(maxLines: number): number {
  const lineCount = Math.max(1, maxLines || 1)
  return Math.round((TOTAL_ALLOCATION_AMOUNT / lineCount) * 100) / 100
}

function buildEntitlementAllocations(
  maxLines: number,
  allocationMode?: AllocationMode,
  existing?: EntitlementAllocationRow[],
): EntitlementAllocationRow[] {
  const lineCount = Math.max(1, maxLines || 1)
  const equalSplit = allocationMode === 'Line' || allocationMode === 'Per Line'
  const splitValue = equalSplit ? equalAllocationValue(lineCount) : undefined
  return Array.from({ length: lineCount }, (_, index) => {
    const line = index + 1
    const previous = existing?.[index]
    return {
      line,
      value: equalSplit ? splitValue : previous?.value,
      unit: previous?.unit ?? 'GB',
    }
  })
}

function redistributeEntitlementAllocations(
  rows: EntitlementAllocationRow[],
  rowIndex: number,
  nextValue: number,
): EntitlementAllocationRow[] | null {
  if (nextValue > TOTAL_ALLOCATION_AMOUNT || nextValue < 0) return null

  const clampedValue = Math.round(nextValue * 100) / 100
  const remaining = Math.round((TOTAL_ALLOCATION_AMOUNT - clampedValue) * 100) / 100
  const otherIndices = rows
    .map((_, index) => index)
    .filter((index) => index !== rowIndex)

  if (!otherIndices.length) {
    return rows.map((row, index) => (
      index === rowIndex ? { ...row, value: clampedValue } : row
    ))
  }

  const baseShare = otherIndices.length === 1
    ? remaining
    : Math.round((remaining / otherIndices.length) * 100) / 100

  let assignedToOthers = 0

  return rows.map((row, index) => {
    if (index === rowIndex) {
      return { ...row, value: clampedValue }
    }

    const otherPosition = otherIndices.indexOf(index)
    const isLastOther = otherPosition === otherIndices.length - 1
    const value = isLastOther
      ? Math.round((remaining - assignedToOthers) * 100) / 100
      : baseShare

    if (!isLastOther) {
      assignedToOthers += value
    }

    return { ...row, value }
  })
}

const TIER_DIMENSION_OPTIONS: TierDimension[] = ['Line Count']
const SERVICE_SPLIT_SERVICE_TYPES: ServiceSplitType[] = ['Data', 'Voice', 'SMS']
const REVENUE_SPLIT_OPTIONS: RevenueSplitMode[] = ['Equally', 'By Percentage', 'By Amount']
const REVENUE_ALLOCATION_MODE_OPTIONS: RevenueAllocationMode[] = ['Mobile (100%)', 'Split']
const DEFAULT_REVENUE_SPLIT_PERCENTAGE = Math.round((100 / 3) * 100) / 100

function dividedRevenueAllocationAmount(mainAmount: number): number {
  return Math.round((mainAmount / 3) * 100) / 100
}

function amountFromPercentage(mainAmount: number, percentage: number): number {
  return Math.round(mainAmount * (percentage / 100) * 100) / 100
}

function buildServicePricingSplits(
  mainAmount?: number,
  existing?: ServicePricingSplit[],
): ServicePricingSplit[] {
  const dividedAmount = mainAmount != null ? dividedRevenueAllocationAmount(mainAmount) : undefined
  return SERVICE_SPLIT_SERVICE_TYPES.map((serviceType, index) => ({
    serviceType,
    amount: dividedAmount,
    glCode: existing?.[index]?.glCode ?? '',
    taxId: existing?.[index]?.taxId ?? '',
    taxTreatment: existing?.[index]?.taxTreatment ?? 'INCLUSIVE',
    amountManuallySet: false,
    percentage: undefined,
  }))
}

function buildPercentageRevenueSplits(
  mainAmount?: number,
  existing?: ServicePricingSplit[],
): ServicePricingSplit[] {
  return SERVICE_SPLIT_SERVICE_TYPES.map((serviceType, index) => {
    const existingSplit = existing?.[index]
    const percentage = existingSplit?.percentage ?? DEFAULT_REVENUE_SPLIT_PERCENTAGE
    return {
      serviceType,
      percentage,
      amount: mainAmount != null ? amountFromPercentage(mainAmount, percentage) : undefined,
      glCode: existingSplit?.glCode ?? '',
      taxId: existingSplit?.taxId ?? '',
      taxTreatment: existingSplit?.taxTreatment ?? 'INCLUSIVE',
      amountManuallySet: false,
    }
  })
}

function applyPercentageToSplits(
  mainAmount: number,
  splits: ServicePricingSplit[],
): ServicePricingSplit[] {
  return splits.map((split) => ({
    ...split,
    amount: split.percentage != null ? amountFromPercentage(mainAmount, split.percentage) : split.amount,
    amountManuallySet: false,
  }))
}

function redistributePercentageSplits(
  splits: ServicePricingSplit[],
  rowIndex: number,
  nextValue: number,
): ServicePricingSplit[] | null {
  if (nextValue > 100 || nextValue < 0) return null

  const clampedValue = Math.round(nextValue * 100) / 100
  const remaining = Math.round((100 - clampedValue) * 100) / 100
  const otherIndices = splits
    .map((_, index) => index)
    .filter((index) => index !== rowIndex)

  if (!otherIndices.length) return splits

  const baseShare = otherIndices.length === 1
    ? remaining
    : Math.round((remaining / otherIndices.length) * 100) / 100

  let assignedToOthers = 0

  return splits.map((split, index) => {
    if (index === rowIndex) {
      return { ...split, percentage: clampedValue }
    }

    const otherPosition = otherIndices.indexOf(index)
    const isLastOther = otherPosition === otherIndices.length - 1
    const percentage = isLastOther
      ? Math.round((remaining - assignedToOthers) * 100) / 100
      : baseShare

    if (!isLastOther) {
      assignedToOthers += percentage
    }

    return { ...split, percentage }
  })
}

function wouldExceedMainAllocation(
  mainAmount: number,
  splits: ServicePricingSplit[],
  rowIndex: number,
  nextValue: number,
): boolean {
  const otherManualSum = splits.reduce((sum, split, index) => {
    if (index === rowIndex) return sum
    if (split.amountManuallySet) return sum + (split.amount ?? 0)
    return sum
  }, 0)
  return otherManualSum + nextValue > mainAmount
}

function redistributeRevenueAllocationAmounts(
  mainAmount: number,
  splits: ServicePricingSplit[],
): ServicePricingSplit[] {
  const lockedSum = splits.reduce(
    (sum, split) => sum + (split.amountManuallySet ? split.amount ?? 0 : 0),
    0,
  )
  const autoIndices = splits
    .map((split, index) => ({ split, index }))
    .filter(({ split }) => !split.amountManuallySet)
    .map(({ index }) => index)
  const remaining = Math.round((mainAmount - lockedSum) * 100) / 100

  if (autoIndices.length === 0) {
    return splits
  }

  const autoAmount = autoIndices.length === 1
    ? remaining
    : Math.round((remaining / autoIndices.length) * 100) / 100

  return splits.map((split, index) => {
    if (split.amountManuallySet || !autoIndices.includes(index)) return split
    return { ...split, amount: autoAmount }
  })
}

function defaultServicePricingSplit(serviceType: ServiceSplitType, mainAmount?: number): ServicePricingSplit {
  return {
    serviceType,
    amount: mainAmount != null ? dividedRevenueAllocationAmount(mainAmount) : undefined,
    glCode: '',
    taxId: '',
    taxTreatment: 'INCLUSIVE',
  }
}

function defaultPriceTier(): PriceTier {
  return {}
}

function emptyPriceComponent(overrides?: Partial<PriceComponent>): PriceComponent {
  return {
    pricingType: undefined,
    glCode: '',
    taxTreatment: undefined,
    pricingStructure: 'Flat',
    pricingBasis: undefined,
    frequency: undefined,
    taxId: '',
    feeDefinition: undefined,
    amount: undefined,
    revenueAllocationMode: 'Mobile (100%)',
    revenueSplitMode: 'Equally',
    servicePricingSplits: SERVICE_SPLIT_SERVICE_TYPES.map((serviceType) => defaultServicePricingSplit(serviceType)),
    tierDimension: 'Line Count',
    tiers: [defaultPriceTier()],
    ...overrides,
  }
}

function derivedPriceComponentFromOffer(item?: PickerCatalogItem): PriceComponent {
  return {
    ...emptyPriceComponent(),
    pricingType: 'RECURRING',
    taxTreatment: 'INCLUSIVE',
    pricingBasis: 'PER LINE',
    frequency: 'Monthly',
    amount: item?.basePrice,
  }
}

function defaultPriceComponent(): PriceComponent {
  return emptyPriceComponent()
}

function priceComponentFromFeeCatalog(option: FeeCatalogOption): PriceComponent {
  return {
    ...emptyPriceComponent(),
    pricingType: 'ONE TIME',
    componentLabel: option.label,
    feeDefinition: option.label,
    amount: option.amount,
    pricingBasis: option.pricingUnit ?? 'PER LINE',
    taxTreatment: 'INCLUSIVE',
    frequency: 'On Activation',
  }
}

function derivedNetworkActivationFeeComponent(): PriceComponent {
  const option = FEE_CATALOG_OPTIONS.find((item) => item.label === 'Network Activation Fee')
  if (!option) {
    return emptyPriceComponent({ componentLabel: 'Network Activation Fee' })
  }
  return priceComponentFromFeeCatalog(option)
}

function priceComponentTitle(
  pricingType?: PricingType,
  feeDefinition?: FeeDefinition,
): string {
  if (feeDefinition) return feeDefinition
  return pricingType ?? 'Pricing component'
}

function primaryPriceAmount(components: PriceComponent[] | undefined): number | undefined {
  const first = components?.[0]
  if (!first) return undefined
  if (first.pricingStructure === 'Per Tier') return first.tiers?.[0]?.amount
  return first.amount
}

function priceComponentAmount(component?: PriceComponent): number | undefined {
  if (!component) return undefined
  if (component.pricingStructure === 'Per Tier') return component.tiers?.[0]?.amount
  return component.amount != null ? Number(component.amount) : undefined
}

function priceComponentSummaryLabel(component: PriceComponent, index: number): string {
  return component.componentLabel?.trim()
    || component.feeDefinition
    || component.pricingType
    || `Pricing component ${index + 1}`
}

function formatPriceAmount(amount: number): string {
  return `$${amount.toFixed(2)}`
}

function priceSummaryRows(components: PriceComponent[] | undefined) {
  return (components ?? []).map((component, index) => {
    const amount = priceComponentAmount(component)
    return {
      key: `${component.componentLabel ?? 'component'}-${index}`,
      label: priceComponentSummaryLabel(component, index),
      amount,
      pricingType: component.pricingType,
      frequency: component.frequency,
      pricingBasis: component.pricingBasis,
      feeDefinition: component.feeDefinition,
      taxTreatment: component.taxTreatment,
    }
  })
}

function reviewValue(value?: string | number | null, fallback = 'Not set') {
  if (value == null) return fallback
  if (typeof value === 'string' && !value.trim()) return fallback
  return value
}

function optionLabel(options: Array<{ value: string; label: string }>, value?: string) {
  if (!value) return undefined
  return options.find((item) => item.value === value)?.label ?? value
}

function optionLabels(options: Array<{ value: string; label: string }>, values?: string[]) {
  if (!values?.length) return []
  return values.map((value) => optionLabel(options, value) ?? value)
}

function formatAttributeRule(rule: CustomerAttributeRule): string {
  const attribute = rule.attribute ?? 'Attribute'
  const mode = rule.matchMode ?? 'Include'
  if (attribute === 'Age') {
    const min = rule.minValue != null ? String(rule.minValue) : '—'
    const max = rule.maxValue != null ? String(rule.maxValue) : '—'
    return `${attribute} (${mode}): ${min} – ${max}`
  }
  const values = rule.values?.length ? rule.values.join(', ') : 'No values'
  return `${attribute} (${mode}): ${values}`
}

function enabledEligibilityDetails(eligibility?: EligibilityFormValues): Array<{ label: string; value: string }> {
  if (!eligibility) return [{ label: 'Rules', value: 'No eligibility rules configured' }]
  const rows: Array<{ label: string; value: string }> = []

  if (eligibility.locationAvailabilityEnabled) {
    const locations = optionLabels(LOCATION_OPTIONS, eligibility.locations)
    rows.push({
      label: `Locations (${eligibility.locationCompatibilityMode})`,
      value: locations.length ? locations.join(', ') : 'All locations',
    })
  }
  if (eligibility.salesChannelAvailabilityEnabled) {
    const channels = optionLabels(SALES_CHANNEL_OPTIONS, eligibility.salesChannels)
    rows.push({
      label: 'Sales channels',
      value: channels.length ? channels.join(', ') : 'All sales channels',
    })
  }
  if (eligibility.subscriptionControlEnabled) {
    rows.push({ label: 'Subscription control', value: 'Enabled' })
  }
  if (eligibility.purchaseCompatibilityEnabled) {
    const products = optionLabels(COMPATIBLE_PRODUCT_OPTIONS, eligibility.compatibleProducts)
    rows.push({
      label: `Purchase compatibility (${eligibility.purchaseCompatibilityMode})`,
      value: products.length ? products.join(', ') : 'No products selected',
    })
  }
  if (eligibility.customerEligibilityEnabled) {
    if (eligibility.useCustomerAttributes) {
      const rules = (eligibility.attributeRules ?? []).map(formatAttributeRule)
      rows.push({
        label: 'Customer attributes',
        value: rules.length ? rules.join(' · ') : 'No attribute rules',
      })
    }
    if (eligibility.useSegments) {
      const segments = optionLabels(SEGMENT_OPTIONS, eligibility.segments)
      rows.push({
        label: 'Segments',
        value: segments.length ? segments.join(', ') : 'No segments selected',
      })
    }
  }
  if (eligibility.customerJourneyEnabled) {
    const journeys = optionLabels(JOURNEY_OPTIONS, eligibility.journeys)
    rows.push({
      label: 'Customer journeys',
      value: journeys.length ? journeys.join(', ') : 'No journeys selected',
    })
  }

  return rows.length
    ? rows
    : [{ label: 'Availability', value: 'Open to all eligible customers (no restrictions enabled)' }]
}

function entitlementReviewRows(
  entitlements: ListingFormValues['entitlements'] | undefined,
  items: PickerCatalogItem[],
) {
  if (!items.length) return []
  return items.map((item) => {
    const serviceTypes = entitlementServicesForCategory(item.category)
    const serviceRows = serviceTypes.map((serviceType) => {
      const service = entitlements?.[item.key]?.[serviceType]
      const thresholdLabel = ENTITLEMENT_THRESHOLD_LABELS[serviceType]
      const followOnLabel = ENTITLEMENT_FOLLOW_ON_LABELS[serviceType]
      return {
        serviceType,
        title: ENTITLEMENT_PANEL_TITLES[serviceType],
        allowance: service?.allowance || 'Unlimited',
        thresholdLabel,
        threshold: service?.fupThreshold || 'Not selected',
        followOnLabel,
        followOn: service?.qosAfterFup || (service?.fupThreshold ? QOS_AFTER_FUP_BY_SERVICE[serviceType] : 'Not set'),
      }
    })
    return {
      key: item.key,
      name: item.name,
      category: item.category,
      serviceRows,
    }
  })
}

function PriceComponentFields({
  field,
  productName,
  offerType,
  canRemove,
  onRemove,
  hideTitle = false,
}: {
  field: { name: number; key: number }
  productName?: string
  offerType: OfferType
  canRemove: boolean
  onRemove: () => void
  hideTitle?: boolean
}) {
  const { message } = App.useApp()
  const [revenueAllocationActive, setRevenueAllocationActive] = useState<string[]>(['revenue-allocation'])
  const [formulaExpressionActive, setFormulaExpressionActive] = useState<string[]>(['formula-expression'])
  const form = Form.useFormInstance<ListingFormValues>()
  const pricingType = Form.useWatch(['priceComponents', field.name, 'pricingType'], form)
  const feeDefinition = Form.useWatch(['priceComponents', field.name, 'feeDefinition'], form)
  const pricingStructure = Form.useWatch(['priceComponents', field.name, 'pricingStructure'], form) ?? 'Flat'
  const isFlatPricing = pricingStructure === 'Flat'
  const offerTypeLabel = offerTypeTitle(offerType)
  const productKeys = Form.useWatch('productKeys', { form, preserve: true }) as string[] | undefined
  const displayName = Form.useWatch('displayName', { form, preserve: true })
  const effectiveProductName = productName ?? resolveCatalogItemName(productKeys?.[0]) ?? displayName
  const componentLabel = Form.useWatch(['priceComponents', field.name, 'componentLabel'], form)
  const componentTitle = componentLabel || priceComponentTitle(pricingType, feeDefinition)
  const primaryComponentName = effectiveProductName?.trim()
  const isFormulaFee = feeDefinition === 'USF Cellular'
  const priceOptional = isFormulaFee
  const flatAmount = Form.useWatch(['priceComponents', field.name, 'amount'], form)
  const firstTierAmount = Form.useWatch(['priceComponents', field.name, 'tiers', 0, 'amount'], form)
  const mainPricingAmount = isFlatPricing ? flatAmount : firstTierAmount
  const revenueAllocationMode = Form.useWatch(
    ['priceComponents', field.name, 'revenueAllocationMode'],
    form,
  ) as RevenueAllocationMode | undefined
  const revenueSplitMode = Form.useWatch(['priceComponents', field.name, 'revenueSplitMode'], form) ?? 'Equally'
  const showMobileAllocation = (revenueAllocationMode ?? 'Mobile (100%)') === 'Mobile (100%)'
  const showRevenueSplitDetails = revenueAllocationMode === 'Split'
  const amountSplitReadOnly = revenueSplitMode !== 'By Amount'

  const syncRevenueAllocationSplits = () => {
    if (mainPricingAmount == null) return
    const mainAmount = Number(mainPricingAmount)
    const existing = form.getFieldValue(['priceComponents', field.name, 'servicePricingSplits']) as ServicePricingSplit[] | undefined
    const splitMode = form.getFieldValue(['priceComponents', field.name, 'revenueSplitMode']) ?? 'Equally'

    if (splitMode === 'Equally') {
      form.setFieldValue(
        ['priceComponents', field.name, 'servicePricingSplits'],
        buildServicePricingSplits(mainAmount, existing),
      )
      return
    }

    if (splitMode === 'By Percentage') {
      form.setFieldValue(
        ['priceComponents', field.name, 'servicePricingSplits'],
        buildPercentageRevenueSplits(mainAmount, existing),
      )
      return
    }

    const hasManual = existing?.some((split) => split.amountManuallySet)
    form.setFieldValue(
      ['priceComponents', field.name, 'servicePricingSplits'],
      hasManual
        ? redistributeRevenueAllocationAmounts(mainAmount, existing ?? [])
        : buildServicePricingSplits(mainAmount, existing),
    )
  }

  const handleRevenueSplitModeChange = (mode: RevenueSplitMode) => {
    const existing = form.getFieldValue(['priceComponents', field.name, 'servicePricingSplits']) as ServicePricingSplit[] | undefined
    const mainAmount = mainPricingAmount != null ? Number(mainPricingAmount) : undefined

    if (mode === 'Equally') {
      form.setFieldValue(
        ['priceComponents', field.name, 'servicePricingSplits'],
        buildServicePricingSplits(mainAmount, existing),
      )
      return
    }

    if (mode === 'By Percentage') {
      form.setFieldValue(
        ['priceComponents', field.name, 'servicePricingSplits'],
        buildPercentageRevenueSplits(mainAmount, existing),
      )
      return
    }

    const baseSplits = existing ?? buildServicePricingSplits(mainAmount)
    form.setFieldValue(
      ['priceComponents', field.name, 'servicePricingSplits'],
      mainAmount != null
        ? redistributeRevenueAllocationAmounts(
          mainAmount,
          baseSplits.map((split) => ({ ...split, amountManuallySet: false })),
        )
        : baseSplits,
    )
  }

  useEffect(() => {
    if (!showRevenueSplitDetails || mainPricingAmount == null) return
    syncRevenueAllocationSplits()
  }, [showRevenueSplitDetails, mainPricingAmount, revenueSplitMode, field.name, form])

  const handleSplitAmountChange = (rowIndex: number, value: number | null): boolean => {
    if (value == null || mainPricingAmount == null) return false
    const mainAmount = Number(mainPricingAmount)
    const splits = (form.getFieldValue(['priceComponents', field.name, 'servicePricingSplits']) ?? []) as ServicePricingSplit[]
    if (wouldExceedMainAllocation(mainAmount, splits, rowIndex, value)) {
      message.error(`Manual allocations cannot exceed the main amount of $${mainAmount.toFixed(2)}`)
      return false
    }
    const updated = splits.map((split, index) => (
      index === rowIndex
        ? { ...split, amount: value, amountManuallySet: true }
        : split
    ))
    form.setFieldValue(
      ['priceComponents', field.name, 'servicePricingSplits'],
      redistributeRevenueAllocationAmounts(mainAmount, updated),
    )
    return true
  }

  const handleSplitPercentageChange = (rowIndex: number, value: number | null): boolean => {
    if (value == null || mainPricingAmount == null) return false
    if (value > 100) {
      message.error('Total percentage cannot exceed 100%')
      return false
    }
    const mainAmount = Number(mainPricingAmount)
    const splits = (form.getFieldValue(['priceComponents', field.name, 'servicePricingSplits']) ?? []) as ServicePricingSplit[]
    const redistributed = redistributePercentageSplits(splits, rowIndex, value)
    if (!redistributed) return false
    form.setFieldValue(
      ['priceComponents', field.name, 'servicePricingSplits'],
      applyPercentageToSplits(mainAmount, redistributed),
    )
    return true
  }

  return (
    <div className="component-price-card">
      {!hideTitle ? (
        <Flex justify="space-between" align="center" className="component-price-heading">
          {field.name === 0 ? (
            <Flex align="center" gap={8} wrap="wrap">
              {primaryComponentName ? (
                <Typography.Text strong>{primaryComponentName}</Typography.Text>
              ) : null}
              <Tag color="blue">{offerTypeLabel}</Tag>
            </Flex>
          ) : (
            <Typography.Text strong>{componentTitle}</Typography.Text>
          )}
          {canRemove ? (
            <Button type="text" danger icon={<DeleteOutlined />} onClick={onRemove}>
              Remove
            </Button>
          ) : null}
        </Flex>
      ) : canRemove ? (
        <Flex justify="flex-end" className="component-price-heading">
          <Button type="text" danger icon={<DeleteOutlined />} onClick={onRemove}>
            Remove
          </Button>
        </Flex>
      ) : null}
      <div className="form-grid">
        <Form.Item name={[field.name, 'componentLabel']} hidden>
          <Input />
        </Form.Item>
        <Form.Item name={[field.name, 'pricingStructure']} hidden initialValue="Flat">
          <Input />
        </Form.Item>
        <div className="span-two pricing-charge-row">
          <Form.Item
            name={[field.name, 'pricingType']}
            label="Pricing Type"
            rules={[{ required: true, message: 'Select a charge type' }]}
          >
            <Select
              allowClear
              placeholder="Select"
              options={PRICING_TYPE_OPTIONS.map((value) => ({ value, label: value }))}
              onChange={(value?: PricingType) => {
                if (value !== 'ONE TIME') {
                  form.setFieldValue(['priceComponents', field.name, 'feeDefinition'], undefined)
                }
                if (value === 'ONE TIME') {
                  form.setFieldValue(['priceComponents', field.name, 'frequency'], 'On Activation')
                } else if (form.getFieldValue(['priceComponents', field.name, 'frequency']) === 'On Activation') {
                  form.setFieldValue(['priceComponents', field.name, 'frequency'], undefined)
                }
                if (value !== 'RECURRING') {
                  form.setFieldValue(['priceComponents', field.name, 'revenueAllocationMode'], 'Mobile (100%)')
                }
              }}
            />
          </Form.Item>
          {isFlatPricing ? (
            <>
              <Form.Item
                name={[field.name, 'amount']}
                label="Price"
                rules={priceOptional ? [] : [{ required: true, message: 'Enter a price' }]}
              >
                <InputNumber min={0} precision={2} prefix="$" style={{ width: '100%' }} placeholder="Enter price" />
              </Form.Item>
              <Form.Item
                name={[field.name, 'pricingBasis']}
                label="Pricing Basis"
                rules={[{ required: true, message: 'Select a pricing basis' }]}
              >
                <Select allowClear placeholder="Select" options={PRICING_BASIS_OPTIONS.map((value) => ({ value }))} />
              </Form.Item>
              {pricingType !== 'ONE TIME' ? (
                <Form.Item
                  name={[field.name, 'frequency']}
                  label="Frequency"
                  rules={[{ required: true, message: 'Select a frequency' }]}
                >
                  <Select allowClear placeholder="Select" options={FREQUENCY_OPTIONS.map((value) => ({ value }))} />
                </Form.Item>
              ) : (
                <>
                  <Form.Item name={[field.name, 'frequency']} hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name={[field.name, 'feeDefinition']}
                    label="Associated Fee"
                    rules={[{ required: true, message: 'Select an associated fee' }]}
                  >
                    <Select allowClear placeholder="Select" options={FEE_DEFINITION_OPTIONS.map((value) => ({ value }))} />
                  </Form.Item>
                </>
              )}
              <Form.Item
                name={[field.name, 'taxTreatment']}
                label="Tax Treatment"
                rules={[{ required: true, message: 'Select a tax treatment' }]}
              >
                <Select allowClear placeholder="Select" options={TAX_TREATMENT_OPTIONS.map((value) => ({ value }))} />
              </Form.Item>
            </>
          ) : null}
        </div>
        <div className="span-two revenue-allocation-panel">
          <Collapse
            activeKey={revenueAllocationActive}
            onChange={(keys) => {
              setRevenueAllocationActive(Array.isArray(keys) ? keys : [keys])
            }}
            items={[{
              key: 'revenue-allocation',
              label: field.name === 0 ? (
                <div className="revenue-allocation-panel-label">
                  <span>Revenue allocation</span>
                  <span
                    className="revenue-allocation-mode-select"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <Form.Item
                      name={[field.name, 'revenueAllocationMode']}
                      noStyle
                      initialValue="Mobile (100%)"
                    >
                      <Select
                        size="small"
                        style={{ width: 150 }}
                        options={REVENUE_ALLOCATION_MODE_OPTIONS.map((value) => ({
                          value,
                          label: value,
                          disabled: value === 'Split' && pricingType !== 'RECURRING',
                        }))}
                        onChange={(value: RevenueAllocationMode) => {
                          if (value === 'Split') syncRevenueAllocationSplits()
                        }}
                      />
                    </Form.Item>
                  </span>
                </div>
              ) : 'Revenue allocation',
              children: (
                <>
                  {field.name !== 0 ? (
                    <Form.Item
                      name={[field.name, 'revenueAllocationMode']}
                      hidden
                      initialValue="Mobile (100%)"
                    >
                      <Input />
                    </Form.Item>
                  ) : null}
                  {showMobileAllocation ? (
                    <div className="form-grid revenue-allocation-top-fields">
                      <Form.Item
                        name={[field.name, 'glCode']}
                        label="GL Code"
                        rules={[{ required: true, message: 'Enter a GL code' }]}
                      >
                        <Input placeholder="e.g. 4100-100" />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, 'taxId']}
                        label="Tax ID"
                        rules={[{ required: true, message: 'Enter a tax ID' }]}
                      >
                        <Input placeholder="e.g. 13/622" />
                      </Form.Item>
                    </div>
                  ) : null}
                  {showRevenueSplitDetails ? (
                    <>
                      <Form.Item
                        name={[field.name, 'revenueSplitMode']}
                        className="revenue-split-mode-field"
                        rules={[{ required: true, message: 'Select a split method' }]}
                      >
                        <Select
                          options={REVENUE_SPLIT_OPTIONS.map((value) => ({ value }))}
                          onChange={handleRevenueSplitModeChange}
                        />
                      </Form.Item>
                      <Table
                        className="line-tier-table service-split-table"
                        size="small"
                        pagination={false}
                        rowKey="serviceType"
                        dataSource={SERVICE_SPLIT_SERVICE_TYPES.map((serviceType, rowIndex) => ({ serviceType, rowIndex }))}
                        columns={[
                          {
                            title: 'Service Type',
                            width: 110,
                            render: (_, row) => (
                              <>
                                <Form.Item
                                  name={[field.name, 'servicePricingSplits', row.rowIndex, 'serviceType']}
                                  initialValue={row.serviceType}
                                  hidden
                                >
                                  <Input />
                                </Form.Item>
                                <Typography.Text>{`Local ${row.serviceType}`}</Typography.Text>
                              </>
                            ),
                          },
                          ...(revenueSplitMode === 'By Percentage'
                            ? [{
                              title: 'Percentage (%)',
                              width: 140,
                              render: (_: unknown, row: { serviceType: ServiceSplitType; rowIndex: number }) => (
                                <Form.Item
                                  name={[field.name, 'servicePricingSplits', row.rowIndex, 'percentage']}
                                  rules={[{ required: true, message: 'Enter a percentage' }]}
                                  style={{ marginBottom: 0 }}
                                  getValueFromEvent={(value: number | null) => {
                                    const splits = (form.getFieldValue(['priceComponents', field.name, 'servicePricingSplits']) ?? []) as ServicePricingSplit[]
                                    const currentValue = splits[row.rowIndex]?.percentage
                                    if (value == null) return value
                                    if (!handleSplitPercentageChange(row.rowIndex, value)) {
                                      return currentValue
                                    }
                                    return value
                                  }}
                                >
                                  <InputNumber
                                    min={0}
                                    max={100}
                                    precision={2}
                                    suffix="%"
                                    style={{ width: '100%' }}
                                  />
                                </Form.Item>
                              ),
                            }]
                            : []),
                          {
                            title: 'Amount ($)',
                            width: 160,
                            render: (_, row) => (
                              <Form.Item
                                name={[field.name, 'servicePricingSplits', row.rowIndex, 'amount']}
                                rules={[{ required: true, message: 'Enter an amount' }]}
                                style={{ marginBottom: 0 }}
                                getValueFromEvent={amountSplitReadOnly
                                  ? undefined
                                  : (value: number | null) => {
                                    const splits = (form.getFieldValue(['priceComponents', field.name, 'servicePricingSplits']) ?? []) as ServicePricingSplit[]
                                    const currentValue = splits[row.rowIndex]?.amount
                                    if (value == null) return value
                                    if (!handleSplitAmountChange(row.rowIndex, value)) {
                                      return currentValue
                                    }
                                    return value
                                  }}
                              >
                                <InputNumber
                                  min={0}
                                  precision={2}
                                  prefix="$"
                                  style={{ width: '100%' }}
                                  readOnly={amountSplitReadOnly}
                                />
                              </Form.Item>
                            ),
                          },
                          {
                            title: 'GL code',
                            render: (_, row) => (
                              <Form.Item
                                name={[field.name, 'servicePricingSplits', row.rowIndex, 'glCode']}
                                rules={[{ required: true, message: 'Enter a GL code' }]}
                                style={{ marginBottom: 0 }}
                              >
                                <Input placeholder="e.g. 4100-100" />
                              </Form.Item>
                            ),
                          },
                          {
                            title: 'Tax ID',
                            render: (_, row) => (
                              <Form.Item
                                name={[field.name, 'servicePricingSplits', row.rowIndex, 'taxId']}
                                rules={[{ required: true, message: 'Enter a tax ID' }]}
                                style={{ marginBottom: 0 }}
                              >
                                <Input placeholder="e.g. 13/622" />
                              </Form.Item>
                            ),
                          },
                        ]}
                      />
                    </>
                  ) : null}
                </>
              ),
            }]}
          />
        </div>
        {pricingType === 'ONE TIME' ? (
          <div className="span-two formula-expression-panel">
            <Collapse
              activeKey={formulaExpressionActive}
              onChange={(keys) => {
                setFormulaExpressionActive(Array.isArray(keys) ? keys.map(String) : [String(keys)])
              }}
              items={[{
                key: 'formula-expression',
                label: 'Formula Expression',
                children: (
                  <pre className="formula-expression-code">{FEE_FORMULA_EXPRESSION}</pre>
                ),
              }]}
            />
          </div>
        ) : null}
        <div className="span-two">
          {!isFlatPricing ? (
            <div className="pricing-tiers-block">
              <Form.Item
                name={[field.name, 'tierDimension']}
                className="pricing-tier-dimension"
                rules={[{ required: true, message: 'Select a tier dimension' }]}
              >
                <Select disabled options={TIER_DIMENSION_OPTIONS.map((value) => ({ value }))} />
              </Form.Item>
              <Form.List name={[field.name, 'tiers']}>
                {(tierFields, { add, remove }) => (
                  <>
                    <Table
                      className="line-tier-table pricing-tier-table"
                      size="small"
                      pagination={false}
                      rowKey="key"
                      dataSource={tierFields}
                      columns={[
                        {
                          title: 'Min Qty',
                          width: 90,
                          render: (_, tierField) => (
                            <Form.Item
                              name={[tierField.name, 'minQty']}
                              rules={[{ required: true, message: 'Enter min qty' }]}
                              style={{ marginBottom: 0 }}
                            >
                              <InputNumber min={0} precision={0} style={{ width: '100%' }} />
                            </Form.Item>
                          ),
                        },
                        {
                          title: 'Max Qty',
                          width: 90,
                          render: (_, tierField) => (
                            <Form.Item
                              name={[tierField.name, 'maxQty']}
                              rules={[{ required: true, message: 'Enter max qty' }]}
                              style={{ marginBottom: 0 }}
                            >
                              <InputNumber min={0} precision={0} style={{ width: '100%' }} />
                            </Form.Item>
                          ),
                        },
                        {
                          title: 'Amount ($)',
                          render: (_, tierField) => (
                            <Form.Item
                              name={[tierField.name, 'amount']}
                              rules={[{ required: true, message: 'Enter an amount' }]}
                              style={{ marginBottom: 0 }}
                            >
                              <InputNumber min={0} precision={2} prefix="$" style={{ width: '100%' }} />
                            </Form.Item>
                          ),
                        },
                        {
                          title: '',
                          width: 56,
                          align: 'center',
                          render: (_, tierField) => (
                            <Button
                              type="text"
                              danger
                              aria-label="Delete tier"
                              icon={<DeleteOutlined />}
                              disabled={tierFields.length <= 1}
                              onClick={() => remove(tierField.name)}
                            />
                          ),
                        },
                      ]}
                    />
                    <Button type="dashed" icon={<PlusOutlined />} onClick={() => add(defaultPriceTier())}>
                      Add New Tier
                    </Button>
                  </>
                )}
              </Form.List>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function EligibilitySection({
  enabledName,
  title,
  description,
  children,
}: {
  enabledName: string[]
  title: string
  description: string
  children: ReactNode
}) {
  const form = Form.useFormInstance()
  const enabled = Form.useWatch(enabledName, form)
  const [open, setOpen] = useState(false)

  return (
    <div className={`eligibility-section ${enabled ? 'is-enabled' : 'is-disabled'}`}>
      <div className="eligibility-section-header">
        <Form.Item name={enabledName} valuePropName="checked" noStyle>
          <Checkbox
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => {
              if (event.target.checked) setOpen(true)
              else setOpen(false)
            }}
          />
        </Form.Item>
        <button
          type="button"
          className="eligibility-section-toggle"
          onClick={() => {
            if (!enabled) return
            setOpen((current) => !current)
          }}
          aria-expanded={open && !!enabled}
        >
          <span className={`eligibility-chevron ${open && enabled ? 'is-open' : ''}`}>▾</span>
          <span className="eligibility-section-copy">
            <Typography.Text strong>{title}</Typography.Text>
            <Typography.Text type="secondary">{description}</Typography.Text>
          </span>
        </button>
      </div>
      {enabled && open ? (
        <div className="eligibility-section-body">
          {children}
        </div>
      ) : null}
    </div>
  )
}

function defaultCustomerAttributeRule(): CustomerAttributeRule {
  return {
    attribute: undefined,
    matchMode: 'Include',
    values: [],
    minValue: undefined,
    maxValue: undefined,
  }
}

function CustomerAttributeRules() {
  const form = Form.useFormInstance()
  const attributeRules = Form.useWatch(['eligibility', 'attributeRules'], form) as CustomerAttributeRule[] | undefined

  return (
    <Form.List name={['eligibility', 'attributeRules']}>
      {(fields, { add, remove }) => (
        <div className="customer-attribute-rules">
          {fields.map((field) => {
            const attribute = attributeRules?.[field.name]?.attribute
            const isNumericAttribute = attribute === 'Age'
            const valueOptions = attribute === 'Membership'
              ? MEMBERSHIP_ATTRIBUTE_OPTIONS
              : RESIDENCY_STATUS_OPTIONS

            return (
              <div key={field.key} className="customer-attribute-rule">
                <div className="customer-attribute-rule-header">
                  <Form.Item
                    name={[field.name, 'attribute']}
                    label="Attribute"
                    className="customer-attribute-field"
                    rules={[{ required: true, message: 'Select an attribute' }]}
                  >
                    <Select
                      placeholder="Select attribute"
                      options={CUSTOMER_ATTRIBUTE_OPTIONS.map((value) => ({ value, label: value }))}
                      onChange={() => {
                        form.setFieldValue(['eligibility', 'attributeRules', field.name, 'values'], [])
                        form.setFieldValue(['eligibility', 'attributeRules', field.name, 'minValue'], undefined)
                        form.setFieldValue(['eligibility', 'attributeRules', field.name, 'maxValue'], undefined)
                      }}
                    />
                  </Form.Item>
                  <Button
                    type="text"
                    danger
                    className="customer-attribute-rule-remove"
                    icon={<DeleteOutlined />}
                    aria-label="Remove rule"
                    onClick={() => remove(field.name)}
                  />
                </div>
                {!isNumericAttribute ? (
                  <Form.Item
                    name={[field.name, 'matchMode']}
                    className="customer-attribute-match-mode"
                    initialValue="Include"
                  >
                    <Radio.Group
                      optionType="button"
                      options={ATTRIBUTE_MATCH_MODE_OPTIONS.map((value) => ({ value, label: value }))}
                    />
                  </Form.Item>
                ) : (
                  <Form.Item name={[field.name, 'matchMode']} hidden initialValue="Include">
                    <Input />
                  </Form.Item>
                )}
                {isNumericAttribute ? (
                  <div className="customer-attribute-numeric-row">
                    <Form.Item
                      name={[field.name, 'minValue']}
                      label="Min"
                      className="customer-attribute-numeric-value"
                      rules={[
                        { required: true, message: 'Enter a minimum' },
                        {
                          validator: async (_, value) => {
                            const maxValue = form.getFieldValue(['eligibility', 'attributeRules', field.name, 'maxValue'])
                            if (value != null && maxValue != null && Number(value) > Number(maxValue)) {
                              throw new Error('Min cannot be greater than Max')
                            }
                          },
                        },
                      ]}
                      dependencies={[['eligibility', 'attributeRules', field.name, 'maxValue']]}
                    >
                      <InputNumber min={0} precision={0} style={{ width: '100%' }} placeholder="Min" />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'maxValue']}
                      label="Max"
                      className="customer-attribute-numeric-value"
                      rules={[
                        { required: true, message: 'Enter a maximum' },
                        {
                          validator: async (_, value) => {
                            const minValue = form.getFieldValue(['eligibility', 'attributeRules', field.name, 'minValue'])
                            if (value != null && minValue != null && Number(value) < Number(minValue)) {
                              throw new Error('Max cannot be less than Min')
                            }
                          },
                        },
                      ]}
                      dependencies={[['eligibility', 'attributeRules', field.name, 'minValue']]}
                    >
                      <InputNumber min={0} precision={0} style={{ width: '100%' }} placeholder="Max" />
                    </Form.Item>
                  </div>
                ) : (
                  <Form.Item
                    name={[field.name, 'values']}
                    className="customer-attribute-values"
                    rules={attribute
                      ? [{ required: true, type: 'array', min: 1, message: 'Select at least one value' }]
                      : []}
                  >
                    <Select
                      mode="multiple"
                      allowClear
                      showSearch
                      placeholder={attribute ? 'Select values' : 'Select an attribute first'}
                      disabled={!attribute}
                      options={valueOptions}
                      optionFilterProp="label"
                    />
                  </Form.Item>
                )}
              </div>
            )
          })}
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            className="customer-attribute-add-rule"
            onClick={() => add(defaultCustomerAttributeRule())}
          >
            Add rule
          </Button>
        </div>
      )}
    </Form.List>
  )
}

function EligibilitySections() {
  const form = Form.useFormInstance()
  const locationCompatibilityMode = Form.useWatch(['eligibility', 'locationCompatibilityMode'], form)
  const purchaseCompatibilityMode = Form.useWatch(['eligibility', 'purchaseCompatibilityMode'], form)
  const useCustomerAttributes = Form.useWatch(['eligibility', 'useCustomerAttributes'], form)
  const useSegments = Form.useWatch(['eligibility', 'useSegments'], form)
  const [locationQuery, setLocationQuery] = useState('')
  const [channelQuery, setChannelQuery] = useState('')

  const filteredLocations = useMemo(() => {
    const q = locationQuery.trim().toLowerCase()
    if (!q) return LOCATION_OPTIONS
    return LOCATION_OPTIONS.filter((item) => item.label.toLowerCase().includes(q) || item.value.toLowerCase().includes(q))
  }, [locationQuery])

  const filteredChannels = useMemo(() => {
    const q = channelQuery.trim().toLowerCase()
    if (!q) return SALES_CHANNEL_OPTIONS
    return SALES_CHANNEL_OPTIONS.filter((item) => item.label.toLowerCase().includes(q) || item.value.toLowerCase().includes(q))
  }, [channelQuery])

  return (
    <div className="eligibility-sections">
      <EligibilitySection
        enabledName={['eligibility', 'locationAvailabilityEnabled']}
        title="Location Availability"
        description="Restrict product availability to specific locations"
      >
        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          message="If no locations are selected, this product will be available everywhere."
        />
        <div className="eligibility-note">
          <InfoCircleOutlined />
          <span>If no locations are selected, this product will be available everywhere.</span>
        </div>
        <div className="eligibility-inner-card">
          <Typography.Text strong>Compatibility Mode</Typography.Text>
          <Form.Item name={['eligibility', 'locationCompatibilityMode']} className="eligibility-radio-item">
            <Radio.Group className="eligibility-radio-group">
              <Radio value="allow">
                <span className="eligibility-radio-copy">
                  <Typography.Text>Allow specific locations only</Typography.Text>
                  <Typography.Text type="secondary">
                    This product will be available ONLY on the locations you select (whitelist).
                  </Typography.Text>
                </span>
              </Radio>
              <Radio value="exclude">Exclude specific locations</Radio>
            </Radio.Group>
          </Form.Item>
        </div>
        <div className="eligibility-inner-card">
          <Space.Compact className="eligibility-search-bar">
            <Form.Item name={['eligibility', 'locationSearchBy']} noStyle>
              <Select
                style={{ width: 140 }}
                options={LOCATION_SEARCH_BY_OPTIONS.map((value) => ({ value, label: value }))}
              />
            </Form.Item>
            <Input
              placeholder="Search by id"
              value={locationQuery}
              onChange={(event) => setLocationQuery(event.target.value)}
              allowClear
            />
            <Button type="primary" icon={<SearchOutlined />} />
          </Space.Compact>
          <Form.Item
            name={['eligibility', 'locations']}
            label={locationCompatibilityMode === 'exclude'
              ? 'Select location(s) to exclude'
              : 'Select location(s) where this product will be available'}
            className="eligibility-select-item"
          >
            <Select
              mode="multiple"
              allowClear
              showSearch
              placeholder="Select"
              options={filteredLocations}
              optionFilterProp="label"
            />
          </Form.Item>
        </div>
      </EligibilitySection>

      <EligibilitySection
        enabledName={['eligibility', 'salesChannelAvailabilityEnabled']}
        title="Sales Channel Availability"
        description="Restrict product availability to specific sales channels"
      >
        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          message="By default, this product is available across all sales channels. To limit its availability, select specific channels."
        />
        <div className="eligibility-note">
          <InfoCircleOutlined />
          <span>If no channels are selected, this product will be available across all sales channels</span>
        </div>
        <div className="eligibility-inner-card">
          <Space.Compact className="eligibility-search-bar">
            <Form.Item name={['eligibility', 'channelSearchBy']} noStyle>
              <Select
                style={{ width: 140 }}
                options={CHANNEL_SEARCH_BY_OPTIONS.map((value) => ({ value, label: value }))}
              />
            </Form.Item>
            <Input
              placeholder="Search by name"
              value={channelQuery}
              onChange={(event) => setChannelQuery(event.target.value)}
              allowClear
            />
            <Button type="primary" icon={<SearchOutlined />} />
          </Space.Compact>
          <Form.Item name={['eligibility', 'salesChannels']} className="eligibility-select-item">
            <Select
              mode="multiple"
              allowClear
              showSearch
              placeholder="Select"
              options={filteredChannels}
              optionFilterProp="label"
            />
          </Form.Item>
        </div>
      </EligibilitySection>

      <EligibilitySection
        enabledName={['eligibility', 'subscriptionControlEnabled']}
        title="Subscription Control"
        description="Prevent customers with an active subscription from purchasing again"
      >
        <div className="eligibility-note">
          <InfoCircleOutlined />
          <span>Customers with an active subscription cannot purchase this product again. They can renew once the current subscription ends.</span>
        </div>
        <div className="eligibility-note">
          <InfoCircleOutlined />
          <span>Customers with an active subscription cannot purchase this product again. They can renew once the current subscription ends.</span>
        </div>
      </EligibilitySection>

      <EligibilitySection
        enabledName={['eligibility', 'purchaseCompatibilityEnabled']}
        title="Purchase Compatibility"
        description="Control which products can be purchased together with this offer"
      >
        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          message="By default, this product is compatible with all other products. Define rules only if you need to restrict combinations."
        />
        <div className="eligibility-note">
          <InfoCircleOutlined />
          <span>By default, this product is compatible with all other products. Define rules only if you need to restrict combinations.</span>
        </div>
        <div className="eligibility-inner-card">
          <Typography.Text strong>Compatibility mode</Typography.Text>
          <Form.Item name={['eligibility', 'purchaseCompatibilityMode']} className="eligibility-radio-item">
            <Radio.Group className="eligibility-radio-group">
              <Radio value="allow">Allow specific products only</Radio>
              <Radio value="exclude">Exclude specific products</Radio>
            </Radio.Group>
          </Form.Item>
        </div>
        <div className="eligibility-inner-card">
          <Form.Item
            name={['eligibility', 'compatibleProducts']}
            label={purchaseCompatibilityMode === 'exclude'
              ? 'Select product(s) to exclude'
              : 'Select product(s) that can be purchased with this offer'}
            className="eligibility-select-item"
          >
            <Select
              mode="multiple"
              allowClear
              showSearch
              placeholder="Select"
              options={COMPATIBLE_PRODUCT_OPTIONS}
              optionFilterProp="label"
            />
          </Form.Item>
        </div>
      </EligibilitySection>

      <EligibilitySection
        enabledName={['eligibility', 'customerEligibilityEnabled']}
        title="Customer eligibility"
        description="Restrict product availability based on customer attributes or segments"
      >
        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          message="By default, this product is available to all customers. Define rules only if you need to restrict availability based on customer profile."
        />
        <div className="eligibility-note">
          <InfoCircleOutlined />
          <span>Products can be restricted to customers matching selected profile attributes.</span>
        </div>
        <div className="eligibility-option-card">
          <Form.Item name={['eligibility', 'useCustomerAttributes']} valuePropName="checked" noStyle>
            <Checkbox
              onChange={(event) => {
                if (event.target.checked) {
                  const rules = form.getFieldValue(['eligibility', 'attributeRules']) as CustomerAttributeRule[] | undefined
                  if (!rules?.length) {
                    form.setFieldValue(['eligibility', 'attributeRules'], [defaultCustomerAttributeRule()])
                  }
                }
              }}
            >
              <span className="eligibility-radio-copy">
                <Typography.Text strong>Customer attributes</Typography.Text>
                <Typography.Text type="secondary">Restrict availability based on customer profile attributes</Typography.Text>
              </span>
            </Checkbox>
          </Form.Item>
          {useCustomerAttributes ? (
            <div className="eligibility-option-card-body">
              <CustomerAttributeRules />
            </div>
          ) : null}
        </div>
        <div className="eligibility-option-card">
          <Form.Item name={['eligibility', 'useSegments']} valuePropName="checked" noStyle>
            <Checkbox>
              <span className="eligibility-radio-copy">
                <Typography.Text strong>Segments</Typography.Text>
                <Typography.Text type="secondary">Restrict availability based on customer segments</Typography.Text>
              </span>
            </Checkbox>
          </Form.Item>
          {useSegments ? (
            <div className="eligibility-option-card-body">
              <div className="eligibility-note">
                <InfoCircleOutlined />
                <span>If no segments are selected, this product will be available for all customers</span>
              </div>
              <div className="eligibility-inner-card">
                <Form.Item
                  name={['eligibility', 'segments']}
                  label="Determine customer segment(s) for this product"
                  className="eligibility-select-item"
                >
                  <Select
                    mode="multiple"
                    allowClear
                    showSearch
                    placeholder="Select Segments"
                    options={SEGMENT_OPTIONS}
                    optionFilterProp="label"
                  />
                </Form.Item>
                <Typography.Text type="secondary" className="eligibility-helper-link">
                  Can&apos;t find your segments? See the{' '}
                  <Typography.Link href="#" target="_blank">
                    Segmentation List
                  </Typography.Link>
                </Typography.Text>
              </div>
            </div>
          ) : null}
        </div>
      </EligibilitySection>

      <EligibilitySection
        enabledName={['eligibility', 'customerJourneyEnabled']}
        title="Customer Journey Availability"
        description="Restrict product availability to specific customer journeys"
      >
        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          message="If no journeys are selected, this product will be available for all journeys."
        />
        <div className="eligibility-note">
          <InfoCircleOutlined />
          <span>If no journeys are selected, this product will be available for all journeys.</span>
        </div>
        <div className="eligibility-inner-card">
          <Form.Item
            name={['eligibility', 'journeys']}
            label="Select customer journeys(s) where product will be available"
            className="eligibility-select-item"
          >
            <Select
              mode="multiple"
              allowClear
              showSearch
              placeholder="Select"
              options={JOURNEY_OPTIONS}
              optionFilterProp="label"
            />
          </Form.Item>
        </div>
      </EligibilitySection>
    </div>
  )
}

function EntitlementPanels({
  maxLines,
  items,
}: {
  maxLines: number
  items: PickerCatalogItem[]
}) {
  const [productPanelsActive, setProductPanelsActive] = useState<string[]>(() => (
    items.map((item) => `entitlement-product-${item.key}`)
  ))
  const [servicePanelsActive, setServicePanelsActive] = useState<Record<string, string[]>>(() => (
    Object.fromEntries(
      items.map((item) => {
        const serviceTypes = entitlementServicesForCategory(item.category)
        return [item.key, serviceTypes[0] ? [serviceTypes[0]] : []]
      }),
    )
  ))

  const itemsKey = items.map((item) => item.key).join('|')

  useEffect(() => {
    setProductPanelsActive(items.map((item) => `entitlement-product-${item.key}`))
    setServicePanelsActive(
      Object.fromEntries(
        items.map((item) => {
          const serviceTypes = entitlementServicesForCategory(item.category)
          return [item.key, serviceTypes[0] ? [serviceTypes[0]] : []]
        }),
      ),
    )
  }, [itemsKey])

  if (!items.length) {
    return <Typography.Text type="secondary">Select a product or bundle to configure entitlement.</Typography.Text>
  }

  return (
    <div className="entitlement-product-list">
      {items.map((item) => {
        const panelKey = `entitlement-product-${item.key}`
        const serviceTypes = entitlementServicesForCategory(item.category)

        return (
          <Collapse
            key={item.key}
            className="entitlement-product-panel"
            activeKey={productPanelsActive}
            onChange={(keys) => {
              setProductPanelsActive(Array.isArray(keys) ? keys.map(String) : [String(keys)])
            }}
            items={[{
              key: panelKey,
              label: item.name,
              children: serviceTypes.length ? (
                <Collapse
                  className="entitlement-panels"
                  activeKey={servicePanelsActive[item.key] ?? []}
                  onChange={(keys) => {
                    const next = Array.isArray(keys) ? keys.map(String) : [String(keys)]
                    setServicePanelsActive((current) => ({ ...current, [item.key]: next }))
                  }}
                  items={serviceTypes.map((serviceType) => ({
                    key: serviceType,
                    label: ENTITLEMENT_PANEL_TITLES[serviceType],
                    extra: (
                      <Tag
                        color="blue"
                        className="entitlement-panel-allowance-tag"
                        onClick={(event) => event.stopPropagation()}
                      >
                        Unlimited
                      </Tag>
                    ),
                    children: (
                      <EntitlementServiceFields
                        productKey={item.key}
                        serviceType={serviceType}
                        maxLines={maxLines}
                      />
                    ),
                  }))}
                />
              ) : (
                <Typography.Text type="secondary">
                  No entitlement services configured for {item.category}.
                </Typography.Text>
              ),
            }]}
          />
        )
      })}
    </div>
  )
}

function EntitlementServiceFields({
  productKey,
  serviceType,
  maxLines: _maxLines,
}: {
  productKey: string
  serviceType: EntitlementServiceType
  maxLines: number
}) {
  const form = Form.useFormInstance<ListingFormValues>()
  const fupThreshold = Form.useWatch(['entitlements', productKey, serviceType, 'fupThreshold'], form)

  return (
    <div className="entitlement-service-fields">
      <Form.Item
        name={['entitlements', productKey, serviceType, 'allowance']}
        initialValue="Unlimited"
        hidden
      >
        <Input />
      </Form.Item>
      <div className="form-grid">
        <Form.Item
          name={['entitlements', productKey, serviceType, 'fupThreshold']}
          label={ENTITLEMENT_THRESHOLD_LABELS[serviceType]}
        >
          <Select
            allowClear
            placeholder="Select"
            options={FUP_THRESHOLD_OPTIONS[serviceType].map((value) => ({ value, label: value }))}
            onChange={(value?: string) => {
              form.setFieldValue(
                ['entitlements', productKey, serviceType, 'qosAfterFup'],
                value ? QOS_AFTER_FUP_BY_SERVICE[serviceType] : undefined,
              )
            }}
          />
        </Form.Item>
        {fupThreshold ? (
          <Form.Item label={ENTITLEMENT_FOLLOW_ON_LABELS[serviceType]} className="entitlement-qos-field">
            <Tag color="blue">{QOS_AFTER_FUP_BY_SERVICE[serviceType]}</Tag>
            <Form.Item
              name={['entitlements', productKey, serviceType, 'qosAfterFup']}
              initialValue={QOS_AFTER_FUP_BY_SERVICE[serviceType]}
              hidden
              noStyle
            >
              <Input />
            </Form.Item>
          </Form.Item>
        ) : null}
      </div>
    </div>
  )
}

type PickerCatalogItem = {
  key: string
  name: string
  kind: 'product' | 'bundle' | 'offer'
  classification: 'Telco' | 'Merchandise' | 'Telco + Merchandise'
  category: string
  basePrice?: number
  archetype?: 'Base plan' | 'Add-on'
}

// The same CCI catalog examples used by the main app. Keeping these real
// examples in the handoff makes the picker and the downstream form demonstrable.
const pickerCatalog: PickerCatalogItem[] = [
  { key: 'cci-connect', name: 'CCI Base Plan', kind: 'product', classification: 'Telco', category: 'Value plans', basePrice: 14.95, archetype: 'Base plan' },
  { key: 'cci-unlimited-18-49', name: 'Unlimited 18-49', kind: 'product', classification: 'Telco', category: 'Mobile plans', basePrice: 60, archetype: 'Base plan' },
  { key: 'cci-protection', name: 'Internet Protection', kind: 'product', classification: 'Telco', category: 'Protection', basePrice: 8, archetype: 'Add-on' },
  { key: 'cci-roadside', name: 'Roadside Assistance', kind: 'product', classification: 'Telco', category: 'Protection', basePrice: 5, archetype: 'Add-on' },
  { key: 'cci-offer-minimalist-1gb', name: 'Minimalist (1 GB)', kind: 'offer', classification: 'Telco', category: 'Value plans', basePrice: 20, archetype: 'Base plan' },
  { key: 'cci-offer-scroller-10gb', name: 'Scroller (10 GB)', kind: 'offer', classification: 'Telco', category: 'Value plans', basePrice: 35, archetype: 'Base plan' },
  { key: 'cci-offer-home-protection', name: 'Home Internet Protection', kind: 'offer', classification: 'Telco', category: 'Protection', basePrice: 8, archetype: 'Add-on' },
]

function pickerItemTone(item: PickerCatalogItem): 'bundle' | 'merchandise' | 'telco' {
  if (item.kind === 'bundle') return 'bundle'
  if (item.classification === 'Merchandise') return 'merchandise'
  return 'telco'
}

function pickerItemTagLabel(item: PickerCatalogItem): string {
  if (item.kind === 'bundle') return 'Bundle'
  return item.classification
}

function resolveCatalogItemName(productKey?: string): string | undefined {
  if (!productKey) return undefined
  const pickerItem = pickerCatalog.find((item) => item.key === productKey)
  const product = initialProducts.find((item) => item.key === productKey)
  const catalogProduct = initialCatalogRows.find((item) => item.key === productKey)
  return pickerItem?.name ?? product?.name ?? catalogProduct?.name
}

function resolvePickerCatalogItem(productKey: string): PickerCatalogItem | undefined {
  return pickerCatalog.find((item) => item.key === productKey)
}

function SelectedProductsList({
  value = [],
  onChange,
}: {
  value?: string[]
  onChange?: (value: string[]) => void
}) {
  const items = value
    .map((key) => resolvePickerCatalogItem(key))
    .filter((item): item is PickerCatalogItem => !!item)

  if (!items.length) {
    return <Typography.Text type="secondary">No offers selected</Typography.Text>
  }

  return (
    <div className="selected-products-list">
      {items.map((item) => {
        const tone = pickerItemTone(item)

        return (
          <div key={item.key} className={`selected-product-row is-${tone}`}>
            <div className="selected-product-copy">
              <Typography.Text strong>{item.name}</Typography.Text>
              <Typography.Text type="secondary">{item.category}</Typography.Text>
            </div>
            <Tag color={tone === 'bundle' ? 'magenta' : tone === 'telco' ? 'blue' : 'purple'}>
              {pickerItemTagLabel(item)}
            </Tag>
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              disabled={items.length <= 1}
              aria-label={`Remove ${item.name}`}
              onClick={() => onChange?.(value.filter((key) => key !== item.key))}
            />
          </div>
        )
      })}
    </div>
  )
}

function SectionTitle({
  title,
  description,
  area,
}: {
  title: string
  description: string
  area?: 'CCI' | 'Postpaid'
}) {
  return (
    <div>
      <div className="section-heading">
        <Typography.Title level={5}>{title}</Typography.Title>
        {area ? <ScopeTag area={area} /> : null}
      </div>
      <Typography.Text type="secondary" className="section-description">
        {description}
      </Typography.Text>
    </div>
  )
}

export function ProductListingsPage() {
  const { message } = App.useApp()
  const [listings, setListings] = useState(initialListings)
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'all' | 'telco' | 'merchandise' | 'bundle'>('all')
  const [creating, setCreating] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickedProductKeys, setPickedProductKeys] = useState<string[]>([])
  const [pickerMode, setPickerMode] = useState<'any' | 'Telco' | 'Merchandise' | 'bundles'>('any')
  const [pickerSearch, setPickerSearch] = useState('')
  const [step, setStep] = useState(0)
  const [offerMaxLines, setOfferMaxLines] = useState(3)
  const [selectedOfferType, setSelectedOfferType] = useState<OfferType>('BASE_PLAN')
  const [pricePanelsActive, setPricePanelsActive] = useState<string[]>(['price-panel-0'])
  const [feeCatalogOpen, setFeeCatalogOpen] = useState(false)
  const [form] = Form.useForm<ListingFormValues>()

  // preserve:true keeps values after step Form.Items unmount
  const selectedProductKeys = Form.useWatch('productKeys', { form, preserve: true }) as string[] | undefined
  const watchedMaxLines = Form.useWatch('maxLines', { form, preserve: true })
  const watchedOfferType = Form.useWatch('offerType', { form, preserve: true })
  const displayName = Form.useWatch('displayName', { form, preserve: true })
  const listingLabelEnabled = Form.useWatch('listingLabelEnabled', { form, preserve: true })
  const watchedPriceComponents = Form.useWatch('priceComponents', { form, preserve: true }) as PriceComponent[] | undefined
  const priceSummary = priceSummaryRows(watchedPriceComponents)
  const recurringTotal = priceSummary
    .filter((row) => row.pricingType !== 'ONE TIME' && row.amount != null)
    .reduce((sum, row) => sum + Number(row.amount), 0)
  const oneTimeTotal = priceSummary
    .filter((row) => row.pricingType === 'ONE TIME' && row.amount != null)
    .reduce((sum, row) => sum + Number(row.amount), 0)
  const hasPriceSummaryAmounts = priceSummary.some((row) => row.amount != null)
  const offerType = watchedOfferType ?? selectedOfferType
  const primaryProductKey = selectedProductKeys?.[0]
  const selectedProduct = initialProducts.find((product) => product.key === primaryProductKey)
  const selectedCatalogProduct = initialCatalogRows.find((product) => product.key === primaryProductKey)
  const selectedPickerItem = pickerCatalog.find((item) => item.key === primaryProductKey)
  const selectedPickerItems = (selectedProductKeys ?? [])
    .map((key) => resolvePickerCatalogItem(key))
    .filter((item): item is PickerCatalogItem => !!item)
  const selectedItemName = selectedPickerItems.length
    ? selectedPickerItems.map((item) => item.name).join(', ')
    : resolveCatalogItemName(primaryProductKey)
      ?? selectedProduct?.name
      ?? selectedCatalogProduct?.name
      ?? displayName
  const pricingProductName = selectedPickerItems[0]?.name ?? selectedItemName
  const pricingMaxLines = Math.max(1, Number(watchedMaxLines ?? form.getFieldValue('maxLines') ?? offerMaxLines) || 1)
  const selectedEntitlementSignature = selectedPickerItems
    .map((item) => `${item.key}:${item.category}`)
    .join('|')

  useEffect(() => {
    if (!selectedEntitlementSignature) return
    const existing = form.getFieldValue('entitlements') as
      | Record<string, Record<EntitlementServiceType, ServiceEntitlement>>
      | undefined
    const nextEntitlements = defaultEntitlementsByProduct(
      selectedPickerItems.map((item) => ({ key: item.key, category: item.category })),
      existing,
    )
    const currentKeys = Object.keys(existing ?? {}).sort().join('|')
    const nextKeys = Object.keys(nextEntitlements).sort().join('|')
    if (currentKeys !== nextKeys) {
      form.setFieldValue('entitlements', nextEntitlements)
    }
  }, [selectedEntitlementSignature, form])

  useEffect(() => {
    const resolved = watchedMaxLines ?? form.getFieldValue('maxLines')
    if (resolved != null) setOfferMaxLines(Number(resolved))
  }, [watchedMaxLines, form])

  useEffect(() => {
    const resolved = watchedOfferType ?? form.getFieldValue('offerType')
    if (resolved) setSelectedOfferType(resolved)
  }, [watchedOfferType, form])

  useEffect(() => {
    const resolvedMaxLines = form.getFieldValue('maxLines')
    if (resolvedMaxLines != null) setOfferMaxLines(Number(resolvedMaxLines))
    const resolvedOfferType = form.getFieldValue('offerType')
    if (resolvedOfferType) setSelectedOfferType(resolvedOfferType)
  }, [step, form])

  const eligiblePickerProducts = useMemo(() => pickerCatalog.filter((item) => (
    item.kind === 'product'
    && (pickerMode === 'any' || pickerMode === 'bundles' || item.classification === pickerMode)
    && `${item.name} ${item.category}`.toLowerCase().includes(pickerSearch.toLowerCase())
  )), [pickerMode, pickerSearch])

  const eligiblePickerBundles = useMemo(() => pickerCatalog.filter((item) => (
    item.kind === 'offer'
    && `${item.name} ${item.category}`.toLowerCase().includes(pickerSearch.toLowerCase())
  )), [pickerSearch])

  const filteredListings = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return listings.filter((listing) => {
      if (view === 'telco' && !['Base plan', 'Add-on'].includes(listing.listingType)) return false
      if (view === 'merchandise' && listing.listingType !== 'Merchandise item') return false
      if (view === 'bundle' && listing.listingType !== 'Bundle offer') return false
      if (!normalized) return true
      return [listing.name, listing.code, listing.product, ...listing.categories].some((value) =>
        value.toLowerCase().includes(normalized),
      )
    })
  }, [listings, query, view])

  const columns: ColumnsType<ListingRecord> = [
    {
      title: 'Listing name',
      dataIndex: 'name',
      render: (name: string, record) => (
        <div>
          <Typography.Text className="cell-title">{name}</Typography.Text>
          <Typography.Text className="cell-subtitle">{record.code}</Typography.Text>
        </div>
      ),
    },
    { title: 'Listing type', dataIndex: 'listingType', width: 150 },
    { title: 'Product / Bundle', dataIndex: 'product', width: 240 },
    {
      title: 'Category',
      dataIndex: 'categories',
      width: 190,
      render: (categories: string[]) => (
        <Space size={[4, 4]} wrap>{categories.map((category) => <Tag key={category}>{category}</Tag>)}</Space>
      ),
    },
    {
      title: 'Price',
      key: 'price',
      width: 180,
      render: (_, record) => (
        <div>
          <Typography.Text className="cell-title">
            {record.priceRange ? `${record.priceRange.min} - ${record.priceRange.max}` : record.price}
          </Typography.Text>
          {record.variantCount ? (
            <Typography.Text className="cell-subtitle">{record.variantCount} variants</Typography.Text>
          ) : null}
        </div>
      ),
    },
    {
      title: 'Promotions',
      dataIndex: 'promotionCount',
      width: 130,
      render: (count: number) => count > 0 ? (
        <Button
          type="link"
          size="small"
          style={{ paddingInline: 0 }}
          onClick={() => message.info('Open the matching promotions in the host application')}
        >
          {count} promotion{count === 1 ? '' : 's'}
        </Button>
      ) : null,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 100,
      render: (status: ListingRecord['status']) => (
        <Tag color={status === 'Active' ? 'green' : 'default'}>{status}</Tag>
      ),
    },
    {
      title: 'Last updated',
      dataIndex: 'lastUpdated',
      width: 160,
      render: (date: string, record) => (
        <div>
          <Typography.Text>{new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Typography.Text>
          <Typography.Text className="cell-subtitle">by {record.updatedBy}</Typography.Text>
        </div>
      ),
    },
    {
      title: '',
      key: 'actions',
      fixed: 'right',
      width: 56,
      render: () => (
        <Dropdown menu={{ items: [{ key: 'view', label: 'View' }, { key: 'edit', label: 'Edit' }, { key: 'duplicate', label: 'Duplicate' }] }}>
          <Button aria-label="Listing actions" type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ]

  const beginCreate = () => {
    form.resetFields()
    form.setFieldsValue({
      paymentModel: 'Postpaid',
      paymentPolicy: 'Standard Postpaid',
      chargingPolicy: 'Real-Time Policy',
      billingPolicy: 'Bill Cycle Policy',
      prorationPolicy: 'Daily Proration Policy',
      offerType: 'BASE_PLAN',
      offerSubType: 'FIXED_DATA_TIER',
      minLines: 1,
      maxLines: 3,
      sellable: true,
      status: 'Draft',
      productKeys: [],
      priceComponents: [
        defaultPriceComponent(),
      ],
      entitlements: {},
      channels: ['Web', 'Retail'],
      productDetailsUrl: undefined,
      termsAndConditionsUrl: undefined,
      bannerImageUrl: undefined,
      listingLabelEnabled: false,
      listingLabel: undefined,
      features: defaultFeatures(),
      galleryImages: [],
      eligibility: defaultEligibility(),
    })
    setPickedProductKeys([])
    setSelectedOfferType('BASE_PLAN')
    setPricePanelsActive(['price-panel-0'])
    setPickerMode('any')
    setPickerSearch('')
    setPickerOpen(true)
  }

  const confirmProduct = () => {
    if (!pickedProductKeys.length) return
    selectProducts(pickedProductKeys)
    setStep(0)
    setPickerOpen(false)
    setCreating(true)
  }

  const selectProducts = (productKeys: string[]) => {
    const pickerItems = productKeys
      .map((key) => resolvePickerCatalogItem(key))
      .filter((item): item is PickerCatalogItem => !!item)
    if (!pickerItems.length) return

    const primary = pickerItems[0]
    const product = initialProducts.find((item) => item.key === primary.key)
    const names = pickerItems.map((item) => item.name)
    const combinedName = names.join(', ')
    const isMerchandise = pickerItems.every((item) => item.classification === 'Merchandise')
    const nextOfferType: OfferType = productKeys.length > 1 ? 'MIXED_BUNDLE' : 'BASE_PLAN'
    const subtypes = offerSubtypesForType(nextOfferType)
    const isBundleOffer = pickerItems.length > 1 || pickerItems.some((item) => item.kind === 'offer')
    const offerPriceComponents = isBundleOffer
      ? pickerItems.map((item) => ({
          ...derivedPriceComponentFromOffer(item),
          componentLabel: item.name,
        }))
      : [emptyPriceComponent()]
    const priceComponents = isBundleOffer
      ? [...offerPriceComponents, derivedNetworkActivationFeeComponent()]
      : offerPriceComponents
    form.setFieldsValue({
      productKeys,
      offerType: nextOfferType,
      offerSubType: subtypes[0],
      minLines: nextOfferType === 'BASE_PLAN' ? form.getFieldValue('minLines') ?? 1 : undefined,
      maxLines: nextOfferType === 'BASE_PLAN' ? form.getFieldValue('maxLines') ?? 3 : undefined,
      entitlements: defaultEntitlementsByProduct(
        pickerItems.map((item) => ({ key: item.key, category: item.category })),
        form.getFieldValue('entitlements') as Record<string, Record<EntitlementServiceType, ServiceEntitlement>> | undefined,
      ),
      priceComponents,
      name: `${combinedName} listing`,
      code: generateOfferCode(),
      displayName: combinedName,
      paymentModel: isMerchandise ? 'Prepaid' : 'Postpaid',
      paymentPolicy: isMerchandise ? 'Upfront Card' : 'Standard Postpaid',
    })
    setSelectedOfferType(nextOfferType)
    setPricePanelsActive(priceComponents.map((_, index) => `price-panel-${index}`))
  }

  const nextStep = async () => {
    try {
      await form.validateFields()
      const resolvedMaxLines = form.getFieldValue('maxLines')
      if (resolvedMaxLines != null) setOfferMaxLines(Number(resolvedMaxLines))
      const resolvedOfferType = form.getFieldValue('offerType')
      if (resolvedOfferType) setSelectedOfferType(resolvedOfferType)
      setStep((current) => Math.min(current + 1, stepItems.length - 1))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      message.error('Complete the required fields before continuing')
    }
  }

  const saveListing = async () => {
    const values = await form.validateFields()
    const primaryKey = values.productKeys?.[0]
    const product = initialProducts.find((item) => item.key === primaryKey)
    const catalogProduct = initialCatalogRows.find((item) => item.key === primaryKey)
    const pickerItem = pickerCatalog.find((item) => item.key === primaryKey)
    const selectedNames = (values.productKeys ?? [])
      .map((key) => resolveCatalogItemName(key))
      .filter((name): name is string => !!name)
    const primaryAmount = primaryPriceAmount(values.priceComponents)
    setListings((current) => [
      ...current,
      {
        key: `l-${Date.now()}`,
        name: values.name,
        code: values.code,
        listingType: pickerItem?.kind === 'bundle'
          ? 'Bundle offer'
          : pickerItem?.classification === 'Merchandise' || catalogProduct?.typeLabel === 'Merchandise'
          ? 'Merchandise item'
          : pickerItem?.archetype === 'Add-on' || product?.archetype === 'Add-on'
            ? 'Add-on'
            : 'Base plan',
        product: selectedNames.length
          ? selectedNames.join(', ')
          : pickerItem?.name ?? product?.name ?? catalogProduct?.name ?? 'Unknown product',
        categories: [pickerItem?.category ?? catalogProduct?.category ?? 'Mobile Plans'],
        price: primaryAmount != null ? `$${Number(primaryAmount).toFixed(2)}/mo` : 'Not set',
        promotionCount: 0,
        status: 'Draft',
        lastUpdated: new Date().toISOString().slice(0, 10),
        updatedBy: 'Current operator',
      },
    ])
    setCreating(false)
    message.success('Draft listing created')
  }

  if (!creating) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="page-header-copy">
            <Typography.Title level={2}>Offers</Typography.Title>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={beginCreate}>
            Create Offer
          </Button>
        </div>

        <div className="toolbar">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search offers"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button icon={<BarsOutlined />}>Columns</Button>
        </div>
        <Tabs
          activeKey={view}
          onChange={(key: string) => setView(key as typeof view)}
          items={[
            { key: 'all', label: `All offers (${listings.length})` },
            { key: 'telco', label: `Telco (${listings.filter((row) => ['Base plan', 'Add-on'].includes(row.listingType)).length})` },
            { key: 'merchandise', label: `Merchandise (${listings.filter((row) => row.listingType === 'Merchandise item').length})` },
            { key: 'bundle', label: `Bundles (${listings.filter((row) => row.listingType === 'Bundle offer').length})` },
          ]}
        />
        <Card className="table-card">
          <Table
            columns={columns}
            dataSource={filteredListings}
            rowSelection={{}}
            scroll={{ x: 1380 }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} results`,
            }}
          />
        </Card>

        <Modal
          className="listing-item-picker-modal"
          title={(
            <Space orientation="vertical" size={2}>
              <Typography.Title level={4} style={{ margin: 0 }}>Create Offer</Typography.Title>
              <Typography.Text type="secondary">Choose a standalone offer or select offers to bundle</Typography.Text>
            </Space>
          )}
          width={996}
          open={pickerOpen}
          onCancel={() => setPickerOpen(false)}
          okText="Done"
          okButtonProps={{ disabled: !pickedProductKeys.length }}
          onOk={confirmProduct}
        >
          <Space orientation="vertical" size={16} className="full-width">
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search offers..."
              value={pickerSearch}
              onChange={(event) => setPickerSearch(event.target.value)}
            />
            <Tabs
              activeKey={pickerMode === 'bundles' ? 'bundles' : 'products'}
              className="listing-item-tabs"
              items={[
                { key: 'products', label: 'Standalone Offer' },
                { key: 'bundles', label: 'Bundle Offer' },
              ]}
              onChange={(value) => {
                setPickedProductKeys([])
                setPickerMode(value === 'bundles' ? 'bundles' : 'any')
              }}
            />
            {pickerMode !== 'bundles' && (
              <Space wrap>
                <Select
                  className="filter-select"
                  value={pickerMode}
                  onChange={(value) => {
                    setPickerMode(value)
                  }}
                  options={[
                    { label: 'All product types', value: 'any' },
                    { label: 'Telco', value: 'Telco' },
                    { label: 'Merchandise', value: 'Merchandise' },
                  ]}
                />
                <Select className="filter-select" value="all" options={[{ label: 'All categories', value: 'all' }]} />
                <Select className="filter-select" value="all" options={[{ label: 'All statuses', value: 'all' }]} />
              </Space>
            )}
            <div className="listing-item-list">
              {(pickerMode === 'bundles' ? eligiblePickerBundles : eligiblePickerProducts).map((item) => {
                const checked = pickedProductKeys.includes(item.key)
                const isBundleOfferTab = pickerMode === 'bundles'
                return (
                  <button
                    className={`listing-item-option ${checked ? 'is-selected' : ''}`}
                    key={item.key}
                    onClick={() => {
                      if (isBundleOfferTab) {
                        setPickedProductKeys((current) => (
                          current.includes(item.key)
                            ? current.filter((key) => key !== item.key)
                            : [...current, item.key]
                        ))
                        return
                      }
                      setPickedProductKeys([item.key])
                    }}
                    type="button"
                  >
                    {isBundleOfferTab ? (
                      <Checkbox checked={checked} />
                    ) : (
                      <Radio checked={checked} />
                    )}
                    <div className="listing-item-copy">
                      <Typography.Text strong>{item.name}</Typography.Text>
                      <Typography.Text type="secondary">{item.category}</Typography.Text>
                    </div>
                    <Space>
                      <Tag color={pickerItemTone(item) === 'bundle' ? 'magenta' : pickerItemTone(item) === 'telco' ? 'blue' : 'purple'}>
                        {pickerItemTagLabel(item)}
                      </Tag>
                    </Space>
                  </button>
                )
              })}
            </div>
          </Space>
        </Modal>
      </div>
    )
  }

  const review = form.getFieldsValue(true) as ListingFormValues
  const reviewPriceRows = priceSummaryRows(review.priceComponents)
  const reviewRecurringTotal = reviewPriceRows
    .filter((row) => row.pricingType !== 'ONE TIME' && row.amount != null)
    .reduce((sum, row) => sum + Number(row.amount), 0)
  const reviewOneTimeTotal = reviewPriceRows
    .filter((row) => row.pricingType === 'ONE TIME' && row.amount != null)
    .reduce((sum, row) => sum + Number(row.amount), 0)
  const reviewGrandTotal = reviewRecurringTotal + reviewOneTimeTotal
  const reviewEntitlements = entitlementReviewRows(review.entitlements, selectedPickerItems)
  const reviewEligibilityDetails = enabledEligibilityDetails(review.eligibility)
  const reviewFeatures = (review.features ?? []).map((feature) => feature.trim()).filter(Boolean)
  const reviewGalleryCount = review.galleryImages?.length ?? 0

  return (
    <div className="page-container listing-create-page telco-studio-page">
      <Breadcrumb items={[{ title: <a onClick={() => setCreating(false)}>Offers</a> }, { title: 'Create offer' }]} />
      <Flex justify="space-between" align="flex-start" gap={16} wrap className="page-header" style={{ marginTop: 16 }}>
        <Space orientation="vertical" size={8} className="page-header-copy">
          {step > 0 ? (
            <Button
              className="page-back-link"
              icon={<ArrowLeftOutlined />}
              onClick={() => setStep((current) => current - 1)}
              type="link"
            >
              Back
            </Button>
          ) : null}
          <div>
            <Typography.Title level={2}>Create Offer</Typography.Title>
          </div>
        </Space>
        <Space wrap>
          {step < stepItems.length - 1 ? (
            <Button type="primary" onClick={nextStep}>Continue</Button>
          ) : (
            <Button type="primary" onClick={saveListing}>Save draft</Button>
          )}
        </Space>
      </Flex>

      <Form<ListingFormValues> form={form} layout="vertical" preserve requiredMark={false}>
        <div className="listing-create-form-shell">
          <div className="listing-form-column">
            {step === 0 && (
              <>
                <Card
                  id="listing-section-basics"
                  className="form-card"
                  title={<SectionTitle title="Offer Details" description="Choose an existing catalog item and define its commercial role." />}
                >
                  <div className="form-grid">
                    <div className="span-two">
                      <Form.Item
                        name="productKeys"
                        label="Selected products"
                        rules={[{ required: true, type: 'array', min: 1, message: 'Select at least one product or bundle' }]}
                      >
                        <SelectedProductsList />
                      </Form.Item>
                    </div>
                    <Form.Item name="name" label="Offer title" rules={[{ required: true, message: 'Enter an offer title' }]}>
                      <Input placeholder="e.g. Minimalist monthly plan" />
                    </Form.Item>
                    <Form.Item name="code" label="Offer Code">
                      <Input readOnly placeholder="Auto-generated" />
                    </Form.Item>
                    <Form.Item name="sellable" label="Sellable" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Form.Item name="status" label="Status">
                      <Select disabled options={[{ value: 'Draft', label: 'Draft' }]} />
                    </Form.Item>
                  </div>
                  <Form.Item
                    name="offerType"
                    label="Offer Type"
                    rules={[{ required: true, message: 'Select an offer type' }]}
                  >
                    <OfferTypePicker />
                  </Form.Item>
                </Card>
                <Card
                  id="listing-section-policies"
                  className="form-card"
                  title={<SectionTitle title="Policies" description="Configure charging, billing, and proration behaviour." />}
                >
                  <div className="form-grid four">
                    <Form.Item
                      name="paymentPolicy"
                      label="Payment Policy"
                      initialValue="Standard Postpaid"
                      rules={[{ required: true }]}
                    >
                      <Select
                        options={[
                          { value: 'Standard Postpaid' },
                          { value: 'Upfront Card' },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item name="chargingPolicy" label="Charging Policy" rules={[{ required: true }]}>
                      <Select
                        options={[
                          { value: 'Real-Time Policy' },
                          { value: 'Advance Policy' },
                          { value: 'Arrears Policy' },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item name="billingPolicy" label="Billing Policy" rules={[{ required: true }]}>
                      <Select options={[{ value: 'Bill Cycle Policy' }]} />
                    </Form.Item>
                    <Form.Item name="prorationPolicy" label="Proration Policy" rules={[{ required: true }]}>
                      <Select options={[{ value: 'Daily Proration Policy' }]} />
                    </Form.Item>
                  </div>
                </Card>
              </>
            )}

            {step === 1 && (
              <>
                <Card
                  id="listing-section-pricing"
                  className="form-card"
                  title={<SectionTitle title="Pricing" description="Define one or more pricing components for this listing." />}
                >
                  <Form.List name="priceComponents">
                    {(fields, { add, remove }) => (
                      <Space orientation="vertical" size={16} className="full-width">
                        {fields.map((field) => {
                          const componentLabel = form.getFieldValue(['priceComponents', field.name, 'componentLabel']) as string | undefined
                          const pricingType = form.getFieldValue(['priceComponents', field.name, 'pricingType']) as PricingType | undefined
                          const feeDefinition = form.getFieldValue(['priceComponents', field.name, 'feeDefinition']) as FeeDefinition | undefined
                          const panelKey = `price-panel-${field.name}`
                          const linkedPickerItem = feeDefinition
                            ? undefined
                            : componentLabel
                              ? selectedPickerItems.find((item) => item.name === componentLabel)
                              : selectedPickerItems[field.name] ?? selectedPickerItems[0]
                          const panelTitle = componentLabel?.trim()
                            || (field.name === 0 ? pricingProductName?.trim() : undefined)
                            || priceComponentTitle(pricingType, feeDefinition)
                          const panelTag = feeDefinition || componentLabel === 'Network Activation Fee'
                            ? 'Fee'
                            : linkedPickerItem?.archetype
                          const panelLabel = (
                            <Flex align="center" gap={8} wrap="wrap">
                              <span>{panelTitle}</span>
                              {panelTag ? (
                                <Tag color={panelTag === 'Add-on' ? 'purple' : panelTag === 'Fee' ? 'orange' : 'blue'}>
                                  {panelTag}
                                </Tag>
                              ) : null}
                            </Flex>
                          )

                          return (
                            <Collapse
                              key={field.key}
                              className="price-component-panel"
                              activeKey={pricePanelsActive}
                              onChange={(keys) => {
                                setPricePanelsActive(Array.isArray(keys) ? keys : [keys])
                              }}
                              items={[{
                                key: panelKey,
                                label: panelLabel,
                                extra: field.name > 0 ? (
                                  <Button
                                    type="text"
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    aria-label="Remove pricing component"
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      remove(field.name)
                                      setPricePanelsActive((current) => (
                                        current.filter((key) => key !== panelKey)
                                      ))
                                    }}
                                  />
                                ) : null,
                                children: (
                                  <PriceComponentFields
                                    field={field}
                                    productName={componentLabel?.trim() || pricingProductName}
                                    offerType={selectedOfferType}
                                    canRemove={false}
                                    onRemove={() => remove(field.name)}
                                    hideTitle
                                  />
                                ),
                              }]}
                            />
                          )
                        })}
                        <Flex gap={8} className="full-width pricing-add-actions">
                          <Dropdown
                            trigger={['click']}
                            open={feeCatalogOpen}
                            onOpenChange={setFeeCatalogOpen}
                            placement="bottomLeft"
                            popupRender={() => (
                              <div className="fee-catalog-menu">
                                {FEE_CATALOG_OPTIONS.map((option) => (
                                  <button
                                    key={option.code}
                                    type="button"
                                    className="fee-catalog-item"
                                    onClick={() => {
                                      const nextIndex = fields.length
                                      add(priceComponentFromFeeCatalog(option))
                                      setPricePanelsActive((current) => [...current, `price-panel-${nextIndex}`])
                                      setFeeCatalogOpen(false)
                                    }}
                                  >
                                    <PlusOutlined className="fee-catalog-item-icon" />
                                    <span className="fee-catalog-item-copy">
                                      <span className="fee-catalog-item-title">{option.label}</span>
                                      <span className="fee-catalog-item-meta">
                                        {option.code} · {option.priceLabel} · {option.category}
                                      </span>
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          >
                            <Button type="dashed" icon={<PlusOutlined />} block>
                              Add Fee
                            </Button>
                          </Dropdown>
                        </Flex>
                      </Space>
                    )}
                  </Form.List>
                </Card>

              </>
            )}

            {step === 2 && (
              <Card
                id="listing-section-entitlement"
                className="form-card"
                title={<SectionTitle title="Entitlement" description="Configure service allowances for this offer. Below sections are based on the available service types of the selected product." />}
              >
                <EntitlementPanels maxLines={pricingMaxLines} items={selectedPickerItems} />
              </Card>
            )}

            {step === 3 && (
              <Card
                className="form-card"
                title={<SectionTitle title="Eligibility" description="Limit where and to whom the offer can be sold." area="CCI" />}
              >
                <EligibilitySections />
              </Card>
            )}

            {step === 4 && (
              <>
                <Card
                  className="form-card"
                  title={<SectionTitle title="Display" description="Write the customer-facing content for this offer." />}
                >
                  <Form.Item name="displayName" label="Display name" rules={[{ required: true }]}>
                    <Input placeholder="e.g. Minimalist" />
                  </Form.Item>
                  <Form.Item name="subtitle" label="Short description">
                    <Input placeholder="A concise value statement" maxLength={100} showCount />
                  </Form.Item>
                  <Form.Item name="description" label="Description">
                    <Input.TextArea rows={5} maxLength={500} showCount />
                  </Form.Item>
                </Card>

                <Card className="form-card" title="Links">
                  <Form.Item name="productDetailsUrl" label="Product details">
                    <Input placeholder="Add url" />
                  </Form.Item>
                  <Form.Item name="termsAndConditionsUrl" label="Terms and conditions">
                    <Input placeholder="Add url" />
                  </Form.Item>
                  <Form.Item name="bannerImageUrl" label="Banner image">
                    <Input placeholder="Add url" />
                  </Form.Item>
                  <Form.Item label="Listing label" className="listing-label-field">
                    <Flex align="center" gap={12} className="listing-label-controls">
                      <Form.Item name="listingLabelEnabled" valuePropName="checked" noStyle>
                        <Switch />
                      </Form.Item>
                      <div className="listing-label-select-wrap">
                        <Form.Item name="listingLabel" noStyle>
                          <Select
                            allowClear
                            placeholder="Select"
                            options={LISTING_LABEL_OPTIONS}
                            disabled={!listingLabelEnabled}
                            className="full-width"
                          />
                        </Form.Item>
                      </div>
                    </Flex>
                  </Form.Item>
                </Card>

                <Card className="form-card" title="Features">
                  <Form.List name="features">
                    {(fields, { add, remove }) => (
                      <div className="display-features-list">
                        {fields.map((field) => (
                          <div key={field.key} className="display-feature-row">
                            <Form.Item name={field.name} className="display-feature-input">
                              <Input placeholder="Add feature" />
                            </Form.Item>
                            <Button
                              type="default"
                              danger
                              icon={<DeleteOutlined />}
                              aria-label="Remove feature"
                              onClick={() => remove(field.name)}
                            />
                          </div>
                        ))}
                        <Button
                          type="dashed"
                          icon={<PlusOutlined />}
                          onClick={() => add('')}
                          className="display-add-feature"
                        >
                          Add Feature
                        </Button>
                      </div>
                    )}
                  </Form.List>
                </Card>

                <Card className="form-card product-gallery-card" title="Product Gallery">
                  <Form.Item name="galleryImages" noStyle>
                    <ProductGalleryField />
                  </Form.Item>
                </Card>
              </>
            )}

            {step === 5 && (
              <Card
                className="form-card"
                title={<SectionTitle title="Review" description="Confirm the actual values selected across each step before saving." />}
              >
                <div className="review-sections">
                  <section className="review-section">
                    <Typography.Title level={5}>Offer Details</Typography.Title>
                    <div className="review-grid">
                      <div className="review-item">
                        <Typography.Text type="secondary">Offer title</Typography.Text>
                        <Typography.Text strong>{reviewValue(review.name)}</Typography.Text>
                      </div>
                      <div className="review-item">
                        <Typography.Text type="secondary">Offer code</Typography.Text>
                        <Typography.Text strong>{reviewValue(review.code, 'No code')}</Typography.Text>
                      </div>
                      <div className="review-item span-two">
                        <Typography.Text type="secondary">
                          {selectedPickerItems.length > 1 ? 'Selected offers / products' : 'Selected offer / product'}
                        </Typography.Text>
                        {selectedPickerItems.length ? (
                          selectedPickerItems.map((item) => (
                            <Typography.Text key={item.key} strong className="review-stack-line">
                              {item.name}
                              <Typography.Text type="secondary">
                                {` · ${item.category} · ${item.kind === 'offer' ? 'Offer' : item.kind === 'bundle' ? 'Bundle' : item.archetype ?? item.classification}`}
                              </Typography.Text>
                            </Typography.Text>
                          ))
                        ) : (
                          <Typography.Text strong>Not selected</Typography.Text>
                        )}
                      </div>
                      <div className="review-item">
                        <Typography.Text type="secondary">Offer type</Typography.Text>
                        <Typography.Text strong>{offerTypeTitle(review.offerType ?? selectedOfferType)}</Typography.Text>
                        <Typography.Text type="secondary">
                          {review.offerSubType ? `Subtype: ${review.offerSubType}` : 'No subtype'}
                        </Typography.Text>
                      </div>
                      <div className="review-item">
                        <Typography.Text type="secondary">Lines / status</Typography.Text>
                        <Typography.Text strong>
                          {review.offerType === 'BASE_PLAN' && review.minLines != null && review.maxLines != null
                            ? `${review.minLines === review.maxLines
                              ? `${review.minLines} line${review.minLines === 1 ? '' : 's'}`
                              : `${review.minLines}-${review.maxLines} lines`}`
                            : 'Not applicable'}
                        </Typography.Text>
                        <Typography.Text type="secondary">
                          {review.sellable ? 'Sellable' : 'Not sellable'} · {reviewValue(review.status, 'Draft')}
                        </Typography.Text>
                      </div>
                      <div className="review-item">
                        <Typography.Text type="secondary">Payment policy</Typography.Text>
                        <Typography.Text strong>{reviewValue(review.paymentPolicy)}</Typography.Text>
                        <Typography.Text type="secondary">{reviewValue(review.paymentModel)}</Typography.Text>
                      </div>
                      <div className="review-item">
                        <Typography.Text type="secondary">Charging / billing</Typography.Text>
                        <Typography.Text strong>{reviewValue(review.chargingPolicy)}</Typography.Text>
                        <Typography.Text type="secondary">
                          {[review.billingPolicy, review.prorationPolicy].filter(Boolean).join(' · ') || 'Not set'}
                        </Typography.Text>
                      </div>
                    </div>
                  </section>

                  <section className="review-section">
                    <Typography.Title level={5}>Pricing</Typography.Title>
                    <div className="review-pricing-list">
                      {reviewPriceRows.length ? (
                        reviewPriceRows.map((row) => (
                          <div key={row.key} className="review-item review-pricing-item">
                            <div className="review-pricing-item-header">
                              <div>
                                <Typography.Text strong>{row.label}</Typography.Text>
                                <Typography.Text type="secondary" className="review-pricing-type">
                                  {row.pricingType === 'ONE TIME' ? 'One time' : (row.frequency || row.pricingType || 'Pricing')}
                                </Typography.Text>
                              </div>
                              <Typography.Text strong className="review-pricing-amount">
                                {row.amount != null ? formatPriceAmount(Number(row.amount)) : '—'}
                              </Typography.Text>
                            </div>
                            <div className="review-field-list">
                              <div className="review-kv">
                                <span>Pricing type</span>
                                <strong>{reviewValue(row.pricingType)}</strong>
                              </div>
                              <div className="review-kv">
                                <span>Pricing basis</span>
                                <strong>{reviewValue(row.pricingBasis)}</strong>
                              </div>
                              {row.pricingType === 'ONE TIME' ? (
                                <div className="review-kv">
                                  <span>Associated fee</span>
                                  <strong>{reviewValue(row.feeDefinition)}</strong>
                                </div>
                              ) : (
                                <div className="review-kv">
                                  <span>Frequency</span>
                                  <strong>{reviewValue(row.frequency)}</strong>
                                </div>
                              )}
                              <div className="review-kv">
                                <span>Tax treatment</span>
                                <strong>{reviewValue(row.taxTreatment)}</strong>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="review-item">
                          <Typography.Text type="secondary">No pricing components configured.</Typography.Text>
                        </div>
                      )}
                      <div className="review-total-card">
                        <div className="review-total-breakdown">
                          <div className="price-summary-row">
                            <Typography.Text type="secondary">Recurring</Typography.Text>
                            <Typography.Text strong>
                              {formatPriceAmount(reviewRecurringTotal)}
                            </Typography.Text>
                          </div>
                          <div className="price-summary-row">
                            <Typography.Text type="secondary">One-time</Typography.Text>
                            <Typography.Text strong>
                              {formatPriceAmount(reviewOneTimeTotal)}
                            </Typography.Text>
                          </div>
                        </div>
                        <div className="review-total-main">
                          <Typography.Text type="secondary">Total price</Typography.Text>
                          <Typography.Title level={3} className="review-total-value">
                            {formatPriceAmount(reviewGrandTotal)}
                          </Typography.Title>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="review-section">
                    <Typography.Title level={5}>Entitlement</Typography.Title>
                    {reviewEntitlements.length ? (
                      <div className="review-entitlement-list">
                        {reviewEntitlements.map((row) => (
                          <div key={row.key} className="review-item">
                            <Typography.Text type="secondary">{row.category}</Typography.Text>
                            <Typography.Text strong>{row.name}</Typography.Text>
                            {row.serviceRows.length ? (
                              <div className="review-service-list">
                                {row.serviceRows.map((service) => (
                                  <div key={service.serviceType} className="review-service-row">
                                    <Typography.Text strong>{service.title}</Typography.Text>
                                    <Typography.Text type="secondary">Allowance: {service.allowance}</Typography.Text>
                                    <Typography.Text type="secondary">
                                      {service.thresholdLabel}: {service.threshold}
                                    </Typography.Text>
                                    <Typography.Text type="secondary">
                                      {service.followOnLabel}: {service.followOn}
                                    </Typography.Text>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <Typography.Text type="secondary">No entitlement services</Typography.Text>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Typography.Text type="secondary">No entitlement configuration available.</Typography.Text>
                    )}
                  </section>

                  <section className="review-section">
                    <Typography.Title level={5}>Eligibility</Typography.Title>
                    <div className="review-item">
                      {reviewEligibilityDetails.map((item) => (
                        <div key={`${item.label}-${item.value}`} className="review-eligibility-block">
                          <Typography.Text type="secondary">{item.label}</Typography.Text>
                          <Typography.Text strong>{item.value}</Typography.Text>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="review-section">
                    <Typography.Title level={5}>Display</Typography.Title>
                    <div className="review-grid">
                      <div className="review-item">
                        <Typography.Text type="secondary">Display name</Typography.Text>
                        <Typography.Text strong>{reviewValue(review.displayName)}</Typography.Text>
                      </div>
                      <div className="review-item">
                        <Typography.Text type="secondary">Listing label</Typography.Text>
                        <Typography.Text strong>
                          {review.listingLabelEnabled
                            ? reviewValue(review.listingLabel, 'Enabled (no label selected)')
                            : 'Off'}
                        </Typography.Text>
                      </div>
                      <div className="review-item span-two">
                        <Typography.Text type="secondary">Short description</Typography.Text>
                        <Typography.Text strong>{reviewValue(review.subtitle, 'Not set')}</Typography.Text>
                      </div>
                      <div className="review-item span-two">
                        <Typography.Text type="secondary">Description</Typography.Text>
                        <Typography.Text strong>{reviewValue(review.description, 'Not set')}</Typography.Text>
                      </div>
                      <div className="review-item span-two">
                        <Typography.Text type="secondary">Features</Typography.Text>
                        {reviewFeatures.length ? (
                          <div className="review-feature-chips">
                            {reviewFeatures.map((feature) => (
                              <span key={feature} className="review-feature-chip">{feature}</span>
                            ))}
                          </div>
                        ) : (
                          <Typography.Text strong>No features added</Typography.Text>
                        )}
                      </div>
                      <div className="review-item span-two">
                        <Typography.Text type="secondary">Product gallery</Typography.Text>
                        {reviewGalleryCount ? (
                          <>
                            <Typography.Text strong>
                              {reviewGalleryCount} image{reviewGalleryCount === 1 ? '' : 's'}
                            </Typography.Text>
                            <div className="review-gallery-thumbs">
                              {review.galleryImages.map((image, index) => (
                                <div key={image.uid} className="review-gallery-thumb">
                                  <img src={image.url} alt={image.name || `Gallery image ${index + 1}`} />
                                  {index === 0 ? <span className="review-gallery-primary">Primary</span> : null}
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <Typography.Text strong>No images uploaded</Typography.Text>
                        )}
                      </div>
                      <div className="review-item">
                        <Typography.Text type="secondary">Product details URL</Typography.Text>
                        <Typography.Text strong className="review-url">
                          {reviewValue(review.productDetailsUrl)}
                        </Typography.Text>
                      </div>
                      <div className="review-item">
                        <Typography.Text type="secondary">Terms and conditions URL</Typography.Text>
                        <Typography.Text strong className="review-url">
                          {reviewValue(review.termsAndConditionsUrl)}
                        </Typography.Text>
                      </div>
                      <div className="review-item span-two">
                        <Typography.Text type="secondary">Banner image URL</Typography.Text>
                        <Typography.Text strong className="review-url">
                          {reviewValue(review.bannerImageUrl)}
                        </Typography.Text>
                      </div>
                    </div>
                  </section>
                </div>
                <Divider />
                <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  Saving creates a draft. Publishing remains a separate governed action.
                </Typography.Paragraph>
              </Card>
            )}

          </div>

          <div className="listing-rails">
            <Card className="listing-progress-panel" title="Progress" size="small">
              <Steps current={step} orientation="vertical" items={stepItems.map(({ title }) => ({ title }))} />
            </Card>
            {step === 1 ? (
              <Card className="listing-price-summary-panel" title="Total price summary" size="small">
                {priceSummary.length ? (
                  <div className="price-summary-list">
                    {priceSummary.map((row) => (
                      <div key={row.key} className="price-summary-row">
                        <div className="price-summary-copy">
                          <Typography.Text>{row.label}</Typography.Text>
                          <Typography.Text type="secondary" className="price-summary-meta">
                            {row.pricingType ?? 'Not set'}
                            {row.pricingType === 'ONE TIME'
                              ? ' · One time'
                              : row.frequency
                                ? ` · ${row.frequency}`
                                : ''}
                          </Typography.Text>
                        </div>
                        <Typography.Text strong>
                          {row.amount != null ? formatPriceAmount(Number(row.amount)) : '—'}
                        </Typography.Text>
                      </div>
                    ))}
                    <Divider className="price-summary-divider" />
                    {hasPriceSummaryAmounts ? (
                      <div className="price-summary-totals">
                        {recurringTotal > 0 ? (
                          <div className="price-summary-row is-total">
                            <Typography.Text strong>Recurring total</Typography.Text>
                            <Typography.Text strong>{formatPriceAmount(recurringTotal)}</Typography.Text>
                          </div>
                        ) : null}
                        {oneTimeTotal > 0 ? (
                          <div className="price-summary-row is-total">
                            <Typography.Text strong>One-time total</Typography.Text>
                            <Typography.Text strong>{formatPriceAmount(oneTimeTotal)}</Typography.Text>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <Typography.Text type="secondary">Enter pricing amounts to see totals.</Typography.Text>
                    )}
                  </div>
                ) : (
                  <Typography.Text type="secondary">No pricing components yet.</Typography.Text>
                )}
              </Card>
            ) : null}
            {step === 0 ? (
              <Card className="listing-sections-panel" title="Listing sections" size="small">
                {[
                  ['listing-section-basics', 'Offer Details'],
                  ['listing-section-policies', 'Policies'],
                ].map(([id, label]) => (
                  <Button
                    className="listing-section-link"
                    key={id}
                    type="text"
                    onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    {label}
                  </Button>
                ))}
              </Card>
            ) : null}
          </div>
        </div>
      </Form>
    </div>
  )
}
