<template>
  <div id="tasks" class="tab-content">
    <div class="section-header">
      <h2><i class="fas fa-list-alt"></i> 功能需求表</h2>
      <div class="header-controls">
        <div class="project-selector">
          <label for="projectSelect">选择项目：</label>
          <select id="projectSelect" v-model="selectedProjectId" @change="onProjectChange">
            <option value="">所有项目</option>
            <option
              v-for="project in projectOptions"
              :key="project.id"
              :value="project.id"
            >
              {{ project.name }}
            </option>
          </select>
          <button class="btn btn-outline-primary btn-sm" @click="showAddProjectModal">
            <i class="fas fa-plus"></i> 新建项目
          </button>
          <button 
            v-if="selectedProjectId" 
            class="btn btn-outline-success btn-sm" 
            @click="showAddSubProjectModal"
          >
            <i class="fas fa-plus"></i> 新建子项目
          </button>
        </div>
        <div class="header-actions">
          <button id="toggleAllBtn" class="btn btn-secondary" @click="toggleAllTasks">
            <i class="fas fa-compress-alt"></i> 全部折叠
          </button>
          <button id="addTaskBtn" class="btn btn-primary" @click="showAddTaskModal">
            <i class="fas fa-plus"></i> 新建功能/任务
          </button>
        </div>
      </div>
    </div>
    <div class="tasks-container" id="tasksContainer">
      <div v-if="tasks.length === 0" class="empty-state">
        <i class="fas fa-tasks"></i>
        <h3>还没有任务</h3>
        <p>点击右上角"新建功能/任务"按钮来创建第一个任务</p>
      </div>
      <div v-else class="task-tree">
        <div
          v-for="task in renderTaskTree"
          :key="task.id"
          :class="['task-item', 'level-' + task.level, { 'has-children': task.children && task.children.length > 0, 'completed': task.status === '已完成' }]"
          :data-task-id="task.id"
        >
          <div
            class="task-header"
            :class="{ 'has-children': task.children && task.children.length > 0 }"
            @click="task.children && task.children.length > 0 ? toggleTaskChildren(task.id) : null"
          >
            <div v-if="task.children && task.children.length > 0" class="toggle-icon" :data-collapsed="task.collapsed ? 'true' : 'false'">
              <i :class="task.collapsed ? 'fas fa-plus' : 'fas fa-minus'"></i>
            </div>
            <div class="task-info">
              <h4 :class="{ 'completed-task': task.status === '已完成' }">
                <span class="level-prefix">
                  <i :class="task.level === 1 ? 'fas fa-tasks' : task.level === 2 ? 'fas fa-list' : 'fas fa-cog'"></i>
                </span>
                {{ task.name }}
              </h4>
              <div class="task-meta">
                <span class="task-priority" :class="task.priority">{{ task.priority }}</span>
                <span class="task-status" :class="task.status">{{ task.status }}</span>
                <span v-if="task.estimatedHours > 0">
                  <i class="fas fa-clock"></i> {{ task.estimatedHours }}h
                </span>
                <span v-if="task.assignedPerson">
                  <i class="fas fa-user"></i> {{ task.assignedPerson.name }}
                </span>
              </div>
              <p v-if="task.description" style="margin-top: 0.5rem; color: #6c757d;">{{ task.description }}</p>
            </div>
            <div class="task-actions" @click.stop>
              <button
                v-if="task.level < 3"
                class="btn btn-info btn-sm"
                @click="showAddSubTaskModal(task.id)"
              >
                <i class="fas fa-plus"></i> 添加子任务
              </button>
              <button
                v-if="!task.assignedTo"
                class="btn btn-primary btn-sm"
                @click="showAssignTaskModal(task.id)"
              >
                <i class="fas fa-user-plus"></i> 分配
              </button>
              <button
                v-if="task.assignedTo && task.status === '未开始'"
                class="btn btn-success btn-sm"
                @click="startTask(task.id)"
              >
                <i class="fas fa-play"></i> 开始
              </button>
              <button
                v-if="task.status === '进行中'"
                class="btn btn-warning btn-sm"
                @click="completeTask(task.id)"
              >
                <i class="fas fa-check"></i> 完成
              </button>
              <button class="btn btn-primary btn-sm" @click="showAssignTaskModal(task.id)">
                <i class="fas fa-edit"></i> 编辑
              </button>
              <button class="btn btn-danger btn-sm" @click="deleteTask(task.id)">
                <i class="fas fa-trash"></i> 删除
              </button>
            </div>
          </div>
          <div
            v-if="task.children && task.children.length > 0"
            class="task-children"
            :class="{ collapsed: task.collapsed }"
            :data-task-id="task.id"
          >
            <component
              :is="'div'"
              v-for="child in task.children"
              :key="child.id"
              :class="['task-item', 'level-' + child.level, { 'has-children': child.children && child.children.length > 0, 'completed': child.status === '已完成' }]"
              :data-task-id="child.id"
            >
              <!-- 递归渲染子任务 -->
              <div
                class="task-header"
                :class="{ 'has-children': child.children && child.children.length > 0 }"
                @click="child.children && child.children.length > 0 ? toggleTaskChildren(child.id) : null"
              >
                <div v-if="child.children && child.children.length > 0" class="toggle-icon" :data-collapsed="child.collapsed ? 'true' : 'false'">
                  <i :class="child.collapsed ? 'fas fa-plus' : 'fas fa-minus'"></i>
                </div>
                <div class="task-info">
                  <h4 :class="{ 'completed-task': child.status === '已完成' }">
                    <span class="level-prefix">
                      <i :class="child.level === 1 ? 'fas fa-tasks' : child.level === 2 ? 'fas fa-list' : 'fas fa-cog'"></i>
                    </span>
                    {{ child.name }}
                  </h4>
                  <div class="task-meta">
                    <span class="task-priority" :class="child.priority">{{ child.priority }}</span>
                    <span class="task-status" :class="child.status">{{ child.status }}</span>
                    <span v-if="child.estimatedHours > 0">
                      <i class="fas fa-clock"></i> {{ child.estimatedHours }}h
                    </span>
                    <span v-if="child.assignedPerson">
                      <i class="fas fa-user"></i> {{ child.assignedPerson.name }}
                    </span>
                  </div>
                  <p v-if="child.description" style="margin-top: 0.5rem; color: #6c757d;">{{ child.description }}</p>
                </div>
                <div class="task-actions" @click.stop>
                  <button
                    v-if="child.level < 3"
                    class="btn btn-info btn-sm"
                    @click="showAddSubTaskModal(child.id)"
                  >
                    <i class="fas fa-plus"></i> 添加子任务
                  </button>
                  <button
                    v-if="!child.assignedTo"
                    class="btn btn-primary btn-sm"
                    @click="showAssignTaskModal(child.id)"
                  >
                    <i class="fas fa-user-plus"></i> 分配
                  </button>
                  <button
                    v-if="child.assignedTo && child.status === '未开始'"
                    class="btn btn-success btn-sm"
                    @click="startTask(child.id)"
                  >
                    <i class="fas fa-play"></i> 开始
                  </button>
                  <button
                    v-if="child.status === '进行中'"
                    class="btn btn-warning btn-sm"
                    @click="completeTask(child.id)"
                  >
                    <i class="fas fa-check"></i> 完成
                  </button>
                  <button class="btn btn-primary btn-sm" @click="showAssignTaskModal(child.id)">
                    <i class="fas fa-edit"></i> 编辑
                  </button>
                  <button class="btn btn-danger btn-sm" @click="deleteTask(child.id)">
                    <i class="fas fa-trash"></i> 删除
                  </button>
                </div>
              </div>
              <div
                v-if="child.children && child.children.length > 0"
                class="task-children"
                :class="{ collapsed: child.collapsed }"
                :data-task-id="child.id"
              >
                <!-- 三级任务 -->
                <div
                  v-for="grandChild in child.children"
                  :key="grandChild.id"
                  :class="['task-item', 'level-' + grandChild.level, { 'completed': grandChild.status === '已完成' }]"
                  :data-task-id="grandChild.id"
                >
                  <div class="task-header">
                    <div class="task-info">
                      <h4 :class="{ 'completed-task': grandChild.status === '已完成' }">
                        <span class="level-prefix">
                          <i class="fas fa-cog"></i>
                        </span>
                        {{ grandChild.name }}
                      </h4>
                      <div class="task-meta">
                        <span class="task-priority" :class="grandChild.priority">{{ grandChild.priority }}</span>
                        <span class="task-status" :class="grandChild.status">{{ grandChild.status }}</span>
                        <span v-if="grandChild.estimatedHours > 0">
                          <i class="fas fa-clock"></i> {{ grandChild.estimatedHours }}h
                        </span>
                        <span v-if="grandChild.assignedPerson">
                          <i class="fas fa-user"></i> {{ grandChild.assignedPerson.name }}
                        </span>
                      </div>
                      <p v-if="grandChild.description" style="margin-top: 0.5rem; color: #6c757d;">{{ grandChild.description }}</p>
                    </div>
                    <div class="task-actions" @click.stop>
                      <button
                        v-if="!grandChild.assignedTo"
                        class="btn btn-primary btn-sm"
                        @click="showAssignTaskModal(grandChild.id)"
                      >
                        <i class="fas fa-user-plus"></i> 分配
                      </button>
                      <button
                        v-if="grandChild.assignedTo && grandChild.status === '未开始'"
                        class="btn btn-success btn-sm"
                        @click="startTask(grandChild.id)"
                      >
                        <i class="fas fa-play"></i> 开始
                      </button>
                      <button
                        v-if="grandChild.status === '进行中'"
                        class="btn btn-warning btn-sm"
                        @click="completeTask(grandChild.id)"
                      >
                        <i class="fas fa-check"></i> 完成
                      </button>
                      <button class="btn btn-primary btn-sm" @click="showAssignTaskModal(grandChild.id)">
                        <i class="fas fa-edit"></i> 编辑
                      </button>
                      <button class="btn btn-danger btn-sm" @click="deleteTask(grandChild.id)">
                        <i class="fas fa-trash"></i> 删除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </component>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { tasks, personnel, projects, tasksActions, projectsActions } from '@/utils/dataStore.js'

