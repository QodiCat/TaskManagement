<template>
  <div v-if="show" class="modal" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>分配任务</h3>
        <span class="close" @click="closeModal">&times;</span>
      </div>
      <div class="modal-body">
        <form @submit.prevent="assignTask">
          <div class="form-group">
            <label for="assignPerson">分配给：</label>
            <select id="assignPerson" v-model="form.assignedTo" required>
              <option value="">请选择人员</option>
              <option
                v-for="person in personnel"
                :key="person.id"
                :value="person.id"
              >
                {{ person.name }} ({{ person.role }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="plannedStartDate">计划开始时间：</label>
            <input
              type="datetime-local"
              id="plannedStartDate"
              v-model="form.plannedStartTime"
              required
            >
          </div>
          <div class="form-group">
            <label for="plannedEndDate">计划结束时间：</label>
            <input
              type="datetime-local"
              id="plannedEndDate"
              v-model="form.plannedEndTime"
              required
            >
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="closeModal">取消</button>
        <button type="submit" class="btn btn-primary" @click="assignTask">分配</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { personnel, tasksActions } from '@/utils/dataStore.js'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  taskId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['close', 'taskAssigned'])

const currentTask = ref(null)

const form = reactive({
  assignedTo: '',
  plannedStartTime: '',
  plannedEndTime: ''
})

const loadPersonnel = () => {
  // 数据已经通过响应式系统自动更新，无需手动加载
}

const loadTask = () => {
  if (props.taskId) {
    try {
      currentTask.value = tasksActions.findById(props.taskId)
      if (currentTask.value) {
        // 预填表单
        form.assignedTo = currentTask.value.assignedTo || ''
        form.plannedStartTime = currentTask.value.plannedStartTime || ''
        form.plannedEndTime = currentTask.value.plannedEndTime || ''
      }
    } catch (error) {
      console.error('加载任务失败:', error)
    }
  }
}

const closeModal = () => {
  emit('close')
  // 重置表单
  form.assignedTo = ''
  form.plannedStartTime = ''
  form.plannedEndTime = ''
}

const assignTask = () => {
  try {
    const updateData = {
      assignedTo: parseInt(form.assignedTo),
      plannedStartTime: form.plannedStartTime,
      plannedEndTime: form.plannedEndTime
    }

    const updatedTask = tasksActions.update(props.taskId, updateData)
    emit('taskAssigned', updatedTask)
    closeModal()
  } catch (error) {
    console.error('分配任务失败:', error)
    alert('分配任务失败，请重试')
  }
}

watch(() => props.show, (show) => {
  if (show) {
    loadPersonnel()
    loadTask()
  }
})
</script>

<style scoped>
/* 继承模态框基础样式 */
</style>