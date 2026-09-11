import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeftOutlined,
  BarsOutlined,
  DeleteOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import {
  Anchor,
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
type PaymentPolicy = 'Charge in Billing Account' | 'Charge Upfront from Wallet'
type ChargingPolicy = 'Real-Time Policy' | 'Advance Policy' | 'Arrears Policy'
type BillingPolicyOption = 'Bill Cycle Policy'
type ProrationPolicy = 'Daily Proration Policy'
type PricingType = 'Reccuring' | 'Fee'
type FeeDefinition = 'Activation Fee' | 'Compliance Fee' | 'Regulatory Fee'
type PricingBasis = 'Flat' | 'Per Tier'
type PricingUnit = 'Per Line' | 'Per Account'
type PricingFrequency = 'Monthly' | 'Annually'
type TaxTreatment = 'Taxable' | 'Exempt' | 'Zero-related'

type LinePrice = {
  line: number
  price?: number
}
type PolicyInheritOption = 'Inherit from Offer'
type PaymentPolicyOverride = PolicyInheritOption | PaymentPolicy
type ChargingPolicyOverride = PolicyInheritOption | ChargingPolicy
type BillingPolicyOverride = PolicyInheritOption | BillingPolicyOption
type ProrationPolicyOverride = PolicyInheritOption | ProrationPolicy
type TierDimension = 'Line Count'

type PriceTier = {
  minQty?: number
  maxQty?: number
  amount?: number
}

type ServiceSplitType = 'Data' | 'Voice' | 'SMS'
type EntitlementServiceType = 'Data' | 'Voice' | 'SMS'
type AllocationMode = 'Line' | 'Per Line' | 'Shared Pool'
type EntitlementResetFrequency = 'Daily' | 'Monthly' | 'Bill Cycle' | 'None'
type EntitlementExpiry = 'Expire' | 'Carry Over' | 'Replace'
type NetworkProfile = '1 GB → 256 kbps'
type RevenueSplitMode = 'Equally' | 'By Percentage' | 'By Amount'

type ServiceEntitlement = {
  allocationMode?: AllocationMode
  resetFrequency?: EntitlementResetFrequency
  rolloverAllowed?: boolean
  rolloverLimit?: string
  expiry?: EntitlementExpiry
  networkProfile?: NetworkProfile
}

type ServicePricingSplit = {
  serviceType: ServiceSplitType
  amount?: number
  percentage?: number
  glCode?: string
  taxId?: string
  amountManuallySet?: boolean
}

type PriceComponent = {
  pricingType: PricingType
  feeDefinition?: FeeDefinition
  glCode: string
  taxTreatment: TaxTreatment
  pricingBasis: PricingBasis
  pricingUnit?: PricingUnit
  frequency?: PricingFrequency
  additionalLinePrice?: number
  additionalLineGlCode?: string
  additionalLineTaxId?: string
  linePrices?: LinePrice[]
  taxId: string
  allowServiceLevelRevenueAllocation?: boolean
  revenueSplitMode?: RevenueSplitMode
  servicePricingSplits?: ServicePricingSplit[]
  paymentPolicy: PaymentPolicyOverride
  chargingPolicy: ChargingPolicyOverride
  billingPolicy: BillingPolicyOverride
  prorationPolicy: ProrationPolicyOverride
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
  productKey: string
  paymentModel: PaymentModel
  paymentPolicy: PaymentPolicy
  chargingPolicy: ChargingPolicy
  billingPolicy: BillingPolicyOption
  prorationPolicy: ProrationPolicy
  priceComponents: PriceComponent[]
  entitlements: Record<EntitlementServiceType, ServiceEntitlement>
  displayName: string
  subtitle?: string
  description?: string
  channels: string[]
  country: string
  customerAccess: 'All eligible customers' | 'New customers' | 'Existing customers'
}

const stepItems = [
  { title: 'Offer Details', description: 'Offer and payment' },
  { title: 'Pricing', description: 'Pricing components' },
  { title: 'Entitlement', description: 'Service allowances' },
  { title: 'Display', description: 'Customer-facing content' },
  { title: 'Eligibility', description: 'Market availability' },
  { title: 'Review', description: 'Confirm and save' },
]

const OFFER_SUBTYPE_OPTIONS: Partial<Record<OfferType, OfferSubType[]>> = {
  BASE_PLAN: ['FIXED_DATA_TIER', 'UNLIMITED_TIER', 'ASSET_ANCHORED'],
}

const OFFER_TYPE_OPTIONS: Array<{ value: OfferType; label: string }> = [
  { value: 'BASE_PLAN', label: 'Base plan' },
  { value: 'ADD_ON', label: 'Add-on' },
  { value: 'MIXED_BUNDLE', label: 'Mixed Bundle' },
]

function offerSubtypesForType(offerType?: OfferType): OfferSubType[] {
  if (!offerType) return []
  return OFFER_SUBTYPE_OPTIONS[offerType] ?? []
}

function offerTypeTitle(offerType?: OfferType): string {
  const option = OFFER_TYPE_OPTIONS.find((item) => item.value === offerType)
  return option?.label ?? 'Base plan'
}

function offerCodeFromTitle(title: string): string {
  return title.trim().toUpperCase().replace(/\s+/g, '_')
}

function OfferTypePicker({
  value,
  onChange,
}: {
  value?: OfferType
  onChange?: (value: OfferType) => void
}) {
  const form = Form.useFormInstance<ListingFormValues>()

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

  return (
    <Select
      value={value}
      placeholder="Select an offer type"
      options={OFFER_TYPE_OPTIONS}
      onChange={handleSelect}
    />
  )
}

const PAYMENT_POLICY_OPTIONS: Record<PaymentModel, PaymentPolicy[]> = {
  Postpaid: ['Charge in Billing Account'],
  Prepaid: ['Charge Upfront from Wallet'],
}

const PRICING_TYPE_OPTIONS: PricingType[] = ['Reccuring', 'Fee']
const FEE_DEFINITION_OPTIONS: FeeDefinition[] = ['Activation Fee', 'Compliance Fee', 'Regulatory Fee']
const TAX_TREATMENT_OPTIONS: TaxTreatment[] = ['Taxable', 'Exempt', 'Zero-related']
const PRICING_BASIS_OPTIONS: PricingBasis[] = ['Flat', 'Per Tier']
const PRICING_UNIT_OPTIONS: PricingUnit[] = ['Per Line', 'Per Account']
const FREQUENCY_OPTIONS: PricingFrequency[] = ['Monthly', 'Annually']
const ENTITLEMENT_SERVICE_TYPES: EntitlementServiceType[] = ['Data', 'Voice', 'SMS']
const ALLOCATION_MODE_OPTIONS: AllocationMode[] = ['Line', 'Per Line', 'Shared Pool']
const ENTITLEMENT_RESET_FREQUENCY_OPTIONS: EntitlementResetFrequency[] = ['Daily', 'Monthly', 'Bill Cycle', 'None']
const ENTITLEMENT_EXPIRY_OPTIONS: EntitlementExpiry[] = ['Expire', 'Carry Over', 'Replace']
const NETWORK_PROFILE_OPTIONS: NetworkProfile[] = ['1 GB → 256 kbps']

function defaultServiceEntitlement(): ServiceEntitlement {
  return {
    rolloverAllowed: false,
  }
}

function defaultEntitlements(): Record<EntitlementServiceType, ServiceEntitlement> {
  return {
    Data: defaultServiceEntitlement(),
    Voice: defaultServiceEntitlement(),
    SMS: defaultServiceEntitlement(),
  }
}

function linePriceForRow(line: number, mainPrice?: number, additionalLinePrice?: number): number | undefined {
  if (mainPrice == null) return undefined
  if (line === 1) return Math.round(mainPrice * 100) / 100
  if (additionalLinePrice == null) return undefined
  return Math.round((mainPrice + additionalLinePrice * (line - 1)) * 100) / 100
}

function buildLinePrices(
  maxLines: number,
  mainPrice?: number,
  additionalLinePrice?: number,
): LinePrice[] {
  const lineCount = Math.max(1, maxLines || 1)
  return Array.from({ length: lineCount }, (_, index) => {
    const line = index + 1
    return {
      line,
      price: linePriceForRow(line, mainPrice, additionalLinePrice),
    }
  })
}

function recalculateLinePrices(
  rows: LinePrice[],
  mainPrice?: number,
  additionalLinePrice?: number,
): LinePrice[] {
  return rows.map((row, index) => {
    const line = row.line ?? index + 1
    return {
      line,
      price: linePriceForRow(line, mainPrice, additionalLinePrice),
    }
  })
}
const PAYMENT_POLICY_OVERRIDE_OPTIONS: PaymentPolicyOverride[] = [
  'Inherit from Offer',
  'Charge in Billing Account',
  'Charge Upfront from Wallet',
]
const CHARGING_POLICY_OVERRIDE_OPTIONS: ChargingPolicyOverride[] = [
  'Inherit from Offer',
  'Real-Time Policy',
  'Advance Policy',
  'Arrears Policy',
]
const BILLING_POLICY_OVERRIDE_OPTIONS: BillingPolicyOverride[] = ['Inherit from Offer', 'Bill Cycle Policy']
const PRORATION_POLICY_OVERRIDE_OPTIONS: ProrationPolicyOverride[] = ['Inherit from Offer', 'Daily Proration Policy']
const TIER_DIMENSION_OPTIONS: TierDimension[] = ['Line Count']
const SERVICE_SPLIT_SERVICE_TYPES: ServiceSplitType[] = ['Data', 'Voice', 'SMS']
const REVENUE_SPLIT_OPTIONS: RevenueSplitMode[] = ['Equally', 'By Percentage', 'By Amount']
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
  }
}

