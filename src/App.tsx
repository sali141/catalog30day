import { useState } from 'react'
import {
  GiftOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShopOutlined,
} from '@ant-design/icons'
import { Button, Layout, Menu } from 'antd'
import { ProductsBundlesPage } from './pages/ProductsBundlesPage'
import { ProductListingsPage } from './pages/ProductListingsPage'
import { TelcoProductFlowPage } from './pages/TelcoProductFlowPage'
import circlesLogo from './assets/circles-logo.png'

const { Sider, Content } = Layout

type PageKey = 'products' | 'listings' | 'telco-create'

const menuItems = [
  {
    type: 'group' as const,
    label: 'Catalog',
    children: [
      { key: 'products', icon: <GiftOutlined />, label: 'Products' },
      { key: 'listings', icon: <ShopOutlined />, label: 'Offers' },
    ],
  },
]

export default function CatalogApp() {
  const [page, setPage] = useState<PageKey>('products')
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Layout className="app-shell">
      <Sider
        width={264}
        collapsedWidth={72}
        collapsed={collapsed}
        breakpoint="lg"
        onCollapse={setCollapsed}
        theme="light"
        className="app-sider"
      >
        <div className="brand">
          <img src={circlesLogo} alt="Circles X" className="brand-logo" />
          <Button
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            className="nav-toggle-button"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((value) => !value)}
            type="text"
          />
        </div>
        <Menu
          mode="inline"
          selectedKeys={[page === 'telco-create' ? 'products' : page]}
          items={menuItems}
          onClick={({ key }) => setPage(key as PageKey)}
        />
      </Sider>

      <Layout>
        <Content className="app-content">
          {page === 'products' && <ProductsBundlesPage onCreateTelco={() => setPage('telco-create')} />}
          {page === 'listings' && <ProductListingsPage />}
          {page === 'telco-create' && (
            <TelcoProductFlowPage
              onBack={() => setPage('products')}
              onContinueToListing={() => setPage('listings')}
            />
          )}
        </Content>
      </Layout>
    </Layout>
  )
}
