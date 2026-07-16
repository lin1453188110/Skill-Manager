import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import { HistoryEntry } from '../../../src/lib/types'

const BACKUP_DIR = path.join(os.homedir(), '.claude', 'skill-manage-backups')
const HISTORY_PATH = path.join(BACKUP_DIR, 'history.json')

export async function initBackupSystem(): Promise<void> {
  await fs.ensureDir(BACKUP_DIR)
  if (!(await fs.pathExists(HISTORY_PATH))) {
    await fs.writeFile(HISTORY_PATH, '[]', 'utf-8')
  }
}

export async function backupFile(originalPath: string, action: string, description: string): Promise<string> {
  await initBackupSystem()

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFolder = path.join(BACKUP_DIR, `${timestamp}_${action}`)
  await fs.ensureDir(backupFolder)

  const fileName = path.basename(originalPath)
  const backupPath = path.join(backupFolder, fileName)

  if (await fs.pathExists(originalPath)) {
    await fs.copyFile(originalPath, backupPath)
  }

  // 记录历史
  const entry: HistoryEntry = {
    id: timestamp,
    timestamp: new Date().toISOString(),
    action,
    description,
    target: originalPath,
    backupPath,
    rolledBack: false
  }

  const history = await getHistory()
  history.unshift(entry)
  await fs.writeFile(HISTORY_PATH, JSON.stringify(history, null, 2), 'utf-8')

  return backupPath
}

export async function getHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await fs.readFile(HISTORY_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export async function rollback(historyId: string): Promise<boolean> {
  const history = await getHistory()
  const entry = history.find(h => h.id === historyId)
  if (!entry) return false

  // 恢复文件
  if (await fs.pathExists(entry.backupPath)) {
    await fs.copyFile(entry.backupPath, entry.target)
  }

  // 标记已回滚
  entry.rolledBack = true
  await fs.writeFile(HISTORY_PATH, JSON.stringify(history, null, 2), 'utf-8')

  return true
}