const emit = defineEmits(['showAddTaskModal', 'showAssignTaskModal', 'showAddProjectModal'])

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

const loadTasks = () => {
  // 数据已经通过响应式系统自动更新，无需手动加载
}

// 将renderTaskTree转换为响应式计算属性
const renderTaskTree = computed(() => {
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

  const buildTree = (parentId = null) => {
    return tasks.value
      .filter(task => {
        // 处理parentId为null、空字符串或undefined的情况
        const taskParentId = task.parentId === '' || task.parentId === undefined ? null : task.parentId
        // 根据选择的项目筛选（包括子项目）
        const projectMatch = !relatedProjectIds || relatedProjectIds.includes(task.projectId)
        return taskParentId === parentId && projectMatch
      })
      .map(task => {
        const assignedPerson = task.assignedTo ? personnel.value.find(p => p.id === task.assignedTo) : null
        const children = buildTree(task.id)
        return {
          ...task,
          assignedPerson,
          children,
          collapsed: false // 可以后续添加折叠状态管理
        }
      })
  }
  return buildTree()
})

const toggleTaskChildren = (taskId) => {
  // 简化实现，实际应该管理每个任务的折叠状态
  const taskElement = document.querySelector(`.task-children[data-task-id="${taskId}"]`)
  const toggleIcon = document.querySelector(`.task-item[data-task-id="${taskId}"] .toggle-icon`)

  if (taskElement && toggleIcon) {
    const isCollapsed = taskElement.classList.contains('collapsed')

    if (isCollapsed) {
      taskElement.classList.remove('collapsed')
      toggleIcon.innerHTML = '<i class="fas fa-minus"></i>'
      toggleIcon.setAttribute('data-collapsed', 'false')
    } else {
      taskElement.classList.add('collapsed')
      toggleIcon.innerHTML = '<i class="fas fa-plus"></i>'
      toggleIcon.setAttribute('data-collapsed', 'true')
    }
  }
}

