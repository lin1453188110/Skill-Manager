import { useState, useEffect } from 'react'
import { Timeline, Button, Typography, Spin, message, Popconfirm, Tag, Empty } from 'antd'
import { RollbackOutlined, HistoryOutlined } from '@ant-design/icons'
import { fetchHistory, rollbackHistory } from '../lib/api'
import type { HistoryEntry } from '../lib/types'

export default function History() {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    setLoading(true)
    try {
      const data = await fetchHistory()
      setEntries(data)
    } catch {
      message.error('加载历史失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleRollback(entry: HistoryEntry) {
    try {
      await rollbackHistory(entry.id)
      message.success('回滚成功')
      loadHistory()
    } catch {
      message.error('回滚失败')
    }
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  const actionLabels: Record<string, string> = {
    'edit-skill': '编辑技能',
    'create-skill': '创建技能',
    'delete-skill': '删除技能',
    'install-plugin': '安装插件',
    'toggle-plugin': '切换插件状态'
  }

  return (
    <div>
      <Typography.Title level={4}>
        <HistoryOutlined /> 操作历史
      </Typography.Title>

      {entries.length === 0 ? (
        <Empty description="暂无操作记录" />
      ) : (
        <Timeline
          items={entries.map(entry => ({
            color: entry.rolledBack ? 'gray' : 'blue',
            children: (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Typography.Text>
                    {actionLabels[entry.action] || entry.action}
                  </Typography.Text>
                  <br />
                  <Typography.Text type="secondary">
                    {entry.description}
                  </Typography.Text>
                  <br />
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(entry.timestamp).toLocaleString('zh-CN')}
                  </Typography.Text>
                  {entry.rolledBack && <Tag color="orange" style={{ marginLeft: 8 }}>已回滚</Tag>}
                </div>
                {!entry.rolledBack && (
                  <Popconfirm
                    title="确定回滚到此操作前？"
                    description="将恢复操作前的文件状态"
                    onConfirm={() => handleRollback(entry)}
                    okText="确定回滚"
                    cancelText="取消"
                  >
                    <Button size="small" icon={<RollbackOutlined />} danger>
                      回滚
                    </Button>
                  </Popconfirm>
                )}
              </div>
            )
          }))}
        />
      )}
    </div>
  )
}
