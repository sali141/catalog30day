import { useState } from 'react'
import { AppstoreOutlined, ArrowLeftOutlined, InfoCircleOutlined, RocketOutlined, SaveOutlined, ShopOutlined, TagOutlined } from '@ant-design/icons'
import {
  App,
  Breadcrumb,
  Button,
  Card,
  Descriptions,
  Flex,
  Form,
  Input,
  InputNumber,
  List,
  Select,
  Space,
  Steps,
  Switch,
  Tag,
  Tooltip,
  TreeSelect,
  Typography,
} from 'antd'
import { ScopeTag } from '../components/ScopeTag'

type ServiceKey = 'Data' | 'Voice' | 'SMS'
type DataSubtype = 'Local Data' | 'Roaming Data'
type VoiceSubtype = 'Local Voice' | 'Roaming Voice'
type SmsSubtype = 'Local SMS' | 'Roaming SMS'
type ServiceSubtype = DataSubtype | VoiceSubtype | SmsSubtype

type DataAllowanceValues = {
  unlimited: boolean
  rollover?: boolean
  amount?: number
  unit: 'GB' | 'MB'
  dataSharing: boolean
  productSpeed: string
  listOfApps: string
  countries?: string[]
}

type VoiceAllowanceValues = {
  unlimited: boolean
  amount?: number | string
  unit: 'Minutes'
  voiceSharing: boolean
  countries?: string[]
}

type SmsAllowanceValues = {
  unlimited: boolean
  amount?: number | string
  smsSharing: boolean
  countries?: string[]
}

type ProductValues = {
  name: string
  subtitle?: string
  description?: string
  category?: string
  collection?: string
  services: ServiceKey[]
  serviceSubtypes: {
    Data?: DataSubtype[]
    Voice?: VoiceSubtype[]
    SMS?: SmsSubtype[]
  }
  selectedSubtypes: ServiceSubtype[]
  allowances: {
    'Local Data'?: DataAllowanceValues
    'Roaming Data'?: DataAllowanceValues
    'Local Voice'?: VoiceAllowanceValues
    'Roaming Voice'?: VoiceAllowanceValues
    'Local SMS'?: SmsAllowanceValues
    'Roaming SMS'?: SmsAllowanceValues
  }
  basePrice?: number
  thresholdNotifications: {
    '100 MB': { enabled: boolean; template: string }
    '512 MB': { enabled: boolean; template: string }
    '1 GB': { enabled: boolean; template: string }
  }
  subscriptionNotification: { enabled: boolean; template: string }
  fairUseNotification: boolean
}

const SERVICE_SUBTYPE_OPTIONS = {
  Data: ['Local Data', 'Roaming Data'],
  Voice: ['Local Voice', 'Roaming Voice'],
  SMS: ['Local SMS', 'Roaming SMS'],
} as const

const COUNTRY_OPTIONS = [
  'Australia', 'France', 'Germany', 'India', 'Japan', 'Singapore', 'Sri Lanka', 'United Kingdom', 'United States',
].map((value) => ({ value, label: value }))

const PRODUCT_SPEED_OPTIONS = ['Uncapped', 'Capped', 'Throttled'].map((value) => ({ value }))
const LIST_OF_APPS_OPTIONS = ['All', 'Social', 'Streaming', 'Messaging'].map((value) => ({ value }))

const defaultDataAllowance = (local: boolean): DataAllowanceValues => ({
  unlimited: false,
  ...(local ? { rollover: false } : {}),
  amount: 0,
  unit: 'GB',
  dataSharing: false,
  productSpeed: 'Uncapped',
  listOfApps: 'All',
  ...(!local ? { countries: [] } : {}),
})

const defaultVoiceAllowance = (local: boolean): VoiceAllowanceValues => ({
  unlimited: false,
  amount: local ? undefined : undefined,
  unit: 'Minutes',
  voiceSharing: false,
  ...(!local ? { countries: [] } : {}),
})

const defaultSmsAllowance = (local: boolean): SmsAllowanceValues => ({
  unlimited: false,
  amount: local ? undefined : 0,
  smsSharing: false,
  ...(!local ? { countries: [] } : {}),
})

const THRESHOLD_NOTIFICATION_LEVELS = ['100 MB', '512 MB', '1 GB'] as const
type ThresholdNotificationLevel = typeof THRESHOLD_NOTIFICATION_LEVELS[number]

