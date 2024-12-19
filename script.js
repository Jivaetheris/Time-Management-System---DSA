const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const summaryContent = document.getElementById('summary-content');
const overviewContent = document.getElementById('overview-content');
const searchInput = document.getElementById('task-search');
let activeTaskId = null;
let timerInterval = null;
let timeSpent = 0;

// Local Storage Keys
const TASKS_KEY = 'tasks';

// Load tasks from local storage
let tasks = JSON.parse(localStorage.getItem(TASKS_KEY)) || [];

searchInput.addEventListener('input', renderTasks);

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const newTask = {
    id: Date.now(),
    title: document.getElementById('task-title').value,
    description: document.getElementById('task-desc').value,
    priority: document.getElementById('task-priority').value,
    startTime: document.getElementById('task-start-time').value,
    duration: parseInt(document.getElementById('task-duration').value, 10),
    day: document.getElementById('task-day').value,
  };

  if (isConflict(newTask)) {
    alert("You already have a schedule within this time! Now Rescheduling.");
    rescheduleTask(newTask);
  }

  tasks.push(newTask);
  saveTasks();
  renderTasks();
  renderDailySummary(); // Update daily summary
  taskForm.reset();
  alert("Task Created!");
});

// Delete Task
taskList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-task')) {
      const taskId = parseInt(e.target.dataset.id, 10);
      deleteTask(taskId);
      renderDailySummary(); // Update daily summary after deletion
    }
});

taskList.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-task')) {
      const taskId = e.target.dataset.id;
      openEditModal(taskId);
}
});

  
function openEditModal(taskId) {
    const task = tasks.find(t => t.id === parseInt(taskId));
    document.getElementById('edit-task-title').value = task.title;
    document.getElementById('edit-task-desc').value = task.description;
    document.getElementById('edit-task-priority').value = task.priority;
    document.getElementById('edit-task-start-time').value = task.startTime;
    document.getElementById('edit-task-duration').value = task.duration;
    document.getElementById('edit-task-day').value = task.day;
    document.getElementById('edit-task-form').dataset.id = taskId;
    document.getElementById('edit-task-modal').classList.remove('hidden');
}

document.getElementById('edit-task-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const taskId = parseInt(this.dataset.id, 10); // Get the task ID from form's data attribute
    const updatedTask = {
        id: taskId,
        title: document.getElementById('edit-task-title').value,
        description: document.getElementById('edit-task-desc').value,
        priority: document.getElementById('edit-task-priority').value,
        startTime: document.getElementById('edit-task-start-time').value,
        duration: parseInt(document.getElementById('edit-task-duration').value, 10),
        day: document.getElementById('edit-task-day').value,
    };

    // Find the task in the array and update it
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    tasks[taskIndex] = updatedTask;

    // Save to localStorage and render tasks
    saveTasks();
    renderTasks();
    renderDailySummary(); // Update daily summary
    document.getElementById('edit-task-modal').classList.add('hidden'); // Hide modal
    alert("Task Updated!");
});

// Cancel the edit operation
document.getElementById('cancel-edit').addEventListener('click', () => {
    document.getElementById('edit-task-modal').classList.add('hidden'); // Hide modal
});

function isConflict(newTask) {
  return tasks.some(task =>
    task.day === newTask.day &&
    task.startTime === newTask.startTime
  );
}

function rescheduleTask(task) {
  const nextTime = incrementTime(task.startTime, task.duration);
  task.startTime = nextTime;
}

function incrementTime(time, duration) {
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + duration;
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
}

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function deleteTask(taskId) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  tasks = tasks.filter(task => task.id !== taskId);
  saveTasks();
  renderTasks();
}

function startTimer(taskId) {
  if (activeTaskId !== null && activeTaskId !== taskId) {
    alert("Please stop the active timer before starting another.");
    return;
  }

  activeTaskId = taskId;
  const task = tasks.find(t => t.id === taskId);

  if (!task.actualTimeSpent) task.actualTimeSpent = 0;

  timerInterval = setInterval(() => {
    task.actualTimeSpent++;
    renderTasks();
    renderDailySummary();
  }, 1000); // Update every second
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  activeTaskId = null;
  alert("Timer Paused!");
}

function stopTimer(taskId) {
  if (taskId !== activeTaskId) {
    alert("No active timer for this task.");
    return;
  } else {
    alert("Timer Saved!");
  }

  clearInterval(timerInterval);
  timerInterval = null;
  activeTaskId = null;

  saveTasks();
  renderTasks();
}

function searchTasks(keyword) {
    return tasks.filter(task => {
      const searchLower = keyword.toLowerCase();
      return task.title.toLowerCase().includes(searchLower) || task.description.toLowerCase().includes(searchLower);
    });
}

