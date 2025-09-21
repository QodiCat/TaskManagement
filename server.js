const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // 提供静态文件服务

// 数据文件路径
const DATA_DIR = path.join(__dirname, 'data');
const PERSONNEL_FILE = path.join(DATA_DIR, 'personnel.json');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// 工具函数：读取JSON文件
function readJsonFile(filePath, defaultValue = []) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        return defaultValue;
    } catch (error) {
        console.error(`读取文件 ${filePath} 失败:`, error);
        return defaultValue;
    }
}

// 工具函数：写入JSON文件
function writeJsonFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`写入文件 ${filePath} 失败:`, error);
        return false;
    }
}

// 初始化数据文件
function initializeDataFiles() {
    if (!fs.existsSync(PERSONNEL_FILE)) {
        writeJsonFile(PERSONNEL_FILE, []);
    }
    if (!fs.existsSync(TASKS_FILE)) {
        writeJsonFile(TASKS_FILE, []);
    }
    if (!fs.existsSync(LOGS_FILE)) {
        writeJsonFile(LOGS_FILE, []);
    }
}

// 人员管理API
app.get('/api/personnel', (req, res) => {
    const personnel = readJsonFile(PERSONNEL_FILE);
    res.json(personnel);
});

app.post('/api/personnel', (req, res) => {
    const personnel = readJsonFile(PERSONNEL_FILE);
    const newPerson = {
        id: Date.now(),
        ...req.body,
        createdAt: new Date().toISOString()
    };

    personnel.push(newPerson);
    if (writeJsonFile(PERSONNEL_FILE, personnel)) {
        res.status(201).json(newPerson);
    } else {
        res.status(500).json({ error: '保存人员失败' });
    }
});

app.delete('/api/personnel/:id', (req, res) => {
    const personnel = readJsonFile(PERSONNEL_FILE);
    const personId = parseInt(req.params.id);
    const filteredPersonnel = personnel.filter(p => p.id !== personId);

    if (filteredPersonnel.length < personnel.length) {
        if (writeJsonFile(PERSONNEL_FILE, filteredPersonnel)) {
            res.json({ message: '人员删除成功' });
        } else {
            res.status(500).json({ error: '删除人员失败' });
        }
    } else {
        res.status(404).json({ error: '人员不存在' });
    }
});

// 任务管理API
app.get('/api/tasks', (req, res) => {
    const tasks = readJsonFile(TASKS_FILE);
    res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
    const tasks = readJsonFile(TASKS_FILE);
    const newTask = {
        id: Date.now(),
        ...req.body,
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    if (writeJsonFile(TASKS_FILE, tasks)) {
        res.status(201).json(newTask);
    } else {
        res.status(500).json({ error: '保存任务失败' });
    }
});

app.put('/api/tasks/:id', (req, res) => {
    const tasks = readJsonFile(TASKS_FILE);
    const taskId = parseInt(req.params.id);
    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex !== -1) {
        tasks[taskIndex] = { ...tasks[taskIndex], ...req.body };
        if (writeJsonFile(TASKS_FILE, tasks)) {
            res.json(tasks[taskIndex]);
        } else {
            res.status(500).json({ error: '更新任务失败' });
        }
    } else {
        res.status(404).json({ error: '任务不存在' });
    }
});

app.delete('/api/tasks/:id', (req, res) => {
    const tasks = readJsonFile(TASKS_FILE);
    const taskId = parseInt(req.params.id);

    // 递归删除任务及其子任务
    const deleteTaskAndChildren = (id) => {
        const children = tasks.filter(t => t.parentId === id);
        children.forEach(child => deleteTaskAndChildren(child.id));
        return tasks.filter(t => t.id !== id && t.parentId !== id);
    };

    const filteredTasks = deleteTaskAndChildren(taskId);

    if (filteredTasks.length < tasks.length) {
        if (writeJsonFile(TASKS_FILE, filteredTasks)) {
            res.json({ message: '任务删除成功' });
        } else {
            res.status(500).json({ error: '删除任务失败' });
        }
    } else {
        res.status(404).json({ error: '任务不存在' });
    }
});

// 日志管理API
app.get('/api/logs', (req, res) => {
    const logs = readJsonFile(LOGS_FILE);
    res.json(logs);
});

app.post('/api/logs', (req, res) => {
    const logs = readJsonFile(LOGS_FILE);
    const newLog = {
        id: Date.now(),
        ...req.body,
        timestamp: new Date().toISOString()
    };

    logs.unshift(newLog); // 新日志放在前面
    if (writeJsonFile(LOGS_FILE, logs)) {
        res.status(201).json(newLog);
    } else {
        res.status(500).json({ error: '保存日志失败' });
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        dataFiles: {
            personnel: fs.existsSync(PERSONNEL_FILE),
            tasks: fs.existsSync(TASKS_FILE),
            logs: fs.existsSync(LOGS_FILE)
        }
    });
});

// 初始化并启动服务器
initializeDataFiles();

app.listen(PORT, HOST, () => {
    console.log(`服务器运行在 http://${HOST}:${PORT}`);
    console.log(`API文档: http://${HOST}:${PORT}/api/health`);
    if (HOST === '0.0.0.0') {
        console.log(`外部访问地址: http://<服务器IP>:${PORT}`);
    }
});