const defaultThresholdNotifications = (): ProductValues['thresholdNotifications'] => ({
  '100 MB': { enabled: false, template: 'usage_notification_addon_data' },
  '512 MB': { enabled: false, template: 'usage_notification_addon_data' },
  '1 GB': { enabled: false, template: 'usage_notification_addon_data' },
})

const steps = [
  { title: 'Details' },
  { title: 'Service configuration' },
  { title: 'Pricing' },
  { title: 'Notifications' },
  { title: 'Review' },
]

const initialValues: ProductValues = {
  name: '',
  services: [],
  serviceSubtypes: {},
  selectedSubtypes: [],
  allowances: {},
  thresholdNotifications: defaultThresholdNotifications(),
  subscriptionNotification: { enabled: true, template: 'addon_subscribe' },
  fairUseNotification: false,
}

function LabelWithInfo({ label, tip }: { label: string; tip: string }) {
  return (
    <span>
      {label}{' '}
      <Tooltip title={tip}>
        <InfoCircleOutlined style={{ color: 'var(--color-primary, #1677ff)' }} />
      </Tooltip>
    </span>
  )
}

function formatServicesReview(
  services: ServiceKey[] | undefined,
  serviceSubtypes: ProductValues['serviceSubtypes'] | undefined,
) {
  if (!services?.length) return 'Not configured'
  return services
    .map((service) => {
      const subtypes = serviceSubtypes?.[service]
      if (!subtypes?.length) return service
      return `${service} (${subtypes.join(', ')})`
    })
    .join(', ')
}

const SERVICE_KEYS = Object.keys(SERVICE_SUBTYPE_OPTIONS) as ServiceKey[]

const SERVICE_TREE_DATA = SERVICE_KEYS.map((service) => ({
  title: service,
  value: service,
  key: service,
  children: SERVICE_SUBTYPE_OPTIONS[service].map((subtype) => ({
    title: subtype,
    value: subtype,
    key: subtype,
  })),
}))

function formValuesFromSubtypes(subtypes: ServiceSubtype[]): {
  services: ServiceKey[]
  serviceSubtypes: ProductValues['serviceSubtypes']
} {
  const serviceSubtypes: ProductValues['serviceSubtypes'] = {}
  const services: ServiceKey[] = []

  const data = SERVICE_SUBTYPE_OPTIONS.Data.filter((subtype) => subtypes.includes(subtype))
  if (data.length) {
    services.push('Data')
    serviceSubtypes.Data = data
  }

  const voice = SERVICE_SUBTYPE_OPTIONS.Voice.filter((subtype) => subtypes.includes(subtype))
  if (voice.length) {
    services.push('Voice')
    serviceSubtypes.Voice = voice
  }

  const sms = SERVICE_SUBTYPE_OPTIONS.SMS.filter((subtype) => subtypes.includes(subtype))
  if (sms.length) {
    services.push('SMS')
    serviceSubtypes.SMS = sms
  }

  return { services, serviceSubtypes }
}

function flattenServiceSubtypes(serviceSubtypes: ProductValues['serviceSubtypes'] | undefined): ServiceSubtype[] {
  if (!serviceSubtypes) return []
  return [
    ...(serviceSubtypes.Data ?? []),
    ...(serviceSubtypes.Voice ?? []),
    ...(serviceSubtypes.SMS ?? []),
  ]
}

function ensureAllowanceDefaults(
  subtypes: ServiceSubtype[],
  current: ProductValues['allowances'],
): ProductValues['allowances'] {
  const next: ProductValues['allowances'] = {}
  for (const subtype of subtypes) {
    if (subtype === 'Local Data') next[subtype] = current[subtype] ?? defaultDataAllowance(true)
    if (subtype === 'Roaming Data') next[subtype] = current[subtype] ?? defaultDataAllowance(false)
    if (subtype === 'Local Voice') next[subtype] = current[subtype] ?? defaultVoiceAllowance(true)
    if (subtype === 'Roaming Voice') next[subtype] = current[subtype] ?? defaultVoiceAllowance(false)
    if (subtype === 'Local SMS') next[subtype] = current[subtype] ?? defaultSmsAllowance(true)
    if (subtype === 'Roaming SMS') next[subtype] = current[subtype] ?? defaultSmsAllowance(false)
  }
  return next
}

