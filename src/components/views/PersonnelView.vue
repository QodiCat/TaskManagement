<template>
  <div id="personnel" class="tab-content active">
    <div class="section-header">
      <h2><i class="fas fa-users"></i> 人员管理</h2>
    </div>
    <div class="personnel-grid" id="personnelGrid">
      <!-- 人员卡片将动态生成 -->
      <div v-if="personnel.length === 0" class="empty-state">
        <i class="fas fa-users"></i>
        <h3>还没有人员</h3>
        <p>点击右上角"添加人员"按钮来添加第一个团队成员</p>
      </div>
      <div v-else v-for="person in personnel" :key="person.id" class="person-card">
        <div class="person-header">
          <div class="person-avatar">
            {{ person.name.charAt(0) }}
          </div>
          <div class="person-info">
            <h3>{{ person.name }}</h3>
            <div class="person-role">{{ person.role }}</div>
            <div v-if="person.email" class="person-email">{{ person.email }}</div>
          </div>
        </div>
        <div class="person-actions">
          <button class="btn btn-danger btn-sm" @click="deletePerson(person.id)">
            <i class="fas fa-trash"></i> 删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { personnel, personnelActions } from '@/utils/dataStore.js'

const loadPersonnel = () => {
  // 数据已经通过响应式系统自动更新，无需手动加载
}

const deletePerson = (personId) => {
  if (confirm('确定要删除这个人员吗？')) {
    try {
      personnelActions.delete(personId)
    } catch (error) {
      console.error('删除人员失败:', error)
      alert('删除人员失败，请重试')
    }
  }
}

onMounted(() => {
  loadPersonnel()
})

// 暴露方法给父组件
defineExpose({
  loadPersonnel
})
</script>

<style scoped>
/* 人员管理样式优化 */
.section-header {
  padding: var(--spacing-xl);
  border-bottom: 2px solid var(--gray-200);
  background: linear-gradient(135deg, var(--gray-50) 0%, white 100%);
  margin-bottom: var(--spacing-lg);
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

.personnel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
}

.person-card {
  background: white;
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--gray-200);
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.person-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--success-color), var(--info-color));
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.person-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: var(--shadow-xl);
}

.person-card:hover::before {
  opacity: 1;
}

.person-header {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  position: relative;
  z-index: 1;
}

.person-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: var(--font-size-xl);
  margin-right: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  border: 3px solid white;
  transition: all var(--transition-normal);
}

.person-card:hover .person-avatar {
  transform: scale(1.1);
  box-shadow: var(--shadow-lg);
}

.person-info {
  flex: 1;
  position: relative;
  z-index: 1;
}

.person-info h3 {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-size-lg);
  color: var(--gray-800);
  font-weight: 600;
}

.person-role {
  color: var(--primary-color);
  font-size: var(--font-size-sm);
  font-weight: 500;
  margin-bottom: var(--spacing-xs);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.person-email {
  color: var(--gray-600);
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.person-email::before {
  content: '📧';
  font-size: var(--font-size-xs);
}

.person-actions {
  position: absolute;
  top: var(--spacing-lg);
  right: var(--spacing-lg);
  opacity: 0;
  transition: all var(--transition-normal);
  z-index: 2;
}

.person-card:hover .person-actions {
  opacity: 1;
}

.person-actions .btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  border-radius: var(--border-radius-sm);
  box-shadow: var(--shadow-sm);
}

.empty-state {
  grid-column: 1 / -1;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .personnel-grid {
    grid-template-columns: 1fr;
    padding: var(--spacing-lg);
  }

  .person-card {
    padding: var(--spacing-lg);
  }

  .person-avatar {
    width: 50px;
    height: 50px;
    font-size: var(--font-size-lg);
  }

  .person-info h3 {
    font-size: var(--font-size-base);
  }

  .person-actions {
    position: static;
    opacity: 1;
    display: flex;
    justify-content: flex-end;
    margin-top: var(--spacing-md);
  }
}
</style>