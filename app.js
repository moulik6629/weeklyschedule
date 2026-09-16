/**
 * ============================================================================
 * AIIMS Bhubaneswar MBBS Exam Schedule — app.js
 * Batches: 2022, 2023, 2024
 * ============================================================================
 */

/* ---------- CONFIGURATION & THEMES ---------- */
const DAYS        = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const GRID_START  = 8;   // 08:00 AM
const GRID_END    = 18;  // 06:00 PM
const SLOT_HEIGHT = 60;  // Pixels per hour

const PALETTE = [
  { bg: 'var(--c0)', accent: 'var(--ca0)' }, // Peach / Amber (Batch 2022)
  { bg: 'var(--c1)', accent: 'var(--ca1)' }, // Sage / Emerald (Batch 2023)
  { bg: 'var(--c2)', accent: 'var(--ca2)' }, // Periwinkle / Navy (Batch 2024)
  { bg: 'var(--c4)', accent: 'var(--ca4)' }, // Lavender
  { bg: 'var(--c5)', accent: 'var(--ca5)' }, // Sky
  { bg: 'var(--c6)', accent: 'var(--ca6)' }, // Rose
];

const BATCH_COLORS = {
  'Batch 2022': { bg: 'var(--c0)', accent: 'var(--ca0)' },
  'Batch 2023': { bg: 'var(--c1)', accent: 'var(--ca1)' },
  'Batch 2024': { bg: 'var(--c2)', accent: 'var(--ca2)' },
};

const STORAGE_KEY = 'aiims_mbbs_exams_schedule_v2';

/* ---------- APPLICATION STATE ---------- */
let allEvents       = [];
let subjectMap      = {};
let weekOffset      = 0;     // 0 = current week, +1 = next week, -1 = last week
let activeGroup     = 'all'; // 'all', '2022', '2023', '2024'
let activeEvent     = null;  // For detail modal & deletion

/* ---------- UTILITY FUNCTIONS ---------- */

function toMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour   = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${suffix}`;
}

function parseDate(dateStr) {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatShortDate(date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function getWeekStart(offset = 0) {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  const monday = new Date(now);
  monday.setDate(now.getDate() - dow + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getColor(subject) {
  if (subject in BATCH_COLORS) return BATCH_COLORS[subject];
  if (!subject) return PALETTE[0];
  const normalized = subject.trim();
  if (!(normalized in subjectMap)) {
    subjectMap[normalized] = Object.keys(subjectMap).length % PALETTE.length;
  }
  return PALETTE[subjectMap[normalized]];
}

/* ---------- RENDER FUNCTIONS ---------- */

function buildLegend() {
  const legend = document.getElementById('legend');
  if (!legend) return;
  legend.innerHTML = '';

  const batches = ['Batch 2022', 'Batch 2023', 'Batch 2024'];
  batches.forEach(b => {
    const color = getColor(b);
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `
      <span class="legend-dot" style="background: ${color.accent}"></span>
      <span>${b}</span>
    `;
    legend.appendChild(item);
  });
}

function buildGrid() {
  const grid      = document.getElementById('schedule-grid');
  const weekStart = getWeekStart(weekOffset);
  const weekEnd   = addDays(weekStart, 6);
  const today     = new Date();
  today.setHours(0, 0, 0, 0);

  // Update Week Label in header
  const weekLabelEl = document.getElementById('week-label');
  if (weekLabelEl) {
    const yearStr = weekStart.getFullYear() === weekEnd.getFullYear()
      ? weekStart.getFullYear()
      : `${weekStart.getFullYear()} / ${weekEnd.getFullYear()}`;
    weekLabelEl.textContent = `${formatShortDate(weekStart)} – ${formatShortDate(weekEnd)}, ${yearStr}`;
  }

  // Clear previous grid
  grid.innerHTML = '';

  // 1. TOP-LEFT CORNER CELL
  const corner = document.createElement('div');
  corner.className = 'grid-header time-header';
  corner.innerHTML = `<span style="font-size:0.68rem; font-weight:700; color:var(--ink-3); text-transform:uppercase;">Time</span>`;
  grid.appendChild(corner);

  // 2. DAY HEADER COLUMNS (Mon to Sun)
  const weekDayDates = [];
  DAYS.forEach((day, i) => {
    const dayDate = addDays(weekStart, i);
    weekDayDates.push(dayDate);
    const isToday = dayDate.getTime() === today.getTime();

    const cell = document.createElement('div');
    cell.className = `grid-header day-header-col${isToday ? ' today' : ''}`;
    cell.innerHTML = `
      <div class="day-name">${DAY_SHORT[i]}</div>
      <div class="day-date">${dayDate.getDate()}</div>
    `;
    grid.appendChild(cell);
  });

  // 3. TIME SLOT ROWS & DAY CELLS
  for (let h = GRID_START; h < GRID_END; h++) {
    const timeCell = document.createElement('div');
    timeCell.className = 'time-label';
    timeCell.style.height = `${SLOT_HEIGHT}px`;
    timeCell.textContent = `${String(h).padStart(2, '0')}:00`;
    grid.appendChild(timeCell);

    DAYS.forEach((day, i) => {
      const dayDate = weekDayDates[i];
      const isToday = dayDate.getTime() === today.getTime();

      const cell = document.createElement('div');
      cell.className = `grid-cell${isToday ? ' today-col' : ''}`;
      cell.style.height = `${SLOT_HEIGHT}px`;
      cell.dataset.day = day;
      cell.dataset.hour = h;
      cell.dataset.date = toDateKey(dayDate);
      grid.appendChild(cell);
    });
  }

  // 4. FILTER VISIBLE EXAMS FOR THIS WEEK & ACTIVE BATCH
  const wsTime = weekStart.getTime();
  const weTime = addDays(weekStart, 7).getTime();

  const visibleEvents = allEvents.filter(evt => {
    // Match batch filter
    const evtBatch = (evt.batch || evt.group || '').toLowerCase();
    const curGroup = activeGroup.toLowerCase();
    const batchMatch = (curGroup === 'all') || (evtBatch === curGroup) || (evtBatch.includes(curGroup));
    if (!batchMatch) return false;

    // Match this week's date range
    if (evt.date) {
      const evtTime = parseDate(evt.date).getTime();
      const inThisWeek = (evtTime >= wsTime && evtTime < weTime);
      if (inThisWeek) return true;
    }

    if (evt.recurring === true || evt.recurring === 'yes') {
      return true;
    }

    return false;
  });

  // 5. PLACE EXAMS ONTO THE GRID
  let hasAnyEvent = false;

  visibleEvents.forEach(evt => {
    let dayName = evt.day;
    if (evt.date && !dayName) {
      const d = parseDate(evt.date);
      const dayIdx = (d.getDay() + 6) % 7;
      dayName = DAYS[dayIdx];
    }

    if (!dayName) return;

    const startMin = toMinutes(evt.start_time);
    const endMin   = toMinutes(evt.end_time);

    if (startMin < GRID_START * 60 || endMin > (GRID_END + 1) * 60 || endMin <= startMin) return;

    hasAnyEvent = true;
    const color = getColor(evt.subject);

    const startHour = Math.floor(startMin / 60);
    const minuteWithinHour = startMin % 60;
    const durationMinutes = endMin - startMin;

    const topPx = (minuteWithinHour / 60) * SLOT_HEIGHT + 2;
    const heightPx = Math.max((durationMinutes / 60) * SLOT_HEIGHT - 4, 34);

    const cellSelector = `[data-day="${dayName}"][data-hour="${startHour}"]`;
    const anchorCell = grid.querySelector(cellSelector);
    if (!anchorCell) return;

    const block = document.createElement('div');
    block.className = 'event-block';
    block.style.cssText = `
      --event-accent: ${color.accent};
      background-color: ${color.bg};
      top: ${topPx}px;
      height: ${heightPx}px;
    `;

    block.innerHTML = `
      <div class="event-subject">${evt.subject || 'Exam'}</div>
      <div class="event-topic">${evt.topic || ''}</div>
      ${heightPx >= 54 ? `<div class="event-faculty">${evt.room || 'Exam Hall'}</div>` : ''}
      ${heightPx >= 72 ? `<div class="event-time-label">${formatTime(evt.start_time)} – ${formatTime(evt.end_time)}</div>` : ''}
    `;

    block.addEventListener('click', (e) => {
      e.stopPropagation();
      openDetailModal(evt, color, dayName);
    });

    anchorCell.appendChild(block);
  });

  // 6. TOGGLE EMPTY STATE
  const emptyStateEl = document.getElementById('empty-state');
  const gridWrapper = document.querySelector('.grid-scroll-wrapper');
  if (emptyStateEl && gridWrapper) {
    if (!hasAnyEvent) {
      emptyStateEl.classList.remove('hidden');
    } else {
      emptyStateEl.classList.add('hidden');
    }
  }
}

/* ---------- MODAL LOGIC ---------- */

function openDetailModal(evt, color, dayName) {
  activeEvent = evt;

  document.getElementById('modal-color-bar').style.background = color.accent;
  document.getElementById('modal-tag').textContent = evt.subject || 'Exam';
  
  const groupBadge = document.getElementById('modal-group-badge');
  groupBadge.textContent = evt.batch ? `Batch ${evt.batch}` : 'MBBS Exam';

  document.getElementById('modal-title').textContent = evt.topic || evt.subject;
  document.getElementById('modal-faculty').textContent = evt.notes || 'AIIMS Bhubaneswar Examination';
  document.getElementById('modal-time').textContent = `${formatTime(evt.start_time)} – ${formatTime(evt.end_time)}`;
  
  const dateObj = evt.date ? parseDate(evt.date) : new Date();
  const dateFormatted = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  document.getElementById('modal-day').textContent = `${dayName || evt.day || ''} • ${dateFormatted}`;

  document.getElementById('modal-room').textContent = evt.room || 'Examination Hall / LT';

  document.getElementById('modal-backdrop').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeDetailModal() {
  document.getElementById('modal-backdrop').classList.add('hidden');
  document.body.style.overflow = '';
  activeEvent = null;
}

function deleteActiveEvent() {
  if (!activeEvent) return;
  if (!confirm(`Are you sure you want to delete "${activeEvent.subject} - ${activeEvent.topic}"?`)) return;

  allEvents = allEvents.filter(e => e.id !== activeEvent.id);
  saveToStorage();
  closeDetailModal();
  buildLegend();
  buildGrid();
}

function openAddModal() {
  const form = document.getElementById('add-event-form');
  form.reset();

  const weekStart = getWeekStart(weekOffset);
  document.getElementById('form-date').value = toDateKey(weekStart);

  document.getElementById('add-modal-backdrop').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeAddModal() {
  document.getElementById('add-modal-backdrop').classList.add('hidden');
  document.body.style.overflow = '';
}

function handleAddEventSubmit(e) {
  e.preventDefault();

  const subject   = document.getElementById('form-subject').value.trim();
  const group     = document.getElementById('form-group').value;
  const topic     = document.getElementById('form-topic').value.trim();
  const faculty   = document.getElementById('form-faculty').value.trim();
  const room      = document.getElementById('form-room').value.trim();
  const dateStr   = document.getElementById('form-date').value;
  const recurring = document.getElementById('form-recurring').value === 'yes';
  const startTime = document.getElementById('form-start').value;
  const endTime   = document.getElementById('form-end').value;

  if (toMinutes(endTime) <= toMinutes(startTime)) {
    alert('End time must be after start time.');
    return;
  }

  const d = parseDate(dateStr);
  const dayIdx = (d.getDay() + 6) % 7;
  const dayName = DAYS[dayIdx];

  const newEvent = {
    id: `exam-${Date.now()}`,
    batch: group,
    subject,
    topic,
    faculty: faculty || 'Exam Cell',
    room: room || 'Examination Hall / LT',
    date: dateStr,
    day: dayName,
    start_time: startTime,
    end_time: endTime,
    group,
    recurring
  };

  allEvents.push(newEvent);
  saveToStorage();

  getColor(subject);
  buildLegend();
  buildGrid();

  closeAddModal();
}

/* ---------- STORAGE MANAGEMENT ---------- */
function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allEvents));
  } catch (err) {
    console.warn('Could not save to localStorage:', err);
  }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Could not read from localStorage:', err);
  }
  return null;
}

/* ---------- DATA INITIALIZATION ---------- */
async function initializeSchedule() {
  const storedEvents = loadFromStorage();
  if (storedEvents && storedEvents.length > 0) {
    allEvents = storedEvents;
  } else {
    try {
      const res = await fetch('./schedule.json');
      if (res.ok) {
        const data = await res.json();
        allEvents = data.events || [];
        saveToStorage();
      }
    } catch (err) {
      console.warn('Failed to fetch schedule.json:', err);
    }
  }

  buildLegend();
  buildGrid();
}

/* ---------- ICS CALENDAR EXPORT ---------- */
function pad(n) {
  return String(n).padStart(2, '0');
}

function toICSDateTime(dateStr, timeStr) {
  const [y, mo, d] = dateStr.split('-');
  const [h, m]     = timeStr.split(':');
  return `${y}${pad(mo)}${pad(d)}T${pad(h)}${pad(m)}00`;
}

function generateICSContent(events) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AIIMS Bhubaneswar MBBS Exam Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:MBBS Exam Schedule'
  ];

  events.forEach((evt, idx) => {
    if (!evt.date || !evt.start_time || !evt.end_time) return;
    lines.push(
      'BEGIN:VEVENT',
      `UID:aiims-exam-${idx}-${evt.id || Date.now()}@aiimsbbsr`,
      `DTSTAMP:${toICSDateTime(toDateKey(new Date()), '00:00')}Z`,
      `DTSTART:${toICSDateTime(evt.date, evt.start_time)}`,
      `DTEND:${toICSDateTime(evt.date, evt.end_time)}`,
      `SUMMARY:${evt.subject} Exam: ${evt.topic}`,
      `DESCRIPTION:Batch: ${evt.batch || evt.group || 'MBBS'}\\nLocation: ${evt.room || 'Exam Hall'}\\nDetails: ${evt.notes || ''}`,
      `LOCATION:${evt.room || 'AIIMS Bhubaneswar'}`,
      `CATEGORIES:${evt.subject}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function downloadICS() {
  if (!allEvents.length) {
    alert('No exams to export!');
    return;
  }
  const content = generateICSContent(allEvents);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'aiims-mbbs-exam-schedule.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---------- EVENT LISTENERS ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initializeSchedule();

  document.getElementById('prev-week').addEventListener('click', () => {
    weekOffset--;
    buildGrid();
  });

  document.getElementById('next-week').addEventListener('click', () => {
    weekOffset++;
    buildGrid();
  });

  document.getElementById('today-btn').addEventListener('click', () => {
    weekOffset = 0;
    buildGrid();
  });

  document.querySelectorAll('.group-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.group-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeGroup = btn.dataset.group;
      buildGrid();
    });
  });

  document.getElementById('modal-close').addEventListener('click', closeDetailModal);
  document.getElementById('modal-close-action').addEventListener('click', closeDetailModal);
  document.getElementById('modal-delete-btn').addEventListener('click', deleteActiveEvent);
  document.getElementById('modal-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'modal-backdrop') closeDetailModal();
  });

  document.getElementById('open-add-btn').addEventListener('click', openAddModal);
  document.getElementById('add-modal-close').addEventListener('click', closeAddModal);
  document.getElementById('add-modal-cancel').addEventListener('click', closeAddModal);
  document.getElementById('add-modal-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'add-modal-backdrop') closeAddModal();
  });
  document.getElementById('add-event-form').addEventListener('submit', handleAddEventSubmit);

  document.getElementById('export-ics-btn').addEventListener('click', (e) => {
    e.preventDefault();
    downloadICS();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDetailModal();
      closeAddModal();
    }
  });
});
