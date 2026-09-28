/* ─────────────────────────────────────────────
   Taskly — main JS
   Features: Tabs, To-Do (CRUD + filter + check),
             Notes (CRUD), LocalStorage persistence
───────────────────────────────────────────── */

// ── LocalStorage helpers ────────────────────
const LS_TASKS = 'taskly_tasks';
const LS_NOTES = 'taskly_notes';

const loadTasks = () => JSON.parse(localStorage.getItem(LS_TASKS) || '[]');
const saveTasks = (arr) => localStorage.setItem(LS_TASKS, JSON.stringify(arr));
const loadNotes = () => JSON.parse(localStorage.getItem(LS_NOTES) || '[]');
const saveNotes = (arr) => localStorage.setItem(LS_NOTES, JSON.stringify(arr));

// ── State ───────────────────────────────────
let tasks  = loadTasks();  // [{ id, text, completed }]
let notes  = loadNotes();  // [{ id, title, body, date }]
let currentFilter = 'all';

// task currently being edited (for modal)
let editingTaskId = null;
let editingNoteId = null;

// ── DOM refs ────────────────────────────────
const taskInput        = document.getElementById('taskInput');
const addTaskBtn       = document.getElementById('addTaskBtn');
const taskList         = document.getElementById('taskList');
const taskCount        = document.getElementById('taskCount');
const clearCompletedBtn= document.getElementById('clearCompletedBtn');

const noteTitleInput   = document.getElementById('noteTitleInput');
const noteBodyInput    = document.getElementById('noteBodyInput');
const addNoteBtn       = document.getElementById('addNoteBtn');
const noteList         = document.getElementById('noteList');
const noNotesMsg       = document.getElementById('noNotesMsg');

const editModal        = document.getElementById('editModal');
const editTaskInput    = document.getElementById('editTaskInput');
const saveEditBtn      = document.getElementById('saveEditBtn');
const cancelEditBtn    = document.getElementById('cancelEditBtn');

const editNoteModal    = document.getElementById('editNoteModal');
const editNoteTitleInput = document.getElementById('editNoteTitleInput');
const editNoteBodyInput  = document.getElementById('editNoteBodyInput');
const saveNoteEditBtn  = document.getElementById('saveNoteEditBtn');
const cancelNoteEditBtn= document.getElementById('cancelNoteEditBtn');

// ── Date display ─────────────────────────────
document.getElementById('dateDisplay').textContent =
  new Date().toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' });

// ── Tab switching ────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// ── Filter buttons ───────────────────────────
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

// ═══════════════════════════════════════════
//   TO-DO SECTION
// ═══════════════════════════════════════════

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── Add task ────────────────────────────────
function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  tasks.push({ id: generateId(), text, completed: false });
  saveTasks(tasks);
  renderTasks();
  taskInput.value = '';
  taskInput.focus();
}

addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

// ── Toggle complete ──────────────────────────
function toggleTask(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  saveTasks(tasks);
  renderTasks();
}

// ── Delete task ──────────────────────────────
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks(tasks);
  renderTasks();
}

// ── Open edit modal ──────────────────────────
function openEditTask(id) {
  editingTaskId = id;
  const task = tasks.find(t => t.id === id);
  editTaskInput.value = task.text;
  editModal.style.display = 'flex';
  editTaskInput.focus();
}

saveEditBtn.addEventListener('click', () => {
  const newText = editTaskInput.value.trim();
  if (!newText) return;
  tasks = tasks.map(t => t.id === editingTaskId ? { ...t, text: newText } : t);
  saveTasks(tasks);
  renderTasks();
  editModal.style.display = 'none';
  editingTaskId = null;
});

cancelEditBtn.addEventListener('click', () => {
  editModal.style.display = 'none';
  editingTaskId = null;
});

editModal.addEventListener('click', e => {
  if (e.target === editModal) { editModal.style.display = 'none'; editingTaskId = null; }
});

editTaskInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveEditBtn.click(); });

// ── Clear completed ──────────────────────────
clearCompletedBtn.addEventListener('click', () => {
  tasks = tasks.filter(t => !t.completed);
  saveTasks(tasks);
  renderTasks();
});

