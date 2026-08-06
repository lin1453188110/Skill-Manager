import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography, Spin, message, Button, Space, Modal, Input, Select, Divider, Progress } from 'antd'
import { ExportOutlined, ImportOutlined, CheckSquareOutlined, PlusOutlined, LinkOutlined, DeleteOutlined } from '@ant-design/icons'
import PluginCard from '../components/PluginCard'
import { fetchPlugins, togglePlugin, deletePlugin, createPlugin, removeSkill, exportSkills, importSkills, createNewSkill, installMarketplacePlugin, fetchInstallProgress } from '../lib/api'
import type { PluginInfo } from '../lib/types'

export default function PluginList() {
  const [plugins, setPlugins] = useState<PluginInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)

  // 导入 Modal
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importZipPath, setImportZipPath] = useState('')
  const [importTargetPlugin, setImportTargetPlugin] = useState('')
  const [importing, setImporting] = useState(false)

  // 新建技能 Modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createPluginId, setCreatePluginId] = useState('')
  const [createFolder, setCreateFolder] = useState('')
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [createBody, setCreateBody] = useState('')
  const [creating, setCreating] = useState(false)

  // 新建插件 Modal
  const [newPluginModalOpen, setNewPluginModalOpen] = useState(false)
  const [newPluginName, setNewPluginName] = useState('')
  const [newPluginMarket, setNewPluginMarket] = useState('local')
  const [newPluginDesc, setNewPluginDesc] = useState('')
  const [creatingPlugin, setCreatingPlugin] = useState(false)

  // URL 安装 Modal
  const [urlModalOpen, setUrlModalOpen] = useState(false)
  const [urlInstallUrl, setUrlInstallUrl] = useState('')
  const [urlInstallName, setUrlInstallName] = useState('')
  const [urlInstalling, setUrlInstalling] = useState(false)

  // URL 安装进度
  const [progressPercent, setProgressPercent] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [progressModalOpen, setProgressModalOpen] = useState(false)
  const [progressStatus, setProgressStatus] = useState<'active' | 'success' | 'exception'>('active')
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const [exporting, setExporting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadPlugins()
    return () => { if (pollTimer.current) clearInterval(pollTimer.current) }
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
      setPlugins(prev => prev.map(p => p.id === plugin.id ? { ...p, enabled } : p))
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

  async function handleDeletePlugin(pluginId: string) {
    try {
      await deletePlugin(pluginId)
      message.success('插件已删除')
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

  // ===== 导出 =====
  async function handleExport() {
    if (selectedSkillIds.size === 0) { message.warning('请先勾选要导出的技能'); return }
    setExporting(true)
    try {
      const zipPath = await exportSkills(Array.from(selectedSkillIds))
      message.success(`已导出到 ${zipPath}`)
      setSelectMode(false); setSelectedSkillIds(new Set())
    } catch (err: any) {
      message.error('导出失败: ' + (err?.message || '未知错误'))
    } finally { setExporting(false) }
  }

  // ===== 导入 =====
  async function handleImport() {
    if (!importZipPath.trim()) { message.warning('请输入 zip 文件路径'); return }
    if (!importTargetPlugin.trim()) { message.warning('请输入目标插件 ID'); return }
    setImporting(true)
    try {
      const result = await importSkills(importZipPath.trim(), importTargetPlugin.trim())
      if (result.imported.length > 0) message.success(`成功导入 ${result.imported.length} 个技能`)
      if (result.errors.length > 0) message.warning(`${result.errors.length} 个失败: ${result.errors.join(', ')}`)
      setImportModalOpen(false); setImportZipPath(''); setImportTargetPlugin('')
      loadPlugins()
    } catch (err: any) {
      message.error('导入失败: ' + (err?.message || '未知错误'))
    } finally { setImporting(false) }
  }

  // ===== 新建技能 =====
  async function handleCreate() {
    if (!createPluginId) { message.warning('请选择插件'); return }
    if (!createFolder.trim()) { message.warning('请输入目录名'); return }
    if (!createName.trim()) { message.warning('请输入技能名称'); return }
    setCreating(true)
    try {
      const id = await createNewSkill(createPluginId, createFolder.trim(),
        { name: createName.trim(), description: createDesc.trim() }, createBody)
      if (id) {
        message.success(`技能 ${createName} 创建成功`)
        setCreateModalOpen(false)
        setCreatePluginId(''); setCreateFolder(''); setCreateName(''); setCreateDesc(''); setCreateBody('')
        loadPlugins()
      } else {
        message.error('创建失败：目录已存在或插件无效')
      }
    } catch (err: any) {
      message.error('创建失败: ' + (err?.message || '未知错误'))
    } finally { setCreating(false) }
  }

  // ===== 新建插件 =====
  async function handleCreatePlugin() {
    if (!newPluginName.trim()) { message.warning('请输入插件名称'); return }
    setCreatingPlugin(true)
    try {
      const id = await createPlugin(newPluginName.trim(), newPluginMarket.trim() || 'local', newPluginDesc.trim())
      if (id) {
        message.success(`插件 ${newPluginName} 创建成功`)
        setNewPluginModalOpen(false)
        setNewPluginName(''); setNewPluginMarket('local'); setNewPluginDesc('')
        loadPlugins()
      }
    } catch (err: any) {
      message.error('创建失败: ' + (err?.message || '未知错误'))
    } finally { setCreatingPlugin(false) }
  }

  // ===== URL 安装进度轮询 =====
  function stopPolling() {
    if (pollTimer.current) {
      clearInterval(pollTimer.current)
      pollTimer.current = null
    }
  }

  async function pollProgress(key: string) {
    try {
      const p = await fetchInstallProgress(key)
      if (!p) return
      setProgressPercent(p.percent)
      setProgressMsg(p.message)
      if (p.status === 'done') {
        setProgressStatus('success')
        setProgressMsg('安装完成')
        stopPolling()
        setTimeout(() => setProgressModalOpen(false), 800)
        setUrlInstalling(false)
        message.success('安装成功')
        loadPlugins()
      } else if (p.status === 'error') {
        setProgressStatus('exception')
        stopPolling()
        setUrlInstalling(false)
      }
    } catch {
      // 忽略轮询错误
    }
  }

  // ===== URL 安装 =====
  async function handleUrlInstall() {
    if (!urlInstallUrl.trim()) { message.warning('请输入 Git 仓库地址'); return }
    if (!urlInstallName.trim()) { message.warning('请输入插件名称'); return }
    const progressKey = `url-install-${urlInstallName.trim()}-${Date.now()}`
    setUrlInstalling(true)
    setProgressPercent(0)
    setProgressMsg('准备安装...')
    setProgressStatus('active')
    setProgressModalOpen(true)

    // 启动进度轮询
    if (pollTimer.current) clearInterval(pollTimer.current)
    pollTimer.current = setInterval(() => pollProgress(progressKey), 500)

    try {
      // 使用 url 源安装，无 marketplace
      await installMarketplacePlugin('url-install', urlInstallName.trim(), urlInstallUrl.trim(), 'url', undefined, progressKey)
      // 关闭安装 Modal，等待轮询确认完成
      setUrlModalOpen(false); setUrlInstallUrl(''); setUrlInstallName('')
    } catch (err: any) {
      stopPolling()
      setProgressStatus('exception')
      setProgressMsg('安装失败: ' + (err?.message || '未知错误'))
      setUrlInstalling(false)
    }
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  const pluginOptions = plugins.map(p => ({ label: `${p.name} (${p.id})`, value: p.id }))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>已安装插件</Typography.Title>
        <Space>
          {selectMode ? (
            <>
              <span style={{ color: '#1677ff' }}>已选 {selectedSkillIds.size} 个</span>
              <Button icon={<ExportOutlined />} type="primary" loading={exporting} onClick={handleExport}>导出选中</Button>
              <Button onClick={() => { setSelectMode(false); setSelectedSkillIds(new Set()) }}>取消</Button>
            </>
          ) : (
            <>
              <Button icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>新建技能</Button>
              <Button onClick={() => setNewPluginModalOpen(true)}>新建插件</Button>
              <Button icon={<LinkOutlined />} onClick={() => setUrlModalOpen(true)}>URL 安装</Button>
              <Button icon={<CheckSquareOutlined />} onClick={() => setSelectMode(true)}>选择导出</Button>
              <Button icon={<ImportOutlined />} onClick={() => setImportModalOpen(true)}>导入</Button>
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
            onDeletePlugin={handleDeletePlugin}
            onToggleSelect={handleToggleSelect}
            onSelectAll={() => handleSelectAll(plugin)}
          />
        ))
      )}

      {/* 新建技能 Modal */}
      <Modal title="新建技能" open={createModalOpen} onOk={handleCreate} onCancel={() => setCreateModalOpen(false)}
        confirmLoading={creating} okText="创建" cancelText="取消" width={600}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Typography.Text>所属插件</Typography.Text>
            <Select placeholder="选择插件" value={createPluginId || undefined} onChange={setCreatePluginId}
              options={pluginOptions} style={{ width: '100%' }} />
          </div>
          <div>
            <Typography.Text>目录名（英文）</Typography.Text>
            <Input placeholder="my-skill" value={createFolder} onChange={e => setCreateFolder(e.target.value)} />
          </div>
          <div>
            <Typography.Text>技能名称</Typography.Text>
            <Input placeholder="我的技能" value={createName} onChange={e => setCreateName(e.target.value)} />
          </div>
          <div>
            <Typography.Text>描述</Typography.Text>
            <Input placeholder="这个技能的用途..." value={createDesc} onChange={e => setCreateDesc(e.target.value)} />
          </div>
          <div>
            <Typography.Text>正文内容（可选）</Typography.Text>
            <Input.TextArea rows={6} placeholder="Markdown 正文..." value={createBody} onChange={e => setCreateBody(e.target.value)} />
          </div>
        </Space>
      </Modal>

      {/* 新建插件 Modal */}
      <Modal title="新建插件" open={newPluginModalOpen} onOk={handleCreatePlugin}
        onCancel={() => setNewPluginModalOpen(false)} confirmLoading={creatingPlugin} okText="创建" cancelText="取消">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Typography.Text>插件名称（英文）</Typography.Text>
            <Input placeholder="my-plugin" value={newPluginName}
              onChange={e => setNewPluginName(e.target.value)} />
          </div>
          <div>
            <Typography.Text>市场标识</Typography.Text>
            <Input placeholder="local" value={newPluginMarket}
              onChange={e => setNewPluginMarket(e.target.value)} />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>如 local、my-market 等，用于区分插件来源</Typography.Text>
          </div>
          <div>
            <Typography.Text>描述（可选）</Typography.Text>
            <Input placeholder="这个插件的用途..." value={newPluginDesc}
              onChange={e => setNewPluginDesc(e.target.value)} />
          </div>
        </Space>
      </Modal>

      {/* URL 安装 Modal */}
      <Modal title="通过 Git URL 安装插件" open={urlModalOpen} onOk={handleUrlInstall}
        onCancel={() => setUrlModalOpen(false)} confirmLoading={urlInstalling} okText="安装" cancelText="取消">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Typography.Text>Git 仓库地址</Typography.Text>
            <Input placeholder="https://github.com/user/plugin.git" value={urlInstallUrl}
              onChange={e => setUrlInstallUrl(e.target.value)} />
          </div>
          <div>
            <Typography.Text>插件名称</Typography.Text>
            <Input placeholder="my-plugin" value={urlInstallName}
              onChange={e => setUrlInstallName(e.target.value)} />
          </div>
        </Space>
      </Modal>

      {/* 导入 Zip Modal */}
      <Modal title="导入技能" open={importModalOpen} onOk={handleImport} onCancel={() => setImportModalOpen(false)}
        confirmLoading={importing} okText="导入" cancelText="取消">
        <div style={{ marginBottom: 12 }}>
          <Typography.Text>zip 文件路径</Typography.Text>
          <Input placeholder="C:\Users\xxx\Desktop\skills-export.zip" value={importZipPath}
            onChange={e => setImportZipPath(e.target.value)} />
        </div>
        <div>
          <Typography.Text>目标插件 ID</Typography.Text>
          <Input placeholder="superpowers@superpowers-marketplace" value={importTargetPlugin}
            onChange={e => setImportTargetPlugin(e.target.value)} />
        </div>
      </Modal>

      {/* URL 安装进度 Modal */}
      <Modal
        title="正在安装插件"
        open={progressModalOpen}
        footer={null}
        closable={false}
        maskClosable={false}
      >
        <Progress percent={progressPercent} status={progressStatus} />
        <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>
          {progressMsg}
        </Typography.Text>
      </Modal>
    </div>
  )
}