function renderTasks() {
    taskList.innerHTML = "";

    const keyword = searchInput.value;
    const filteredTasks = keyword ? searchTasks(keyword) : tasks;

    filteredTasks.forEach(task => {
      const taskDiv = document.createElement("div");
      taskDiv.className = "task";
      taskDiv.dataset.priority = task.priority;
      taskDiv.dataset.id = task.id;

      taskDiv.style.display = "flex";
      taskDiv.style.justifyContent = "space-between";
      taskDiv.style.alignItems = "flex-start";
      taskDiv.style.background = "white";
      taskDiv.style.padding = "1rem";
      taskDiv.style.marginBottom = "1rem";
      taskDiv.style.borderLeft = "5px solid";

      const taskContent = document.createElement("div");
      taskContent.style.flex = "1";

      taskContent.innerHTML = `
        <h3>${task.title}</h3>
        <p>${task.description}</p>
        <p>Priority: ${task.priority}</p>
        <p>Start Time: ${task.startTime}</p>
        <p>Duration: ${task.duration} minutes</p>
        <p>Day: ${task.day}</p>
        <p>Actual Time Spent: ${task.actualTimeSpent || 0} seconds</p>
      `;

      const buttonContainer = document.createElement("div");
      buttonContainer.style.display = "flex";
      buttonContainer.style.flexDirection = "column";
      buttonContainer.style.gap = "0.5rem";

      const editButton = document.createElement("button");
      editButton.className = "edit-task";
      editButton.dataset.id = task.id;
      editButton.textContent = "Edit";
      editButton.style.padding = "0.5rem 1rem";
      editButton.style.color = "white";
      editButton.style.border = "none";
      editButton.style.cursor = "pointer";
      editButton.style.borderRadius = "5px";

      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-task";
      deleteButton.dataset.id = task.id;
      deleteButton.textContent = "Delete";
      deleteButton.style.padding = "0.5rem 1rem";
      deleteButton.style.color = "white";
      deleteButton.style.border = "none";
      deleteButton.style.cursor = "pointer";
      deleteButton.style.borderRadius = "5px";

      const startButton = document.createElement("button");
      startButton.className = "start-task";
      startButton.dataset.id = task.id;
      startButton.textContent = "Start";
      startButton.style.padding = "0.5rem 1rem";
      startButton.style.color = "white";
      startButton.style.border = "none";
      startButton.style.cursor = "pointer";
      startButton.style.borderRadius = "5px";
      startButton.addEventListener("click", () => startTimer(task.id));

      const pauseButton = document.createElement("button");
      pauseButton.className = "pause-task";
      pauseButton.dataset.id = task.id;
      pauseButton.textContent = "Pause";
      pauseButton.style.padding = "0.5rem 1rem";
      pauseButton.style.color = "white";
      pauseButton.style.border = "none";
      pauseButton.style.cursor = "pointer";
      pauseButton.style.borderRadius = "5px";
      pauseButton.addEventListener("click", pauseTimer);

      const stopButton = document.createElement("button");
      stopButton.className = "stop-task";
      stopButton.dataset.id = task.id;
      stopButton.textContent = "Stop";
      stopButton.style.padding = "0.5rem 1rem";
      stopButton.style.color = "white";
      stopButton.style.border = "none";
      stopButton.style.cursor = "pointer";
      stopButton.style.borderRadius = "5px";
      stopButton.addEventListener("click", () => stopTimer(task.id));

      buttonContainer.appendChild(editButton);
      buttonContainer.appendChild(deleteButton);
      buttonContainer.appendChild(startButton);
      buttonContainer.appendChild(pauseButton);
      buttonContainer.appendChild(stopButton);

      taskDiv.appendChild(taskContent);
      taskDiv.appendChild(buttonContainer);

      taskList.appendChild(taskDiv);
    });
    renderWeeklyOverview();
}

function renderDailySummary() {
    const dailySummary = {}; 

    tasks.forEach(task => {
      if (!dailySummary[task.day]) {
        dailySummary[task.day] = {
          estimatedTime: 0,
          actualTime: 0,
          tasks: [],
        };
      }

      dailySummary[task.day].estimatedTime += task.duration;
      dailySummary[task.day].actualTime += task.actualTimeSpent || 0;
      dailySummary[task.day].tasks.push(task);
    });

    summaryContent.innerHTML = '';
    for (let day in dailySummary) {
      const summaryDiv = document.createElement('div');
      summaryDiv.innerHTML = `
        <h4>${day}</h4>
        <p>Estimated Time: ${dailySummary[day].estimatedTime} minutes</p>
        <p>Actual Time: ${dailySummary[day].actualTime} seconds</p>
        <ul>
          ${dailySummary[day].tasks
            .map(task => `<li>${task.title}</li>`)
            .join('')}
        </ul>
        <hr>
      `;
      summaryContent.appendChild(summaryDiv);
    }

}

function renderWeeklyOverview() {
    const weeklySummary = {};

    tasks.forEach(task => {
      const day = task.day;

      if (!weeklySummary[day]) {
        weeklySummary[day] = {
          tasksCount: 0,
          estimatedTime: 0,
          actualTime: 0,
        };
      }

      weeklySummary[day].tasksCount += 1;
      weeklySummary[day].estimatedTime += task.duration;
      weeklySummary[day].actualTime += task.actualTimeSpent || 0;
    });

    overviewContent.innerHTML = '';
    for (let day in weeklySummary) {
      const overviewDiv = document.createElement('div');
      overviewDiv.innerHTML = `
        <h4>${day}</h4>
        <p>Tasks: ${weeklySummary[day].tasksCount}</p>
        <p>Estimated Time: ${weeklySummary[day].estimatedTime} minutes</p>
        <p>Actual Time: ${weeklySummary[day].actualTime} seconds</p>
        <hr>
      `;
      overviewContent.appendChild(overviewDiv);
    }
}

renderTasks();
renderDailySummary();
