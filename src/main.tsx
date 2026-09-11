import React from 'react'
import ReactDOM from 'react-dom/client'
import { App as AntApp, ConfigProvider } from 'antd'
import CatalogApp from './App'
import { circlesTheme } from './theme'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider theme={circlesTheme}>
      <AntApp>
        <CatalogApp />
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>,
)