const toggleAllTasks = () => {
  const toggleBtn = document.getElementById('toggleAllBtn')
  const allTaskChildren = document.querySelectorAll('.task-children')
  const allToggleIcons = document.querySelectorAll('.toggle-icon')

  const allExpanded = Array.from(allTaskChildren).every(child => !child.classList.contains('collapsed'))

  if (allExpanded) {
    allTaskChildren.forEach(child => child.classList.add('collapsed'))
    allToggleIcons.forEach(icon => {
      icon.innerHTML = '<i class="fas fa-plus"></i>'
      icon.setAttribute('data-collapsed', 'true')
    })
    toggleBtn.innerHTML = '<i class="fas fa-expand-alt"></i> 全部展开'
  } else {
    allTaskChildren.forEach(child => child.classList.remove('collapsed'))
    allToggleIcons.forEach(icon => {
      icon.innerHTML = '<i class="fas fa-minus"></i>'
      icon.setAttribute('data-collapsed', 'false')
    })
    toggleBtn.innerHTML = '<i class="fas fa-compress-alt"></i> 全部折叠'
  }
}

const showAddTaskModal = () => {
  emit('showAddTaskModal')
}

const showAddSubTaskModal = (parentTaskId) => {
  emit('showAddTaskModal', parentTaskId)
}