function defaultPriceTier(): PriceTier {
  return {}
}

function defaultPriceComponent(): PriceComponent {
  return {
    pricingType: 'Reccuring',
    glCode: '',
    taxTreatment: 'Taxable',
    pricingBasis: 'Flat',
    pricingUnit: 'Per Line',
    frequency: 'Monthly',
    taxId: '',
    allowServiceLevelRevenueAllocation: false,
    revenueSplitMode: 'Equally',
    servicePricingSplits: SERVICE_SPLIT_SERVICE_TYPES.map((serviceType) => defaultServicePricingSplit(serviceType)),
    paymentPolicy: 'Inherit from Offer',
    chargingPolicy: 'Inherit from Offer',
    billingPolicy: 'Inherit from Offer',
    prorationPolicy: 'Inherit from Offer',
    tierDimension: 'Line Count',
    tiers: [defaultPriceTier()],
  }
}

function defaultAdditionalPriceComponent(): PriceComponent {
  return {
    ...defaultPriceComponent(),
    pricingType: 'Fee',
  }
}

function priceComponentTitle(
  pricingType?: PricingType,
  feeDefinition?: FeeDefinition,
): string {
  if (pricingType === 'Fee') return feeDefinition ?? 'Fee'
  return pricingType ?? 'Pricing component'
}

function primaryPriceAmount(components: PriceComponent[] | undefined): number | undefined {
  const first = components?.[0]
  if (!first) return undefined
  if (first.pricingBasis === 'Per Tier') return first.tiers?.[0]?.amount
  return first.amount
}