function ServiceTypeSelect({
  value = [],
  onChange,
}: {
  value?: ServiceSubtype[]
  onChange?: (subtypes: ServiceSubtype[]) => void
}) {
  const form = Form.useFormInstance<ProductValues>()

  const handleChange = (next: ServiceSubtype[]) => {
    const derived = formValuesFromSubtypes(next)
    const currentAllowances = form.getFieldValue('allowances') ?? {}
    form.setFieldsValue({
      services: derived.services,
      serviceSubtypes: derived.serviceSubtypes,
      allowances: ensureAllowanceDefaults(next, currentAllowances),
    })
    onChange?.(next)
  }

  return (
    <TreeSelect
      treeCheckable
      multiple
      allowClear
      showSearch
      treeDefaultExpandAll={false}
      showCheckedStrategy={TreeSelect.SHOW_CHILD}
      placeholder="Select services and usage types"
      treeData={SERVICE_TREE_DATA}
      value={value}
      onChange={(next) => handleChange(next as ServiceSubtype[])}
      maxTagCount="responsive"
      style={{ width: '100%' }}
    />
  )
}

function ThresholdNotificationRow({ level }: { level: ThresholdNotificationLevel }) {
  return (
    <div>
      <Typography.Text>{level}</Typography.Text>
      <Flex gap={12} align="center" style={{ marginTop: 8 }}>
        <Form.Item name={['thresholdNotifications', level, 'enabled']} valuePropName="checked" noStyle>
          <Switch />
        </Form.Item>
        <Form.Item name={['thresholdNotifications', level, 'template']} noStyle style={{ flex: 1, width: '100%' }}>
          <Input />
        </Form.Item>
      </Flex>
    </div>
  )
}

function ReadOnlyField({ label, tip, value }: { label: string; tip: string; value: string }) {
  return (
    <Form.Item label={<LabelWithInfo label={label} tip={tip} />} required>
      <Input value={value} disabled />
    </Form.Item>
  )
}