const showAssignTaskModal = (taskId) => {
  emit('showAssignTaskModal', taskId)
}

const showAddProjectModal = () => {
  emit('showAddProjectModal')
}

const showAddSubProjectModal = () => {
  emit('showAddProjectModal', selectedProjectId.value)
}

const onProjectChange = () => {
  // 项目改变时重新渲染任务树
}

const startTask = (taskId) => {
  try {
    tasksActions.update(taskId, {
      status: '进行中',
      actualStartTime: new Date().toISOString()
    })
  } catch (error) {
    console.error('开始任务失败:', error)
    alert('开始任务失败，请重试')
  }
}

const completeTask = (taskId) => {
  try {
    tasksActions.update(taskId, {
      status: '已完成',
      actualEndTime: new Date().toISOString()
    })
  } catch (error) {
    console.error('完成任务失败:', error)
    alert('完成任务失败，请重试')
  }
}

const deleteTask = (taskId) => {
  if (confirm('确定要删除这个任务吗？这将同时删除所有子任务。')) {
    try {
      tasksActions.delete(taskId)
    } catch (error) {
      console.error('删除任务失败:', error)
      alert('删除任务失败，请重试')
    }
  }
}

onMounted(() => {
  loadTasks()
})

defineExpose({
  loadTasks
})
</script>

<style scoped>
/* 任务管理样式优化 */
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
  flex-direction: column;
  gap: var(--spacing-md);
  align-items: flex-end;
}

.project-selector {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.project-selector label {
  font-weight: 600;
  color: var(--gray-700);
  margin: 0;
}

.project-selector select {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid var(--gray-300);
  border-radius: var(--border-radius-md);
  background: white;
  font-size: var(--font-size-sm);
  min-width: 200px;
  transition: border-color var(--transition-normal);
}

.project-selector select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
}

.header-actions {
  display: flex;
  gap: var(--spacing-md);
}

.tasks-container {
  padding: var(--spacing-xl);
}

.task-tree {
  max-width: 100%;
}

.task-item {
  margin-bottom: var(--spacing-md);
  position: relative;
}

.task-item::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--gray-300);
  opacity: 0.3;
}

.task-item.level-1::before {
  display: none;
}

.task-item.level-1 {
  margin-left: 0;
}

.task-item.level-2 {
  margin-left: 3rem;
}

.task-item.level-2::before {
  left: -25px;
  background: var(--primary-color);
  opacity: 0.5;
}

.task-item.level-3 {
  margin-left: 6rem;
}

.task-item.level-3::before {
  left: -30px;
  background: var(--success-color);
  opacity: 0.5;
}

.task-header {
  display: flex;
  align-items: flex-start;
  padding: var(--spacing-lg);
  background: white;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--gray-200);
  cursor: pointer;
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.task-header::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--primary-color);
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.task-item.level-2 .task-header::before {
  background: var(--info-color);
}

.task-item.level-3 .task-header::before {
  background: var(--success-color);
}

.task-header.has-children {
  cursor: pointer;
}

.task-header:hover {
  box-shadow: var(--shadow-lg);
  transform: translateX(4px);
}

.task-header:hover::before {
  opacity: 1;
}

