// 项目管理系统 JavaScript
class TaskManagementSystem {
    constructor() {
        this.personnel = JSON.parse(localStorage.getItem('personnel')) || [];
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.logs = JSON.parse(localStorage.getItem('logs')) || [];
        this.currentTaskId = 1;
        this.currentPersonId = 1;
        this.currentLogId = 1;
        
        this.initializeApp();
    }

    initializeApp() {
        this.initializeEventListeners();
        this.loadData();
        this.renderPersonnel();
        this.renderTasks();
        this.renderGantt();
        this.renderLogs();
    }

    initializeEventListeners() {
        // 标签页切换
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // 添加人员
        document.getElementById('addPersonBtn').addEventListener('click', () => {
            this.showAddPersonModal();
        });

        document.getElementById('addPersonForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addPerson();
        });

        // 添加任务
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.showAddTaskModal();
        });

        // 全部展开/折叠
        document.getElementById('toggleAllBtn').addEventListener('click', () => {
            this.toggleAllTasks();
        });

        document.getElementById('addTaskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // 任务分配
        document.getElementById('assignTaskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.assignTask();
        });

        // 模态框关闭
        document.querySelectorAll('.modal .close, .modal .btn-secondary').forEach(element => {
            element.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        // 点击模态框外部关闭
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });

        // 任务级别变化时更新上级任务选项
        document.getElementById('taskLevel').addEventListener('change', () => {
            this.updateParentTaskOptions();
        });
    }

    loadData() {
        // 如果有保存的数据，更新ID计数器
        if (this.personnel.length > 0) {
            this.currentPersonId = Math.max(...this.personnel.map(p => p.id)) + 1;
        }
        if (this.tasks.length > 0) {
            this.currentTaskId = Math.max(...this.tasks.map(t => t.id)) + 1;
        }
        if (this.logs.length > 0) {
            this.currentLogId = Math.max(...this.logs.map(l => l.id)) + 1;
        }
    }

    saveData() {
        localStorage.setItem('personnel', JSON.stringify(this.personnel));
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        localStorage.setItem('logs', JSON.stringify(this.logs));
    }

    switchTab(tabName) {
        // 更新标签页状态
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // 显示对应内容
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabName);
        });

        // 重新渲染内容（如果需要）
        if (tabName === 'gantt') {
            this.renderGantt();
        }
    }

    // 人员管理功能
    showAddPersonModal() {
        document.getElementById('addPersonModal').style.display = 'block';
        document.getElementById('personName').focus();
    }

    addPerson() {
        const form = document.getElementById('addPersonForm');
        const formData = new FormData(form);
        
        const person = {
            id: this.currentPersonId++,
            name: formData.get('personName'),
            role: formData.get('personRole'),
            email: formData.get('personEmail'),
            createdAt: new Date().toISOString()
        };

        this.personnel.push(person);
        this.saveData();
        
        this.addLog('create', `添加了新人员：${person.name} (${person.role})`);
        this.renderPersonnel();
        this.updateAssignPersonOptions();
        
        this.closeModal(document.getElementById('addPersonModal'));
        form.reset();
    }

    deletePerson(personId) {
        if (confirm('确定要删除这个人员吗？')) {
            const person = this.personnel.find(p => p.id === personId);
            this.personnel = this.personnel.filter(p => p.id !== personId);
            
            // 取消该人员的所有任务分配
            this.tasks.forEach(task => {
                if (task.assignedTo === personId) {
                    task.assignedTo = null;
                    task.status = '未开始';
                }
            });
            
            this.saveData();
            this.addLog('delete', `删除了人员：${person.name}`);
            this.renderPersonnel();
            this.renderTasks();
            this.renderGantt();
        }
    }

    renderPersonnel() {
        const container = document.getElementById('personnelGrid');
        
        if (this.personnel.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>还没有人员</h3>
                    <p>点击右上角"添加人员"按钮来添加第一个团队成员</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.personnel.map(person => `
            <div class="person-card">
                <div class="person-header">
                    <div class="person-avatar">
                        ${person.name.charAt(0)}
                    </div>
                    <div class="person-info">
                        <h3>${person.name}</h3>
                        <div class="person-role">${person.role}</div>
                        ${person.email ? `<div class="person-email">${person.email}</div>` : ''}
                    </div>
                </div>
                <div class="person-actions">
                    <button class="btn btn-danger btn-sm" onclick="taskManager.deletePerson(${person.id})">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </div>
            </div>
        `).join('');
    }

    // 任务管理功能
    showAddTaskModal() {
        // 重置表单状态
        document.getElementById('taskLevel').disabled = false;
        document.getElementById('parentTask').disabled = false;
        document.getElementById('taskName').placeholder = '输入任务名称...';
        
        this.updateParentTaskOptions();
        document.getElementById('addTaskModal').style.display = 'block';
        document.getElementById('taskName').focus();
    }

    showAddSubTaskModal(parentTaskId) {
        const parentTask = this.tasks.find(t => t.id === parentTaskId);
        if (!parentTask) return;

        // 预设子任务的级别和父任务
        const childLevel = parentTask.level + 1;
        if (childLevel > 3) {
            alert('最多只支持三级任务');
            return;
        }

        // 打开添加任务模态框
        document.getElementById('addTaskModal').style.display = 'block';
        
        // 设置默认值
        document.getElementById('taskLevel').value = childLevel;
        document.getElementById('parentTask').innerHTML = `<option value="${parentTaskId}" selected>${parentTask.name}</option>`;
        document.getElementById('parentTask').value = parentTaskId;
        
        // 禁用级别选择（因为是固定的子任务级别）
        document.getElementById('taskLevel').disabled = true;
        document.getElementById('parentTask').disabled = true;
        
        // 聚焦到任务名称输入框
        document.getElementById('taskName').focus();
        document.getElementById('taskName').placeholder = `输入${parentTask.name}的子任务名称...`;
    }

    updateParentTaskOptions() {
        const levelSelect = document.getElementById('taskLevel');
        const parentSelect = document.getElementById('parentTask');
        const selectedLevel = parseInt(levelSelect.value);

        parentSelect.innerHTML = '<option value="">无（一级任务）</option>';

        if (selectedLevel > 1) {
            const availableParents = this.tasks.filter(task => task.level < selectedLevel);
            availableParents.forEach(task => {
                const option = document.createElement('option');
                option.value = task.id;
                option.textContent = `${'  '.repeat(task.level - 1)}${task.name}`;
                parentSelect.appendChild(option);
            });
        }

        parentSelect.disabled = selectedLevel === 1;
    }

    addTask() {
        const form = document.getElementById('addTaskForm');
        const formData = new FormData(form);
        
        const task = {
            id: this.currentTaskId++,
            name: formData.get('taskName'),
            description: formData.get('taskDescription'),
            level: parseInt(formData.get('taskLevel')),
            parentId: formData.get('parentTask') ? parseInt(formData.get('parentTask')) : null,
            priority: formData.get('taskPriority'),
            estimatedHours: parseInt(formData.get('estimatedHours')) || 0,
            status: '未开始',
            assignedTo: null,
            actualStartTime: null,
            actualEndTime: null,
            plannedStartTime: null,
            plannedEndTime: null,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveData();
        
        this.addLog('create', `创建了${task.level}级任务：${task.name}`);
        this.renderTasks();
        
        this.closeModal(document.getElementById('addTaskModal'));
        form.reset();
    }

    deleteTask(taskId) {
        if (confirm('确定要删除这个任务吗？这将同时删除所有子任务。')) {
            const deleteTaskAndChildren = (id) => {
                // 找到所有子任务
                const children = this.tasks.filter(task => task.parentId === id);
                children.forEach(child => deleteTaskAndChildren(child.id));
                
                // 删除当前任务
                this.tasks = this.tasks.filter(task => task.id !== id);
            };

            const task = this.tasks.find(t => t.id === taskId);
            deleteTaskAndChildren(taskId);
            
            this.saveData();
            this.addLog('delete', `删除了任务：${task.name}`);
            this.renderTasks();
            this.renderGantt();
        }
    }

    showAssignTaskModal(taskId) {
        this.currentAssignTaskId = taskId;
        this.updateAssignPersonOptions();
        
        // 如果任务已经有计划时间，填入表单
        const task = this.tasks.find(t => t.id === taskId);
        if (task.plannedStartTime) {
            document.getElementById('plannedStartDate').value = task.plannedStartTime;
        }
        if (task.plannedEndTime) {
            document.getElementById('plannedEndDate').value = task.plannedEndTime;
        }
        if (task.assignedTo) {
            document.getElementById('assignPerson').value = task.assignedTo;
        }
        
        document.getElementById('assignTaskModal').style.display = 'block';
    }

    updateAssignPersonOptions() {
        const select = document.getElementById('assignPerson');
        select.innerHTML = '<option value="">请选择人员</option>';
        
        this.personnel.forEach(person => {
            const option = document.createElement('option');
            option.value = person.id;
            option.textContent = `${person.name} (${person.role})`;
            select.appendChild(option);
        });
    }

    assignTask() {
        const form = document.getElementById('assignTaskForm');
        const formData = new FormData(form);
        
        const taskId = this.currentAssignTaskId;
        const task = this.tasks.find(t => t.id === taskId);
        const personId = parseInt(formData.get('assignPerson'));
        const person = this.personnel.find(p => p.id === personId);
        
        task.assignedTo = personId;
        task.plannedStartTime = formData.get('plannedStartDate');
        task.plannedEndTime = formData.get('plannedEndDate');
        
        this.saveData();
        this.addLog('assign', `将任务"${task.name}"分配给了${person.name}`);
        this.renderTasks();
        this.renderGantt();
        
        this.closeModal(document.getElementById('assignTaskModal'));
        form.reset();
    }

    startTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        const person = this.personnel.find(p => p.id === task.assignedTo);
        
        task.status = '进行中';
        task.actualStartTime = new Date().toISOString();
        
        this.saveData();
        this.addLog('start', `${person.name}开始了任务"${task.name}"`);
        this.renderTasks();
        this.renderGantt();
    }

    completeTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        const person = this.personnel.find(p => p.id === task.assignedTo);
        
        task.status = '已完成';
        task.actualEndTime = new Date().toISOString();
        
        this.saveData();
        this.addLog('complete', `${person.name}完成了任务"${task.name}"`);
        this.renderTasks();
        this.renderGantt();
    }

    renderTasks() {
        const container = document.getElementById('tasksContainer');
        
        if (this.tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <h3>还没有任务</h3>
                    <p>点击右上角"新建功能/任务"按钮来创建第一个任务</p>
                </div>
            `;
            return;
        }

        // 按层级组织任务
        const renderTaskTree = (parentId = null, level = 1) => {
            const children = this.tasks.filter(task => task.parentId === parentId);
            return children.map(task => {
                const assignedPerson = task.assignedTo ? this.personnel.find(p => p.id === task.assignedTo) : null;
                const childTasks = renderTaskTree(task.id, level + 1);
                const hasChildren = childTasks.length > 0;
                
                return `
                    <div class="task-item level-${task.level} ${hasChildren ? 'has-children' : ''} ${task.status === '已完成' ? 'completed' : ''}" data-task-id="${task.id}">
                        <div class="task-header" ${hasChildren ? `onclick="taskManager.toggleTaskChildren(${task.id})"` : ''}>
                            ${hasChildren ? `<div class="toggle-icon" data-collapsed="false"><i class="fas fa-minus"></i></div>` : ''}
                            <div class="task-info">
                                <h4 class="${task.status === '已完成' ? 'completed-task' : ''}">${task.name}</h4>
                                <div class="task-meta">
                                    <span class="task-priority ${task.priority}">${task.priority}</span>
                                    <span class="task-status ${task.status}">${task.status}</span>
                                    ${task.estimatedHours > 0 ? `<span><i class="fas fa-clock"></i> ${task.estimatedHours}h</span>` : ''}
                                    ${assignedPerson ? `<span><i class="fas fa-user"></i> ${assignedPerson.name}</span>` : ''}
                                </div>
                                ${task.description ? `<p style="margin-top: 0.5rem; color: #6c757d;">${task.description}</p>` : ''}
                            </div>
                            <div class="task-actions" onclick="event.stopPropagation()">
                                ${task.level < 3 ? `
                                    <button class="btn btn-info btn-sm" onclick="taskManager.showAddSubTaskModal(${task.id})">
                                        <i class="fas fa-plus"></i> 添加子任务
                                    </button>
                                ` : ''}
                                ${!task.assignedTo ? `
                                    <button class="btn btn-primary btn-sm" onclick="taskManager.showAssignTaskModal(${task.id})">
                                        <i class="fas fa-user-plus"></i> 分配
                                    </button>
                                ` : ''}
                                ${task.assignedTo && task.status === '未开始' ? `
                                    <button class="btn btn-success btn-sm" onclick="taskManager.startTask(${task.id})">
                                        <i class="fas fa-play"></i> 开始
                                    </button>
                                ` : ''}
                                ${task.status === '进行中' ? `
                                    <button class="btn btn-warning btn-sm" onclick="taskManager.completeTask(${task.id})">
                                        <i class="fas fa-check"></i> 完成
                                    </button>
                                ` : ''}
                                <button class="btn btn-primary btn-sm" onclick="taskManager.showAssignTaskModal(${task.id})">
                                    <i class="fas fa-edit"></i> 编辑
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="taskManager.deleteTask(${task.id})">
                                    <i class="fas fa-trash"></i> 删除
                                </button>
                            </div>
                        </div>
                        ${hasChildren ? `<div class="task-children" data-task-id="${task.id}">${childTasks}</div>` : ''}
                    </div>
                `;
            }).join('');
        };

        container.innerHTML = `
            <div class="task-tree">
                ${renderTaskTree()}
            </div>
        `;
    }

    // 切换任务子项的折叠状态
    toggleTaskChildren(taskId) {
        const taskChildren = document.querySelector(`.task-children[data-task-id="${taskId}"]`);
        const toggleIcon = document.querySelector(`.task-item[data-task-id="${taskId}"] .toggle-icon`);
        
        if (taskChildren && toggleIcon) {
            const isCollapsed = taskChildren.classList.contains('collapsed');
            
            if (isCollapsed) {
                // 展开
                taskChildren.classList.remove('collapsed');
                toggleIcon.innerHTML = '<i class="fas fa-minus"></i>';
                toggleIcon.setAttribute('data-collapsed', 'false');
            } else {
                // 折叠
                taskChildren.classList.add('collapsed');
                toggleIcon.innerHTML = '<i class="fas fa-plus"></i>';
                toggleIcon.setAttribute('data-collapsed', 'true');
            }
        }
    }

    // 全部展开/折叠任务
    toggleAllTasks() {
        const toggleBtn = document.getElementById('toggleAllBtn');
        const allTaskChildren = document.querySelectorAll('.task-children');
        const allToggleIcons = document.querySelectorAll('.toggle-icon');
        
        // 检查当前状态 - 如果有任何折叠的，就全部展开；如果全部展开，就全部折叠
        const hasCollapsed = Array.from(allTaskChildren).some(child => child.classList.contains('collapsed'));
        
        if (hasCollapsed) {
            // 全部展开
            allTaskChildren.forEach(child => {
                child.classList.remove('collapsed');
            });
            allToggleIcons.forEach(icon => {
                icon.innerHTML = '<i class="fas fa-minus"></i>';
                icon.setAttribute('data-collapsed', 'false');
            });
            toggleBtn.innerHTML = '<i class="fas fa-compress-alt"></i> 全部折叠';
        } else {
            // 全部折叠
            allTaskChildren.forEach(child => {
                child.classList.add('collapsed');
            });
            allToggleIcons.forEach(icon => {
                icon.innerHTML = '<i class="fas fa-plus"></i>';
                icon.setAttribute('data-collapsed', 'true');
            });
            toggleBtn.innerHTML = '<i class="fas fa-expand-alt"></i> 全部展开';
        }
    }

    // 获取任务的完整路径（包括所有上级任务）
    getTaskPath(taskId) {
        const path = [];
        let currentTask = this.tasks.find(t => t.id === taskId);
        
        while (currentTask) {
            path.unshift(currentTask.name);
            if (currentTask.parentId) {
                currentTask = this.tasks.find(t => t.id === currentTask.parentId);
            } else {
                break;
            }
        }
        
        return path;
    }

    // 甘特图功能
    renderGantt() {
        const container = document.getElementById('ganttContainer');
        
        const tasksWithAssignment = this.tasks.filter(task => 
            task.assignedTo && 
            (task.plannedStartTime || task.actualStartTime) &&
            task.status !== '已完成'
        );
        
        if (tasksWithAssignment.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-gantt"></i>
                    <h3>暂无甘特图数据</h3>
                    <p>请先分配任务并设置时间计划（已完成的任务不会显示）</p>
                </div>
            `;
            return;
        }

        // 计算时间范围
        const allDates = [];
        tasksWithAssignment.forEach(task => {
            if (task.plannedStartTime) allDates.push(new Date(task.plannedStartTime));
            if (task.plannedEndTime) allDates.push(new Date(task.plannedEndTime));
            if (task.actualStartTime) allDates.push(new Date(task.actualStartTime));
            if (task.actualEndTime) allDates.push(new Date(task.actualEndTime));
        });

        const minDate = new Date(Math.min(...allDates));
        const maxDate = new Date(Math.max(...allDates));
        
        // 生成日期范围
        const dateRange = [];
        const currentDate = new Date(minDate);
        while (currentDate <= maxDate) {
            dateRange.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // 生成甘特图HTML
        const timelineHeader = dateRange.map(date => `
            <div class="gantt-day">
                ${date.getMonth() + 1}/${date.getDate()}
            </div>
        `).join('');

        const ganttRows = tasksWithAssignment.map(task => {
            const person = this.personnel.find(p => p.id === task.assignedTo);
            const startDate = task.actualStartTime ? new Date(task.actualStartTime) : new Date(task.plannedStartTime);
            const endDate = task.actualEndTime ? new Date(task.actualEndTime) : new Date(task.plannedEndTime);
            
            // 获取任务的完整路径
            const taskPath = this.getTaskPath(task.id);
            const pathDisplay = taskPath.length > 1 ? 
                taskPath.slice(0, -1).join(' > ') + ' > ' + taskPath[taskPath.length - 1] :
                taskPath[0];
            
            // 计算位置和宽度
            const startIndex = dateRange.findIndex(date => 
                date.toDateString() === startDate.toDateString()
            );
            const endIndex = dateRange.findIndex(date => 
                date.toDateString() === endDate.toDateString()
            );
            
            const left = startIndex * 80;
            const width = (endIndex - startIndex + 1) * 80;
            
            return `
                <div class="gantt-row">
                    <div class="gantt-task-name">
                        <div class="task-path">${pathDisplay}</div>
                        <small class="assignee">${person.name}</small>
                    </div>
                    <div class="gantt-timeline">
                        <div class="gantt-bar" style="left: ${left}px; width: ${width}px;">
                            ${task.status}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="gantt-chart">
                <div class="gantt-header">
                    <div class="gantt-task-header">任务/人员</div>
                    <div class="gantt-timeline-header">
                        ${timelineHeader}
                    </div>
                </div>
                ${ganttRows}
            </div>
        `;
    }

    // 日志功能
    addLog(type, message) {
        const log = {
            id: this.currentLogId++,
            type: type,
            message: message,
            timestamp: new Date().toISOString()
        };
        
        this.logs.unshift(log); // 添加到开头
        this.saveData();
        this.renderLogs();
    }

    renderLogs() {
        const container = document.getElementById('logsContainer');
        
        if (this.logs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <h3>暂无操作日志</h3>
                    <p>当您执行操作时，日志会显示在这里</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.logs.map(log => {
            const date = new Date(log.timestamp);
            const timeString = date.toLocaleString('zh-CN');
            
            return `
                <div class="log-item">
                    <div class="log-icon ${log.type}">
                        ${this.getLogIcon(log.type)}
                    </div>
                    <div class="log-content">
                        <div class="log-message">${log.message}</div>
                        <div class="log-time">${timeString}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getLogIcon(type) {
        const icons = {
            create: '<i class="fas fa-plus"></i>',
            start: '<i class="fas fa-play"></i>',
            complete: '<i class="fas fa-check"></i>',
            assign: '<i class="fas fa-user-plus"></i>',
            delete: '<i class="fas fa-trash"></i>'
        };
        return icons[type] || '<i class="fas fa-info"></i>';
    }

    // 模态框功能
    closeModal(modal) {
        modal.style.display = 'none';
        
        // 如果关闭的是添加任务模态框，重置表单状态
        if (modal.id === 'addTaskModal') {
            document.getElementById('taskLevel').disabled = false;
            document.getElementById('parentTask').disabled = false;
            document.getElementById('taskName').placeholder = '输入任务名称...';
            document.getElementById('addTaskForm').reset();
        }
    }
}

// 初始化应用
let taskManager;
document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManagementSystem();
});