function LocalDataCard() {
  const unlimited = Form.useWatch(['allowances', 'Local Data', 'unlimited'])
  return (
    <Card title="Local Data">
      <div className="form-grid">
        <ReadOnlyField label="Usage type" tip="Usage type for this allowance" value="Local" />
        <ReadOnlyField label="Service" tip="Service covered by this allowance" value="Data" />
        <Form.Item
          name={['allowances', 'Local Data', 'rollover']}
          label={<LabelWithInfo label="Rollover" tip="Unused data rolls over to the next period" />}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
        <Form.Item
          name={['allowances', 'Local Data', 'unlimited']}
          label={<LabelWithInfo label="Unlimited Allowances?" tip="Provide unlimited local data" />}
          valuePropName="checked"
          required
        >
          <Switch />
        </Form.Item>
        {!unlimited ? (
          <Form.Item label={<LabelWithInfo label="Data" tip="Included local data allowance" />} required>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name={['allowances', 'Local Data', 'amount']} noStyle rules={[{ required: true, message: 'Enter data allowance' }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name={['allowances', 'Local Data', 'unit']} noStyle rules={[{ required: true }]}>
                <Select options={[{ value: 'GB' }, { value: 'MB' }]} style={{ width: 100 }} />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
        ) : <div />}
        <div />
        <Form.Item
          name={['allowances', 'Local Data', 'dataSharing']}
          label={<LabelWithInfo label="Enable Data Sharing" tip="Share data across lines in a group" />}
          valuePropName="checked"
          extra="Enables data sharing across multiple mobile lines in a group (included primary line)."
        >
          <Switch />
        </Form.Item>
        <div />
        <Form.Item
          name={['allowances', 'Local Data', 'productSpeed']}
          label={<LabelWithInfo label="Product speed" tip="Speed profile for this product" />}
          rules={[{ required: true }]}
          required
        >
          <Select options={PRODUCT_SPEED_OPTIONS} />
        </Form.Item>
        <Form.Item
          name={['allowances', 'Local Data', 'listOfApps']}
          label={<LabelWithInfo label="List of apps" tip="Apps included in this allowance" />}
          rules={[{ required: true }]}
          required
        >
          <Select options={LIST_OF_APPS_OPTIONS} />
        </Form.Item>
      </div>
    </Card>
  )
}

function RoamingDataCard() {
  const unlimited = Form.useWatch(['allowances', 'Roaming Data', 'unlimited'])
  return (
    <Card title="Roaming Data">
      <div className="form-grid">
        <ReadOnlyField label="Usage type" tip="Usage type for this allowance" value="Roaming" />
        <ReadOnlyField label="Service" tip="Service covered by this allowance" value="Data" />
        <Form.Item
          name={['allowances', 'Roaming Data', 'unlimited']}
          label={<LabelWithInfo label="Unlimited Allowances?" tip="Provide unlimited roaming data" />}
          valuePropName="checked"
          required
        >
          <Switch />
        </Form.Item>
        <div />
        {!unlimited ? (
          <Form.Item label={<LabelWithInfo label="Roaming Data" tip="Included roaming data allowance" />} required>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name={['allowances', 'Roaming Data', 'amount']} noStyle rules={[{ required: true, message: 'Enter roaming data allowance' }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name={['allowances', 'Roaming Data', 'unit']} noStyle rules={[{ required: true }]}>
                <Select options={[{ value: 'GB' }, { value: 'MB' }]} style={{ width: 100 }} />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
        ) : <div />}
        <div />
        <Form.Item
          name={['allowances', 'Roaming Data', 'dataSharing']}
          label={<LabelWithInfo label="Enable Data Sharing" tip="Share data across lines in a group" />}
          valuePropName="checked"
          extra="Enables data sharing across multiple mobile lines in a group (included primary line)."
        >
          <Switch />
        </Form.Item>
        <div />
        <Form.Item
          name={['allowances', 'Roaming Data', 'productSpeed']}
          label={<LabelWithInfo label="Product speed" tip="Speed profile for this product" />}
        >
          <Select options={PRODUCT_SPEED_OPTIONS} />
        </Form.Item>
        <Form.Item
          name={['allowances', 'Roaming Data', 'listOfApps']}
          label={<LabelWithInfo label="List of apps" tip="Apps included in this allowance" />}
          rules={[{ required: true }]}
          required
        >
          <Select options={LIST_OF_APPS_OPTIONS} />
        </Form.Item>
        <div className="span-two">
          <Form.Item
            name={['allowances', 'Roaming Data', 'countries']}
            label={<LabelWithInfo label="Select Countries" tip="Countries where roaming applies" />}
            rules={[{ required: true, type: 'array', min: 1, message: 'Select at least one country' }]}
            required
          >
            <Select mode="multiple" allowClear showSearch placeholder="Select a country or a set of countries" options={COUNTRY_OPTIONS} />
          </Form.Item>
        </div>
      </div>
    </Card>
  )
}

function LocalVoiceCard() {
  const unlimited = Form.useWatch(['allowances', 'Local Voice', 'unlimited'])
  return (
    <Card title="Local Voice">
      <div className="form-grid">
        <ReadOnlyField label="Usage type" tip="Usage type for this allowance" value="Local" />
        <ReadOnlyField label="Service" tip="Service covered by this allowance" value="Voice Incoming Outgoing" />
        <Form.Item
          name={['allowances', 'Local Voice', 'unlimited']}
          label={<LabelWithInfo label="Unlimited Allowances?" tip="Provide unlimited local voice" />}
          valuePropName="checked"
          required
        >
          <Switch />
        </Form.Item>
        <div />
        {!unlimited ? (
          <Form.Item label={<LabelWithInfo label="Outgoing Voice" tip="Included outgoing voice allowance" />} required>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name={['allowances', 'Local Voice', 'amount']} noStyle rules={[{ required: true, message: 'Enter voice allowance' }]}>
                <InputNumber min={0} placeholder="Voice" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name={['allowances', 'Local Voice', 'unit']} noStyle rules={[{ required: true }]}>
                <Select options={[{ value: 'Minutes' }]} style={{ width: 120 }} />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
        ) : <div />}
        <div />
        <Form.Item
          name={['allowances', 'Local Voice', 'voiceSharing']}
          label={<LabelWithInfo label="Enable Voice Sharing" tip="Share voice across lines in a group" />}
          valuePropName="checked"
          extra="Enables voice sharing across multiple mobile lines in a group (included primary line)."
        >
          <Switch />
        </Form.Item>
      </div>
    </Card>
  )
}

function RoamingVoiceCard() {
  const unlimited = Form.useWatch(['allowances', 'Roaming Voice', 'unlimited'])
  return (
    <Card title="Roaming Voice">
      <div className="form-grid">
        <ReadOnlyField label="Usage type" tip="Usage type for this allowance" value="Roaming" />
        <ReadOnlyField label="Service" tip="Service covered by this allowance" value="Voice Incoming Outgoing" />
        <Form.Item
          name={['allowances', 'Roaming Voice', 'unlimited']}
          label={<LabelWithInfo label="Unlimited Allowances?" tip="Provide unlimited roaming voice" />}
          valuePropName="checked"
          required
        >
          <Switch />
        </Form.Item>
        <div />
        {!unlimited ? (
          <Form.Item label={<LabelWithInfo label="Voice Roaming" tip="Included roaming voice allowance" />} required>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name={['allowances', 'Roaming Voice', 'amount']} noStyle rules={[{ required: true, message: 'Enter voice roaming allowance' }]}>
                <InputNumber min={0} placeholder="Voice roaming" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name={['allowances', 'Roaming Voice', 'unit']} noStyle rules={[{ required: true }]}>
                <Select options={[{ value: 'Minutes' }]} style={{ width: 120 }} />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
        ) : <div />}
        <div />
        <Form.Item
          name={['allowances', 'Roaming Voice', 'voiceSharing']}
          label={<LabelWithInfo label="Enable Voice Sharing" tip="Share voice across lines in a group" />}
          valuePropName="checked"
          extra="Enables voice sharing across multiple mobile lines in a group (included primary line)."
        >
          <Switch />
        </Form.Item>
        <div />
        <div className="span-two">
          <Form.Item
            name={['allowances', 'Roaming Voice', 'countries']}
            label={<LabelWithInfo label="Select Countries" tip="Countries where roaming applies" />}
            rules={[{ required: true, type: 'array', min: 1, message: 'Select at least one country' }]}
            required
          >
            <Select mode="multiple" allowClear showSearch placeholder="Select a country or a set of countries" options={COUNTRY_OPTIONS} />
          </Form.Item>
        </div>
      </div>
    </Card>
  )
}

function LocalSmsCard() {
  const unlimited = Form.useWatch(['allowances', 'Local SMS', 'unlimited'])
  return (
    <Card title="Local SMS">
      <div className="form-grid">
        <ReadOnlyField label="Usage type" tip="Usage type for this allowance" value="Local" />
        <ReadOnlyField label="Service" tip="Service covered by this allowance" value="SMS Incoming Outgoing" />
        <Form.Item
          name={['allowances', 'Local SMS', 'unlimited']}
          label={<LabelWithInfo label="Unlimited Allowances?" tip="Provide unlimited local SMS" />}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
        {!unlimited ? (
          <Form.Item
            name={['allowances', 'Local SMS', 'amount']}
            label={<LabelWithInfo label="Outgoing SMS" tip="Included outgoing SMS allowance" />}
          >
            <InputNumber min={0} placeholder="SMS allowance" style={{ width: '100%' }} />
          </Form.Item>
        ) : <div />}
        <Form.Item
          name={['allowances', 'Local SMS', 'smsSharing']}
          label={<LabelWithInfo label="Enable SMS Sharing" tip="Share SMS across lines in a group" />}
          valuePropName="checked"
          extra="Enables sms sharing across multiple mobile lines in a group (included primary line)."
        >
          <Switch />
        </Form.Item>
      </div>
    </Card>
  )
}

function RoamingSmsCard() {
  const unlimited = Form.useWatch(['allowances', 'Roaming SMS', 'unlimited'])
  return (
    <Card title="Roaming SMS">
      <div className="form-grid">
        <ReadOnlyField label="Usage type" tip="Usage type for this allowance" value="Roaming" />
        <ReadOnlyField label="Service" tip="Service covered by this allowance" value="SMS Incoming Outgoing" />
        <Form.Item
          name={['allowances', 'Roaming SMS', 'unlimited']}
          label={<LabelWithInfo label="Unlimited Allowances?" tip="Provide unlimited roaming SMS" />}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
        {!unlimited ? (
          <Form.Item
            name={['allowances', 'Roaming SMS', 'amount']}
            label={<LabelWithInfo label="SMS Roaming" tip="Included roaming SMS allowance" />}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        ) : <div />}
        <Form.Item
          name={['allowances', 'Roaming SMS', 'smsSharing']}
          label={<LabelWithInfo label="Enable SMS Sharing" tip="Share SMS across lines in a group" />}
          valuePropName="checked"
          extra="Enables sms sharing across multiple mobile lines in a group (included primary line)."
        >
          <Switch />
        </Form.Item>
        <div />
        <div className="span-two">
          <Form.Item
            name={['allowances', 'Roaming SMS', 'countries']}
            label={<LabelWithInfo label="Select Countries" tip="Countries where roaming applies" />}
            rules={[{ required: true, type: 'array', min: 1, message: 'Select at least one country' }]}
            required
          >
            <Select mode="multiple" allowClear showSearch placeholder="Select a country or a set of countries" options={COUNTRY_OPTIONS} />
          </Form.Item>
        </div>
      </div>
    </Card>
  )
}

const SUBTYPE_CARD_ORDER: ServiceSubtype[] = [
  'Local Data',
  'Roaming Data',
  'Local Voice',
  'Roaming Voice',
  'Local SMS',
  'Roaming SMS',
]

function SubtypeAllowanceCards({ selected }: { selected: ServiceSubtype[] }) {
  return (
    <>
      {SUBTYPE_CARD_ORDER.filter((subtype) => selected.includes(subtype)).map((subtype) => {
        switch (subtype) {
          case 'Local Data':
            return <LocalDataCard key={subtype} />
          case 'Roaming Data':
            return <RoamingDataCard key={subtype} />
          case 'Local Voice':
            return <LocalVoiceCard key={subtype} />
          case 'Roaming Voice':
            return <RoamingVoiceCard key={subtype} />
          case 'Local SMS':
            return <LocalSmsCard key={subtype} />
          case 'Roaming SMS':
            return <RoamingSmsCard key={subtype} />
          default:
            return null
        }
      })}
    </>
  )
}

export function TelcoProductFlowPage({ onBack, onContinueToListing }: {
  onBack: () => void
  onContinueToListing: () => void
}) {
  const { message } = App.useApp()
  const [step, setStep] = useState(0)
  const [behavior, setBehavior] = useState({ orderable: true, trackable: false, shippable: false })
  const [form] = Form.useForm<ProductValues>()
  const selectedSubtypes = Form.useWatch('selectedSubtypes', form) ?? []

  const next = async () => {
    try {
      if (step === 0) await form.validateFields(['name'])
      if (step === 1) await form.validateFields(['selectedSubtypes'])
      setStep((current) => Math.min(current + 1, steps.length - 1))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      message.error('Complete the required fields before continuing')
    }
  }

  const fill = () => {
    if (step === 0) form.setFieldsValue({ name: 'Local Data 100GB', category: 'High-value plans' })
    if (step === 1) {
      const subtypes: ProductValues['serviceSubtypes'] = {
        Data: ['Local Data', 'Roaming Data'],
        Voice: ['Local Voice', 'Roaming Voice'],
        SMS: ['Local SMS', 'Roaming SMS'],
      }
      const flat = flattenServiceSubtypes(subtypes)
      form.setFieldsValue({
        services: ['Data', 'Voice', 'SMS'],
        serviceSubtypes: subtypes,
        selectedSubtypes: flat,
        allowances: {
          'Local Data': { ...defaultDataAllowance(true), amount: 100, unit: 'GB', rollover: true },
          'Roaming Data': { ...defaultDataAllowance(false), amount: 5, unit: 'GB', countries: ['Singapore', 'United Kingdom'] },
          'Local Voice': { ...defaultVoiceAllowance(true), amount: 1000 },
          'Roaming Voice': { ...defaultVoiceAllowance(false), amount: 100, countries: ['Singapore'] },
          'Local SMS': { ...defaultSmsAllowance(true), amount: 1000 },
          'Roaming SMS': { ...defaultSmsAllowance(false), amount: 100, countries: ['Singapore'] },
        },
      })
    }
    if (step === 2) form.setFieldsValue({ basePrice: 39.9 })
    if (step === 3) form.setFieldsValue({
      thresholdNotifications: defaultThresholdNotifications(),
      subscriptionNotification: { enabled: true, template: 'addon_subscribe' },
      fairUseNotification: true,
    })
    message.success('Sample data filled')
  }

  const values = form.getFieldsValue(true)

  return (
    <div className="page-container telco-studio-page">
      <Breadcrumb items={[{ title: <a onClick={onBack}>Products</a> }, { title: 'Create telco product' }]} />
      <Space orientation="vertical" size="middle" className="full-width" style={{ marginTop: 16 }}>
        <Flex justify="space-between" align="flex-start" gap={16} wrap className="page-header">
          <Space orientation="vertical" size={8} className="page-header-copy">
            {step > 0 ? (
              <Button className="page-back-link" icon={<ArrowLeftOutlined />} onClick={() => setStep((value) => value - 1)} type="link">
                Back
              </Button>
            ) : null}
            <div>
              <Typography.Title level={3}>Create telco product</Typography.Title>
              <Typography.Text type="secondary">Define the core product and its services</Typography.Text>
            </div>
          </Space>
          <Space wrap>
            {step < steps.length - 1 ? <Button onClick={fill}>Fill the form for me</Button> : null}
            {step > 0 && step < steps.length - 1 ? (
              <Button icon={<SaveOutlined />} onClick={() => message.success('Draft saved')}>Save draft</Button>
            ) : null}
            {step < steps.length - 1 ? (
              <Button type="primary" onClick={next}>Continue</Button>
            ) : (
              <>
                <Button icon={<SaveOutlined />} onClick={() => message.success('Product published')}>Publish only</Button>
                <Button type="primary" icon={<ShopOutlined />} onClick={onContinueToListing}>Publish &amp; continue to listing</Button>
              </>
            )}
          </Space>
        </Flex>

        <Form<ProductValues>
          form={form}
          layout="vertical"
          initialValues={initialValues}
          requiredMark
          preserve
        >
          <div className="product-create-flow-layout">
            <div className="product-create-flow-main">
              {step === 0 ? (
                <Space orientation="vertical" size="middle" className="full-width">
                  <Card title="Product details">
                    <Form.Item name="name" label="Product name" rules={[{ required: true }]} extra="Used for catalog management. The customer-facing display name is set on the listing.">
                      <Input placeholder="e.g. Local Data 100GB" />
                    </Form.Item>
                    <Form.Item name="subtitle" label="Subtitle · Optional"><Input placeholder="e.g. Local data, no roaming" /></Form.Item>
                    <Form.Item name="description" label="Description · Optional"><Input.TextArea autoSize={{ minRows: 3 }} placeholder="What this product is, for whoever maintains the catalog." /></Form.Item>
                  </Card>
                  <Card title="Category & collection">
                    <Form.Item name="category" label="Product category · Optional">
                      <Select allowClear showSearch placeholder="Search and select a category" options={['General', 'High-value plans', 'Senior plans', 'Roaming', 'Value plans', 'Devices'].map((value) => ({ value }))} />
                    </Form.Item>
                    <Form.Item name="collection" label="Collection · Optional">
                      <Select allowClear showSearch placeholder="Search and select a collection" options={['Postpaid plans', 'Featured plans', 'Seasonal offers'].map((value) => ({ value }))} />
                    </Form.Item>
                  </Card>
                  <Card title="Product behavior">
                    <List
                      className="telco-product-behavior-list"
                      dataSource={[
                        { key: 'orderable' as const, label: 'Orderable', description: 'This product can be part of a customer order.' },
                        { key: 'trackable' as const, label: 'Trackable', description: 'This product requires inventory or shipment tracking.' },
                        { key: 'shippable' as const, label: 'Shippable', description: 'This product requires physical shipping.' },
                      ]}
                      renderItem={(item) => (
                        <List.Item actions={[<Switch key={item.key} checked={behavior[item.key]} onChange={(checked) => setBehavior((current) => ({ ...current, [item.key]: checked }))} />]}>
                          <List.Item.Meta title={item.label} description={item.description} />
                        </List.Item>
                      )}
                      split={false}
                    />
                  </Card>
                </Space>
              ) : null}

              {step === 1 ? (
                <Space orientation="vertical" size="middle" className="full-width">
                  <Card title={<span>Services included <ScopeTag area="CCI" /></span>}>
                    <Form.Item
                      name="selectedSubtypes"
                      label="Service types"
                      rules={[{ required: true, type: 'array', min: 1, message: 'Select at least one service' }]}
                    >
                      <ServiceTypeSelect />
                    </Form.Item>
                  </Card>
                  <SubtypeAllowanceCards selected={selectedSubtypes} />
                </Space>
              ) : null}

              {step === 2 ? (
                <Card title="Base price">
                  <Form.Item name="basePrice" label="Base price · Optional"><InputNumber min={0} precision={2} prefix="$" style={{ width: 320 }} /></Form.Item>
                </Card>
              ) : null}

              {step === 3 ? (
                <Space orientation="vertical" size="middle" className="full-width">
                  <Typography.Title level={4} style={{ margin: 0 }}>Notifications</Typography.Title>
                  <Card title={<LabelWithInfo label="Threshold Notification Data" tip="Notify customers when remaining data drops below configured thresholds" />}>
                    <Space orientation="vertical" size="large" className="full-width">
                      {THRESHOLD_NOTIFICATION_LEVELS.map((level) => (
                        <ThresholdNotificationRow key={level} level={level} />
                      ))}
                    </Space>
                  </Card>
                  <Card title="Expiry Notifications">
                    <Typography.Text type="secondary">
                      Configure expiry reminder notifications for product with fixed validity periods
                    </Typography.Text>
                    <Flex justify="space-between" align="center" style={{ marginTop: 16 }}>
                      <Typography.Text>Trigger Events</Typography.Text>
                      <Button onClick={() => message.info('Add trigger')}>Add Trigger</Button>
                    </Flex>
                  </Card>
                  <Card title={<LabelWithInfo label="Subscription List" tip="Subscription-related notification templates" />}>
                    <Typography.Text>Subscription</Typography.Text>
                    <Flex gap={12} align="center" style={{ marginTop: 8 }}>
                      <Form.Item name={['subscriptionNotification', 'enabled']} valuePropName="checked" noStyle>
                        <Switch />
                      </Form.Item>
                      <Form.Item name={['subscriptionNotification', 'template']} noStyle style={{ flex: 1, width: '100%' }}>
                        <Input />
                      </Form.Item>
                    </Flex>
                  </Card>
                  <Card title="FUP limit">
                    <Form.Item name="fairUseNotification" valuePropName="checked">
                      <Switch /> <Typography.Text>Notify when full-speed data is exhausted</Typography.Text>
                    </Form.Item>
                  </Card>
                </Space>
              ) : null}

              {step === 4 ? (
                <Card title="Product overview">
                  <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="Product name">{values.name || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Category">{values.category || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Base price">{values.basePrice ? `$${Number(values.basePrice).toFixed(2)}` : '—'}</Descriptions.Item>
                    <Descriptions.Item label="Behavior">{Object.entries(behavior).filter(([, enabled]) => enabled).map(([key]) => key).join(', ')}</Descriptions.Item>
                    <Descriptions.Item label="Services">{formatServicesReview(values.services, values.serviceSubtypes)}</Descriptions.Item>
                    <Descriptions.Item label="Schema">Telco product</Descriptions.Item>
                  </Descriptions>
                  <div className="product-review-next-steps">
                    <Flex gap={16} align="flex-start">
                      <div className="product-review-next-steps-icon">
                        <RocketOutlined />
                      </div>
                      <Space orientation="vertical" size={8} className="full-width">
                        <Typography.Title level={5} className="product-review-next-steps-title">
                          What&apos;s next?
                        </Typography.Title>
                        <Typography.Text>
                          A product alone cannot be sold. Group it into a{' '}
                          <Tag icon={<AppstoreOutlined />} color="processing">Bundle</Tag>
                          or create an{' '}
                          <Tag icon={<TagOutlined />} color="processing">Offer</Tag>
                          that prices it directly.
                        </Typography.Text>
                      </Space>
                    </Flex>
                  </div>
                </Card>
              ) : null}
            </div>
            <aside className="product-create-flow-rail">
              <Card title="Progress">
                <Steps direction="vertical" size="small" current={step} items={steps} />
              </Card>
            </aside>
          </div>
        </Form>
      </Space>
    </div>
  )
}
