import express from 'express'
import cors from 'cors'
import { readFileSync, writeFileSync, existsSync, rmSync, createReadStream } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createServer } from 'vite'
import archiver from 'archiver'
import multer from 'multer'
import unzipper from 'unzipper'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// 数据文件路径
const DATA_DIR = join(__dirname, 'data')
const TEMP_DIR = join(__dirname, 'temp')

// 中间件
app.use(cors())
app.use(express.json())

// 配置multer用于文件上传
const upload = multer({ dest: TEMP_DIR })
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

// 确保临时目录存在
if (!existsSync(TEMP_DIR)) {
  mkdirSync(TEMP_DIR, { recursive: true })
}

// 初始化数据文件
Object.values(DATA_FILES).forEach(filePath => {
  if (!existsSync(filePath)) {
    writeFileSync(filePath, '[]', 'utf8')
  }
})

// API路由
// 备份路由 (放在前面，避免被其他路由匹配)
app.get('/api/backup', (req, res) => {
  try {
    const archive = archiver('zip', {
      zlib: { level: 9 } // 最高压缩
    })

    // 设置响应头
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', 'attachment; filename="data_backup.zip"')

    // 监听错误
    archive.on('error', (err) => {
      throw err
    })

    // 将压缩流连接到响应
    archive.pipe(res)

    // 添加data目录下的所有文件
    archive.directory(DATA_DIR, false)

    // 完成压缩
    archive.finalize()
  } catch (error) {
    console.error('备份失败:', error)
    res.status(500).json({ error: '备份失败' })
  }
})

app.post('/api/import', upload.single('backupFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' })
    }

    // 删除现有的data目录
    if (existsSync(DATA_DIR)) {
      rmSync(DATA_DIR, { recursive: true, force: true })
    }

    // 创建新的data目录
    mkdirSync(DATA_DIR, { recursive: true })

    // 解压上传的文件到data目录
    const zipPath = req.file.path
    await new Promise((resolve, reject) => {
      const stream = unzipper.Extract({ path: DATA_DIR })
      stream.on('close', resolve)
      stream.on('error', reject)
      createReadStream(zipPath).pipe(stream)
    })

    // 删除临时文件
    rmSync(zipPath)

    // 重新初始化数据文件（确保所有必需的文件都存在）
    Object.values(DATA_FILES).forEach(filePath => {
      if (!existsSync(filePath)) {
        writeFileSync(filePath, '[]', 'utf8')
      }
    })

    res.json({ success: true, message: '数据导入成功' })
  } catch (error) {
    console.error('导入失败:', error)
    res.status(500).json({ error: '导入失败' })
  }
})

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

    // 对于logs，执行追加操作而不是直接覆盖
    if (type === 'logs') {
      const existingData = JSON.parse(readFileSync(filePath, 'utf8') || '[]')
      // 确保existingData是数组
      const logsArray = Array.isArray(existingData) ? existingData : []
      // 添加新日志到数组开头
      const newLog = {
        id: Date.now(),
        ...req.body,
        timestamp: new Date().toISOString()
      }
      logsArray.unshift(newLog)
      writeFileSync(filePath, JSON.stringify(logsArray, null, 2), 'utf8')
    } else {
      // 其他数据类型直接覆盖
      const data = req.body
      writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
    }

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