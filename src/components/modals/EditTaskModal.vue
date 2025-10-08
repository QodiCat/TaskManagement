<template>
  <div v-if="show" class="modal" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>编辑任务</h3>
        <span class="close" @click="closeModal">&times;</span>
      </div>
      <div class="modal-body">
        <form @submit.prevent="editTask">
          <div class="form-group">
            <label for="taskName">任务名称：</label>
            <input
              type="text"
              id="taskName"
              v-model="form.name"
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
            <label for="taskPriority">优先级：</label>
            <select id="taskPriority" v-model="form.priority">
              <option value="低">低</option>
              <option value="中">中</option>
              <option value="高">高</option>
              <option value="紧急">紧急</option>
            </select>
          </div>
          <div class="form-group">
            <label for="taskStatus">状态：</label>
            <select id="taskStatus" v-model="form.status">
              <option value="未开始">未开始</option>
              <option value="进行中">进行中</option>
              <option value="已完成">已完成</option>
              <option value="暂停">暂停</option>
            </select>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="closeModal">取消</button>
        <button type="submit" class="btn btn-primary" @click="editTask">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { tasksActions } from '@/utils/dataStore.js'

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

const emit = defineEmits(['close', 'taskEdited'])

const currentTask = ref(null)

const form = reactive({
  name: '',
  description: '',
  priority: '中',
  status: '未开始'
})

const loadTask = () => {
  if (props.taskId) {
    try {
      currentTask.value = tasksActions.findById(props.taskId)
      if (currentTask.value) {
        // 预填表单
        form.name = currentTask.value.name || ''
        form.description = currentTask.value.description || ''
        form.priority = currentTask.value.priority || '中'
        form.status = currentTask.value.status || '未开始'
      }
    } catch (error) {
      console.error('加载任务失败:', error)
    }
  }
}

const closeModal = () => {
  emit('close')
  // 重置表单
  form.name = ''
  form.description = ''
  form.priority = '中'
  form.status = '未开始'
}

const editTask = () => {
  try {
    const updateData = {
      name: form.name,
      description: form.description,
      priority: form.priority,
      status: form.status
    }

    const updatedTask = tasksActions.update(props.taskId, updateData)
    emit('taskEdited', updatedTask)
    closeModal()
  } catch (error) {
    console.error('编辑任务失败:', error)
    alert('编辑任务失败，请重试')
  }
}

watch(() => props.show, (show) => {
  if (show) {
    loadTask()
  }
})
</script>

<style scoped>
/* 继承模态框基础样式 */
</style>