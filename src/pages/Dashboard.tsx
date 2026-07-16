import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Statistic, Typography, List, Spin, Tag } from 'antd'
import { AppstoreOutlined, FileTextOutlined, HistoryOutlined } from '@ant-design/icons'
import { fetchPlugins, fetchHistory } from '../lib/api'
import type { PluginInfo, HistoryEntry } from '../lib/types'

export default function Dashboard() {
  const [plugins, setPlugins] = useState<PluginInfo[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      const [p, h] = await Promise.all([fetchPlugins(), fetchHistory()])
      setPlugins(p)
      setHistory(h)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  const totalSkills = plugins.reduce((sum, p) => sum + p.skillCount, 0)
  const enabledPlugins = plugins.filter(p => p.enabled).length

  return (
    <div>
      <Typography.Title level={4}>仪表盘</Typography.Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="已安装插件"
              value={plugins.length}
              prefix={<AppstoreOutlined />}
              suffix={`/ 启用 ${enabledPlugins}`}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="技能总数"
              value={totalSkills}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="操作记录"
              value={history.length}
              prefix={<HistoryOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="插件概览" extra={<a onClick={() => navigate('/plugins')}>查看全部 →</a>}>
            <List
              size="small"
              dataSource={plugins}
              renderItem={p => (
                <List.Item>
                  <List.Item.Meta
                    title={p.name}
                    description={`v${p.version} · ${p.skillCount} 个技能`}
                  />
                  <Tag color={p.enabled ? 'green' : 'red'}>
                    {p.enabled ? '已启用' : '已禁用'}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="最近操作" extra={<a onClick={() => navigate('/history')}>查看全部 →</a>}>
            <List
              size="small"
              dataSource={history.slice(0, 5)}
              renderItem={h => (
                <List.Item>
                  <List.Item.Meta
                    title={h.description}
                    description={new Date(h.timestamp).toLocaleString('zh-CN')}
                  />
                </List.Item>
              )}
              locale={{ emptyText: '暂无操作记录' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