// ── Render tasks ─────────────────────────────
function renderTasks() {
  const filtered = tasks.filter(t => {
    if (currentFilter === 'active')    return !t.completed;
    if (currentFilter === 'completed') return  t.completed;
    return true;
  });

  taskList.innerHTML = '';

  if (filtered.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-msg';
    empty.textContent = currentFilter === 'completed'
      ? 'No completed tasks yet.'
      : 'All clear! Add a task above.';
    taskList.appendChild(empty);
  } else {
    filtered.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item' + (task.completed ? ' completed' : '');
      li.dataset.id = task.id;

      // Checkbox
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.className = 'task-check';
      check.checked = task.completed;
      check.addEventListener('change', () => toggleTask(task.id));

      // Text
      const span = document.createElement('span');
      span.className = 'task-text';
      span.textContent = task.text;

      // Actions
      const actions = document.createElement('div');
      actions.className = 'task-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'icon-btn edit-btn';
      editBtn.textContent = '✏️';
      editBtn.title = 'Edit task';
      editBtn.addEventListener('click', () => openEditTask(task.id));

      const delBtn = document.createElement('button');
      delBtn.className = 'icon-btn delete-btn';
      delBtn.textContent = '🗑️';
      delBtn.title = 'Delete task';
      delBtn.addEventListener('click', () => deleteTask(task.id));

      actions.append(editBtn, delBtn);
      li.append(check, span, actions);
      taskList.appendChild(li);
    });
  }

  // Update footer count
  const remaining = tasks.filter(t => !t.completed).length;
  taskCount.textContent = `${remaining} task${remaining !== 1 ? 's' : ''} left`;
  clearCompletedBtn.style.display = tasks.some(t => t.completed) ? '' : 'none';
}

// ═══════════════════════════════════════════
//   NOTES SECTION
// ═══════════════════════════════════════════

// ── Add note ─────────────────────────────────
function addNote() {
  const title = noteTitleInput.value.trim();
  const body  = noteBodyInput.value.trim();
  if (!title && !body) return;

  const now = new Date();
  notes.unshift({
    id:    generateId(),
    title: title || 'Untitled',
    body,
    date:  now.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
  });
  saveNotes(notes);
  renderNotes();
  noteTitleInput.value = '';
  noteBodyInput.value  = '';
  noteTitleInput.focus();
}

addNoteBtn.addEventListener('click', addNote);
noteBodyInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.ctrlKey) addNote();
});

// ── Delete note ──────────────────────────────
function deleteNote(id) {
  notes = notes.filter(n => n.id !== id);
  saveNotes(notes);
  renderNotes();
}

// ── Open edit note modal ─────────────────────
function openEditNote(id) {
  editingNoteId = id;
  const note = notes.find(n => n.id === id);
  editNoteTitleInput.value = note.title;
  editNoteBodyInput.value  = note.body;
  editNoteModal.style.display = 'flex';
  editNoteTitleInput.focus();
}

saveNoteEditBtn.addEventListener('click', () => {
  const title = editNoteTitleInput.value.trim();
  const body  = editNoteBodyInput.value.trim();
  if (!title && !body) return;
  notes = notes.map(n => n.id === editingNoteId
    ? { ...n, title: title || 'Untitled', body }
    : n
  );
  saveNotes(notes);
  renderNotes();
  editNoteModal.style.display = 'none';
  editingNoteId = null;
});

cancelNoteEditBtn.addEventListener('click', () => {
  editNoteModal.style.display = 'none';
  editingNoteId = null;
});

editNoteModal.addEventListener('click', e => {
  if (e.target === editNoteModal) { editNoteModal.style.display = 'none'; editingNoteId = null; }
});

// ── Render notes ─────────────────────────────
function renderNotes() {
  noteList.innerHTML = '';

  if (notes.length === 0) {
    noNotesMsg.style.display = '';
    return;
  }
  noNotesMsg.style.display = 'none';

  notes.forEach(note => {
    const card = document.createElement('div');
    card.className = 'note-card';

    const titleEl = document.createElement('div');
    titleEl.className = 'note-card-title';
    titleEl.textContent = note.title;

    const bodyEl = document.createElement('div');
    bodyEl.className = 'note-card-body';
    bodyEl.textContent = note.body || '—';

    const dateEl = document.createElement('div');
    dateEl.className = 'note-card-date';
    dateEl.textContent = note.date;

    const actionsEl = document.createElement('div');
    actionsEl.className = 'note-card-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'icon-btn edit-btn';
    editBtn.textContent = '✏️';
    editBtn.title = 'Edit note';
    editBtn.addEventListener('click', () => openEditNote(note.id));

    const delBtn = document.createElement('button');
    delBtn.className = 'icon-btn delete-btn';
    delBtn.textContent = '🗑️';
    delBtn.title = 'Delete note';
    delBtn.addEventListener('click', () => deleteNote(note.id));

    actionsEl.append(editBtn, delBtn);
    card.append(titleEl, bodyEl, dateEl, actionsEl);
    noteList.appendChild(card);
  });
}

// ── Init ──────────────────────────────────────
renderTasks();
renderNotes();
