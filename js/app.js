// 项目管理系统 JavaScript
class TaskManagementSystem {
    constructor() {
        this.personnel = [];
        this.tasks = [];
        this.logs = [];
        this.currentTaskId = 1;
        this.currentPersonId = 1;
        this.currentLogId = 1;
        this.db = null;

        this.initializeApp();
    }

    async initializeApp() {
        await this.loadData();
        this.initializeEventListeners();
        this.renderPersonnel();
        this.renderTasks();
        this.renderGantt();
        this.renderLogs();
    }

    async initializeIndexedDB() {
        // 已移除，使用服务器端存储
        return Promise.resolve();
    }

    loadFromLocalStorage() {
        console.log('从localStorage加载数据...');
        try {
            this.personnel = JSON.parse(localStorage.getItem('personnel') || '[]');
            this.tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            this.logs = JSON.parse(localStorage.getItem('logs') || '[]');

            // 更新ID计数器
            if (this.personnel.length > 0) {
                this.currentPersonId = Math.max(...this.personnel.map(p => p.id || 0)) + 1;
            }
            if (this.tasks.length > 0) {
                this.currentTaskId = Math.max(...this.tasks.map(t => t.id || 0)) + 1;
            }
            if (this.logs.length > 0) {
                this.currentLogId = Math.max(...this.logs.map(l => l.id || 0)) + 1;
            }
        } catch (error) {
            console.error('从localStorage加载数据失败:', error);
            this.personnel = [];
            this.tasks = [];
            this.logs = [];
        }
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('personnel', JSON.stringify(this.personnel));
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
            localStorage.setItem('logs', JSON.stringify(this.logs));
            console.log('数据已保存到localStorage');
        } catch (error) {
            console.error('保存到localStorage失败:', error);
        }
    }

    async loadData() {
        try {
            // 并行加载所有数据
            const [personnelResponse, tasksResponse, logsResponse] = await Promise.all([
                fetch('/api/personnel'),
                fetch('/api/tasks'),
                fetch('/api/logs')
            ]);

            this.personnel = await personnelResponse.json();
            this.tasks = await tasksResponse.json();
            this.logs = await logsResponse.json();

            // 更新ID计数器
            if (this.personnel.length > 0) {
                this.currentPersonId = Math.max(...this.personnel.map(p => p.id)) + 1;
            }
            if (this.tasks.length > 0) {
                this.currentTaskId = Math.max(...this.tasks.map(t => t.id)) + 1;
            }
            if (this.logs.length > 0) {
                this.currentLogId = Math.max(...this.logs.map(l => l.id)) + 1;
            }

            console.log('数据加载成功:', {
                personnel: this.personnel.length,
                tasks: this.tasks.length,
                logs: this.logs.length
            });
        } catch (error) {
            console.error('加载数据失败:', error);
            // 如果API不可用，使用空数据
            this.personnel = [];
            this.tasks = [];
            this.logs = [];
        }
    }

    async getAllFromStore(storeName) {
        // 已移除，使用服务器端存储
        return [];
    }

    async saveToStore(storeName, data) {
        if (!this.db) {
            console.warn('IndexedDB未初始化，使用本地存储作为备用');
            // 备用方案：使用localStorage
            const allData = JSON.parse(localStorage.getItem(storeName) || '[]');
            const existingIndex = allData.findIndex(item => item.id === data.id);
            if (existingIndex >= 0) {
                allData[existingIndex] = data;
            } else {
                allData.push(data);
            }
            localStorage.setItem(storeName, JSON.stringify(allData));
            return data.id || Date.now();
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.put(data);

                request.onsuccess = () => {
                    resolve(request.result);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    async deleteFromStore(storeName, id) {
        if (!this.db) {
            console.warn('IndexedDB未初始化，使用本地存储作为备用');
            // 备用方案：使用localStorage
            const allData = JSON.parse(localStorage.getItem(storeName) || '[]');
            const filteredData = allData.filter(item => item.id !== id);
            localStorage.setItem(storeName, JSON.stringify(filteredData));
            return;
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(id);

                request.onsuccess = () => {
                    resolve();
                };

                request.onerror = () => {
                    reject(request.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    // 已移除，使用服务器端存储

    // 已移除，使用服务器端存储

    // 已移除，使用服务器端存储

    // 已移除，使用服务器端存储

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

    // 已移除，使用服务器端存储

    // 已移除，使用服务器端存储

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

    async addPerson() {
        const form = document.getElementById('addPersonForm');
        const formData = new FormData(form);

        const person = {
            name: formData.get('personName'),
            role: formData.get('personRole'),
            email: formData.get('personEmail')
        };

        try {
            // 发送到服务器
            const response = await fetch('/api/personnel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(person)
            });

            if (!response.ok) {
                throw new Error('添加人员失败');
            }

            const savedPerson = await response.json();

            // 更新本地数组
            this.personnel.push(savedPerson);

            await this.addLog('create', `添加了新人员：${savedPerson.name} (${savedPerson.role})`);
            this.renderPersonnel();
            this.updateAssignPersonOptions();

            this.closeModal(document.getElementById('addPersonModal'));
            form.reset();

            console.log('人员添加成功:', savedPerson);
        } catch (error) {
            console.error('添加人员失败:', error);
            alert('添加人员失败，请重试');
        }
    }

    async updateTaskOnServer(task) {
        try {
            const response = await fetch(`/api/tasks/${task.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(task)
            });

            if (!response.ok) {
                console.error('更新任务到服务器失败:', task.id);
            }
        } catch (error) {
            console.error('更新任务到服务器异常:', error);
        }
    }

    async deletePerson(personId) {
        if (confirm('确定要删除这个人员吗？')) {
            const person = this.personnel.find(p => p.id === personId);

            try {
                // 从服务器删除
                const response = await fetch(`/api/personnel/${personId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error('删除人员失败');
                }

                // 更新本地数组
                this.personnel = this.personnel.filter(p => p.id !== personId);
                this.tasks.forEach(task => {
                    if (task.assignedTo === personId) {
                        task.assignedTo = null;
                        task.status = '未开始';
                        // 更新任务到服务器
                        this.updateTaskOnServer(task);
                    }
                });

                await this.addLog('delete', `删除了人员：${person.name}`);
                this.renderPersonnel();
                this.renderTasks();
                this.renderGantt();

                console.log('人员删除成功:', personId);
            } catch (error) {
                console.error('删除人员失败:', error);
                alert('删除人员失败，请重试');
            }
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

    async addTask() {
        const form = document.getElementById('addTaskForm');
        const formData = new FormData(form);

        const task = {
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
            plannedEndTime: null
        };

        try {
            // 发送到服务器
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(task)
            });

            if (!response.ok) {
                throw new Error('添加任务失败');
            }

            const savedTask = await response.json();

            // 更新本地数组
            this.tasks.push(savedTask);

            await this.addLog('create', `创建了${savedTask.level}级任务：${savedTask.name}`);
            this.renderTasks();

            this.closeModal(document.getElementById('addTaskModal'));
            form.reset();

            console.log('任务添加成功:', savedTask);
        } catch (error) {
            console.error('添加任务失败:', error);
            alert('添加任务失败，请重试');
        }
    }

    async deleteTask(taskId) {
        if (confirm('确定要删除这个任务吗？这将同时删除所有子任务。')) {
            const task = this.tasks.find(t => t.id === taskId);

            try {
                // 从服务器删除
                const response = await fetch(`/api/tasks/${taskId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error('删除任务失败');
                }

                // 更新本地数组
                const deleteFromArray = (id) => {
                    const children = this.tasks.filter(t => t.parentId === id);
                    children.forEach(child => deleteFromArray(child.id));
                    this.tasks = this.tasks.filter(t => t.id !== id);
                };

                deleteFromArray(taskId);

                await this.addLog('delete', `删除了任务：${task.name}`);
                this.renderTasks();
                this.renderGantt();

                console.log('任务删除成功:', taskId);
            } catch (error) {
                console.error('删除任务失败:', error);
                alert('删除任务失败，请重试');
            }
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

    async assignTask() {
        const form = document.getElementById('assignTaskForm');
        const formData = new FormData(form);

        const taskId = this.currentAssignTaskId;
        const task = this.tasks.find(t => t.id === taskId);
        const personId = parseInt(formData.get('assignPerson'));
        const person = this.personnel.find(p => p.id === personId);

        // 更新任务
        task.assignedTo = personId;
        task.plannedStartTime = formData.get('plannedStartDate');
        task.plannedEndTime = formData.get('plannedEndDate');

        try {
            // 更新到服务器
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(task)
            });

            if (!response.ok) {
                throw new Error('分配任务失败');
            }

            await this.addLog('assign', `将任务"${task.name}"分配给了${person.name}`);
            this.renderTasks();
            this.renderGantt();

            this.closeModal(document.getElementById('assignTaskModal'));
            form.reset();

            console.log('任务分配成功:', taskId);
        } catch (error) {
            console.error('分配任务失败:', error);
            alert('分配任务失败，请重试');
        }
    }

    async startTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        const person = this.personnel.find(p => p.id === task.assignedTo);

        // 更新任务
        task.status = '进行中';
        task.actualStartTime = new Date().toISOString();

        try {
            // 更新到服务器
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(task)
            });

            if (!response.ok) {
                throw new Error('开始任务失败');
            }

            await this.addLog('start', `${person.name}开始了任务"${task.name}"`);
            this.renderTasks();
            this.renderGantt();

            console.log('任务开始成功:', taskId);
        } catch (error) {
            console.error('开始任务失败:', error);
            alert('开始任务失败，请重试');
        }
    }

    async completeTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        const person = this.personnel.find(p => p.id === task.assignedTo);

        // 更新任务
        task.status = '已完成';
        task.actualEndTime = new Date().toISOString();

        try {
            // 更新到服务器
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(task)
            });

            if (!response.ok) {
                throw new Error('完成任务失败');
            }

            await this.addLog('complete', `${person.name}完成了任务"${task.name}"`);
            this.renderTasks();
            this.renderGantt();

            console.log('任务完成成功:', taskId);
        } catch (error) {
            console.error('完成任务失败:', error);
            alert('完成任务失败，请重试');
        }
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
                                <h4 class="${task.status === '已完成' ? 'completed-task' : ''}">
                                    <span class="level-prefix">${task.level === 1 ? '📋' : task.level === 2 ? '📝' : '🔧'}</span>
                                    ${task.name}
                                </h4>
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
        
        // 检查是否全部展开（没有折叠的子任务）
        const allExpanded = Array.from(allTaskChildren).every(child => !child.classList.contains('collapsed'));
        
        if (allExpanded) {
            // 当前全部展开，执行全部折叠
            allTaskChildren.forEach(child => {
                child.classList.add('collapsed');
            });
            allToggleIcons.forEach(icon => {
                icon.innerHTML = '<i class="fas fa-plus"></i>';
                icon.setAttribute('data-collapsed', 'true');
            });
            toggleBtn.innerHTML = '<i class="fas fa-expand-alt"></i> 全部展开';
        } else {
            // 当前有折叠的，执行全部展开
            allTaskChildren.forEach(child => {
                child.classList.remove('collapsed');
            });
            allToggleIcons.forEach(icon => {
                icon.innerHTML = '<i class="fas fa-minus"></i>';
                icon.setAttribute('data-collapsed', 'false');
            });
            toggleBtn.innerHTML = '<i class="fas fa-compress-alt"></i> 全部折叠';
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
            
            // 根据优先级确定样式类
            const priorityClass = `priority-${task.priority}`;
            
            return `
                <div class="gantt-row">
                    <div class="gantt-task-name">
                        <div class="task-path">${pathDisplay}</div>
                        <small class="assignee">${person.name}</small>
                        <small class="priority-indicator ${priorityClass}">${task.priority}</small>
                    </div>
                    <div class="gantt-timeline">
                        <div class="gantt-bar ${priorityClass}" style="left: ${left}px; width: ${width}px;">
                            ${task.status}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="gantt-chart">
                <div class="gantt-legend">
                    <span class="legend-title">优先级图例：</span>
                    <span class="legend-item">
                        <span class="legend-color priority-高"></span>
                        高优先级
                    </span>
                    <span class="legend-item">
                        <span class="legend-color priority-中"></span>
                        中优先级
                    </span>
                    <span class="legend-item">
                        <span class="legend-color priority-低"></span>
                        低优先级
                    </span>
                </div>
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
    async addLog(type, message) {
        const log = {
            type: type,
            message: message
        };

        try {
            // 发送到服务器
            const response = await fetch('/api/logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(log)
            });

            if (response.ok) {
                const savedLog = await response.json();
                // 更新本地数组
                this.logs.unshift(savedLog);
                this.renderLogs();
                console.log('日志添加成功:', savedLog);
            } else {
                // 如果API失败，本地添加日志
                const localLog = {
                    id: Date.now(),
                    ...log,
                    timestamp: new Date().toISOString()
                };
                this.logs.unshift(localLog);
                this.renderLogs();
                console.log('日志添加成功（本地）:', localLog);
            }
        } catch (error) {
            console.error('添加日志失败:', error);
            // 本地添加日志作为后备
            const localLog = {
                id: Date.now(),
                ...log,
                timestamp: new Date().toISOString()
            };
            this.logs.unshift(localLog);
            this.renderLogs();
        }
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