import { useMemo, useState, type ReactNode } from 'react'
import {
  CarOutlined,
  DownOutlined,
  FilterOutlined,
  GiftOutlined,
  MobileOutlined,
  MoreOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  Dropdown,
  Flex,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { initialCatalogRows, type CatalogTableRow } from '../data'

const { Text, Title } = Typography
type CatalogTab = 'all' | 'telco' | 'merchandise' | 'bundles'
type CreateProductKind = 'Telco' | 'Insurance' | 'Travel' | 'Merchandise'

const CREATE_PRODUCT_KIND_OPTIONS: {
  value: CreateProductKind
  title: string
  description: string
  icon: ReactNode
  tone: string
}[] = [
  {
    value: 'Telco',
    title: 'Telco',
    description: 'Plans, add-ons, and connectivity products',
    icon: <MobileOutlined />,
    tone: 'telco',
  },
  {
    value: 'Insurance',
    title: 'Insurance',
    description: 'Protection and coverage products',
    icon: <SafetyCertificateOutlined />,
    tone: 'insurance',
  },
  {
    value: 'Travel',
    title: 'Travel',
    description: 'Travel packs and journey products',
    icon: <CarOutlined />,
    tone: 'travel',
  },
  {
    value: 'Merchandise',
    title: 'Merchandise',
    description: 'Physical and digital retail products',
    icon: <GiftOutlined />,
    tone: 'merchandise',
  },
]

const statusColor = (status: string) =>
  status === 'Active'
    ? 'green'
    : status === 'Draft'
      ? 'gold'
      : status === 'Review'
        ? 'blue'
        : status === 'Incomplete'
          ? 'red'
          : undefined

export function ProductsBundlesPage({
  onCreateTelco,
  onCreateProductNew,
}: {
  onCreateTelco: () => void
  onCreateProductNew?: () => void
}) {
  const { message } = App.useApp()
  const [tab, setTab] = useState<CatalogTab>('all')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createKind, setCreateKind] = useState<CreateProductKind>('Telco')
  const [createCategory, setCreateCategory] = useState<string>()
  const [createSchema, setCreateSchema] = useState<string>()

  const merchandiseCategories = useMemo(
    () => [...new Set(initialCatalogRows
      .filter((row) => row.kind === 'product' && row.typeLabel === 'Merchandise')
      .map((row) => row.category))],
    [],
  )
  const merchandiseSchemas = useMemo(
    () => [...new Set(initialCatalogRows
      .filter((row) => row.kind === 'product' && row.typeLabel === 'Merchandise')
      .map((row) => row.secondary))],
    [],
  )

  const rows = useMemo(() => {
    return initialCatalogRows.filter((row) => {
      if (tab === 'telco' && row.typeLabel !== 'Telco') return false
      if (tab === 'merchandise' && row.typeLabel !== 'Merchandise') return false
      if (tab === 'bundles' && row.kind !== 'bundle') return false
      if (status !== 'All' && row.status !== status) return false
      const term = search.trim().toLowerCase()
      return !term || row.name.toLowerCase().includes(term) || row.secondary.toLowerCase().includes(term)
    })
  }, [search, status, tab])

  const usedInColumn: ColumnsType<CatalogTableRow>[number] = {
    title: 'Used in',
    key: 'usedIn',
    width: 140,
    render: (_, row) => {
      if (row.kind === 'bundle') return <Text type="secondary">-</Text>
      const parts = [
        row.usedInOffers ? `${row.usedInOffers} listing${row.usedInOffers === 1 ? '' : 's'}` : null,
        row.usedInBundles ? `${row.usedInBundles} bundle${row.usedInBundles === 1 ? '' : 's'}` : null,
      ].filter(Boolean)
      return parts.length ? (
        <Space orientation="vertical" size={0}>
          {parts.map((part) => <Text type="secondary" key={part}>{part}</Text>)}
        </Space>
      ) : <Text type="secondary">Not in use</Text>
    },
  }

  const columns: ColumnsType<CatalogTableRow> = [
    {
      title: 'ID',
      key: 'id',
      fixed: 'left',
      width: 72,
      render: (_: unknown, row) => rows.findIndex((item) => item.key === row.key) + 1,
    },
    {
      title: tab === 'bundles' ? 'Bundle name' : 'Product Name',
      dataIndex: 'name',
      fixed: 'left',
      width: 280,
      render: (name: string, row) => (
        <Space orientation="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary">{row.secondary}</Text>
        </Space>
      ),
    },
    ...(tab === 'all' ? [
      {
        title: 'Type',
        dataIndex: 'typeLabel',
        width: 180,
        render: (value: string) => <Tag color={value === 'Telco' ? 'purple' : value.includes('+') ? 'blue' : undefined}>{value}</Tag>,
      },
      { title: 'Category', dataIndex: 'category', width: 150 },
    ] as ColumnsType<CatalogTableRow> : []),
    ...(tab === 'telco' ? [
      { title: 'Subscription type', dataIndex: 'subscriptionType', width: 200, render: (value?: string) => value ?? '-' },
      { title: 'Duration', dataIndex: 'duration', width: 140, render: (value?: string) => value ?? '-' },
      { title: 'Data allowance', dataIndex: 'dataAllowance', width: 150, render: (value?: string) => value ?? '-' },
    ] as ColumnsType<CatalogTableRow> : []),
    ...(tab === 'merchandise' ? [
      { title: 'Category', dataIndex: 'category', width: 160 },
      { title: 'Variants', dataIndex: 'variantCount', width: 120, render: (value?: number) => value ?? '-' },
    ] as ColumnsType<CatalogTableRow> : []),
    ...(tab === 'bundles' ? [
      { title: 'Type', dataIndex: 'typeLabel', width: 180, render: (value: string) => <Tag color="blue">{value}</Tag> },
      {
        title: 'Components',
        dataIndex: 'componentNames',
        width: 300,
        render: (names?: string[]) => (
          <Space orientation="vertical" size={0}>
            {names?.map((name) => <Text type="secondary" key={name}>{name}</Text>)}
          </Space>
        ),
      },
      {
        title: 'Issues',
        dataIndex: 'issues',
        width: 140,
        render: (issues?: string[]) => issues?.length ? <Tag color="red">{issues.length} to fix</Tag> : <Text type="secondary">None</Text>,
      },
    ] as ColumnsType<CatalogTableRow> : []),
    ...(tab === 'bundles' ? [] : [usedInColumn]),
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      render: (value: string) => <Tag color={statusColor(value)}>{value}</Tag>,
    },
    {
      title: 'Last updated',
      dataIndex: 'updatedAt',
      width: 170,
      render: (value: string, row) => (
        <Space orientation="vertical" size={0}>
          <Text>{value}</Text>
          <Text type="secondary">by {row.owner}</Text>
        </Space>
      ),
    },
    {
      title: '',
      key: 'actions',
      fixed: 'right',
      width: 64,
      render: () => (
        <Dropdown menu={{ items: [{ key: 'view', label: 'View' }, { key: 'edit', label: 'Edit' }, { key: 'duplicate', label: 'Duplicate' }] }}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ]

  const counts = {
    all: initialCatalogRows.length,
    telco: initialCatalogRows.filter((row) => row.typeLabel === 'Telco').length,
    merchandise: initialCatalogRows.filter((row) => row.typeLabel === 'Merchandise').length,
    bundles: initialCatalogRows.filter((row) => row.kind === 'bundle').length,
  }

  return (
    <Space orientation="vertical" size={12} className="page-container">
      <Flex justify="space-between" align="flex-start" gap={16} wrap className="page-header">
        <Space orientation="vertical" size={4} className="page-header-copy">
          <Title level={3}>Products</Title>
          <Text type="secondary">Everything the catalog can sell, in one list.</Text>
        </Space>
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              { key: 'product', icon: <PlusOutlined />, label: 'Create product' },
              { key: 'product-new', icon: <PlusOutlined />, label: 'Create Product New' },
              { key: 'bundle', icon: <PlusOutlined />, label: 'Create bundle' },
            ],
            onClick: ({ key }) => {
              if (key === 'product') {
                setCreateKind('Telco')
                setCreateCategory(undefined)
                setCreateSchema(undefined)
                setCreateOpen(true)
              } else if (key === 'product-new') {
                onCreateProductNew?.()
              } else {
                message.info('Open the existing bundle flow in the host application')
              }
            },
          }}
        >
          <Button type="primary">Create <DownOutlined /></Button>
        </Dropdown>
      </Flex>

      <Card>
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          <Tabs
            activeKey={tab}
            onChange={(key) => setTab(key as CatalogTab)}
            items={[
              { key: 'all', label: `All (${counts.all})` },
              { key: 'telco', label: `Telco (${counts.telco})` },
              { key: 'merchandise', label: `Merchandise (${counts.merchandise})` },
              { key: 'bundles', label: `Bundles (${counts.bundles})` },
            ]}
          />
          <Space wrap>
            <Input
              allowClear
              placeholder="Search products and bundles"
              prefix={<SearchOutlined />}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={{ width: 320 }}
            />
            <Select
              value={status}
              onChange={setStatus}
              style={{ width: 160 }}
              options={['All', 'Active', 'Review', 'Draft', 'Incomplete', 'Archived'].map((value) => ({
                value,
                label: value === 'All' ? 'All statuses' : value,
              }))}
            />
            <Button icon={<FilterOutlined />} onClick={() => setShowMoreFilters((value) => !value)}>
              {showMoreFilters ? 'Less' : 'More'}
            </Button>
          </Space>
          {showMoreFilters ? (
            <Flex gap={12} wrap>
              <Select
                placeholder="All categories"
                style={{ width: 200 }}
                options={merchandiseCategories.map((value) => ({ value, label: value }))}
              />
              <Select
                placeholder="All schemas"
                style={{ width: 200 }}
                options={merchandiseSchemas.map((value) => ({ value, label: value }))}
              />
            </Flex>
          ) : null}
          <Table
            columns={columns}
            dataSource={rows}
            rowSelection={{}}
            scroll={{ x: 1160 }}
            pagination={{ pageSize: 20, showSizeChanger: true }}
          />
        </Space>
      </Card>

      <Modal
        title="Create product"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        width={640}
        okButtonProps={{
          disabled: createKind === 'Merchandise' && (!createCategory || !createSchema),
        }}
        onOk={() => {
          setCreateOpen(false)
          if (createKind === 'Telco') {
            onCreateTelco()
            return
          }
          if (createKind === 'Merchandise') {
            message.success('Continue to the merchandise product form')
            return
          }
          message.info(`Continue to the ${createKind.toLowerCase()} product form`)
        }}
        okText="Continue"
      >
        <Form layout="vertical" requiredMark={false}>
          <Form.Item label="Business Domain">
            <div className="create-product-kind-grid">
              {CREATE_PRODUCT_KIND_OPTIONS.map((option) => {
                const selected = createKind === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`create-product-kind-card${selected ? ' selected' : ''}`}
                    onClick={() => {
                      setCreateKind(option.value)
                      setCreateCategory(undefined)
                      setCreateSchema(undefined)
                    }}
                  >
                    <span className={`create-product-kind-icon tone-${option.tone}`}>
                      {option.icon}
                    </span>
                    <span className="create-product-kind-title">{option.title}</span>
                    <span className="create-product-kind-description">{option.description}</span>
                  </button>
                )
              })}
            </div>
          </Form.Item>
          {createKind === 'Merchandise' ? (
            <>
              <Form.Item label="Category">
                <Select
                  placeholder="Select category"
                  value={createCategory}
                  onChange={setCreateCategory}
                  options={merchandiseCategories.map((value) => ({ value, label: value }))}
                />
              </Form.Item>
              <Form.Item label="Schema">
                <Select
                  placeholder="Select schema"
                  value={createSchema}
                  onChange={setCreateSchema}
                  options={merchandiseSchemas.map((value) => ({ value, label: value }))}
                />
              </Form.Item>
            </>
          ) : null}
        </Form>
      </Modal>
    </Space>
  )
}