.task-item.completed .task-header {
  background: linear-gradient(135deg, var(--gray-50) 0%, var(--gray-100) 100%);
  opacity: 0.8;
}

.toggle-icon {
  margin-right: var(--spacing-sm);
  margin-top: var(--spacing-xs);
  color: var(--gray-500);
  transition: all var(--transition-fast);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.toggle-icon:hover {
  background: var(--gray-200);
  color: var(--primary-color);
}

.task-info {
  flex: 1;
  position: relative;
  z-index: 1;
}

.task-info h4 {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-base);
  display: flex;
  align-items: center;
  font-weight: 600;
}

.level-prefix {
  margin-right: var(--spacing-sm);
  font-size: var(--font-size-sm);
  opacity: 0.7;
}

.completed-task {
  text-decoration: line-through;
  color: var(--gray-500);
  opacity: 0.7;
}

.task-meta {
  display: flex;
  gap: var(--spacing-lg);
  font-size: var(--font-size-sm);
  color: var(--gray-600);
  margin-bottom: var(--spacing-sm);
  flex-wrap: wrap;
}

.task-meta > span {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.task-meta i {
  font-size: var(--font-size-xs);
  opacity: 0.7;
}

.task-priority {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.task-priority.高 {
  background: linear-gradient(135deg, var(--danger-color) 0%, #dc3545 100%);
  color: white;
  box-shadow: var(--shadow-sm);
}

.task-priority.中 {
  background: linear-gradient(135deg, var(--warning-color) 0%, #ffc107 100%);
  color: var(--gray-900);
  box-shadow: var(--shadow-sm);
}

.task-priority.低 {
  background: linear-gradient(135deg, var(--success-color) 0%, #28a745 100%);
  color: white;
  box-shadow: var(--shadow-sm);
}

.task-status {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.task-status.未开始 {
  background: linear-gradient(135deg, var(--gray-400) 0%, var(--gray-500) 100%);
  color: white;
  box-shadow: var(--shadow-sm);
}

.task-status.进行中 {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  color: white;
  box-shadow: var(--shadow-sm);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: var(--shadow-sm);
  }
  50% {
    box-shadow: 0 0 0 3px rgba(0,123,255,0.2);
  }
}

.task-status.已完成 {
  background: linear-gradient(135deg, var(--success-color) 0%, #28a745 100%);
  color: white;
  box-shadow: var(--shadow-sm);
}

.task-description {
  color: var(--gray-600);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  margin-top: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--gray-50);
  border-radius: var(--border-radius-sm);
  border-left: 3px solid var(--primary-color);
}

.task-actions {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
  margin-top: var(--spacing-sm);
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.task-header:hover .task-actions {
  opacity: 1;
}

.task-children {
  margin-left: 3rem;
  margin-top: var(--spacing-md);
  position: relative;
}

.task-children::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--gray-300);
  opacity: 0.5;
}

.task-children.collapsed {
  display: none;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xxl);
  color: var(--gray-500);
  background: linear-gradient(135deg, var(--gray-50) 0%, white 100%);
  border-radius: var(--border-radius-xl);
  border: 2px dashed var(--gray-300);
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
  opacity: 0.5;
  color: var(--primary-color);
}

.empty-state h3 {
  margin-bottom: var(--spacing-md);
  color: var(--gray-700);
  font-size: var(--font-size-xl);
  font-weight: 600;
}

.empty-state p {
  color: var(--gray-600);
  font-size: var(--font-size-base);
  max-width: 400px;
  margin: 0 auto;
  line-height: var(--line-height-relaxed);
}

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  border-radius: var(--border-radius-sm);
}

.btn-info {
  background: linear-gradient(135deg, var(--info-color) 0%, #17a2b8 100%);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-info:hover {
  background: linear-gradient(135deg, #138496 0%, #117a8b 100%);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: var(--spacing-md);
    text-align: center;
  }

  .tasks-container {
    padding: var(--spacing-lg);
  }

  .task-item.level-2 {
    margin-left: 2rem;
  }

  .task-item.level-3 {
    margin-left: 4rem;
  }

  .task-children {
    margin-left: 2rem;
  }

  .task-meta {
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .task-actions {
    opacity: 1;
    justify-content: center;
  }

  .task-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .task-info {
    width: 100%;
  }
}
</style>