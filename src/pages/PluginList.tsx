import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography, Spin, message, Button, Space, Modal, Input } from 'antd'
import { ExportOutlined, ImportOutlined, CheckSquareOutlined } from '@ant-design/icons'
import PluginCard from '../components/PluginCard'
import { fetchPlugins, togglePlugin, removeSkill, exportSkills, importSkills } from '../lib/api'
import type { PluginInfo } from '../lib/types'

export default function PluginList() {
  const [plugins, setPlugins] = useState<PluginInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importZipPath, setImportZipPath] = useState('')
  const [importTargetPlugin, setImportTargetPlugin] = useState('')
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadPlugins()
  }, [])

  async function loadPlugins() {
    setLoading(true)
    try {
      const data = await fetchPlugins()
      setPlugins(data)
    } catch (err) {
      message.error('加载插件列表失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(plugin: PluginInfo, enabled: boolean) {
    try {
      await togglePlugin(plugin.id, enabled)
      setPlugins(prev =>
        prev.map(p => p.id === plugin.id ? { ...p, enabled } : p)
      )
      message.success(`${enabled ? '启用' : '禁用'} ${plugin.name} 成功`)
    } catch {
      message.error('操作失败')
    }
  }

  function handleExpand(pluginId: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(pluginId)) next.delete(pluginId)
      else next.add(pluginId)
      return next
    })
  }

  async function handleDeleteSkill(skillId: string) {
    try {
      await removeSkill(skillId)
      message.success('技能已删除')
      loadPlugins()
    } catch {
      message.error('删除失败')
    }
  }

  function handleToggleSelect(skillId: string) {
    setSelectedSkillIds(prev => {
      const next = new Set(prev)
      if (next.has(skillId)) next.delete(skillId)
      else next.add(skillId)
      return next
    })
  }

  function handleSelectAll(plugin: PluginInfo) {
    setSelectedSkillIds(prev => {
      const next = new Set(prev)
      const allPluginSkillIds = plugin.skills.map(s => s.id)
      const allSelected = allPluginSkillIds.every(id => next.has(id))
      if (allSelected) {
        allPluginSkillIds.forEach(id => next.delete(id))
      } else {
        allPluginSkillIds.forEach(id => next.add(id))
      }
      return next
    })
  }

  async function handleExport() {
    if (selectedSkillIds.size === 0) {
      message.warning('请先勾选要导出的技能')
      return
    }
    setExporting(true)
    try {
      const zipPath = await exportSkills(Array.from(selectedSkillIds))
      message.success(`已导出到 ${zipPath}`)
      setSelectMode(false)
      setSelectedSkillIds(new Set())
    } catch (err: any) {
      message.error('导出失败: ' + (err?.message || '未知错误'))
    } finally {
      setExporting(false)
    }
  }

  async function handleImport() {
    if (!importZipPath.trim()) {
      message.warning('请输入 zip 文件路径')
      return
    }
    if (!importTargetPlugin.trim()) {
      message.warning('请输入目标插件 ID（如 superpowers@superpowers-marketplace）')
      return
    }
    setImporting(true)
    try {
      const result = await importSkills(importZipPath.trim(), importTargetPlugin.trim())
      if (result.imported.length > 0) {
        message.success(`成功导入 ${result.imported.length} 个技能`)
      }
      if (result.errors.length > 0) {
        message.warning(`${result.errors.length} 个失败: ${result.errors.join(', ')}`)
      }
      setImportModalOpen(false)
      setImportZipPath('')
      setImportTargetPlugin('')
      loadPlugins()
    } catch (err: any) {
      message.error('导入失败: ' + (err?.message || '未知错误'))
    } finally {
      setImporting(false)
    }
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>已安装插件</Typography.Title>
        <Space>
          {selectMode ? (
            <>
              <span style={{ color: '#1677ff' }}>已选 {selectedSkillIds.size} 个</span>
              <Button icon={<ExportOutlined />} type="primary" loading={exporting} onClick={handleExport}>
                导出选中
              </Button>
              <Button onClick={() => { setSelectMode(false); setSelectedSkillIds(new Set()) }}>
                取消
              </Button>
            </>
          ) : (
            <>
              <Button icon={<CheckSquareOutlined />} onClick={() => setSelectMode(true)}>
                选择导出
              </Button>
              <Button icon={<ImportOutlined />} onClick={() => setImportModalOpen(true)}>
                导入
              </Button>
            </>
          )}
        </Space>
      </div>

      {plugins.length === 0 ? (
        <Typography.Text type="secondary">暂无已安装插件</Typography.Text>
      ) : (
        plugins.map(plugin => (
          <PluginCard
            key={plugin.id}
            plugin={plugin}
            expanded={expandedIds.has(plugin.id)}
            selectMode={selectMode}
            selectedIds={selectedSkillIds}
            onToggleExpand={() => handleExpand(plugin.id)}
            onToggleEnabled={(enabled) => handleToggle(plugin, enabled)}
            onEditSkill={(skillId) => navigate(`/editor/${encodeURIComponent(skillId)}`)}
            onDeleteSkill={handleDeleteSkill}
            onToggleSelect={handleToggleSelect}
            onSelectAll={() => handleSelectAll(plugin)}
          />
        ))
      )}

      <Modal
        title="导入技能"
        open={importModalOpen}
        onOk={handleImport}
        onCancel={() => setImportModalOpen(false)}
        confirmLoading={importing}
        okText="导入"
        cancelText="取消"
      >
        <div style={{ marginBottom: 12 }}>
          <Typography.Text>zip 文件路径</Typography.Text>
          <Input
            placeholder="C:\Users\xxx\Desktop\skills-export.zip"
            value={importZipPath}
            onChange={e => setImportZipPath(e.target.value)}
          />
        </div>
        <div>
          <Typography.Text>目标插件 ID</Typography.Text>
          <Input
            placeholder="superpowers@superpowers-marketplace"
            value={importTargetPlugin}
            onChange={e => setImportTargetPlugin(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}
