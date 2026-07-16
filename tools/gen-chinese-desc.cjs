const fs = require('fs');
const path = require('path');
const os = require('os');

const catalog = require(path.join(os.homedir(), '.claude', 'plugins', 'plugin-catalog-cache.json'));
const plugins = Object.values(catalog.catalog.plugins);

function translate(p) {
  const desc = (p.marketplace_entry?.description || '').toLowerCase();
  const name = (p.marketplace_entry?.name || p.plugin || '').toLowerCase();

  // 精准匹配热门插件
  if (name === 'frontend-design')
    return '创建高质量前端界面，支持 React/Next.js/Vue，可生成创意 UI 组件与生产级 CSS';
  if (name === 'code-review')
    return '自动化代码审查，多 Agent 对 PR 进行置信度评分，发现 Bug 与改进点';
  if (name === 'context7')
    return '通过 Upstash Context7 查询最新版本文档，支持多种语言和框架的实时 API 参考';
  if (name === 'code-simplifier')
    return '代码精简重构：提升可读性、一致性和可维护性，保持功能不变';
  if (name === 'github')
    return 'GitHub 官方集成：管理 Issue、PR、代码审查、仓库操作、Actions 等';
  if (name === 'claude-md-management')
    return 'CLAUDE.md 维护工具：审计质量、捕获会话经验、自动优化项目配置';
  if (name === 'feature-dev')
    return '全流程功能开发：代码库探索 → 架构设计 → 实现 → 测试，多 Agent 协作';
  if (name === 'claude-code-setup')
    return '分析代码库并推荐 Claude Code 自动化方案（hooks、skills、MCP 等）';
  if (name === 'commit-commands')
    return 'Git 提交工作流：commit、push、PR 创建一条龙命令';
  if (name === 'figma')
    return 'Figma 设计集成：访问设计文件、提取组件信息、读取设计令牌与样式';
  if (name === 'chrome-devtools-mcp')
    return 'Chrome DevTools 协议：控制浏览器、性能分析、DOM/网络调试';
  if (name === 'atlassian')
    return 'Atlassian 全家桶：Jira 项目管理 + Confluence 文档协作';
  if (name === 'agent-sdk-dev')
    return 'Claude Agent SDK 开发工具包，用于构建自定义 AI Agent';
  if (name === 'explanatory-output-style')
    return '解释性输出风格：为代码添加实现原理、设计模式等教育性注释';
  if (name === 'hookify')
    return '自定义 Hook 创建工具：分析对话模式，自动生成防止不良行为的钩子';
  if (name === 'greptile')
    return 'AI 代码库搜索：自然语言查询仓库，语义理解代码结构';
  if (name === 'linear')
    return 'Linear 项目管理：创建 Issue、管理项目、更新状态、搜索任务';
  if (name === 'csharp-lsp')
    return 'C# 语言服务器（LSP），提供智能补全、跳转定义、重构等功能';
  if (name === 'learning-output-style')
    return '交互式学习模式：在关键节点要求用户参与，提升学习效果';
  if (name === 'gopls-lsp')
    return 'Go 语言服务器（gopls），提供代码智能补全与重构';
  if (name === 'gitlab')
    return 'GitLab DevOps 集成：仓库管理、MR、CI/CD、Issue 追踪';
  if (name === 'firecrawl')
    return 'Firecrawl 网页抓取：将任意网站转为干净的 Markdown，供 LLM 使用';
  if (name === 'huggingface-skills')
    return 'HuggingFace 模型工具：构建、训练、评估、部署开源 AI 模型';
  if (name === 'jdtls-lsp')
    return 'Java 语言服务器（Eclipse JDT.LS），提供代码智能与重构';
  if (name === 'coderabbit')
    return 'AI 代码审查伙伴：多维度架构级验证，确保代码质量';
  if (name === 'discord')
    return 'Discord 消息桥接：内置访问控制、配对管理与策略配置';
  if (name === 'clangd-lsp')
    return 'C/C++ 语言服务器（clangd），提供代码智能补全与分析';
  if (name === 'firebase')
    return 'Google Firebase 集成：Firestore 数据库、认证、云函数、托管';
  if (name === 'kotlin-lsp')
    return 'Kotlin 语言服务器，提供代码智能与 Android 开发支持';
  if (name === 'laravel-boost')
    return 'Laravel 开发增强：数据库管理、路由生成、队列监控、Artisan 命令';

  // 通用分类翻译
  if (desc.includes('code review') || desc.includes('pull request'))
    return '自动化代码审查工具，对代码变更进行质量评估和建议';
  if (desc.includes('frontend') && desc.includes('interface'))
    return '前端界面生成工具，帮助创建高质量的 UI 组件和页面';
  if (desc.includes('documentation') && desc.includes('lookup'))
    return '实时文档查询工具，获取最新版本的 API 参考和用法';
  if (desc.includes('simplif') || desc.includes('refactor'))
    return '代码简化和重构工具，提升代码质量和可维护性';
  if (desc.includes('github'))
    return 'GitHub 集成工具，支持仓库管理、Issue 和 PR 操作';
  if (desc.includes('mcp server') || desc.includes('mcp'))
    return 'MCP 协议服务器，为 Claude 提供额外的工具和能力';
  if (desc.includes('lsp') || desc.includes('language server'))
    return '语言服务器（LSP），提供代码智能、自动补全和重构';
  if (desc.includes('design') || desc.includes('figma'))
    return '设计工具集成，连接设计文件和开发工作流';
  if (desc.includes('security') || desc.includes('vulnerab'))
    return '安全检测工具，识别代码中的安全漏洞和风险';
  if (desc.includes('database') || desc.includes('firestore'))
    return '数据库管理工具，支持数据查询、建模和迁移';
  if (desc.includes('scrape') || desc.includes('crawl'))
    return '网页抓取工具，将网页内容转为结构化数据';
  if (desc.includes('test'))
    return '测试工具，自动化测试生成和执行';

  return (p.marketplace_entry?.description || '').substring(0, 60).replace(/\s+/g, ' ') + '...';
}

const map = {};
plugins.forEach(p => {
  const name = p.marketplace_entry?.name || p.plugin;
  map[name] = translate(p);
});

const outPath = path.join(__dirname, '..', 'electron', 'server', 'services', 'chinese-descriptions.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(map, null, 2), 'utf-8');
console.log('已生成', Object.keys(map).length, '个插件的中文描述 →', outPath);
