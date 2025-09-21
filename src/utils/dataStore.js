// 直接操作JSON文件的数据存储模块
import { ref, reactive } from 'vue'

// 数据存储
const personnel = ref([])
const tasks = ref([])
const logs = ref([])
const projects = ref([])

// 文件路径配置 (API端点)
const DATA_PATHS = {
  personnel: '/api/personnel',
  tasks: '/api/tasks',
  logs: '/api/logs',
  projects: '/api/projects'
}

// 工具函数：读取JSON文件
async function readJsonFile(path, defaultValue = []) {
  try {
    const response = await fetch(path)
    if (response.ok) {
      return await response.json()
    }
    return defaultValue
  } catch (error) {
    console.error(`读取文件 ${path} 失败:`, error)
    return defaultValue
  }
}

// 工具函数：写入JSON文件 (通过API端点)
async function writeJsonFile(key, data) {
  try {
    const response = await fetch(`/api/${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data, null, 2)
    })
    return response.ok
  } catch (error) {
    console.error(`保存数据 ${key} 失败:`, error)
    return false
  }
}

// 初始化数据
async function initializeData() {
  try {
    // 从JSON文件读取数据
    personnel.value = await readJsonFile(DATA_PATHS.personnel, [])
    tasks.value = await readJsonFile(DATA_PATHS.tasks, [])
    logs.value = await readJsonFile(DATA_PATHS.logs, [])
    projects.value = await readJsonFile(DATA_PATHS.projects, [])
    
    console.log('数据初始化完成:', { 
      personnel: personnel.value.length, 
      tasks: tasks.value.length, 
      logs: logs.value.length,
      projects: projects.value.length
    })
  } catch (error) {
    console.error('初始化数据失败:', error)
  }
}

// 人员管理函数
const personnelActions = {
  // 获取所有人员
  getAll() {
    return personnel.value
  },

  // 添加人员
  add(person) {
    const newPerson = {
      id: Date.now(),
      ...person,
      createdAt: new Date().toISOString()
    }
    personnel.value.push(newPerson)
    writeJsonFile('personnel', personnel.value)
    return newPerson
  },

  // 删除人员
  delete(personId) {
    const index = personnel.value.findIndex(p => p.id === personId)
    if (index !== -1) {
      personnel.value.splice(index, 1)
      writeJsonFile('personnel', personnel.value)
      return true
    }
    return false
  },

  // 根据ID查找人员
  findById(id) {
    return personnel.value.find(p => p.id === id)
  }
}

// 项目管理函数
const projectsActions = {
  // 获取所有项目
  getAll() {
    return projects.value
  },

  // 添加项目
  add(project) {
    const newProject = {
      id: Date.now(),
      parentId: project.parentId || null,
      ...project,
      createdAt: new Date().toISOString()
    }
    projects.value.push(newProject)
    writeJsonFile('projects', projects.value)
    return newProject
  },

  // 删除项目（递归删除子项目）
  delete(projectId) {
    const projectToDelete = projects.value.find(p => p.id === projectId)
    if (!projectToDelete) return false

    // 递归删除子项目
    const deleteProjectAndChildren = (id) => {
      const children = projects.value.filter(p => p.parentId === id)
      children.forEach(child => deleteProjectAndChildren(child.id))
      projects.value = projects.value.filter(p => p.id !== id)
    }

    deleteProjectAndChildren(projectId)
    writeJsonFile('projects', projects.value)
    return true
  },

  // 更新项目
  update(projectId, updates) {
    const index = projects.value.findIndex(p => p.id === projectId)
    if (index !== -1) {
      projects.value[index] = { ...projects.value[index], ...updates }
      writeJsonFile('projects', projects.value)
      return projects.value[index]
    }
    return null
  },

  // 根据ID查找项目
  findById(id) {
    return projects.value.find(p => p.id === id)
  },

  // 获取子项目
  getChildren(parentId) {
    return projects.value.filter(p => p.parentId === parentId)
  },

  // 获取项目层级路径
  getProjectPath(projectId) {
    const path = []
    let currentProject = projects.value.find(p => p.id === projectId)

    while (currentProject) {
      path.unshift(currentProject.name)
      if (currentProject.parentId) {
        currentProject = projects.value.find(p => p.id === currentProject.parentId)
      } else {
        break
      }
    }

    return path.join(' > ')
  }
}

// 任务管理函数
const tasksActions = {
  // 获取所有任务
  getAll() {
    return tasks.value
  },

  // 添加任务
  add(task) {
    const newTask = {
      id: Date.now(),
      ...task,
      createdAt: new Date().toISOString()
    }
    tasks.value.push(newTask)
    writeJsonFile('tasks', tasks.value)
    
    // 添加日志
    logsActions.add({
      type: '任务创建',
      message: `创建任务：${newTask.name}`,
      taskId: newTask.id
    })
    
    return newTask
  },

  // 更新任务
  update(taskId, updates) {
    const index = tasks.value.findIndex(t => t.id === taskId)
    if (index !== -1) {
      const oldTask = { ...tasks.value[index] }
      tasks.value[index] = { ...tasks.value[index], ...updates }
      writeJsonFile('tasks', tasks.value)
      
      // 添加日志
      if (oldTask.status !== updates.status) {
        logsActions.add({
          type: '状态变更',
          message: `任务"${tasks.value[index].name}"状态从"${oldTask.status}"变更为"${updates.status}"`,
          taskId: taskId
        })
      }
      
      return tasks.value[index]
    }
    return null
  },

  // 删除任务（递归删除子任务）
  delete(taskId) {
    const taskToDelete = tasks.value.find(t => t.id === taskId)
    if (!taskToDelete) return false

    // 递归删除子任务
    const deleteTaskAndChildren = (id) => {
      const children = tasks.value.filter(t => t.parentId === id)
      children.forEach(child => deleteTaskAndChildren(child.id))
      tasks.value = tasks.value.filter(t => t.id !== id)
    }

    deleteTaskAndChildren(taskId)
    writeJsonFile('tasks', tasks.value)
    
    // 添加日志
    logsActions.add({
      type: '任务删除',
      message: `删除任务：${taskToDelete.name}`,
      taskId: taskId
    })
    
    return true
  },

  // 根据ID查找任务
  findById(id) {
    return tasks.value.find(t => t.id === id)
  },

  // 获取子任务
  getChildren(parentId) {
    return tasks.value.filter(t => t.parentId === parentId)
  }
}

// 日志管理函数
const logsActions = {
  // 获取所有日志
  getAll() {
    return logs.value
  },

  // 添加日志
  add(log) {
    const newLog = {
      id: Date.now(),
      ...log,
      timestamp: new Date().toISOString()
    }
    logs.value.unshift(newLog) // 新日志放在前面
    writeJsonFile('logs', logs.value)
    return newLog
  }
}

// 导出数据和操作函数
export {
  personnel,
  tasks,
  logs,
  projects,
  personnelActions,
  tasksActions,
  logsActions,
  projectsActions,
  initializeData
}