import { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Typography } from 'antd'
import {
  DashboardOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import Dashboard from './pages/Dashboard'
import PluginList from './pages/PluginList'
import SkillEditor from './pages/SkillEditor'
import Marketplace from './pages/Marketplace'
import History from './pages/History'

const { Sider, Content, Header } = Layout

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/plugins', icon: <AppstoreOutlined />, label: '插件管理' },
  { key: '/marketplace', icon: <ShoppingOutlined />, label: '技能市场' },
  { key: '/history', icon: <HistoryOutlined />, label: '操作历史' }
]

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const currentKey = '/' + location.pathname.split('/')[1]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        style={{ borderRight: '1px solid #f0f0f0' }}
      >
        <div style={{
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: collapsed ? 14 : 18,
          borderBottom: '1px solid #f0f0f0'
        }}>
          {collapsed ? '🛠️' : '🛠️ Skill 管理器'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {menuItems.find(m => m.key === currentKey)?.label || 'Skill 管理器'}
          </Typography.Title>
        </Header>
        <Content style={{ padding: 24, background: '#f5f5f5', overflow: 'auto' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/plugins" element={<PluginList />} />
            <Route path="/editor/:skillId" element={<SkillEditor />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}
