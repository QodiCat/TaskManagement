import express from 'express'
import cors from 'cors'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createServer } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// 中间件
app.use(cors())
app.use(express.json())

// 数据文件路径
const DATA_DIR = join(__dirname, 'data')
const DATA_FILES = {
  personnel: join(DATA_DIR, 'personnel.json'),
  tasks: join(DATA_DIR, 'tasks.json'),
  logs: join(DATA_DIR, 'logs.json'),
  projects: join(DATA_DIR, 'projects.json')
}

// 确保数据目录存在
import { mkdirSync } from 'fs'
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true })
}

// 初始化数据文件
Object.values(DATA_FILES).forEach(filePath => {
  if (!existsSync(filePath)) {
    writeFileSync(filePath, '[]', 'utf8')
  }
})

// API路由
app.get('/api/:type', (req, res) => {
  try {
    const { type } = req.params
    const filePath = DATA_FILES[type]

    if (!filePath) {
      return res.status(404).json({ error: '数据类型不存在' })
    }

    const data = JSON.parse(readFileSync(filePath, 'utf8'))
    res.json(data)
  } catch (error) {
    console.error('读取数据失败:', error)
    res.status(500).json({ error: '读取数据失败' })
  }
})

app.post('/api/:type', (req, res) => {
  try {
    const { type } = req.params
    const filePath = DATA_FILES[type]

    if (!filePath) {
      return res.status(404).json({ error: '数据类型不存在' })
    }

    const data = req.body
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
    res.json({ success: true })
  } catch (error) {
    console.error('保存数据失败:', error)
    res.status(500).json({ error: '保存数据失败' })
  }
})

// 创建Vite开发服务器
const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'spa'
})

// 使用Vite中间件
app.use(vite.middlewares)

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
})