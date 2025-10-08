<template>
  <div class="container">
    <header class="header">
      <h1><i class="fas fa-tasks"></i> 项目管理系统</h1>
      <div class="header-actions">
        <button id="addPersonBtn" class="btn btn-primary" @click="showAddPersonModal">
          <i class="fas fa-user-plus"></i> 添加人员
        </button>
      </div>
    </header>

    <nav class="nav-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="nav-tab"
        :class="{ active: activeTab === tab.id }"
        @click="switchTab(tab.id)"
      >
        {{ tab.name }}
      </button>
    </nav>

    <main class="main-content">
      <PersonnelView
        v-if="activeTab === 'personnel'"
        ref="personnelViewRef"
      />
      <TasksView
        v-if="activeTab === 'tasks'"
        ref="tasksViewRef"
        @showAddTaskModal="handleShowAddTaskModal"
        @showAssignTaskModal="handleShowAssignTaskModal"
        @showEditTaskModal="handleShowEditTaskModal"
        @showAddProjectModal="handleShowAddProjectModal"
      />
      <GanttView
        v-if="activeTab === 'gantt'"
        ref="ganttViewRef"
      />
      <ArchivedProjectsView
        v-if="activeTab === 'archived'"
        ref="archivedViewRef"
      />
      <LogsView
        v-if="activeTab === 'logs'"
        ref="logsViewRef"
      />
    </main>

    <!-- 模态框 -->
    <AddPersonModal
      :show="modals.addPerson"
      @close="closeModal('addPerson')"
      @personAdded="onPersonAdded"
    />
    <AddTaskModal
      :show="modals.addTask"
      :parentTaskId="currentParentTaskId"
      @close="closeModal('addTask')"
      @taskAdded="onTaskAdded"
    />
    <AssignTaskModal
      :show="modals.assignTask"
      :taskId="currentAssignTaskId"
      @close="closeModal('assignTask')"
      @taskAssigned="onTaskAssigned"
    />
    <EditTaskModal
      :show="modals.editTask"
      :taskId="currentEditTaskId"
      @close="closeModal('editTask')"
      @taskEdited="onTaskEdited"
    />
    <AddProjectModal
      :show="modals.addProject"
      :parentProjectId="currentParentProjectId"
      @close="closeModal('addProject')"
      @projectAdded="onProjectAdded"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { initializeData } from './utils/dataStore.js'
import PersonnelView from './components/views/PersonnelView.vue'
import TasksView from './components/views/TasksView.vue'
import GanttView from './components/views/GanttView.vue'
import ArchivedProjectsView from './components/views/ArchivedProjectsView.vue'
import LogsView from './components/views/LogsView.vue'
import AddPersonModal from './components/modals/AddPersonModal.vue'
import AddTaskModal from './components/modals/AddTaskModal.vue'
import AssignTaskModal from './components/modals/AssignTaskModal.vue'
import EditTaskModal from './components/modals/EditTaskModal.vue'
import AddProjectModal from './components/modals/AddProjectModal.vue'

const activeTab = ref('personnel')
const currentParentTaskId = ref(null)
const currentAssignTaskId = ref(null)
const currentEditTaskId = ref(null)
const currentParentProjectId = ref(null)

const tabs = [
  { id: 'personnel', name: '人员管理' },
  { id: 'tasks', name: '功能需求表' },
  { id: 'gantt', name: '甘特图' },
  { id: 'archived', name: '已归档项目' },
  { id: 'logs', name: '操作日志' }
]

const modals = reactive({
  addPerson: false,
  addTask: false,
  assignTask: false,
  editTask: false,
  addProject: false
})

// 组件引用
const personnelViewRef = ref(null)
const tasksViewRef = ref(null)
const ganttViewRef = ref(null)
const archivedViewRef = ref(null)
const logsViewRef = ref(null)

const switchTab = (tabId) => {
  activeTab.value = tabId
  if (tabId === 'gantt' && ganttViewRef.value) {
    ganttViewRef.value.loadData()
  }
}

const showAddPersonModal = () => {
  modals.addPerson = true
}

const handleShowAddTaskModal = (parentTaskId = null) => {
  currentParentTaskId.value = parentTaskId
  modals.addTask = true
}

const handleShowAssignTaskModal = (taskId) => {
  currentAssignTaskId.value = taskId
  modals.assignTask = true
}

const handleShowEditTaskModal = (taskId) => {
  currentEditTaskId.value = taskId
  modals.editTask = true
}

const handleShowAddProjectModal = (parentProjectId = null) => {
  currentParentProjectId.value = parentProjectId
  modals.addProject = true
}

const closeModal = (modalName) => {
  modals[modalName] = false
  if (modalName === 'addTask') {
    currentParentTaskId.value = null
  }
  if (modalName === 'assignTask') {
    currentAssignTaskId.value = null
  }
  if (modalName === 'addProject') {
    currentParentProjectId.value = null
  }
}