function PriceComponentFields({
  field,
  productName,
  offerType,
  maxLines,
  canRemove,
  onRemove,
}: {
  field: { name: number; key: number }
  productName?: string
  offerType: OfferType
  maxLines: number
  canRemove: boolean
  onRemove: () => void
}) {
  const { message } = App.useApp()
  const [revenueAllocationActive, setRevenueAllocationActive] = useState<string[]>([])
  const [additionalLinesActive, setAdditionalLinesActive] = useState<string[]>([])
  const form = Form.useFormInstance<ListingFormValues>()
  const pricingType = Form.useWatch(['priceComponents', field.name, 'pricingType'], form)
  const feeDefinition = Form.useWatch(['priceComponents', field.name, 'feeDefinition'], form)
  const pricingBasis = Form.useWatch(['priceComponents', field.name, 'pricingBasis'], form) ?? 'Flat'
  const isFlatPricing = pricingBasis === 'Flat'
  const pricingUnit = Form.useWatch(['priceComponents', field.name, 'pricingUnit'], form)
  const offerTypeLabel = offerTypeTitle(offerType)
  const showAdditionalLines = isFlatPricing
    && pricingType === 'Reccuring'
    && offerType === 'BASE_PLAN'
    && pricingUnit === 'Per Line'
  const additionalLinePrice = Form.useWatch(['priceComponents', field.name, 'additionalLinePrice'], form)
  const hasAdditionalLinePrice = additionalLinePrice != null
  const linePrices = Form.useWatch(['priceComponents', field.name, 'linePrices'], form) as LinePrice[] | undefined
  const productKey = Form.useWatch('productKey', form)
  const displayName = Form.useWatch('displayName', form)
  const effectiveProductName = productName ?? resolveCatalogItemName(productKey) ?? displayName
  const componentTitle = priceComponentTitle(pricingType, feeDefinition)
  const primaryComponentName = effectiveProductName?.trim()
  const flatAmount = Form.useWatch(['priceComponents', field.name, 'amount'], form)
  const firstTierAmount = Form.useWatch(['priceComponents', field.name, 'tiers', 0, 'amount'], form)
  const mainPricingAmount = isFlatPricing ? flatAmount : firstTierAmount
  const allowServiceLevelRevenueAllocation = Form.useWatch(
    ['priceComponents', field.name, 'allowServiceLevelRevenueAllocation'],
    form,
  )
  const revenueSplitMode = Form.useWatch(['priceComponents', field.name, 'revenueSplitMode'], form) ?? 'Equally'
  const revenueAllocationExpanded = allowServiceLevelRevenueAllocation
    && revenueAllocationActive.includes('revenue-allocation')
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
    if (!revenueAllocationExpanded || mainPricingAmount == null) return
    syncRevenueAllocationSplits()
  }, [revenueAllocationExpanded, mainPricingAmount, revenueSplitMode, field.name, form])

  useEffect(() => {
    if (!showAdditionalLines) {
      setAdditionalLinesActive([])
    }
  }, [showAdditionalLines])

  useEffect(() => {
    if (!showAdditionalLines) return
    const targetLines = Math.max(1, maxLines)
    const existing = (form.getFieldValue(['priceComponents', field.name, 'linePrices']) ?? []) as LinePrice[]
    const mainPrice = flatAmount != null ? Number(flatAmount) : undefined
    const addPerLine = additionalLinePrice != null ? Number(additionalLinePrice) : undefined
    if (existing.length < targetLines) {
      const padded = [...existing]
      for (let line = existing.length + 1; line <= targetLines; line += 1) {
        padded.push({ line, price: linePriceForRow(line, mainPrice, addPerLine) })
      }
      form.setFieldValue(['priceComponents', field.name, 'linePrices'], padded)
      return
    }
    if (existing.length === 0) {
      form.setFieldValue(
        ['priceComponents', field.name, 'linePrices'],
        buildLinePrices(targetLines, mainPrice, addPerLine),
      )
    }
  }, [showAdditionalLines, maxLines, field.name, form, flatAmount, additionalLinePrice])

  useEffect(() => {
    if (!showAdditionalLines) return
    const existing = (form.getFieldValue(['priceComponents', field.name, 'linePrices']) ?? []) as LinePrice[]
    if (!existing.length) return
    const mainPrice = flatAmount != null ? Number(flatAmount) : undefined
    const addPerLine = additionalLinePrice != null ? Number(additionalLinePrice) : undefined
    form.setFieldValue(
      ['priceComponents', field.name, 'linePrices'],
      recalculateLinePrices(existing, mainPrice, addPerLine),
    )
  }, [showAdditionalLines, flatAmount, additionalLinePrice, field.name, form, linePrices?.length])

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
    <Card
      type="inner"
      title={field.name === 0 ? (
        <Flex align="center" gap={8} wrap="wrap">
          {primaryComponentName ? <span>{primaryComponentName}</span> : null}
          <Tag color="blue">{offerTypeLabel}</Tag>
        </Flex>
      ) : componentTitle}
      extra={canRemove ? (
        <Button type="text" icon={<DeleteOutlined />} onClick={onRemove}>
          Remove
        </Button>
      ) : null}
    >
      <div className="form-grid">
        <Form.Item name={[field.name, 'pricingBasis']} hidden initialValue="Flat">
          <Input />
        </Form.Item>
        <div className="span-two pricing-charge-row">
          <Form.Item
            name={[field.name, 'pricingType']}
            label="Charge Type"
            rules={[{ required: true, message: 'Select a charge type' }]}
          >
            <Select
              options={PRICING_TYPE_OPTIONS.map((value) => ({ value }))}
              onChange={(value: PricingType) => {
                if (value !== 'Fee') {
                  form.setFieldValue(['priceComponents', field.name, 'feeDefinition'], undefined)
                }
                if (value !== 'Reccuring') {
                  form.setFieldValue(['priceComponents', field.name, 'allowServiceLevelRevenueAllocation'], false)
                  setRevenueAllocationActive([])
                }
              }}
            />
          </Form.Item>
          {isFlatPricing ? (
            <>
              <Form.Item
                name={[field.name, 'amount']}
                label="Price"
                rules={[{ required: true, message: 'Enter a price' }]}
              >
                <InputNumber min={0} precision={2} prefix="$" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                name={[field.name, 'pricingUnit']}
                label="Pricing Unit"
                rules={[{ required: true, message: 'Select a pricing unit' }]}
              >
                <Select options={PRICING_UNIT_OPTIONS.map((value) => ({ value }))} />
              </Form.Item>
              {pricingType === 'Fee' ? (
                <Form.Item
                  name={[field.name, 'feeDefinition']}
                  label="Fee Definition"
                  rules={[{ required: true, message: 'Select a fee definition' }]}
                >
                  <Select options={FEE_DEFINITION_OPTIONS.map((value) => ({ value }))} />
                </Form.Item>
              ) : (
                <Form.Item
                  name={[field.name, 'frequency']}
                  label="Frequency"
                  initialValue="Monthly"
                  rules={[{ required: true, message: 'Select a frequency' }]}
                >
                  <Select options={FREQUENCY_OPTIONS.map((value) => ({ value }))} />
                </Form.Item>
              )}
            </>
          ) : null}
        </div>
        <div className="span-two form-grid three">
          <Form.Item
            name={[field.name, 'glCode']}
            label="GL Code"
            rules={[{ required: true, message: 'Enter a GL code' }]}
          >
            <Input placeholder="e.g. 4100-100" />
          </Form.Item>
          <Form.Item
            name={[field.name, 'taxTreatment']}
            label="Tax Treatment"
            rules={[{ required: true, message: 'Select a tax treatment' }]}
          >
            <Select options={TAX_TREATMENT_OPTIONS.map((value) => ({ value }))} />
          </Form.Item>
          <Form.Item
            name={[field.name, 'taxId']}
            label="Tax ID"
            rules={[{ required: true, message: 'Enter a tax ID' }]}
          >
            <Input
              placeholder="e.g. 13/622"
              readOnly={!!allowServiceLevelRevenueAllocation}
            />
          </Form.Item>
        </div>
        {pricingType === 'Reccuring' ? (
          <div className="span-two revenue-allocation-panel">
            <Flex align="center" gap={8} className="revenue-allocation-toggle">
              <Typography.Text>Allow service level splitting</Typography.Text>
              <Form.Item
                name={[field.name, 'allowServiceLevelRevenueAllocation']}
                valuePropName="checked"
                noStyle
              >
                <Switch
                  onChange={(checked) => {
                    if (checked) {
                      setRevenueAllocationActive(['revenue-allocation'])
                      syncRevenueAllocationSplits()
                    } else {
                      setRevenueAllocationActive([])
                    }
                  }}
                />
              </Form.Item>
            </Flex>
            <Collapse
              activeKey={allowServiceLevelRevenueAllocation ? revenueAllocationActive : []}
              collapsible={allowServiceLevelRevenueAllocation ? undefined : 'disabled'}
              onChange={(keys) => {
                if (!allowServiceLevelRevenueAllocation) return
                const nextKeys = Array.isArray(keys) ? keys : [keys]
                const isOpening = nextKeys.includes('revenue-allocation') && !revenueAllocationExpanded
                setRevenueAllocationActive(nextKeys)
                if (isOpening) syncRevenueAllocationSplits()
              }}
              items={[{
                key: 'revenue-allocation',
                label: 'Revenue allocation at service level',
                children: (
                  <>
                    <Form.Item
                      name={[field.name, 'revenueSplitMode']}
                      label="Split"
                      className="revenue-split-mode-field"
                      rules={revenueAllocationExpanded ? [{ required: true, message: 'Select a split method' }] : []}
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
                              <Typography.Text>{row.serviceType}</Typography.Text>
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
                                rules={revenueAllocationExpanded ? [{ required: true, message: 'Enter a percentage' }] : []}
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
                              rules={revenueAllocationExpanded ? [{ required: true, message: 'Enter an amount' }] : []}
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
                              rules={revenueAllocationExpanded ? [{ required: true, message: 'Enter a GL code' }] : []}
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
                              rules={revenueAllocationExpanded ? [{ required: true, message: 'Enter a tax ID' }] : []}
                              style={{ marginBottom: 0 }}
                            >
                              <Input placeholder="e.g. 13/622" />
                            </Form.Item>
                          ),
                        },
                      ]}
                    />
                  </>
                ),
              }]}
            />
          </div>
        ) : null}
        {showAdditionalLines ? (
          <div className="span-two additional-lines-panel">
            <Collapse
              activeKey={additionalLinesActive}
              onChange={(keys) => {
                setAdditionalLinesActive(Array.isArray(keys) ? keys : [keys])
              }}
              items={[{
                key: 'additional-lines',
                label: 'Additional Lines',
                children: (
                  <>
                    <div className="additional-lines-fields form-grid three">
                      <Form.Item
                        name={[field.name, 'additionalLinePrice']}
                        label="Additional Line Price"
                      >
                        <InputNumber min={0} precision={2} prefix="$" style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, 'additionalLineGlCode']}
                        label="GL Code"
                      >
                        <Input placeholder="e.g. 4100-100" />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, 'additionalLineTaxId']}
                        label="Tax ID"
                      >
                        <Input placeholder="e.g. 13/622" />
                      </Form.Item>
                    </div>
                    {hasAdditionalLinePrice ? (
                      <Form.List name={[field.name, 'linePrices']}>
                        {(lineFields, { add, remove }) => (
                          <>
                            <Table
                              className="line-tier-table price-by-lines-table"
                              size="small"
                              pagination={false}
                              rowKey="key"
                              dataSource={lineFields}
                              columns={[
                                {
                                  title: 'Line',
                                  width: 120,
                                  render: (_, lineField) => (
                                    <>
                                      <Form.Item
                                        name={[lineField.name, 'line']}
                                        initialValue={lineField.name + 1}
                                        hidden
                                      >
                                        <Input />
                                      </Form.Item>
                                      <Typography.Text>
                                        Line {lineField.name + 1}
                                      </Typography.Text>
                                    </>
                                  ),
                                },
                                {
                                  title: 'Price',
                                  render: (_, lineField) => (
                                    <Form.Item
                                      name={[lineField.name, 'price']}
                                      rules={[{
                                        required: lineField.name === 0 || hasAdditionalLinePrice,
                                        message: 'Enter a price',
                                      }]}
                                      style={{ marginBottom: 0 }}
                                    >
                                      <InputNumber min={0} precision={2} prefix="$" style={{ width: '100%' }} readOnly />
                                    </Form.Item>
                                  ),
                                },
                                {
                                  title: '',
                                  width: 56,
                                  align: 'center',
                                  render: (_, lineField) => (
                                    lineField.name > 0 ? (
                                      <Button
                                        type="text"
                                        danger
                                        aria-label="Remove line"
                                        icon={<DeleteOutlined />}
                                        onClick={() => remove(lineField.name)}
                                      />
                                    ) : null
                                  ),
                                },
                              ]}
                            />
                            <Button
                              type="dashed"
                              icon={<PlusOutlined />}
                              onClick={() => {
                                const mainPrice = flatAmount != null ? Number(flatAmount) : undefined
                                const addPerLine = additionalLinePrice != null ? Number(additionalLinePrice) : undefined
                                const nextLine = lineFields.length + 1
                                add({
                                  line: nextLine,
                                  price: linePriceForRow(nextLine, mainPrice, addPerLine),
                                })
                              }}
                            >
                              Add row
                            </Button>
                          </>
                        )}
                      </Form.List>
                    ) : null}
                  </>
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
      <Divider plain>Policy Override</Divider>
      <div className="policy-override-grid">
        <Form.Item
          name={[field.name, 'paymentPolicy']}
          label="Payment Policy"
          rules={[{ required: true, message: 'Select a payment policy' }]}
        >
          <Select options={PAYMENT_POLICY_OVERRIDE_OPTIONS.map((value) => ({ value }))} />
        </Form.Item>
        <Form.Item
          name={[field.name, 'chargingPolicy']}
          label="Charging Policy"
          rules={[{ required: true, message: 'Select a charging policy' }]}
        >
          <Select options={CHARGING_POLICY_OVERRIDE_OPTIONS.map((value) => ({ value }))} />
        </Form.Item>
        <Form.Item
          name={[field.name, 'billingPolicy']}
          label="Billing Policy"
          rules={[{ required: true, message: 'Select a billing policy' }]}
        >
          <Select options={BILLING_POLICY_OVERRIDE_OPTIONS.map((value) => ({ value }))} />
        </Form.Item>
        <Form.Item
          name={[field.name, 'prorationPolicy']}
          label="Proration Policy"
          rules={[{ required: true, message: 'Select a proration policy' }]}
        >
          <Select options={PRORATION_POLICY_OVERRIDE_OPTIONS.map((value) => ({ value }))} />
        </Form.Item>
      </div>
    </Card>
  )
}

