<template>
  <div v-if="show" class="modal" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>添加人员</h3>
        <span class="close" @click="closeModal">&times;</span>
      </div>
      <div class="modal-body">
        <form @submit.prevent="addPerson">
          <div class="form-group">
            <label for="personName">姓名：</label>
            <input
              type="text"
              id="personName"
              v-model="form.name"
              required
            >
          </div>
          <div class="form-group">
            <label for="personRole">角色：</label>
            <select id="personRole" v-model="form.role" required>
              <option value="">请选择角色</option>
              <option value="项目经理">项目经理大师</option>
              <option value="开发工程师">开发测试大神</option>
              <option value="UI设计师">UI产品设计大师</option>
            </select>
          </div>
          <div class="form-group">
            <label for="personEmail">邮箱：</label>
            <input
              type="email"
              id="personEmail"
              v-model="form.email"
            >
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="closeModal">取消</button>
        <button type="submit" class="btn btn-primary" @click="addPerson">添加</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { personnelActions } from '@/utils/dataStore.js'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'personAdded'])

const form = reactive({
  name: '',
  role: '',
  email: ''
})

const closeModal = () => {
  emit('close')
  // 重置表单
  form.name = ''
  form.role = ''
  form.email = ''
}

const addPerson = () => {
  try {
    const newPerson = personnelActions.add({ ...form })
    emit('personAdded', newPerson)
    closeModal()
  } catch (error) {
    console.error('添加人员失败:', error)
    alert('添加人员失败，请重试')
  }
}
</script>

<style scoped>
/* 模态框样式 */
.modal {
  display: block;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
}

.modal-content {
  background-color: white;
  margin: 10% auto;
  padding: 0;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close {
  color: #6c757d;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: color 0.2s;
}

.close:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0,123,255,0.25);
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>