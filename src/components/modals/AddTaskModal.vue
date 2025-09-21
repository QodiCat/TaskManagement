<template>
  <div v-if="show" class="modal" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ isSubTask ? '添加子任务' : '新建功能/任务' }}</h3>
        <span class="close" @click="closeModal">&times;</span>
      </div>
      <div class="modal-body">
        <form @submit.prevent="addTask">
          <div class="form-group">
            <label for="taskName">任务名称：</label>
            <input
              type="text"
              id="taskName"
              v-model="form.name"
              :placeholder="isSubTask ? `输入${parentTaskName}的子任务名称...` : '输入任务名称...'"
              required
            >
          </div>
          <div class="form-group">
            <label for="taskDescription">任务描述：</label>
            <textarea
              id="taskDescription"
              v-model="form.description"
              rows="3"
            ></textarea>
          </div>
          <div class="form-group">
            <label for="taskLevel">任务级别：</label>
            <select id="taskLevel" v-model="form.level" :disabled="isSubTask" required>
              <option value="1">一级功能</option>
              <option value="2">二级功能</option>
              <option value="3">三级功能</option>
            </select>
          </div>
          <div class="form-group" v-if="!isSubTask">
            <label for="taskProject">所属项目：</label>
            <select id="taskProject" v-model="form.projectId">
              <option value="">无项目</option>
              <option
                v-for="project in projects"
                :key="project.id"
                :value="project.id"
              >
                {{ project.name }}
              </option>
            </select>
          </div>
          <div class="form-group" v-else>
            <label for="taskProject">所属项目：</label>
            <input
              type="text"
              :value="parentProjectName"
              readonly
              class="form-control"
              style="background-color: #f8f9fa; cursor: not-allowed;"
            />
            <small class="text-muted">子任务自动继承父任务的项目</small>
          </div>
          <div class="form-group" v-if="!isSubTask">
            <label for="parentTask">上级任务：</label>
            <select id="parentTask" v-model="form.parentId">
              <option value="">无（一级任务）</option>
              <option
                v-for="task in availableParents"
                :key="task.id"
                :value="task.id"
              >
                {{ '  '.repeat(task.level - 1) }}{{ task.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="taskPriority">优先级：</label>
            <select id="taskPriority" v-model="form.priority" required>
              <option value="高">高</option>
              <option value="中">中</option>
              <option value="低">低</option>
            </select>
          </div>
          <div class="form-group">
            <label for="estimatedHours">预计工时（小时）：</label>
            <input
              type="number"
              id="estimatedHours"
              v-model.number="form.estimatedHours"
              min="1"
            >
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="closeModal">取消</button>
        <button type="submit" class="btn btn-primary" @click="addTask">创建</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { tasks, projects, tasksActions } from '@/utils/dataStore.js'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  parentTaskId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['close', 'taskAdded'])

const parentTaskName = ref('')
const parentProjectName = ref('')

const isSubTask = computed(() => !!props.parentTaskId)

const form = reactive({
  name: '',
  description: '',
  level: 1,
  parentId: null,
  priority: '中',
  estimatedHours: 0,
  projectId: null
})

const availableParents = computed(() => {
  if (form.level > 1) {
    return tasks.value.filter(task => task.level < form.level)
  }
  return []
})

const loadTasks = () => {
  // 数据已经通过响应式系统自动更新，无需手动加载
}

const closeModal = () => {
  emit('close')
  // 重置表单
  form.name = ''
  form.description = ''
  form.level = 1
  form.parentId = null
  form.priority = '中'
  form.estimatedHours = 0
  form.projectId = null
  parentTaskName.value = ''
  parentProjectName.value = ''
}

const addTask = () => {
  try {
    const taskData = {
      ...form,
      status: '未开始',
      assignedTo: null,
      actualStartTime: null,
      actualEndTime: null,
      plannedStartTime: null,
      plannedEndTime: null
    }

    const newTask = tasksActions.add(taskData)
    emit('taskAdded', newTask)
    closeModal()
  } catch (error) {
    console.error('添加任务失败:', error)
    alert('添加任务失败，请重试')
  }
}

watch(() => props.parentTaskId, (newId) => {
  if (newId && tasks.value.length > 0) {
    const parentTask = tasks.value.find(t => t.id === newId)
    if (parentTask) {
      parentTaskName.value = parentTask.name
      form.level = parentTask.level + 1
      form.parentId = newId
      // 子任务自动继承父任务的项目
      form.projectId = parentTask.projectId
      
      // 设置父项目名称显示
      if (parentTask.projectId) {
        const parentProject = projects.value.find(p => p.id === parentTask.projectId)
        parentProjectName.value = parentProject ? parentProject.name : '未知项目'
      } else {
        parentProjectName.value = '无项目'
      }
    }
  } else if (!newId) {
    form.level = 1
    form.parentId = null
    form.projectId = null
    parentProjectName.value = ''
  }
})

watch(() => props.show, (show) => {
  if (show) {
    loadTasks()
    // 如果有parentTaskId，设置相关信息
    if (props.parentTaskId) {
      const parentTask = tasks.value.find(t => t.id === props.parentTaskId)
      if (parentTask) {
        // 检查是否超过最大级别
        const childLevel = parentTask.level + 1
        if (childLevel > 3) {
          alert('最多只支持三级任务')
          emit('close')
          return
        }
        parentTaskName.value = parentTask.name
        form.level = childLevel
        form.parentId = props.parentTaskId
        // 子任务自动继承父任务的项目
        form.projectId = parentTask.projectId
        
        // 设置父项目名称显示
        if (parentTask.projectId) {
          const parentProject = projects.value.find(p => p.id === parentTask.projectId)
          parentProjectName.value = parentProject ? parentProject.name : '未知项目'
        } else {
          parentProjectName.value = '无项目'
        }
      }
    }
  }
})
</script>

<style scoped>
/* 继承模态框基础样式 */
</style>