function EntitlementServiceFields({ serviceType }: { serviceType: EntitlementServiceType }) {
  return (
    <div className="entitlement-service-fields form-grid">
      <Form.Item
        name={['entitlements', serviceType, 'allocationMode']}
        label="Allocation Mode"
        rules={[{ required: true, message: 'Select an allocation mode' }]}
      >
        <Select options={ALLOCATION_MODE_OPTIONS.map((value) => ({ value }))} placeholder="Select" />
      </Form.Item>
      <Form.Item
        name={['entitlements', serviceType, 'resetFrequency']}
        label="Reset Frequency"
        rules={[{ required: true, message: 'Select a reset frequency' }]}
      >
        <Select options={ENTITLEMENT_RESET_FREQUENCY_OPTIONS.map((value) => ({ value }))} placeholder="Select" />
      </Form.Item>
      <Form.Item
        name={['entitlements', serviceType, 'rolloverAllowed']}
        label="Rollover allowed"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
      <Form.Item
        name={['entitlements', serviceType, 'rolloverLimit']}
        label="Rollover Limit"
      >
        <Input placeholder="e.g. 5 GB" />
      </Form.Item>
      <Form.Item
        name={['entitlements', serviceType, 'expiry']}
        label="Expiry"
        rules={[{ required: true, message: 'Select an expiry option' }]}
      >
        <Select options={ENTITLEMENT_EXPIRY_OPTIONS.map((value) => ({ value }))} placeholder="Select" />
      </Form.Item>
      <Form.Item
        name={['entitlements', serviceType, 'networkProfile']}
        label="Network Profile"
        rules={[{ required: true, message: 'Select a network profile' }]}
      >
        <Select options={NETWORK_PROFILE_OPTIONS.map((value) => ({ value }))} placeholder="Select" />
      </Form.Item>
    </div>
  )
}

