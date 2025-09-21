<template>
  <div id="gantt" class="tab-content">
    <div class="section-header">
      <h2><i class="fas fa-chart-gantt"></i> 甘特图</h2>
      <div class="header-controls">
        <div class="project-filter">
          <label for="ganttProjectSelect">筛选项目：</label>
          <select id="ganttProjectSelect" v-model="selectedProjectId" @change="renderGantt">
            <option value="">所有项目</option>
            <option
              v-for="project in projectOptions"
              :key="project.id"
              :value="project.id"
            >
              {{ project.name }}
            </option>
          </select>
        </div>
      </div>
      <div class="info-text">
        <small><i class="fas fa-info-circle"></i> 仅显示未完成的已分配任务</small>
      </div>
    </div>
    <div class="gantt-container" id="ganttContainer">
      <div v-if="ganttTasks.length === 0" class="empty-state">
        <i class="fas fa-chart-gantt"></i>
        <h3>暂无甘特图数据</h3>
        <p>请先分配任务并设置时间计划（已完成的任务不会显示）</p>
      </div>
      <div v-else class="gantt-chart">
        <div class="gantt-legend">
          <span class="legend-title">优先级图例：</span>
          <span class="legend-item">
            <span class="legend-color priority-高"></span>
            高优先级
          </span>
          <span class="legend-item">
            <span class="legend-color priority-中"></span>
            中优先级
          </span>
          <span class="legend-item">
            <span class="legend-color priority-低"></span>
            低优先级
          </span>
        </div>
        <div class="gantt-header">
          <div class="gantt-task-header">任务/人员</div>
          <div class="gantt-timeline-header">
            <div
              v-for="date in dateRange"
              :key="date.toISOString()"
              class="gantt-day"
            >
              {{ formatDate(date) }}
            </div>
          </div>
        </div>
        <div
          v-for="task in ganttTasks"
          :key="task.id"
          class="gantt-row"
        >
          <div class="gantt-task-name">
            <div class="task-path">{{ getTaskPath(task.id) }}</div>
            <small class="assignee">{{ task.assignedPerson.name }}</small>
            <small class="priority-indicator" :class="'priority-' + task.priority">{{ task.priority }}</small>
          </div>
          <div class="gantt-timeline">
            <div
              class="gantt-bar"
              :class="'priority-' + task.priority"
              :style="getBarStyle(task)"
            >
              {{ task.status }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { tasks, personnel, projects } from '@/utils/dataStore.js'

const dateRange = ref([])
const ganttTasks = ref([])
const selectedProjectId = ref('')

// 构建项目层级选项
const projectOptions = computed(() => {
  const buildProjectTree = (parentId = null, level = 0) => {
    return projects.value
      .filter(project => {
        // 统一处理parentId的比较，空字符串和null都视为根项目
        const projectParentId = project.parentId === '' || project.parentId === null ? null : project.parentId
        return projectParentId === parentId
      })
      .map(project => ({
        ...project,
        level,
        children: buildProjectTree(project.id, level + 1)
      }))
      .flat()
  }
  
  const flattenProjects = (projects, prefix = '') => {
    return projects.flatMap(project => [
      {
        id: project.id,
        name: prefix + project.name,
        level: project.level
      },
      ...flattenProjects(project.children || [], prefix + '  ')
    ])
  }
  
  const tree = buildProjectTree()
  return flattenProjects(tree)
})

const loadData = () => {
  try {
    // 数据已经通过响应式系统自动更新，直接使用
    renderGantt()
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

const renderGantt = () => {
  // 获取所有相关的项目ID（包括子项目）
  const getRelatedProjectIds = (projectId) => {
    const ids = [projectId]
    const addChildren = (parentId) => {
      const children = projects.value.filter(p => p.parentId === parentId)
      children.forEach(child => {
        ids.push(child.id)
        addChildren(child.id)
      })
    }
    addChildren(projectId)
    return ids
  }

  const relatedProjectIds = selectedProjectId.value ? getRelatedProjectIds(selectedProjectId.value) : null

  const tasksWithAssignment = tasks.value.filter(task =>
    task.assignedTo &&
    (task.plannedStartTime || task.actualStartTime) &&
    task.status !== '已完成' &&
    (!relatedProjectIds || relatedProjectIds.includes(task.projectId))
  )

  if (tasksWithAssignment.length === 0) {
    ganttTasks.value = []
    return
  }

  // 计算时间范围
  const allDates = []
  tasksWithAssignment.forEach(task => {
    if (task.plannedStartTime) allDates.push(new Date(task.plannedStartTime))
    if (task.plannedEndTime) allDates.push(new Date(task.plannedEndTime))
    if (task.actualStartTime) allDates.push(new Date(task.actualStartTime))
    if (task.actualEndTime) allDates.push(new Date(task.actualEndTime))
  })

  const minDate = new Date(Math.min(...allDates))
  const maxDate = new Date(Math.max(...allDates))

  // 生成日期范围
  const dates = []
  const currentDate = new Date(minDate)
  while (currentDate <= maxDate) {
    dates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }
  dateRange.value = dates

  // 处理任务数据
  ganttTasks.value = tasksWithAssignment.map(task => {
    const assignedPerson = personnel.value.find(p => p.id === task.assignedTo)
    return {
      ...task,
      assignedPerson
    }
  })
}

const formatDate = (date) => {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const getTaskPath = (taskId) => {
  const path = []
  let currentTask = tasks.value.find(t => t.id === taskId)

  while (currentTask) {
    path.unshift(currentTask.name)
    if (currentTask.parentId) {
      currentTask = tasks.value.find(t => t.id === currentTask.parentId)
    } else {
      break
    }
  }

  if (path.length > 1) {
    return path.slice(0, -1).join(' > ') + ' > ' + path[path.length - 1]
  }
  return path[0]
}

const getBarStyle = (task) => {
  const startDate = task.actualStartTime ? new Date(task.actualStartTime) : new Date(task.plannedStartTime)
  const endDate = task.actualEndTime ? new Date(task.actualEndTime) : new Date(task.plannedEndTime)

  const startIndex = dateRange.value.findIndex(date =>
    date.toDateString() === startDate.toDateString()
  )
  const endIndex = dateRange.value.findIndex(date =>
    date.toDateString() === endDate.toDateString()
  )

  const left = startIndex * 80
  const width = (endIndex - startIndex + 1) * 80

  return {
    left: `${left}px`,
    width: `${width}px`
  }
}

onMounted(() => {
  loadData()
})

defineExpose({
  loadData
})
</script>

<style scoped>
/* 甘特图样式 */
.section-header {
  padding: var(--spacing-xl);
  border-bottom: 2px solid var(--gray-200);
  background: linear-gradient(135deg, var(--gray-50) 0%, white 100%);
  margin-bottom: var(--spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h2 {
  margin: 0;
  color: var(--gray-800);
  font-size: var(--font-size-2xl);
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.section-header h2 i {
  color: var(--primary-color);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.project-filter {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.project-filter label {
  font-weight: 600;
  color: var(--gray-700);
  margin: 0;
}

.project-filter select {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid var(--gray-300);
  border-radius: var(--border-radius-md);
  background: white;
  font-size: var(--font-size-sm);
  min-width: 200px;
  transition: border-color var(--transition-normal);
}

.project-filter select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
}

.info-text {
  font-size: var(--font-size-sm);
  color: var(--gray-600);
  margin-top: var(--spacing-sm);
}

.gantt-container {
  padding: 1rem;
}

.gantt-chart {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow-x: auto;
}

.gantt-legend {
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.legend-title {
  font-weight: bold;
  color: #495057;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 2px;
}

.legend-color.priority-高 {
  background: #dc3545;
}

.legend-color.priority-中 {
  background: #ffc107;
}

.legend-color.priority-低 {
  background: #28a745;
}

.gantt-header {
  display: flex;
  border-bottom: 1px solid #e9ecef;
}

.gantt-task-header {
  width: 250px;
  padding: 1rem;
  font-weight: bold;
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
}

.gantt-timeline-header {
  display: flex;
  flex: 1;
}

.gantt-day {
  width: 80px;
  padding: 0.5rem;
  text-align: center;
  font-size: 0.8rem;
  color: #6c757d;
  border-right: 1px solid #e9ecef;
}

.gantt-row {
  display: flex;
  border-bottom: 1px solid #f8f9fa;
}

.gantt-task-name {
  width: 250px;
  padding: 1rem;
  border-right: 1px solid #e9ecef;
  background: #f8f9fa;
}

.task-path {
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: #333;
}

.assignee {
  display: block;
  color: #6c757d;
  font-size: 0.8rem;
  margin-bottom: 0.25rem;
}

.priority-indicator {
  display: inline-block;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: bold;
}

.priority-indicator.priority-高 {
  background: #dc3545;
  color: white;
}

.priority-indicator.priority-中 {
  background: #ffc107;
  color: #333;
}

.priority-indicator.priority-低 {
  background: #28a745;
  color: white;
}

.gantt-timeline {
  flex: 1;
  position: relative;
  height: 60px;
}

.gantt-bar {
  position: absolute;
  top: 20px;
  height: 20px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
  color: white;
}

.gantt-bar.priority-高 {
  background: #dc3545;
}

.gantt-bar.priority-中 {
  background: #ffc107;
  color: #333;
}

.gantt-bar.priority-低 {
  background: #28a745;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  margin-bottom: 0.5rem;
  color: #495057;
}
</style>