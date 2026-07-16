import { Card, Switch, Tag, List, Typography, Space, Button, Popconfirm, Checkbox } from 'antd'
import { CaretDownOutlined, CaretRightOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { PluginInfo } from '../lib/types'

interface Props {
  plugin: PluginInfo
  expanded: boolean
  selectMode?: boolean
  selectedIds?: Set<string>
  onToggleExpand: () => void
  onToggleEnabled: (enabled: boolean) => void
  onEditSkill: (skillId: string) => void
  onDeleteSkill: (skillId: string) => void
  onToggleSelect?: (skillId: string) => void
  onSelectAll?: () => void
}

export default function PluginCard({
  plugin, expanded, selectMode, selectedIds,
  onToggleExpand, onToggleEnabled, onEditSkill, onDeleteSkill,
  onToggleSelect, onSelectAll
}: Props) {
  return (
    <Card
      size="small"
      style={{ marginBottom: 8 }}
      title={
        <Space>
          <Button
            type="text"
            size="small"
            icon={expanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
            onClick={onToggleExpand}
          />
          <span style={{ fontWeight: 600 }}>{plugin.name}</span>
          <Tag color="blue">{plugin.version}</Tag>
          <Typography.Text type="secondary">
            {plugin.skillCount} 个技能
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {plugin.marketplace}
          </Typography.Text>
        </Space>
      }
      extra={
        <Space>
          {selectMode && expanded && onSelectAll && (
            <Button size="small" onClick={onSelectAll}>
              {plugin.skills.every(s => selectedIds?.has(s.id)) ? '取消全选' : '全选'}
            </Button>
          )}
          <Switch
            checked={plugin.enabled}
            onChange={onToggleEnabled}
            checkedChildren="已启用"
            unCheckedChildren="已禁用"
          />
        </Space>
      }
    >
      {expanded && (
        <List
          size="small"
          dataSource={plugin.skills}
          renderItem={skill => (
            <List.Item
              actions={selectMode ? [] : [
                <Button type="link" icon={<EditOutlined />} onClick={() => onEditSkill(skill.id)}>
                  编辑
                </Button>,
                <Popconfirm
                  title="确定删除这个技能？"
                  description={`将删除 ${skill.name} 的 SKILL.md 文件`}
                  onConfirm={() => onDeleteSkill(skill.id)}
                  okText="确定删除"
                  cancelText="取消"
                >
                  <Button type="link" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              ]}
            >
              {selectMode && onToggleSelect && (
                <Checkbox
                  checked={selectedIds?.has(skill.id) || false}
                  onChange={() => onToggleSelect(skill.id)}
                  style={{ marginRight: 12 }}
                />
              )}
              <List.Item.Meta
                title={skill.name}
                description={skill.description || '无描述'}
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  )
}