type PickerCatalogItem = {
  key: string
  name: string
  kind: 'product' | 'bundle'
  classification: 'Telco' | 'Merchandise' | 'Telco + Merchandise'
  category: string
  basePrice?: number
  archetype?: 'Base plan' | 'Add-on'
}

// The same CCI catalog examples used by the main app. Keeping these real
// examples in the handoff makes the picker and the downstream form demonstrable.
const pickerCatalog: PickerCatalogItem[] = [
  { key: 'cci-connect', name: 'Connect', kind: 'product', classification: 'Telco', category: 'Value plans', basePrice: 14.95, archetype: 'Base plan' },
  { key: 'cci-connect-plus', name: 'Connect+', kind: 'product', classification: 'Telco', category: 'Value plans', basePrice: 19.95, archetype: 'Base plan' },
  { key: 'cci-minimalist', name: 'Minimalist', kind: 'product', classification: 'Telco', category: 'Value plans', basePrice: 20, archetype: 'Base plan' },
  { key: 'cci-sometimes-on', name: 'Sometimes-on', kind: 'product', classification: 'Telco', category: 'Value plans', basePrice: 25, archetype: 'Base plan' },
  { key: 'cci-scroller', name: 'Scroller', kind: 'product', classification: 'Telco', category: 'Value plans', basePrice: 35, archetype: 'Base plan' },
  { key: 'cci-streamer', name: 'Streamer', kind: 'product', classification: 'Telco', category: 'Value plans', basePrice: 45, archetype: 'Base plan' },
  { key: 'cci-unlimited-50', name: 'Unlimited 50+', kind: 'product', classification: 'Telco', category: 'Senior plans', basePrice: 35, archetype: 'Base plan' },
  { key: 'cci-unlimited-18-49', name: 'Unlimited 18-49', kind: 'product', classification: 'Telco', category: 'Mobile plans', basePrice: 60, archetype: 'Base plan' },
  { key: 'cci-unlimited-aarp', name: 'Unlimited for AARP (2+ lines)', kind: 'product', classification: 'Telco', category: 'Senior plans', basePrice: 55, archetype: 'Base plan' },
  { key: 'cci-pers-iris-ally', name: 'PERS — Iris Ally', kind: 'product', classification: 'Telco', category: 'Senior plans', basePrice: 25, archetype: 'Base plan' },
  { key: 'cci-byod-ipad', name: 'BYOD — iPad', kind: 'product', classification: 'Telco', category: 'Devices', basePrice: 15, archetype: 'Add-on' },
  { key: 'cci-home-protection', name: 'Home Internet Protection', kind: 'product', classification: 'Telco', category: 'Protection', basePrice: 8, archetype: 'Add-on' },
  { key: 'cci-roadside', name: 'Roadside Assistance', kind: 'product', classification: 'Telco', category: 'Protection', basePrice: 5, archetype: 'Add-on' },
  { key: 'cci-iris-device', name: 'Iris Ally PERS Device', kind: 'product', classification: 'Merchandise', category: 'Devices', basePrice: 99 },
  { key: 'cci-bundle-unlimited-iris', name: 'Unlimited 50+ with Iris Ally', kind: 'bundle', classification: 'Telco + Merchandise', category: 'Senior plans' },
  { key: 'cci-bundle-scroller-roaming', name: 'Scroller + Roaming', kind: 'bundle', classification: 'Telco', category: 'Roaming' },
]

