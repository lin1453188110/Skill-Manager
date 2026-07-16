import axios from 'axios'
import type {
  PluginInfo,
  SkillSummary,
  SkillDetail,
  SkillFrontmatter,
  MarketplaceInfo,
  MarketplacePlugin,
  HistoryEntry,
  ApiResponse
} from './types'

// 自动检测：Vite 开发模式用独立端口，生产模式（Express 静态服务）用相对路径
const isViteDev = !!(window.location.port && window.location.port === '5173')
const API_BASE = isViteDev ? 'http://127.0.0.1:3001/api' : '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

export async function initApiBase(): Promise<void> {
  console.log('[Skill Manager] API:', API_BASE)
}

// ===== 插件 =====
export async function fetchPlugins(): Promise<PluginInfo[]> {
  const { data } = await api.get<ApiResponse<PluginInfo[]>>('/plugins')
  return data.data || []
}

export async function togglePlugin(id: string, enabled: boolean): Promise<void> {
  await api.put(`/plugins/${encodeURIComponent(id)}/toggle`, { enabled })
}

export async function fetchPluginSkills(pluginId: string): Promise<SkillSummary[]> {
  const { data } = await api.get<ApiResponse<SkillSummary[]>>(`/plugins/${encodeURIComponent(pluginId)}/skills`)
  return data.data || []
}

// ===== Skill =====
export async function fetchSkillDetail(skillId: string): Promise<SkillDetail | null> {
  const { data } = await api.get<ApiResponse<SkillDetail>>(`/skills/${encodeURIComponent(skillId)}`)
  return data.data || null
}

export async function saveSkill(skillId: string, frontmatter: SkillFrontmatter, body: string): Promise<void> {
  await api.put(`/skills/${encodeURIComponent(skillId)}`, { frontmatter, body })
}

export async function createNewSkill(
  pluginId: string,
  folderName: string,
  frontmatter: SkillFrontmatter,
  body: string
): Promise<string | null> {
  const { data } = await api.post<ApiResponse<{ id: string }>>('/skills', {
    pluginId, folderName, frontmatter, body
  })
  return data.data?.id || null
}

export async function removeSkill(skillId: string): Promise<void> {
  await api.delete(`/skills/${encodeURIComponent(skillId)}`)
}

// ===== 市场 =====
export async function fetchMarketplaces(): Promise<MarketplaceInfo[]> {
  const { data } = await api.get<ApiResponse<MarketplaceInfo[]>>('/marketplaces')
  return data.data || []
}

export async function fetchMarketplacePlugins(marketplaceId: string): Promise<MarketplacePlugin[]> {
  const { data } = await api.get<ApiResponse<MarketplacePlugin[]>>(`/marketplaces/${encodeURIComponent(marketplaceId)}/plugins`)
  return data.data || []
}

export async function fetchOfficialPlugins(): Promise<MarketplacePlugin[]> {
  const { data } = await api.get<ApiResponse<MarketplacePlugin[]>>('/marketplaces/official/plugins')
  return data.data || []
}

export async function installMarketplacePlugin(
  marketplaceId: string,
  pluginName: string,
  sourceUrl: string
): Promise<void> {
  try {
    await api.post('/marketplaces/install', { marketplaceId, pluginName, sourceUrl })
  } catch (err: any) {
    throw new Error(err?.response?.data?.error || err?.message || '安装失败')
  }
}

// ===== 历史 =====
export async function fetchHistory(): Promise<HistoryEntry[]> {
  const { data } = await api.get<ApiResponse<HistoryEntry[]>>('/history')
  return data.data || []
}

export async function rollbackHistory(historyId: string): Promise<void> {
  await api.post(`/history/rollback/${encodeURIComponent(historyId)}`)
}

// ===== 导入导出 =====
export async function exportSkills(skillIds: string[]): Promise<string> {
  const { data } = await api.post<ApiResponse<{ path: string }>>('/export', { skillIds })
  return data.data?.path || ''
}

export async function importSkills(zipPath: string, targetPluginId: string): Promise<{ imported: string[]; errors: string[] }> {
  const { data } = await api.post<ApiResponse<{ imported: string[]; errors: string[] }>>('/import', { zipPath, targetPluginId })
  return data.data || { imported: [], errors: [] }
}
