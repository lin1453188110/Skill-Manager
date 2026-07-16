import { useState, useEffect } from 'react'
import { Card, List, Button, Tag, Typography, Spin, Input, message, Space, Tabs } from 'antd'
import { DownloadOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { fetchMarketplaces, fetchMarketplacePlugins, fetchOfficialPlugins, installMarketplacePlugin } from '../lib/api'
import type { MarketplaceInfo, MarketplacePlugin } from '../lib/types'

export default function Marketplace() {
  const [marketplaces, setMarketplaces] = useState<MarketplaceInfo[]>([])
  const [plugins, setPlugins] = useState<MarketplacePlugin[]>([])
  const [loading, setLoading] = useState(true)
  const [installing, setInstalling] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeMarketplace, setActiveMarketplace] = useState<string>('')

  useEffect(() => {
    loadMarketplaces()
  }, [])

  async function loadMarketplaces() {
    setLoading(true)
    try {
      const mps = await fetchMarketplaces()
      setMarketplaces(mps)
      // 默认显示官方市场
      setActiveMarketplace('official')
      await loadPlugins('official')
    } catch {
      message.error('加载市场失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadPlugins(marketplaceId: string) {
    setLoading(true)
    try {
      const p = marketplaceId === 'official'
        ? await fetchOfficialPlugins()
        : await fetchMarketplacePlugins(marketplaceId)
      setPlugins(p)
    } catch {
      message.error('加载插件列表失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleInstall(mp: MarketplacePlugin) {
    setInstalling(mp.id)
    try {
      await installMarketplacePlugin(mp.marketplace, mp.name, mp.sourceUrl)
      message.success(`${mp.name} 安装成功`)
      // 刷新列表
      await loadPlugins(activeMarketplace)
    } catch (err: any) {
      message.error('安装失败: ' + (err?.message || '网络错误'))
    } finally {
      setInstalling(null)
    }
  }

  function handleMarketplaceChange(key: string) {
    setActiveMarketplace(key)
    setSearch('')
    loadPlugins(key)
  }

  const filteredPlugins = plugins.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>技能市场</Typography.Title>
        <Button icon={<ReloadOutlined />} onClick={() => loadPlugins(activeMarketplace)}>刷新</Button>
      </Space>

      {marketplaces.length === 0 ? (
        <Typography.Text type="secondary">暂无已注册的市场源，请在 Claude Code 中添加市场</Typography.Text>
      ) : (
        <>
          <Tabs
            activeKey={activeMarketplace}
            onChange={handleMarketplaceChange}
            items={[
              { key: 'official', label: '🏛️ 官方市场' },
              ...marketplaces.map(m => ({
                key: m.id,
                label: m.name,
              }))
            ]}
            style={{ marginBottom: 16 }}
          />

          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索插件..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: 16, maxWidth: 400 }}
          />

          {loading ? (
            <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />
          ) : filteredPlugins.length === 0 ? (
            <Typography.Text type="secondary">
              {search ? '没有匹配的插件' : '该市场暂无可用插件'}
            </Typography.Text>
          ) : (
            <List
              dataSource={filteredPlugins}
              renderItem={item => (
                <Card size="small" style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <Typography.Text strong>{item.name}</Typography.Text>
                      <Tag style={{ marginLeft: 8 }}>{item.version}</Tag>
                      {item.category && <Tag color="purple">{item.category}</Tag>}
                      {item.installs ? <Tag>📊 {item.installs.toLocaleString()} 次安装</Tag> : null}
                      {item.installed && <Tag color="green">已安装</Tag>}
                      <br />
                      <Typography.Text type="secondary">{item.description || '暂无描述'}</Typography.Text>
                    </div>
                    <Button
                      type={item.installed ? 'default' : 'primary'}
                      icon={<DownloadOutlined />}
                      loading={installing === item.id}
                      disabled={item.installed}
                      onClick={() => handleInstall(item)}
                    >
                      {item.installed ? '已安装' : '安装'}
                    </Button>
                  </div>
                </Card>
              )}
            />
          )}
        </>
      )}
    </div>
  )
}