const onPersonAdded = async (person) => {
  // 刷新人员视图
  if (personnelViewRef.value) {
    personnelViewRef.value.loadPersonnel()
  }
  // 添加日志
  await addLog('create', `添加了新人员：${person.name} (${person.role})`)
}

const onTaskAdded = async (task) => {
  // 刷新任务视图
  if (tasksViewRef.value) {
    tasksViewRef.value.loadTasks()
  }
  // 刷新甘特图
  if (ganttViewRef.value) {
    ganttViewRef.value.loadData()
  }
  // 添加日志
  await addLog('create', `创建了${task.level}级任务：${task.name}`)
}

const onTaskAssigned = async (task) => {
  // 刷新相关视图
  if (tasksViewRef.value) {
    tasksViewRef.value.loadTasks()
  }
  if (ganttViewRef.value) {
    ganttViewRef.value.loadData()
  }
  // 添加日志
  const person = await getPersonById(task.assignedTo)
  await addLog('assign', `将任务"${task.name}"分配给了${person.name}`)
}

const onTaskEdited = async (task) => {
  // 刷新相关视图
  if (tasksViewRef.value) {
    tasksViewRef.value.loadTasks()
  }
  if (ganttViewRef.value) {
    ganttViewRef.value.loadData()
  }
  // 添加日志
  await addLog('update', `编辑了任务：${task.name}`)
}

const onProjectAdded = async (project) => {
  // 刷新任务视图（因为项目选择器需要更新）
  if (tasksViewRef.value) {
    tasksViewRef.value.loadTasks()
  }
  // 添加日志
  await addLog('create', `创建了新项目：${project.name}`)
}

const getPersonById = async (personId) => {
  try {
    const response = await axios.get(`/api/personnel/${personId}`)
    return response.data
  } catch (error) {
    console.error('获取人员信息失败:', error)
    return { name: '未知人员' }
  }
}

const addLog = async (type, message) => {
  try {
    await axios.post('/api/logs', { type, message })
    // 刷新日志视图
    if (logsViewRef.value) {
      logsViewRef.value.loadLogs()
    }
  } catch (error) {
    console.error('添加日志失败:', error)
  }
}

onMounted(async () => {
  // 初始化数据存储
  await initializeData()
})
</script>

<style>
/* CSS 变量定义 */
:root {
  /* 颜色系统 */
  --primary-color: #007bff;
  --primary-hover: #0056b3;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --warning-color: #ffc107;
  --danger-color: #dc3545;
  --info-color: #17a2b8;
  --light-color: #f8f9fa;
  --dark-color: #343a40;

  /* 灰色调色板 */
  --gray-100: #f8f9fa;
  --gray-200: #e9ecef;
  --gray-300: #dee2e6;
  --gray-400: #ced4da;
  --gray-500: #adb5bd;
  --gray-600: #6c757d;
  --gray-700: #495057;
  --gray-800: #343a40;
  --gray-900: #212529;

  /* 间距系统 */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-xxl: 3rem;

  /* 圆角系统 */
  --border-radius-sm: 4px;
  --border-radius-md: 6px;
  --border-radius-lg: 8px;
  --border-radius-xl: 12px;

  /* 阴影系统 */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
  --shadow-xl: 0 20px 25px rgba(0,0,0,0.15);

  /* 过渡动画 */
  --transition-fast: 0.15s ease;
  --transition-normal: 0.3s ease;
  --transition-slow: 0.5s ease;

  /* 字体系统 */
  --font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;

  /* 行高 */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
}

/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-family);
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  color: var(--gray-800);
  line-height: var(--line-height-normal);
  min-height: 100vh;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  background: white;
  min-height: 100vh;
  box-shadow: var(--shadow-xl);
  border-radius: 0 var(--border-radius-lg) var(--border-radius-lg) 0;
}

/* 头部样式优化 */
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: var(--spacing-xl) var(--spacing-xxl);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;
}

.header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  opacity: 0.3;
}

.header h1 {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  position: relative;
  z-index: 1;
}

.header h1 i {
  margin-right: var(--spacing-sm);
  color: #ffeb3b;
  filter: drop-shadow(0 0 8px rgba(255,235,59,0.5));
}

.header-actions {
  display: flex;
  gap: var(--spacing-md);
  position: relative;
  z-index: 1;
}

/* 标签页样式优化 */
.nav-tabs {
  display: flex;
  background: linear-gradient(135deg, var(--gray-100) 0%, var(--gray-200) 100%);
  border-bottom: 2px solid var(--gray-300);
  position: relative;
}

.nav-tabs::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--primary-color) 50%, transparent 100%);
  opacity: 0.3;
}

.nav-tab {
  padding: var(--spacing-lg) var(--spacing-xl);
  border: none;
  background: none;
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--gray-600);
  border-bottom: 3px solid transparent;
  transition: all var(--transition-normal);
  position: relative;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nav-tab::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 3px;
  background: var(--primary-color);
  transition: all var(--transition-normal);
  transform: translateX(-50%);
}

