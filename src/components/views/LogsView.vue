<template>
  <div id="logs" class="tab-content">
    <div class="section-header">
      <h2><i class="fas fa-history"></i> 操作日志</h2>
    </div>
    <div class="logs-container" id="logsContainer">
      <div v-if="logs.length === 0" class="empty-state">
        <i class="fas fa-history"></i>
        <h3>暂无操作日志</h3>
        <p>当您执行操作时，日志会显示在这里</p>
      </div>
      <div
        v-else
        v-for="log in logs"
        :key="log.id"
        class="log-item"
      >
        <div class="log-icon" :class="log.type">
          <i :class="getLogIcon(log.type)"></i>
        </div>
        <div class="log-content">
          <div class="log-message">{{ log.message }}</div>
          <div class="log-time">{{ formatDateTime(log.timestamp) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { logs } from '@/utils/dataStore.js'

const loadLogs = () => {
  // 数据已经通过响应式系统自动更新，无需手动加载
}

const getLogIcon = (type) => {
  const icons = {
    create: 'fas fa-plus',
    start: 'fas fa-play',
    complete: 'fas fa-check',
    assign: 'fas fa-user-plus',
    delete: 'fas fa-trash'
  }
  return icons[type] || 'fas fa-info'
}

const formatDateTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

onMounted(() => {
  loadLogs()
})

defineExpose({
  loadLogs
})
</script>

<style scoped>
/* 日志样式 */
.logs-container {
  padding: 1rem;
}

.log-item {
  display: flex;
  align-items: flex-start;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 0.5rem;
  border: 1px solid #e9ecef;
}

.log-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  font-size: 1rem;
}

.log-icon.create {
  background: #28a745;
  color: white;
}

.log-icon.start {
  background: #007bff;
  color: white;
}

.log-icon.complete {
  background: #ffc107;
  color: #333;
}

.log-icon.assign {
  background: #17a2b8;
  color: white;
}

.log-icon.delete {
  background: #dc3545;
  color: white;
}

.log-content {
  flex: 1;
}

.log-message {
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: #333;
}

.log-time {
  font-size: 0.8rem;
  color: #6c757d;
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