<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3><i class="fas fa-folder-plus"></i> 新建项目</h3>
        <button class="close-btn" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label for="projectName">项目名称 *</label>
          <input
            type="text"
            id="projectName"
            v-model="formData.name"
            required
            placeholder="请输入项目名称"
            class="form-control"
          />
        </div>
        <div class="form-group">
          <label for="projectDescription">项目描述</label>
          <textarea
            id="projectDescription"
            v-model="formData.description"
            placeholder="请输入项目描述（可选）"
            class="form-control"
            rows="3"
          ></textarea>
        </div>
        <div class="form-group">
          <label for="parentProject">上级项目</label>
          <select id="parentProject" v-model="formData.parentId" class="form-control">
            <option value="">无上级项目（根项目）</option>
            <option
              v-for="project in availableParents"
              :key="project.id"
              :value="project.id"
            >
              {{ '  '.repeat(getProjectLevel(project.id) - 1) }}{{ project.name }}
            </option>
          </select>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="closeModal">取消</button>
          <button type="submit" class="btn btn-primary" :disabled="!formData.name.trim()">
            <i class="fas fa-save"></i> 创建项目
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { projects, projectsActions } from '@/utils/dataStore.js'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  parentProjectId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['close', 'projectAdded'])

const formData = reactive({
  name: '',
  description: '',
  parentId: null
})

// 监听show和parentProjectId的变化
watch([() => props.show, () => props.parentProjectId], ([show, parentId]) => {
  if (show) {
    formData.parentId = parentId
  }
})

const availableParents = computed(() => {
  // 返回所有项目作为潜在的上级项目，但排除当前正在编辑的项目（如果有的话）
  // 排除当前项目及其子项目，避免循环引用
  const excludeIds = new Set()
  
  const addExcludeIds = (projectId) => {
    excludeIds.add(projectId)
    const children = projects.value.filter(p => {
      const pParentId = p.parentId === '' || p.parentId === null ? null : p.parentId
      return pParentId === projectId
    })
    children.forEach(child => addExcludeIds(child.id))
  }
  
  if (props.parentProjectId) {
    addExcludeIds(props.parentProjectId)
  }
  
  return projects.value.filter(project => !excludeIds.has(project.id))
})

const getProjectLevel = (projectId) => {
  let level = 1
  let currentProject = projects.value.find(p => p.id === projectId)
  
  while (currentProject && (currentProject.parentId || currentProject.parentId === '')) {
    if (currentProject.parentId !== '' && currentProject.parentId !== null) {
      level++
      currentProject = projects.value.find(p => p.id === currentProject.parentId)
    } else {
      break
    }
  }
  
  return level
}

const handleSubmit = () => {
  if (!formData.name.trim()) return

  try {
    const newProject = projectsActions.add({
      name: formData.name.trim(),
      description: formData.description.trim(),
      parentId: formData.parentId
    })

    emit('projectAdded', newProject)

    // 重置表单
    formData.name = ''
    formData.description = ''
    formData.parentId = null

    closeModal()
  } catch (error) {
    console.error('创建项目失败:', error)
    alert('创建项目失败，请重试')
  }
}

const closeModal = () => {
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.modal-content {
  background: white;
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideIn 0.3s ease-out;
}

.modal-header {
  padding: var(--spacing-xl);
  border-bottom: 2px solid var(--gray-200);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, var(--gray-50) 0%, white 100%);
}

.modal-header h3 {
  margin: 0;
  color: var(--gray-800);
  font-size: var(--font-size-xl);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.modal-header h3 i {
  color: var(--primary-color);
}

.close-btn {
  background: none;
  border: none;
  font-size: var(--font-size-lg);
  color: var(--gray-500);
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  transition: all var(--transition-fast);
}

.close-btn:hover {
  background: var(--gray-200);
  color: var(--gray-700);
}

.modal-body {
  padding: var(--spacing-xl);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-weight: 600;
  color: var(--gray-700);
}

.form-control {
  width: 100%;
  padding: var(--spacing-md);
  border: 2px solid var(--gray-300);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  transition: border-color var(--transition-normal);
  background: white;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
}

.form-control[rows] {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--gray-200);
}

.btn {
  padding: var(--spacing-md) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--gray-200);
  color: var(--gray-700);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--gray-300);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--primary-hover) 0%, #004085 100%);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: var(--spacing-lg);
  }

  .modal-header,
  .modal-body {
    padding: var(--spacing-lg);
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>