.nav-tab:hover {
  color: var(--primary-color);
  background: rgba(0,123,255,0.05);
  transform: translateY(-1px);
}

.nav-tab:hover::before {
  width: 100%;
}

.nav-tab.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
  background: white;
  box-shadow: 0 -2px 8px rgba(0,123,255,0.1);
}

.nav-tab.active::before {
  width: 100%;
}

/* 主内容区域 */
.main-content {
  min-height: calc(100vh - 180px);
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
}

/* 按钮样式优化 */
.btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 600;
  transition: all var(--transition-normal);
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  transition: all var(--transition-fast);
  transform: translate(-50%, -50%);
}

.btn:hover::before {
  width: 300px;
  height: 300px;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  color: white;
  box-shadow: var(--shadow-md);
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--primary-hover) 0%, #004085 100%);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-secondary {
  background: linear-gradient(135deg, var(--secondary-color) 0%, var(--gray-700) 100%);
  color: white;
  box-shadow: var(--shadow-md);
}

.btn-secondary:hover {
  background: linear-gradient(135deg, var(--gray-700) 0%, var(--gray-800) 100%);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-success {
  background: linear-gradient(135deg, var(--success-color) 0%, #1e7e34 100%);
  color: white;
  box-shadow: var(--shadow-md);
}

.btn-success:hover {
  background: linear-gradient(135deg, #1e7e34 0%, #155724 100%);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-warning {
  background: linear-gradient(135deg, var(--warning-color) 0%, #e0a800 100%);
  color: var(--gray-900);
  box-shadow: var(--shadow-md);
}

.btn-warning:hover {
  background: linear-gradient(135deg, #e0a800 0%, #d39e00 100%);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-danger {
  background: linear-gradient(135deg, var(--danger-color) 0%, #c82333 100%);
  color: white;
  box-shadow: var(--shadow-md);
}

.btn-danger:hover {
  background: linear-gradient(135deg, #c82333 0%, #bd2130 100%);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-info {
  background: linear-gradient(135deg, var(--info-color) 0%, #138496 100%);
  color: white;
  box-shadow: var(--shadow-md);
}

.btn-info:hover {
  background: linear-gradient(135deg, #138496 0%, #117a8b 100%);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
}

/* 模态框样式优化 */
.modal {
  display: block;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  animation: modalFadeIn var(--transition-normal) ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: white;
  margin: var(--spacing-xxl) auto;
  padding: 0;
  border-radius: var(--border-radius-xl);
  width: 90%;
  max-width: 600px;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--gray-200);
  animation: modalSlideIn var(--transition-normal) ease-out;
  position: relative;
  overflow: hidden;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--success-color), var(--warning-color), var(--danger-color));
}

.modal-header {
  padding: var(--spacing-xl);
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, var(--gray-50) 0%, white 100%);
}

.modal-header h3 {
  margin: 0;
  color: var(--gray-800);
  font-size: var(--font-size-xl);
  font-weight: 600;
}

.close {
  color: var(--gray-500);
  font-size: var(--font-size-xl);
  font-weight: bold;
  cursor: pointer;
  transition: all var(--transition-fast);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close:hover {
  color: var(--danger-color);
  background: rgba(220, 53, 69, 0.1);
  transform: rotate(90deg);
}

.modal-body {
  padding: var(--spacing-xl);
  max-height: 70vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-weight: 600;
  color: var(--gray-700);
  font-size: var(--font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: var(--spacing-md);
  border: 2px solid var(--gray-300);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  transition: all var(--transition-fast);
  background: var(--gray-50);
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
  background: white;
  transform: translateY(-1px);
}

.modal-footer {
  padding: var(--spacing-xl);
  border-top: 1px solid var(--gray-200);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  background: var(--gray-50);
}

/* 响应式设计优化 */
@media (max-width: 768px) {
  .container {
    border-radius: 0;
    box-shadow: none;
  }

  .header {
    flex-direction: column;
    gap: var(--spacing-lg);
    text-align: center;
    padding: var(--spacing-lg);
  }

  .header h1 {
    font-size: var(--font-size-2xl);
  }

  .nav-tabs {
    flex-wrap: wrap;
    gap: 2px;
  }

  .nav-tab {
    flex: 1;
    min-width: 120px;
    padding: var(--spacing-md);
    font-size: var(--font-size-sm);
  }

  .modal-content {
    width: 95%;
    margin: var(--spacing-lg) auto;
    max-height: 90vh;
  }

  .modal-body {
    padding: var(--spacing-lg);
    max-height: 60vh;
  }
}

@media (max-width: 480px) {
  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .modal-footer {
    flex-direction: column;
  }

  .modal-footer .btn {
    width: 100%;
  }
}
</style>
