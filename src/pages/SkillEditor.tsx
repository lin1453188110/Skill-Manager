import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Input, Space, Typography, Spin, message } from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import Editor from '@monaco-editor/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { fetchSkillDetail, saveSkill } from '../lib/api'
import type { SkillDetail } from '../lib/types'

export default function SkillEditor() {
  const { skillId } = useParams<{ skillId: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<SkillDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editBody, setEditBody] = useState('')

  useEffect(() => {
    if (!skillId) return
    loadSkill(decodeURIComponent(skillId))
  }, [skillId])

  async function loadSkill(id: string) {
    setLoading(true)
    try {
      const data = await fetchSkillDetail(id)
      if (!data) {
        message.error('技能未找到')
        navigate('/plugins')
        return
      }
      setDetail(data)
      setEditName(data.frontmatter.name)
      setEditDesc(data.frontmatter.description)
      setEditBody(data.body)
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!skillId) return
    setSaving(true)
    try {
      await saveSkill(decodeURIComponent(skillId), { name: editName, description: editDesc }, editBody)
      message.success('保存成功')
    } catch {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />
  if (!detail) return null

  // 构建完整 Markdown 用于预览
  const previewContent = [
    '---',
    `name: ${editName}`,
    `description: "${editDesc}"`,
    '---',
    '',
    editBody
  ].join('\n')

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/plugins')}>
          返回列表
        </Button>
        <Typography.Text strong>编辑 SKILL.md</Typography.Text>
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
          保存
        </Button>
      </Space>

      <div style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <Typography.Text strong>基本信息</Typography.Text>
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          <div style={{ flex: 1 }}>
            <Typography.Text type="secondary">名称</Typography.Text>
            <Input value={editName} onChange={e => setEditName(e.target.value)} />
          </div>
          <div style={{ flex: 2 }}>
            <Typography.Text type="secondary">描述</Typography.Text>
            <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 280px)' }}>
        <div style={{ flex: 1, background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }}>
            <Typography.Text strong>Markdown 源码</Typography.Text>
          </div>
          <Editor
            height="100%"
            defaultLanguage="markdown"
            value={editBody}
            onChange={val => setEditBody(val || '')}
            theme="vs"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              lineNumbers: 'on',
              padding: { top: 16 }
            }}
          />
        </div>
        <div style={{ flex: 1, background: '#fff', borderRadius: 8, overflow: 'auto', padding: 24 }}>
          <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', marginBottom: 16 }}>
            <Typography.Text strong>👁 实时预览</Typography.Text>
          </div>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {previewContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