function resolveCatalogItemName(productKey?: string): string | undefined {
  if (!productKey) return undefined
  const pickerItem = pickerCatalog.find((item) => item.key === productKey)
  const product = initialProducts.find((item) => item.key === productKey)
  const catalogProduct = initialCatalogRows.find((item) => item.key === productKey)
  return pickerItem?.name ?? product?.name ?? catalogProduct?.name
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
  const [pickedProductKey, setPickedProductKey] = useState<string>()
  const [pickerMode, setPickerMode] = useState<'any' | 'Telco' | 'Merchandise' | 'bundles'>('any')
  const [pickerSearch, setPickerSearch] = useState('')
  const [step, setStep] = useState(0)
  const [selectedCatalogItemName, setSelectedCatalogItemName] = useState<string>()
  const [offerMaxLines, setOfferMaxLines] = useState(3)
  const [selectedOfferType, setSelectedOfferType] = useState<OfferType>('BASE_PLAN')
  const [form] = Form.useForm<ListingFormValues>()

  const selectedProductKey = Form.useWatch('productKey', form)
  const watchedMaxLines = Form.useWatch('maxLines', form)
  const watchedOfferType = Form.useWatch('offerType', form)
  const displayName = Form.useWatch('displayName', form)
  const offerType = watchedOfferType ?? selectedOfferType
  const offerSubtypeOptions = offerSubtypesForType(offerType)
  const selectedProduct = initialProducts.find((product) => product.key === selectedProductKey)
  const selectedCatalogProduct = initialCatalogRows.find((product) => product.key === selectedProductKey)
  const selectedPickerItem = pickerCatalog.find((item) => item.key === selectedProductKey)
  const selectedIsMerchandise = selectedPickerItem
    ? selectedPickerItem.classification === 'Merchandise'
    : selectedCatalogProduct?.typeLabel === 'Merchandise'
  const selectedItemName = selectedCatalogItemName
    ?? resolveCatalogItemName(selectedProductKey)
    ?? selectedPickerItem?.name
    ?? selectedProduct?.name
    ?? selectedCatalogProduct?.name
    ?? displayName
  const pricingProductName = selectedItemName
  const offerDetailsSectionNavItems = [
    { key: 'basics', href: '#listing-section-basics', title: 'Offer Details' },
    // The Payment card is not rendered for merchandise, so its link would scroll to nothing.
    ...(selectedIsMerchandise ? [] : [{ key: 'purchase', href: '#listing-section-purchase', title: 'Payment' }]),
    { key: 'policies', href: '#listing-section-policies', title: 'Policies' },
  ]
  const pricingMaxLines = Math.max(1, Number(watchedMaxLines ?? form.getFieldValue('maxLines') ?? offerMaxLines) || 1)

  useEffect(() => {
    const resolved = watchedMaxLines ?? form.getFieldValue('maxLines')
    if (resolved != null) setOfferMaxLines(Number(resolved))
  }, [watchedMaxLines, form])

  useEffect(() => {
    const resolved = watchedOfferType ?? form.getFieldValue('offerType')
    if (resolved) setSelectedOfferType(resolved)
  }, [watchedOfferType, form])

  useEffect(() => {
    if (step === 1) {
      const resolvedMaxLines = form.getFieldValue('maxLines')
      if (resolvedMaxLines != null) setOfferMaxLines(Number(resolvedMaxLines))
      const resolvedOfferType = form.getFieldValue('offerType')
      if (resolvedOfferType) setSelectedOfferType(resolvedOfferType)
    }
  }, [step, form])

  const eligiblePickerProducts = useMemo(() => pickerCatalog.filter((item) => (
    item.kind === 'product'
    && (pickerMode === 'any' || pickerMode === 'bundles' || item.classification === pickerMode)
    && `${item.name} ${item.category}`.toLowerCase().includes(pickerSearch.toLowerCase())
  )), [pickerMode, pickerSearch])

  const eligiblePickerBundles = useMemo(() => pickerCatalog.filter((item) => (
    item.kind === 'bundle'
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
      paymentPolicy: 'Charge in Billing Account',
      chargingPolicy: 'Real-Time Policy',
      billingPolicy: 'Bill Cycle Policy',
      prorationPolicy: 'Daily Proration Policy',
      offerType: 'BASE_PLAN',
      offerSubType: 'FIXED_DATA_TIER',
      minLines: 1,
      maxLines: 3,
      sellable: true,
      status: 'Draft',
      priceComponents: [defaultPriceComponent()],
      entitlements: defaultEntitlements(),
      channels: ['Web', 'Retail'],
      country: 'United States',
      customerAccess: 'All eligible customers',
    })
    setPickedProductKey(undefined)
    setSelectedCatalogItemName(undefined)
    setSelectedOfferType('BASE_PLAN')
    setPickerMode('any')
    setPickerSearch('')
    setPickerOpen(true)
  }

  const confirmProduct = () => {
    if (!pickedProductKey) return
    selectProduct(pickedProductKey)
    setStep(0)
    setPickerOpen(false)
    setCreating(true)
  }

  const selectProduct = (productKey: string) => {
    const product = initialProducts.find((item) => item.key === productKey)
    const catalogProduct = initialCatalogRows.find((item) => item.key === productKey)
    const pickerItem = pickerCatalog.find((item) => item.key === productKey)
    if (!product && !catalogProduct && !pickerItem) return
    const name = pickerItem?.name ?? product?.name ?? catalogProduct?.name ?? ''
    setSelectedCatalogItemName(name)
    const isMerchandise = pickerItem
      ? pickerItem.classification === 'Merchandise'
      : catalogProduct?.typeLabel === 'Merchandise'
    form.setFieldsValue({
      productKey,
      priceComponents: [{
        ...defaultPriceComponent(),
        amount: pickerItem?.basePrice ?? product?.basePrice,
      }],
      name: `${name} listing`,
      code: offerCodeFromTitle(`${name} listing`),
      displayName: name,
      paymentModel: isMerchandise ? 'Prepaid' : 'Postpaid',
      paymentPolicy: isMerchandise ? 'Charge Upfront from Wallet' : 'Charge in Billing Account',
    })
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
    const product = initialProducts.find((item) => item.key === values.productKey)
    const catalogProduct = initialCatalogRows.find((item) => item.key === values.productKey)
    const pickerItem = pickerCatalog.find((item) => item.key === values.productKey)
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
        product: pickerItem?.name ?? product?.name ?? catalogProduct?.name ?? 'Unknown product',
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
              <Typography.Title level={4} style={{ margin: 0 }}>Select product or bundle</Typography.Title>
              <Typography.Text type="secondary">Choose the item this listing will sell</Typography.Text>
            </Space>
          )}
          width={996}
          open={pickerOpen}
          onCancel={() => setPickerOpen(false)}
          okText="Done"
          okButtonProps={{ disabled: !pickedProductKey }}
          onOk={confirmProduct}
        >
          <Space orientation="vertical" size={16} className="full-width">
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search products or bundles..."
              value={pickerSearch}
              onChange={(event) => setPickerSearch(event.target.value)}
            />
            <Tabs
              activeKey={pickerMode === 'bundles' ? 'bundles' : 'products'}
              className="listing-item-tabs"
              items={[
                { key: 'products', label: 'Products' },
                { key: 'bundles', label: 'Bundles' },
              ]}
              onChange={(value) => {
                setPickerMode(value === 'bundles' ? 'bundles' : 'any')
                setPickedProductKey(undefined)
              }}
            />
            {pickerMode !== 'bundles' && (
              <Space wrap>
                <Select
                  className="filter-select"
                  value={pickerMode}
                  onChange={(value) => {
                    setPickerMode(value)
                    setPickedProductKey(undefined)
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
              {(pickerMode === 'bundles' ? eligiblePickerBundles : eligiblePickerProducts).map((item) => (
                <button
                  className={`listing-item-option ${pickedProductKey === item.key ? 'is-selected' : ''}`}
                  key={item.key}
                  onClick={() => setPickedProductKey(item.key)}
                  type="button"
                >
                  <Radio checked={pickedProductKey === item.key} />
                  <div className="listing-item-copy">
                    <Typography.Text strong>{item.name}</Typography.Text>
                    <Typography.Text type="secondary">{item.category}</Typography.Text>
                  </div>
                  <Space>
                    <Tag color={item.kind === 'bundle' ? 'magenta' : item.classification === 'Telco' ? 'blue' : 'purple'}>
                      {item.kind === 'bundle' ? 'Bundle' : item.classification}
                    </Tag>
                  </Space>
                </button>
              ))}
            </div>
          </Space>
        </Modal>
      </div>
    )
  }

  const review = form.getFieldsValue(true)

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
                        name="productKey"
                        label="Product or bundle"
                        rules={[{ required: true, message: 'Select a product or bundle' }]}
                      >
                        <Select
                          placeholder="Select a configured product"
                          showSearch
                          optionFilterProp="label"
                          options={[
                            ...pickerCatalog.map((item) => ({
                              value: item.key,
                              label: `${item.name} · ${item.kind === 'bundle' ? 'Bundle' : item.classification}`,
                            })),
                          ]}
                          onChange={selectProduct}
                        />
                      </Form.Item>
                    </div>
                    <Form.Item name="name" label="Offer title" rules={[{ required: true, message: 'Enter an offer title' }]}>
                      <Input
                        placeholder="e.g. Minimalist monthly plan"
                        onChange={(event) => {
                          form.setFieldValue('code', offerCodeFromTitle(event.target.value))
                        }}
                      />
                    </Form.Item>
                    <Form.Item name="code" label="Offer Code">
                      <Input readOnly placeholder="Auto-generated from offer title" />
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
                  <Form.Item name="offerSubType" label="Offer Sub Type">
                    <Select
                      disabled
                      placeholder="Not applicable"
                      options={offerSubtypeOptions.map((value) => ({ value }))}
                    />
                  </Form.Item>
                  {offerType === 'BASE_PLAN' ? (
                    <div className="form-grid">
                      <Form.Item
                        name="minLines"
                        label="Min Lines"
                        rules={[{ required: true, message: 'Enter the minimum number of lines' }]}
                      >
                        <InputNumber min={1} precision={0} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item
                        name="maxLines"
                        label="Max Lines"
                        rules={[{ required: true, message: 'Enter the maximum number of lines' }]}
                      >
                        <InputNumber min={1} precision={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </div>
                  ) : null}
                </Card>
                {!selectedIsMerchandise ? (
                <Card
                  id="listing-section-purchase"
                  className="form-card"
                  title={<SectionTitle title="Payment" description="Configure how this listing is charged." />}
                >
                  <Form.Item name="paymentModel" label="Payment Model" rules={[{ required: true }]}>
                    <Select
                      options={[{ value: 'Postpaid' }, { value: 'Prepaid' }]}
                      onChange={(value: PaymentModel) => {
                        form.setFieldValue('paymentPolicy', PAYMENT_POLICY_OPTIONS[value][0])
                      }}
                    />
                  </Form.Item>
                </Card>
              ) : null}
                <Card
                  id="listing-section-policies"
                  className="form-card"
                  title={<SectionTitle title="Policies" description="Configure charging, billing, and proration behaviour." />}
                >
                  <div className="form-grid three">
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
                        {fields.map((field) => (
                          <PriceComponentFields
                            key={field.key}
                            field={field}
                            productName={pricingProductName}
                            offerType={selectedOfferType}
                            maxLines={pricingMaxLines}
                            canRemove={field.name > 0}
                            onRemove={() => remove(field.name)}
                          />
                        ))}
                        <Button type="dashed" icon={<PlusOutlined />} onClick={() => add(defaultAdditionalPriceComponent())} block>
                          Add price component
                        </Button>
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
                title={<SectionTitle title="Entitlement" description="Configure service allowances for this offer." />}
              >
                <Collapse
                  className="entitlement-panels"
                  items={ENTITLEMENT_SERVICE_TYPES.map((serviceType) => ({
                    key: serviceType,
                    label: serviceType,
                    children: <EntitlementServiceFields serviceType={serviceType} />,
                  }))}
                />
              </Card>
            )}

            {step === 3 && (
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
                <Form.Item name="channels" label="Sales channels" rules={[{ required: true }]}>
                  <Checkbox.Group options={['Web', 'Retail', 'Contact centre']} />
                </Form.Item>
              </Card>
            )}

            {step === 4 && (
              <Card
                className="form-card"
                title={<SectionTitle title="Eligibility" description="Limit where and to whom the offer can be sold." area="CCI" />}
              >
                <div className="form-grid">
                  <Form.Item name="country" label="Market" rules={[{ required: true }]}>
                    <Select
                      showSearch
                      options={[
                        { value: 'United States' },
                        { value: 'Canada' },
                        { value: 'United Kingdom' },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item name="customerAccess" label="Customer access" rules={[{ required: true }]}>
                    <Select
                      options={[
                        { value: 'All eligible customers' },
                        { value: 'New customers' },
                        { value: 'Existing customers' },
                      ]}
                    />
                  </Form.Item>
                </div>
                <div className="hint-box">
                  Account standing, address validation, and regulatory checks are applied by the platform.
                </div>
              </Card>
            )}

            {step === 5 && (
              <Card
                className="form-card"
                title={<SectionTitle title="Review" description="Confirm the operator-controlled configuration before saving." />}
              >
                <div className="review-grid">
                  <div className="review-item">
                    <Typography.Text type="secondary">Listing</Typography.Text>
                    <Typography.Text strong>{review.name || 'Not set'}</Typography.Text>
                    <Typography.Text type="secondary">{review.code || 'No code'}</Typography.Text>
                  </div>
                  <div className="review-item">
                    <Typography.Text type="secondary">Product</Typography.Text>
                    <Typography.Text strong>{selectedItemName || 'Not selected'}</Typography.Text>
                    <Typography.Text type="secondary">
                      {selectedPickerItem?.kind === 'bundle'
                        ? 'Bundle'
                        : selectedPickerItem?.archetype ?? selectedPickerItem?.classification ?? selectedProduct?.archetype ?? selectedCatalogProduct?.typeLabel}
                    </Typography.Text>
                  </div>
                  <div className="review-item">
                    <Typography.Text type="secondary">Commercial</Typography.Text>
                    <Typography.Text strong>
                      {review.priceComponents?.length
                        ? `${review.priceComponents.length} pricing component${review.priceComponents.length === 1 ? '' : 's'}`
                        : 'Not set'}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      {primaryPriceAmount(review.priceComponents) != null
                        ? `Primary amount: $${Number(primaryPriceAmount(review.priceComponents)).toFixed(2)}`
                        : null}
                      {review.paymentModel ? ` · ${review.paymentModel}` : ''}
                      {review.paymentPolicy ? ` · ${review.paymentPolicy}` : ''}
                    </Typography.Text>
                  </div>
                  <div className="review-item">
                    <Typography.Text type="secondary">Policies</Typography.Text>
                    <Typography.Text strong>{review.chargingPolicy || 'Not set'}</Typography.Text>
                    <Typography.Text type="secondary">
                      {review.billingPolicy}
                      {review.prorationPolicy ? ` · ${review.prorationPolicy}` : ''}
                    </Typography.Text>
                  </div>
                  <div className="review-item">
                    <Typography.Text type="secondary">Customer display</Typography.Text>
                    <Typography.Text strong>{review.displayName || 'Not set'}</Typography.Text>
                    <Typography.Text type="secondary">{review.channels?.join(', ')}</Typography.Text>
                  </div>
                  <div className="review-item">
                    <Typography.Text type="secondary">Offer</Typography.Text>
                    <Typography.Text strong>{review.sellable ? 'Sellable' : 'Not sellable'}</Typography.Text>
                    <Typography.Text type="secondary">
                      {review.offerType}
                      {review.offerSubType ? ` · ${review.offerSubType}` : ''}
                      {review.offerType === 'BASE_PLAN' && review.minLines != null && review.maxLines != null
                        ? ` · ${review.minLines === review.maxLines
                          ? `${review.minLines} line${review.minLines === 1 ? '' : 's'}`
                          : `${review.minLines}-${review.maxLines} lines`}`
                        : ''}
                    </Typography.Text>
                  </div>
                  <div className="review-item">
                    <Typography.Text type="secondary">Availability</Typography.Text>
                    <Typography.Text strong>{review.country || 'Not set'}</Typography.Text>
                    <Typography.Text type="secondary">{review.customerAccess}</Typography.Text>
                  </div>
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
              <Steps
                current={step}
                orientation="vertical"
                size="small"
                items={stepItems.map(({ title }, index) => ({
                  title,
                  // The step's own sections nest under it, only while that step is open.
                  description: index === step && index === 0
                    ? (
                      <Anchor
                        affix={false}
                        className="listing-step-anchor"
                        targetOffset={24}
                        items={offerDetailsSectionNavItems}
                      />
                    )
                    : undefined,
                }))}
              />
            </Card>
          </div>
        </div>
      </Form>
    </div>
  )
}
