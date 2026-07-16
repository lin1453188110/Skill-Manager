// ===== 插件 =====
export interface PluginInfo {
  id: string
  name: string
  version: string
  marketplace: string
  enabled: boolean
  installPath: string
  skillCount: number
  skills: SkillSummary[]
}

export interface SkillSummary {
  id: string
  name: string
  description: string
  pluginId: string
  filePath: string
}

// ===== Skill 详情 =====
export interface SkillDetail {
  id: string
  name: string
  description: string
  pluginId: string
  filePath: string
  rawContent: string
  frontmatter: SkillFrontmatter
  body: string
}

export interface SkillFrontmatter {
  name: string
  description: string
}

// ===== 市场 =====
export interface MarketplaceInfo {
  id: string
  name: string
  source: string
  pluginCount: number
}

export interface MarketplacePlugin {
  id: string
  name: string
  description: string
  version: string
  marketplace: string
  installed: boolean
  sourceUrl: string
  category?: string
  installs?: number
}

// ===== 操作历史 =====
export interface HistoryEntry {
  id: string
  timestamp: string
  action: string
  description: string
  target: string
  backupPath: string
  rolledBack: boolean
}

// ===== 通用响应 =====
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// ===== 导入导出 =====
export interface ExportManifest {
  exportedAt: string
  version: string
  skills: Array<{
    name: string
    pluginName: string
    frontmatter: SkillFrontmatter
    body: string
  }>
}
