<template>
  <div id="archived" class="tab-content">
    <div class="section-header">
      <h2><i class="fas fa-archive"></i> 已归档项目</h2>
      <div class="header-controls">
        <div class="header-actions">
          <span class="archive-info">
            <i class="fas fa-info-circle"></i>
            已归档的项目及其所有任务在此处显示，可以随时取消归档
          </span>
        </div>
      </div>
    </div>
    <div class="archived-container">
      <div v-if="archivedProjects.length === 0" class="empty-state">
        <i class="fas fa-archive"></i>
        <h3>暂无已归档项目</h3>
        <p>归档的项目将显示在此处</p>
      </div>
      <div v-else class="archived-projects-grid">
        <div
          v-for="project in archivedProjects"
          :key="project.id"
          class="archived-project-card"
        >
          <div class="project-header">
            <h3>
              <i class="fas fa-folder"></i>
              {{ project.name }}
            </h3>
            <div class="project-actions">
              <button
                class="btn btn-success btn-sm"
                @click="unarchiveProject(project.id)"
              >
                <i class="fas fa-undo"></i> 取消归档
              </button>
              <button
                class="btn btn-danger btn-sm"
                @click="deleteProject(project.id)"
              >
                <i class="fas fa-trash"></i> 删除
              </button>
            </div>
          </div>
          <div class="project-meta">
            <span v-if="project.description" class="project-description">
              <i class="fas fa-info"></i> {{ project.description }}
            </span>
            <span class="project-stats">
              <i class="fas fa-tasks"></i>
              包含 {{ getProjectTaskCount(project.id) }} 个任务
            </span>
            <span class="archive-date">
              <i class="fas fa-calendar"></i>
              归档时间: {{ formatDate(project.archivedAt) }}
            </span>
          </div>
          <div class="project-tasks-preview">
            <h4>任务列表：</h4>
            <div class="tasks-list">
              <div
                v-for="task in getProjectTasks(project.id)"
                :key="task.id"
                class="task-item-preview"
                :class="{ 'completed': task.status === '已完成' }"
              >
                <span class="task-level" :class="'level-' + task.level">
                  <i :class="task.level === 1 ? 'fas fa-tasks' : task.level === 2 ? 'fas fa-list' : 'fas fa-cog'"></i>
                </span>
                <span class="task-name">{{ task.name }}</span>
                <span class="task-status" :class="task.status">{{ task.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { projects, tasks, projectsActions, tasksActions } from '@/utils/dataStore.js'

const emit = defineEmits(['showAddProjectModal'])

// 获取已归档的项目
const archivedProjects = computed(() => {
  return projects.value.filter(project => project.archived === true)
})

// 获取项目下的任务数量
const getProjectTaskCount = (projectId) => {
  const getRelatedProjectIds = (pid) => {
    const ids = [pid]
    const addChildren = (parentId) => {
      const children = projects.value.filter(p => p.parentId === parentId)
      children.forEach(child => {
        ids.push(child.id)
        addChildren(child.id)
      })
    }
    addChildren(pid)
    return ids
  }

  const relatedIds = getRelatedProjectIds(projectId)
  return tasks.value.filter(task => relatedIds.includes(task.projectId)).length
}

// 获取项目下的任务列表（最多显示前5个）
const getProjectTasks = (projectId) => {
  const getRelatedProjectIds = (pid) => {
    const ids = [pid]
    const addChildren = (parentId) => {
      const children = projects.value.filter(p => p.parentId === parentId)
      children.forEach(child => {
        ids.push(child.id)
        addChildren(child.id)
      })
    }
    addChildren(pid)
    return ids
  }

  const relatedIds = getRelatedProjectIds(projectId)
  const projectTasks = tasks.value.filter(task => relatedIds.includes(task.projectId))
  return projectTasks.slice(0, 5) // 只显示前5个任务
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 取消归档项目
const unarchiveProject = (projectId) => {
  if (confirm('确定要取消归档这个项目吗？项目将重新显示在功能需求表中。')) {
    try {
      projectsActions.unarchive(projectId)
      alert('项目已成功取消归档')
    } catch (error) {
      console.error('取消归档项目失败:', error)
      alert('取消归档项目失败，请重试')
    }
  }
}

// 删除项目
const deleteProject = (projectId) => {
  if (confirm('确定要删除这个项目吗？这将同时删除项目下的所有任务，且无法恢复。')) {
    try {
      // 获取所有相关的项目ID（包括子项目）
      const getRelatedProjectIds = (pid) => {
        const ids = [pid]
        const addChildren = (parentId) => {
          const children = projects.value.filter(p => p.parentId === parentId)
          children.forEach(child => {
            ids.push(child.id)
            addChildren(child.id)
          })
        }
        addChildren(pid)
        return ids
      }

      const relatedProjectIds = getRelatedProjectIds(projectId)

      // 删除所有相关任务
      const relatedTasks = tasks.value.filter(task => relatedProjectIds.includes(task.projectId))
      relatedTasks.forEach(task => {
        tasksActions.delete(task.id)
      })

      // 删除项目（包括子项目）
      relatedProjectIds.forEach(id => {
        projectsActions.delete(id)
      })

      alert('项目及其所有任务已删除')
    } catch (error) {
      console.error('删除项目失败:', error)
      alert('删除项目失败，请重试')
    }
  }
}

onMounted(() => {
  // 数据已经通过响应式系统自动更新，无需手动加载
})

defineExpose({
  loadData: () => {
    // 可以在这里添加刷新数据的逻辑
  }
})
</script>

<style scoped>
/* 已归档项目样式 */
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
  color: var(--warning-color);
}

.header-controls {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  align-items: flex-end;
}

.archive-info {
  color: var(--gray-600);
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.archived-container {
  padding: var(--spacing-xl);
}

.archived-projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: var(--spacing-lg);
}

.archived-project-card {
  background: white;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--gray-200);
  overflow: hidden;
  transition: all var(--transition-normal);
}

.archived-project-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.project-header {
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, var(--warning-color) 0%, #e0a800 100%);
  color: var(--gray-900);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.project-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.project-meta {
  padding: var(--spacing-lg);
  background: var(--gray-50);
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.project-meta > span {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--gray-600);
}

.project-description {
  color: var(--gray-700);
  font-style: italic;
}

.project-stats {
  color: var(--primary-color);
  font-weight: 600;
}

.archive-date {
  color: var(--gray-500);
}

.project-tasks-preview {
  padding: var(--spacing-lg);
}

.project-tasks-preview h4 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--gray-800);
  font-size: var(--font-size-base);
  font-weight: 600;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  max-height: 200px;
  overflow-y: auto;
}

.task-item-preview {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--gray-50);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
}

.task-item-preview.completed {
  opacity: 0.6;
  text-decoration: line-through;
}

.task-level {
  font-size: var(--font-size-xs);
  opacity: 0.7;
}

.task-level.level-1 {
  color: var(--primary-color);
}

.task-level.level-2 {
  color: var(--info-color);
}

.task-level.level-3 {
  color: var(--success-color);
}

.task-name {
  flex: 1;
  color: var(--gray-700);
}

.task-status {
  padding: 2px var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: bold;
  text-transform: uppercase;
}

.task-status.未开始 {
  background: var(--gray-400);
  color: white;
}

.task-status.进行中 {
  background: var(--primary-color);
  color: white;
}

.task-status.已完成 {
  background: var(--success-color);
  color: white;
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
  color: var(--warning-color);
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

/* 响应式设计 */
@media (max-width: 768px) {
  .archived-projects-grid {
    grid-template-columns: 1fr;
  }

  .project-header {
    flex-direction: column;
    gap: var(--spacing-sm);
    text-align: center;
  }

  .project-actions {
    justify-content: center;
  }

  .project-meta {
    padding: var(--spacing-md);
  }

  .project-tasks-preview {
    padding: var(--spacing-md);
  }
}
</style>