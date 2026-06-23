'use strict';

// ─── EXERCISE LIBRARY ────────────────────────────────────────────────────────

const EXERCISE_LIBRARY = {
  Chest: [
    'Bench Press','Incline Bench Press','Decline Bench Press',
    'Dumbbell Bench Press','Incline Dumbbell Press','Decline Dumbbell Press',
    'Dumbbell Flyes','Incline Dumbbell Flyes','Cable Crossover',
    'Cable Flyes','Pec Deck Machine','Machine Chest Press',
    'Push-ups','Chest Dips','Svend Press','Landmine Press'
  ],
  Back: [
    'Deadlift','Rack Pulls','Barbell Row','Pendlay Row','T-Bar Row',
    'Pull-ups','Chin-ups','Lat Pulldown','Wide-Grip Pulldown',
    'Close-Grip Pulldown','Seated Cable Row','One-Arm Dumbbell Row',
    'Chest-Supported Row','Straight-Arm Pulldown','Face Pulls',
    'Good Mornings','Hyperextensions','Dumbbell Pullover'
  ],
  Shoulders: [
    'Overhead Press','Seated Dumbbell Press','Arnold Press',
    'Machine Shoulder Press','Lateral Raises','Cable Lateral Raise',
    'Front Raises','Rear Delt Flyes','Cable Rear Delt Fly',
    'Upright Row','Barbell Shrugs','Dumbbell Shrugs'
  ],
  Biceps: [
    'Barbell Curl','Dumbbell Curl','Hammer Curl','Preacher Curl',
    'Concentration Curl','Cable Curl','EZ Bar Curl',
    'Incline Dumbbell Curl','Spider Curl','Reverse Curl','Zottman Curl'
  ],
  Triceps: [
    'Tricep Pushdown','Skull Crushers','Close-Grip Bench Press',
    'Overhead Tricep Extension','Tricep Dips','Diamond Push-ups',
    'Cable Overhead Extension','Tricep Kickbacks','JM Press'
  ],
  Legs: [
    'Back Squat','Front Squat','Pause Squat','Safety Bar Squat',
    'Hack Squat','Goblet Squat','Leg Press','Romanian Deadlift',
    'Sumo Deadlift','Bulgarian Split Squat','Lunges','Walking Lunges',
    'Leg Curl','Leg Extension','Standing Calf Raises','Seated Calf Raises',
    'Nordic Curls','Step-ups','Box Jumps',
    'Hip Abduction Machine','Hip Adduction Machine'
  ],
  Glutes: [
    'Hip Thrust','Glute Bridge','Single-Leg Hip Thrust',
    'Cable Kickback','Donkey Kicks','Lateral Band Walk',
    'Banded Clamshells','Sumo Squat','Glute Ham Raise'
  ],
  Core: [
    'Plank','Side Plank','Crunches','Bicycle Crunches','Leg Raises',
    'Hanging Leg Raises','Russian Twist','Cable Crunch','Ab Wheel Rollout',
    'Dead Bug','Pallof Press','Dragon Flag','L-sit','V-ups'
  ],
  Cardio: [
    'Treadmill','Elliptical','Stationary Bike','Rowing Machine',
    'StairMaster','Battle Ropes','Jump Rope','Assault Bike','Sled Push'
  ]
};

const ALL_EXERCISES = Object.entries(EXERCISE_LIBRARY)
  .flatMap(([group, exs]) => exs.map(name => ({ name, group })));

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const DAY_KEYS = ['sun','mon','tue','wed','thu','fri','sat'];
const DAY_NAMES = { sun:'Sunday', mon:'Monday', tue:'Tuesday', wed:'Wednesday', thu:'Thursday', fri:'Friday', sat:'Saturday' };
const DAY_ABBR  = { sun:'Sun', mon:'Mon', tue:'Tue', wed:'Wed', thu:'Thu', fri:'Fri', sat:'Sat' };

const DEFAULT_BENCHMARKS = ['Bench Press','Back Squat','Deadlift','Overhead Press'];

// ─── DATA LAYER ───────────────────────────────────────────────────────────────

const DB = {
  _get(key, def) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
    catch { return def; }
  },
  _set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },

  getSettings()   { return this._get('fit_settings',   { units: 'imperial' }); },
  saveSettings(v) { this._set('fit_settings', v); },

  getRoutines()   { return this._get('fit_routines',   {}); },
  saveRoutines(v) { this._set('fit_routines', v); },

  getWorkouts()   { return this._get('fit_workouts',   []); },
  saveWorkouts(v) { this._set('fit_workouts', v); },

  getRuns()       { return this._get('fit_runs',       []); },
  saveRuns(v)     { this._set('fit_runs', v); },

  getBodyweight() { return this._get('fit_bodyweight', []); },
  saveBodyweight(v){ this._set('fit_bodyweight', v); },

  getBenchmarks() {
    const bms = this._get('fit_benchmarks', {});
    // ensure defaults exist
    DEFAULT_BENCHMARKS.forEach(name => { if (!bms[name]) bms[name] = []; });
    return bms;
  },
  saveBenchmarks(v){ this._set('fit_benchmarks', v); },

  getSession()    { return this._get('fit_session', null); },
  saveSession(v)  { this._set('fit_session', v); },

  clearAll() {
    ['fit_settings','fit_routines','fit_workouts','fit_runs',
     'fit_bodyweight','fit_benchmarks','fit_session'].forEach(k => localStorage.removeItem(k));
  }
};

// ─── UTILITIES ────────────────────────────────────────────────────────────────

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function dateToStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function fmtDate(str) {
  if (!str) return '';
  const [y,m,d] = str.split('-');
  return new Date(+y, +m-1, +d).toLocaleDateString('en-US', { month:'short', day:'numeric' });
}

function getDayKey(dateStr) {
  const [y,m,d] = (dateStr || todayStr()).split('-');
  return DAY_KEYS[new Date(+y, +m-1, +d).getDay()];
}

function epley(weight, reps) {
  if (!weight || !reps) return 0;
  if (+reps === 1) return +weight;
  return Math.round(+weight * (1 + +reps / 30));
}

function parseDuration(str) {
  if (!str) return 0;
  const parts = str.trim().split(':').map(Number);
  if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
  if (parts.length === 2) return parts[0]*60 + parts[1];
  return +parts[0] || 0;
}

function fmtDuration(secs) {
  secs = Math.round(+secs || 0);
  const h = Math.floor(secs/3600);
  const m = Math.floor((secs%3600)/60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

function calcPace(distance, durationSecs, units) {
  if (!distance || !durationSecs) return '–';
  const secsPerUnit = durationSecs / +distance;
  const m = Math.floor(secsPerUnit/60);
  const s = Math.round(secsPerUnit%60);
  const unit = units === 'metric' ? 'km' : 'mi';
  return `${m}:${String(s).padStart(2,'0')}/${unit}`;
}

function getUnitLabel() {
  return DB.getSettings().units === 'metric' ? 'kg' : 'lbs';
}

function getDistLabel() {
  return DB.getSettings().units === 'metric' ? 'km' : 'mi';
}

function calculateStreak() {
  const routines = DB.getRoutines();
  const workouts = DB.getWorkouts();
  const wDates = new Set(workouts.map(w => w.date));
  const today = todayStr();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = dateToStr(d);
    const dk = DAY_KEYS[d.getDay()];
    const routine = routines[dk];
    const isRest = !routine || routine.label === 'Rest' || !routine.exercises || routine.exercises.length === 0;
    const hasWorkout = wDates.has(ds);
    if (hasWorkout || isRest) {
      streak++;
    } else if (ds === today) {
      // today's training day not yet logged — don't break streak
    } else {
      break;
    }
  }
  return streak;
}

function getLastExerciseData(exerciseName, beforeDate) {
  const workouts = DB.getWorkouts();
  for (let i = workouts.length - 1; i >= 0; i--) {
    if (workouts[i].date >= beforeDate) continue;
    const ex = workouts[i].exercises.find(e => e.name === exerciseName);
    if (ex && ex.sets && ex.sets.length) return ex;
  }
  return null;
}

function createSession(dayKey, dateStr) {
  const routines = DB.getRoutines();
  const routine  = routines[dayKey] || { label: 'Rest', exercises: [] };
  const exercises = (routine.exercises || []).map(ex => {
    const last = getLastExerciseData(ex.name, dateStr);
    const numSets = ex.sets || 3;
    const sets = [];
    for (let i = 0; i < numSets; i++) {
      sets.push({
        weight: last?.sets?.[i]?.weight ?? '',
        reps:   last?.sets?.[i]?.reps   ?? (ex.reps || ''),
        done:   false
      });
    }
    return { name: ex.name, sets };
  });
  return { date: dateStr, dayKey, label: routine.label, exercises, completed: false };
}

// ─── SVG GRAPH ENGINE ─────────────────────────────────────────────────────────

function renderGraph(data, { yLabel = '', W = 320, H = 170 } = {}) {
  if (!data || data.length < 2) {
    return `<div class="empty-state"><span>📊</span>Not enough data yet</div>`;
  }
  const PL = 50, PR = 14, PT = 16, PB = 38;
  const iW = W - PL - PR, iH = H - PT - PB;
  const ys = data.map(d => d.y);
  const minY = Math.min(...ys), rawMax = Math.max(...ys);
  const rangeY = rawMax - minY || 1;
  const maxY = rawMax + rangeY * 0.12;
  const adjMin = Math.max(0, minY - rangeY * 0.08);
  const totalRange = maxY - adjMin;

  const n = data.length;
  const sx = i => PL + (i / (n - 1)) * iW;
  const sy = y => PT + iH - ((y - adjMin) / totalRange) * iH;

  const pts = data.map((d, i) => `${sx(i)},${sy(d.y)}`).join(' ');

  // y ticks
  const numY = 4;
  const yTicks = Array.from({length: numY+1}, (_, i) => {
    const val = adjMin + (totalRange / numY) * i;
    return { val, py: sy(val) };
  });

  // x ticks: up to 5 evenly spaced
  const maxX = 5;
  const step  = Math.max(1, Math.ceil(n / maxX));
  const xTicks = [];
  for (let i = 0; i < n; i += step) xTicks.push({ i, label: data[i].label });
  if (xTicks[xTicks.length-1].i !== n-1) xTicks.push({ i: n-1, label: data[n-1].label });

  return `
<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <style>text{font-family:'Caveat',cursive;}</style>
  ${yTicks.map(t => `<line x1="${PL}" y1="${t.py.toFixed(1)}" x2="${W-PR}" y2="${t.py.toFixed(1)}" stroke="#eee" stroke-width="1"/>`).join('')}
  <line x1="${PL}" y1="${PT}" x2="${PL}" y2="${PT+iH+4}" stroke="#111" stroke-width="2" stroke-linecap="round"/>
  <line x1="${PL-4}" y1="${PT+iH}" x2="${W-PR}" y2="${PT+iH}" stroke="#111" stroke-width="2" stroke-linecap="round"/>
  <polyline points="${pts}" fill="none" stroke="#111" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  ${data.map((d,i) => `<circle cx="${sx(i).toFixed(1)}" cy="${sy(d.y).toFixed(1)}" r="3.5" fill="#111"/>`).join('')}
  ${yTicks.map(t => `
    <line x1="${PL-4}" y1="${t.py.toFixed(1)}" x2="${PL}" y2="${t.py.toFixed(1)}" stroke="#111" stroke-width="1.5"/>
    <text x="${PL-7}" y="${(t.py+5).toFixed(1)}" text-anchor="end" font-size="11" fill="#888">${Math.round(t.val)}</text>
  `).join('')}
  ${xTicks.map(t => `
    <line x1="${sx(t.i).toFixed(1)}" y1="${PT+iH}" x2="${sx(t.i).toFixed(1)}" y2="${PT+iH+5}" stroke="#111" stroke-width="1.5"/>
    <text x="${sx(t.i).toFixed(1)}" y="${PT+iH+18}" text-anchor="middle" font-size="11" fill="#888">${t.label}</text>
  `).join('')}
  <text x="10" y="${(PT+iH/2).toFixed(1)}" text-anchor="middle" font-size="12" fill="#888" transform="rotate(-90,10,${(PT+iH/2).toFixed(1)})">${yLabel}</text>
</svg>`.trim();
}

// ─── PAGE: TODAY ──────────────────────────────────────────────────────────────

function renderToday() {
  const dateStr = todayStr();
  const dayKey  = getDayKey(dateStr);
  const dayName = DAY_NAMES[dayKey];
  const routines = DB.getRoutines();
  const routine  = routines[dayKey] || { label: 'Rest', exercises: [] };
  const isRest = routine.label === 'Rest' || !routine.exercises || routine.exercises.length === 0;

  // Load or create session
  let session = DB.getSession();
  if (!session || session.date !== dateStr) {
    session = createSession(dayKey, dateStr);
    DB.saveSession(session);
  }

  const units = getUnitLabel();

  if (isRest) {
    return `
      <div class="rest-day-card card">
        <span class="rest-icon">😴</span>
        <h2>${dayName}</h2>
        <p>Scheduled rest day — recovery is part of the work</p>
        ${!session.completed
          ? `<button class="btn btn-fill btn-full complete-btn" data-action="complete-rest">Log Rest Day ✓</button>`
          : `<div class="done-banner">Rest day logged ✓</div>`}
      </div>`;
  }

  const totalSets = session.exercises.reduce((s, ex) => s + ex.sets.length, 0);
  const doneSets  = session.exercises.reduce((s, ex) => s + ex.sets.filter(s => s.done).length, 0);

  const exHtml = session.exercises.map((ex, ei) => {
    const last = getLastExerciseData(ex.name, dateStr);
    const lastHint = last
      ? `Last: ${last.sets.filter(s=>s.done).map(s=>`${s.weight}${units}×${s.reps}`).join(', ')}`
      : '';
    const doneCount = ex.sets.filter(s=>s.done).length;
    const allDone = doneCount === ex.sets.length;

    const setsHtml = ex.sets.map((set, si) => `
      <div class="set-row">
        <span class="set-num">${si+1}</span>
        <input class="set-input" type="number" inputmode="decimal" placeholder="${units}"
          value="${set.weight}"
          data-action="set-weight" data-ei="${ei}" data-si="${si}">
        <input class="set-input" type="number" inputmode="numeric" placeholder="reps"
          value="${set.reps}"
          data-action="set-reps" data-ei="${ei}" data-si="${si}">
        <button class="set-check ${set.done ? 'done' : ''}"
          data-action="toggle-set" data-ei="${ei}" data-si="${si}">✓</button>
      </div>`).join('');

    return `
      <div class="exercise-card ${allDone ? 'all-done' : ''}">
        <button class="ex-header" data-action="toggle-ex" data-ei="${ei}">
          <span>${ex.name}<span class="ex-status">${doneCount}/${ex.sets.length}</span></span>
          <span class="ex-arrow ${ei===0?'open':''}" id="arr-${ei}">▾</span>
        </button>
        <div class="ex-body ${ei===0?'open':''}" id="ex-body-${ei}">
          ${lastHint ? `<div class="prev-hint">${lastHint}</div>` : ''}
          <div class="set-row-labels">
            <span></span>
            <span class="set-label">${units}</span>
            <span class="set-label">reps</span>
            <span></span>
          </div>
          ${setsHtml}
          <button class="btn btn-sm add-set-btn" data-action="add-set" data-ei="${ei}">+ set</button>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="today-head">
      <div>
        <h2>${dayName}</h2>
        <div class="session-meta">${doneSets}/${totalSets} sets complete</div>
      </div>
      <span class="split-pill">${routine.label}</span>
    </div>
    ${exHtml}
    ${session.completed
      ? `<div class="done-banner">Session complete! ✓</div>`
      : `<button class="btn btn-fill btn-full complete-btn" data-action="complete-session">
          Complete Session ✓
        </button>`}`;
}

// ─── PAGE: ROUTINES ───────────────────────────────────────────────────────────

let routineActiveDay = getDayKey(todayStr());
let exSearchQuery = '';

function renderRoutines() {
  const routines = DB.getRoutines();
  const todayKey  = getDayKey(todayStr());
  const dk = routineActiveDay;
  const routine   = routines[dk] || { label: '', exercises: [] };

  const weekHtml = DAY_KEYS.map(k => {
    const r = routines[k];
    const tag = r?.label || '–';
    return `<button class="day-btn ${k===dk?'sel':''} ${k===todayKey?'today-marker':''}"
      data-action="routine-day" data-day="${k}">
      <span class="day-abbr">${DAY_ABBR[k]}</span>
      <span class="day-tag">${tag}</span>
    </button>`;
  }).join('');

  const exList = (routine.exercises || []).map((ex, i) => `
    <div class="routine-exercise" id="rex-${i}">
      <span class="routine-ex-name">${ex.name}</span>
      <input class="routine-ex-sets" type="number" inputmode="numeric" value="${ex.sets||3}"
        data-action="rex-sets" data-day="${dk}" data-idx="${i}" style="width:38px" min="1">
      <span style="font-size:13px;color:#888;">×</span>
      <input class="routine-ex-reps" type="number" inputmode="numeric" value="${ex.reps||10}"
        data-action="rex-reps" data-day="${dk}" data-idx="${i}" style="width:38px" min="1">
      <button class="remove-ex-btn" data-action="remove-ex" data-day="${dk}" data-idx="${i}">✕</button>
    </div>`).join('');

  const filtered = exSearchQuery
    ? ALL_EXERCISES.filter(e => e.name.toLowerCase().includes(exSearchQuery.toLowerCase()))
    : ALL_EXERCISES;

  const searchList = filtered.slice(0, 60).map(e => `
    <div class="ex-list-item" data-action="add-ex" data-day="${dk}" data-name="${e.name}">
      <span>${e.name}</span>
      <span class="ex-list-group">${e.group}</span>
    </div>`).join('');

  return `
    <div class="page-title">Routines</div>
    <div class="week-row">${weekHtml}</div>

    <div class="form-group">
      <label>Split label for ${DAY_NAMES[dk]}</label>
      <input type="text" id="split-label-input"
        placeholder="e.g. Push, Pull, Legs, Rest"
        value="${routine.label || ''}"
        data-action="set-split-label" data-day="${dk}">
    </div>

    <span class="section-label">Exercises</span>
    <div id="rex-list">${exList || '<p style="color:#bbb;font-size:15px;padding:8px 0">No exercises yet</p>'}</div>

    <div class="mt-12">
      <label>Add exercise</label>
      <div class="ex-search-wrap">
        <input class="ex-search" type="text" placeholder="Search exercises…" id="ex-search"
          value="${exSearchQuery}"
          data-action="ex-search">
      </div>
      <div class="ex-list">${searchList}</div>
    </div>`;
}

// ─── PAGE: RUNS ───────────────────────────────────────────────────────────────

let runEffort = 3;
let showRunForm = false;

function renderRuns() {
  const runs = DB.getRuns();
  const settings = DB.getSettings();
  const dist = getDistLabel();
  const today = todayStr();
  const weekAgo = dateToStr(new Date(Date.now() - 6*24*3600*1000));
  const weekRuns = runs.filter(r => r.date >= weekAgo);
  const weekDist = weekRuns.reduce((s,r) => s + (+r.distance||0), 0);

  const statsHtml = `
    <div class="stats-grid">
      <div class="stat-box">
        <span class="stat-val">${weekRuns.length}</span>
        <span class="stat-lbl">runs this week</span>
      </div>
      <div class="stat-box">
        <span class="stat-val">${weekDist.toFixed(1)}</span>
        <span class="stat-lbl">${dist} this week</span>
      </div>
    </div>`;

  const effortDots = n => Array.from({length:5}, (_,i) =>
    `<span class="effort-dot ${i<n?'filled':''}"></span>`).join('');

  const runListHtml = runs.length
    ? [...runs].sort((a,b)=>b.date.localeCompare(a.date)).map(r => {
        const pace = calcPace(r.distance, parseDuration(r.duration), settings.units);
        return `
          <div class="run-item">
            <div class="run-item-head">
              <div>
                <span class="run-dist">${r.distance} ${dist}</span>
                <div class="run-stats">${r.duration} · ${pace} avg · ${fmtDate(r.date)}</div>
              </div>
              <button class="delete-run-btn" data-action="delete-run" data-id="${r.id}">✕</button>
            </div>
            <div class="run-effort">${effortDots(r.effort||0)}</div>
            ${r.notes ? `<div class="run-notes">${r.notes}</div>` : ''}
          </div>`;
      }).join('')
    : `<div class="empty-state"><span>🏃</span>No runs logged yet</div>`;

  const formHtml = showRunForm ? `
    <div class="card run-log-form">
      <div class="form-group">
        <label>Date</label>
        <input type="date" id="run-date" value="${today}">
      </div>
      <div class="row">
        <div class="form-group">
          <label>Distance (${dist})</label>
          <input type="number" inputmode="decimal" id="run-dist" placeholder="5.0" step="0.1">
        </div>
        <div class="form-group">
          <label>Duration</label>
          <input type="text" id="run-dur" placeholder="42:30">
          <div class="duration-hint">mm:ss or h:mm:ss</div>
        </div>
      </div>
      <div class="form-group">
        <label>Effort</label>
        <div class="effort-row">
          ${[1,2,3,4,5].map(n=>`<button class="effort-pick ${runEffort===n?'sel':''}"
            data-action="run-effort" data-val="${n}">${n}</button>`).join('')}
        </div>
      </div>
      <div class="form-group">
        <label>Notes</label>
        <textarea id="run-notes" placeholder="How'd it feel?"></textarea>
      </div>
      <div class="row">
        <button class="btn" data-action="cancel-run">Cancel</button>
        <button class="btn btn-fill" data-action="save-run">Save Run</button>
      </div>
    </div>` : `<button class="btn btn-fill btn-full mb-12" data-action="show-run-form">+ Log Run</button>`;

  return `
    <div class="page-title">Run Log</div>
    ${statsHtml}
    ${formHtml}
    ${runListHtml}`;
}

// ─── PAGE: PROGRESS ───────────────────────────────────────────────────────────

let progressTab     = 'lifts';  // 'lifts' | 'runs'
let progressExercise = '';
let progressMetric  = 'max';    // 'max' | 'volume'
let progressRunMetric = 'dist'; // 'dist' | 'pace'

function renderProgress() {
  const workouts = DB.getWorkouts();
  const runs  = DB.getRuns();
  const settings = DB.getSettings();

  // collect all exercised that have been logged
  const loggedExercises = [...new Set(
    workouts.flatMap(w => w.exercises.map(e => e.name))
  )].sort();

  if (!progressExercise && loggedExercises.length) progressExercise = loggedExercises[0];

  const tabsHtml = `
    <div class="tab-row">
      <button class="tab ${progressTab==='lifts'?'active':''}" data-action="ptab" data-tab="lifts">Strength</button>
      <button class="tab ${progressTab==='runs'?'active':''}"  data-action="ptab" data-tab="runs">Runs</button>
    </div>`;

  let bodyHtml = '';

  if (progressTab === 'lifts') {
    const selectHtml = loggedExercises.length
      ? `<div class="form-group">
          <select id="prog-ex-select" data-action="prog-ex-change">
            ${loggedExercises.map(ex => `<option value="${ex}" ${ex===progressExercise?'selected':''}>${ex}</option>`).join('')}
          </select>
        </div>`
      : `<div class="empty-state"><span>🏋️</span>Log some workouts first!</div>`;

    const toggleHtml = `
      <div class="toggle-row">
        <button class="tog-btn ${progressMetric==='max'?'active':''}" data-action="prog-metric" data-m="max">Max Weight</button>
        <button class="tog-btn ${progressMetric==='volume'?'active':''}" data-action="prog-metric" data-m="volume">Volume</button>
      </div>`;

    let graphHtml = '';
    if (progressExercise) {
      const pts = workouts
        .filter(w => w.exercises.some(e => e.name === progressExercise))
        .map(w => {
          const ex = w.exercises.find(e => e.name === progressExercise);
          const doneSets = (ex.sets||[]).filter(s=>s.done&&+s.weight&&+s.reps);
          let y = 0;
          if (progressMetric === 'max') {
            y = Math.max(...doneSets.map(s=>+s.weight), 0);
          } else {
            y = doneSets.reduce((sum,s) => sum + +s.weight * +s.reps, 0);
          }
          return { y, label: fmtDate(w.date) };
        })
        .filter(p => p.y > 0);

      const units = getUnitLabel();
      graphHtml = `<div class="graph-wrap">${renderGraph(pts, { yLabel: progressMetric==='max' ? units : `${units}·reps` })}</div>`;
    }

    bodyHtml = selectHtml + (loggedExercises.length ? toggleHtml + graphHtml : '');

  } else {
    const runToggle = `
      <div class="toggle-row">
        <button class="tog-btn ${progressRunMetric==='dist'?'active':''}" data-action="run-metric" data-m="dist">Distance</button>
        <button class="tog-btn ${progressRunMetric==='pace'?'active':''}" data-action="run-metric" data-m="pace">Pace</button>
      </div>`;

    const sortedRuns = [...runs].sort((a,b) => a.date.localeCompare(b.date));
    const dist = getDistLabel();
    const pts = sortedRuns.map(r => {
      let y;
      if (progressRunMetric === 'dist') {
        y = +r.distance || 0;
      } else {
        const secs = parseDuration(r.duration);
        y = secs && r.distance ? +(secs / +r.distance / 60).toFixed(2) : 0;
      }
      return { y, label: fmtDate(r.date) };
    }).filter(p => p.y > 0);

    const graphHtml = `<div class="graph-wrap">${renderGraph(pts, {
      yLabel: progressRunMetric==='dist' ? dist : 'min/mi'
    })}</div>`;

    bodyHtml = runs.length
      ? runToggle + graphHtml
      : `<div class="empty-state"><span>🏃</span>Log some runs first!</div>`;
  }

  return `
    <div class="page-title">Progress</div>
    ${tabsHtml}
    ${bodyHtml}`;
}

// ─── PAGE: BENCHMARKS ─────────────────────────────────────────────────────────

let bmSearchQuery = '';
let bmAddMode = false;

function renderBenchmarks() {
  const units = getUnitLabel();
  const workouts   = DB.getWorkouts();
  const bodyweight = DB.getBodyweight();
  const benchmarks = DB.getBenchmarks();

  // Bodyweight section
  const latestBW = bodyweight.length ? bodyweight[bodyweight.length-1] : null;
  const bwPts = [...bodyweight]
    .sort((a,b)=>a.date.localeCompare(b.date))
    .map(b => ({ y: +b.weight, label: fmtDate(b.date) }));

  const bwHtml = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <span style="font-size:20px;font-weight:700;">Bodyweight</span>
        ${latestBW ? `<span style="font-size:24px;font-weight:700;">${latestBW.weight} ${units}</span>` : ''}
      </div>
      <div class="bw-entry-row">
        <input type="number" inputmode="decimal" id="bw-input" placeholder="${units}" step="0.1">
        <button class="btn btn-fill" data-action="log-bw">Log</button>
      </div>
      ${bwPts.length >= 2 ? `<div class="graph-wrap">${renderGraph(bwPts, { yLabel: units })}</div>` : ''}
    </div>`;

  // Get estimated 1RMs from logged workouts
  const estimated1RMs = {};
  workouts.forEach(w => {
    (w.exercises||[]).forEach(ex => {
      const best = (ex.sets||[]).filter(s=>s.done&&+s.weight&&+s.reps)
        .map(s => epley(s.weight, s.reps))
        .reduce((max, v) => v > max ? v : max, 0);
      if (best > (estimated1RMs[ex.name]||0)) estimated1RMs[ex.name] = best;
    });
  });

  // Benchmark items
  const bmItems = Object.entries(benchmarks).map(([name, entries]) => {
    const sorted = [...entries].sort((a,b)=>a.date.localeCompare(b.date));
    const pr = sorted.reduce((best, e) => +e.weight > +best ? +e.weight : +best, 0);
    const est = estimated1RMs[name] || 0;
    return `
      <div class="benchmark-item">
        <div class="bm-head">
          <div>
            <div class="bm-name">${name}</div>
            ${est ? `<div class="bm-est">est. 1RM: ${est} ${units}*</div>` : ''}
          </div>
          <div style="text-align:right;">
            ${pr ? `<div class="bm-pr">${pr} ${units}</div><div style="font-size:13px;color:#888;">PR</div>` : '<div style="color:#bbb;font-size:15px;">No PR yet</div>'}
          </div>
        </div>
        <div class="bm-log-row">
          <input type="number" inputmode="decimal" class="bm-weight" placeholder="${units}" step="0.5"
            id="bm-${name.replace(/\s/g,'_')}">
          <button class="btn btn-sm btn-fill" data-action="log-bm" data-name="${name}">Log PR</button>
          <button class="btn btn-sm btn-danger" data-action="remove-bm" data-name="${name}">✕</button>
        </div>
      </div>`;
  }).join('');

  const filtered = bmSearchQuery
    ? ALL_EXERCISES.filter(e => e.name.toLowerCase().includes(bmSearchQuery.toLowerCase()))
    : ALL_EXERCISES;

  const addSection = bmAddMode ? `
    <div class="card mt-12">
      <label style="margin-bottom:8px;display:block">Add tracked exercise</label>
      <input type="text" id="bm-search" placeholder="Search…" value="${bmSearchQuery}" data-action="bm-search">
      <div class="ex-list mt-8">
        ${filtered.slice(0,40).map(e => `
          <div class="ex-list-item" data-action="add-bm" data-name="${e.name}">
            <span>${e.name}</span><span class="ex-list-group">${e.group}</span>
          </div>`).join('')}
      </div>
    </div>` : `<button class="btn mt-12" data-action="show-bm-add">+ Track Exercise</button>`;

  return `
    <div class="page-title">Benchmarks & PRs</div>
    ${bwHtml}
    <div class="page-title" style="margin-top:8px;">One Rep Maxes</div>
    ${bmItems}
    ${addSection}
    <p class="disclaimer">* Estimated via Epley formula (weight × (1 + reps/30)). Never to be mistaken for actual performance.</p>`;
}

// ─── PAGE: SETTINGS ───────────────────────────────────────────────────────────

function renderSettings() {
  const { units } = DB.getSettings();
  return `
    <div class="page-title">Settings</div>
    <div class="card">
      <div class="settings-row">
        <div>
          <div class="settings-label">Units</div>
          <div class="settings-desc">Weight and distance</div>
        </div>
        <div class="unit-toggle">
          <button class="unit-opt ${units==='imperial'?'active':''}" data-action="set-units" data-units="imperial">lbs / mi</button>
          <button class="unit-opt ${units==='metric'?'active':''}"   data-action="set-units" data-units="metric">kg / km</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div style="font-size:20px;font-weight:700;margin-bottom:8px;">Danger Zone</div>
      <div style="font-size:16px;color:#888;margin-bottom:14px;">
        This will delete all your workouts, runs, routines, and settings. Cannot be undone.
      </div>
      <button class="btn btn-danger btn-full" data-action="reset-data">Reset All Data</button>
    </div>`;
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────

let currentPage = 'today';

function navigate(page) {
  currentPage = page;

  // Update nav
  document.querySelectorAll('.nav-bar button').forEach(b => {
    b.classList.toggle('active', b.dataset.page === page);
  });

  // Render page
  const pages = { today: renderToday, routines: renderRoutines, runs: renderRuns,
                  progress: renderProgress, benchmarks: renderBenchmarks, settings: renderSettings };
  const app = document.getElementById('app');
  app.innerHTML = pages[page]?.() || '';
  app.scrollTop = 0;

  updateStreak();
}

function updateStreak() {
  const streak = calculateStreak();
  const el = document.getElementById('streak-badge');
  if (el) el.textContent = `🔥 ${streak}`;
}

function updateHeaderDate() {
  const el = document.getElementById('header-date');
  if (el) {
    const d = new Date();
    el.textContent = d.toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' });
  }
}

// ─── EVENT HANDLING ───────────────────────────────────────────────────────────

// Debounced session save for inputs
let saveTimer;
function debounceSave(session) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => DB.saveSession(session), 300);
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;

  switch (action) {

    // ── TODAY ──
    case 'toggle-ex': {
      const ei = el.dataset.ei;
      const body = document.getElementById(`ex-body-${ei}`);
      const arr  = document.getElementById(`arr-${ei}`);
      if (!body) break;
      body.classList.toggle('open');
      arr?.classList.toggle('open', body.classList.contains('open'));
      break;
    }
    case 'toggle-set': {
      const session = DB.getSession();
      if (!session) break;
      const ei = +el.dataset.ei, si = +el.dataset.si;
      session.exercises[ei].sets[si].done = !session.exercises[ei].sets[si].done;
      DB.saveSession(session);
      navigate(currentPage);
      break;
    }
    case 'add-set': {
      const session = DB.getSession();
      if (!session) break;
      const ei = +el.dataset.ei;
      const ex = session.exercises[ei];
      const lastSet = ex.sets[ex.sets.length-1] || {};
      ex.sets.push({ weight: lastSet.weight||'', reps: lastSet.reps||'', done: false });
      DB.saveSession(session);
      navigate(currentPage);
      break;
    }
    case 'complete-session': {
      const session = DB.getSession();
      if (!session) break;
      session.completed = true;
      DB.saveSession(session);
      const workouts = DB.getWorkouts();
      const idx = workouts.findIndex(w => w.date === session.date);
      if (idx >= 0) workouts[idx] = session;
      else workouts.push(session);
      DB.saveWorkouts(workouts);
      navigate(currentPage);
      break;
    }
    case 'complete-rest': {
      const session = DB.getSession();
      if (!session) break;
      session.completed = true;
      DB.saveSession(session);
      const workouts = DB.getWorkouts();
      const idx = workouts.findIndex(w => w.date === session.date);
      if (idx >= 0) workouts[idx] = session;
      else workouts.push({ date: session.date, dayKey: session.dayKey, label:'Rest', exercises:[], completed:true });
      DB.saveWorkouts(workouts);
      navigate(currentPage);
      break;
    }

    // ── ROUTINES ──
    case 'routine-day': {
      routineActiveDay = el.dataset.day;
      exSearchQuery = '';
      navigate('routines');
      break;
    }
    case 'remove-ex': {
      const dk = el.dataset.day;
      const idx = +el.dataset.idx;
      const routines = DB.getRoutines();
      if (routines[dk]?.exercises) {
        routines[dk].exercises.splice(idx, 1);
        DB.saveRoutines(routines);
        navigate('routines');
      }
      break;
    }
    case 'add-ex': {
      const dk   = el.dataset.day;
      const name = el.dataset.name;
      const routines = DB.getRoutines();
      if (!routines[dk]) routines[dk] = { label: '', exercises: [] };
      if (!routines[dk].exercises.find(e => e.name === name)) {
        routines[dk].exercises.push({ name, sets: 3, reps: 10 });
        DB.saveRoutines(routines);
      }
      exSearchQuery = '';
      navigate('routines');
      break;
    }

    // ── RUNS ──
    case 'show-run-form': {
      showRunForm = true; runEffort = 3;
      navigate('runs');
      break;
    }
    case 'cancel-run': {
      showRunForm = false;
      navigate('runs');
      break;
    }
    case 'run-effort': {
      runEffort = +el.dataset.val;
      document.querySelectorAll('.effort-pick').forEach(b => {
        b.classList.toggle('sel', +b.dataset.val === runEffort);
      });
      break;
    }
    case 'save-run': {
      const date = document.getElementById('run-date')?.value || todayStr();
      const dist = document.getElementById('run-dist')?.value;
      const dur  = document.getElementById('run-dur')?.value;
      const notes = document.getElementById('run-notes')?.value || '';
      if (!dist || !dur) { alert('Enter distance and duration'); break; }
      const runs = DB.getRuns();
      runs.push({ id: Date.now(), date, distance: +dist, duration: dur, effort: runEffort, notes });
      DB.saveRuns(runs);
      showRunForm = false;
      navigate('runs');
      break;
    }
    case 'delete-run': {
      if (!confirm('Delete this run?')) break;
      const id = +el.dataset.id;
      DB.saveRuns(DB.getRuns().filter(r => r.id !== id));
      navigate('runs');
      break;
    }

    // ── PROGRESS ──
    case 'ptab': {
      progressTab = el.dataset.tab;
      navigate('progress');
      break;
    }
    case 'prog-metric': {
      progressMetric = el.dataset.m;
      document.querySelectorAll('.tog-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.m === progressMetric);
      });
      navigate('progress');
      break;
    }
    case 'run-metric': {
      progressRunMetric = el.dataset.m;
      navigate('progress');
      break;
    }

    // ── BENCHMARKS ──
    case 'log-bw': {
      const val = document.getElementById('bw-input')?.value;
      if (!val) break;
      const bw = DB.getBodyweight();
      bw.push({ date: todayStr(), weight: +val });
      DB.saveBodyweight(bw);
      navigate('benchmarks');
      break;
    }
    case 'log-bm': {
      const name = el.dataset.name;
      const safeId = `bm-${name.replace(/\s/g,'_')}`;
      const val = document.getElementById(safeId)?.value;
      if (!val) break;
      const bms = DB.getBenchmarks();
      if (!bms[name]) bms[name] = [];
      bms[name].push({ date: todayStr(), weight: +val });
      DB.saveBenchmarks(bms);
      navigate('benchmarks');
      break;
    }
    case 'remove-bm': {
      const name = el.dataset.name;
      if (!confirm(`Remove "${name}" from benchmarks?`)) break;
      const bms = DB.getBenchmarks();
      delete bms[name];
      DB.saveBenchmarks(bms);
      navigate('benchmarks');
      break;
    }
    case 'show-bm-add': {
      bmAddMode = true; bmSearchQuery = '';
      navigate('benchmarks');
      break;
    }
    case 'add-bm': {
      const name = el.dataset.name;
      const bms = DB.getBenchmarks();
      if (!bms[name]) bms[name] = [];
      DB.saveBenchmarks(bms);
      bmAddMode = false; bmSearchQuery = '';
      navigate('benchmarks');
      break;
    }

    // ── SETTINGS ──
    case 'set-units': {
      const s = DB.getSettings();
      s.units = el.dataset.units;
      DB.saveSettings(s);
      navigate('settings');
      break;
    }
    case 'reset-data': {
      if (confirm('Delete ALL data? This cannot be undone.')) {
        if (confirm('Are you sure? All workouts, runs, and settings will be gone.')) {
          DB.clearAll();
          progressExercise = '';
          navigate('today');
        }
      }
      break;
    }
  }
});

// Input events (for Today set logging + search/label inputs)
document.addEventListener('input', e => {
  const el = e.target;
  const action = el.dataset.action;

  if (action === 'set-weight' || action === 'set-reps') {
    const session = DB.getSession();
    if (!session) return;
    const ei = +el.dataset.ei, si = +el.dataset.si;
    if (action === 'set-weight') session.exercises[ei].sets[si].weight = el.value;
    else                         session.exercises[ei].sets[si].reps   = el.value;
    debounceSave(session);
    return;
  }

  if (action === 'set-split-label') {
    const dk = el.dataset.day;
    const routines = DB.getRoutines();
    if (!routines[dk]) routines[dk] = { label: '', exercises: [] };
    routines[dk].label = el.value;
    DB.saveRoutines(routines);
    // update week row
    const dayBtn = document.querySelector(`.day-btn[data-day="${dk}"] .day-tag`);
    if (dayBtn) dayBtn.textContent = el.value || '–';
    return;
  }

  if (action === 'rex-sets' || action === 'rex-reps') {
    const dk  = el.dataset.day;
    const idx = +el.dataset.idx;
    const routines = DB.getRoutines();
    if (!routines[dk]?.exercises?.[idx]) return;
    if (action === 'rex-sets') routines[dk].exercises[idx].sets = +el.value || 1;
    else                       routines[dk].exercises[idx].reps = +el.value || 1;
    DB.saveRoutines(routines);
    return;
  }

  if (action === 'ex-search') {
    exSearchQuery = el.value;
    const filtered = exSearchQuery
      ? ALL_EXERCISES.filter(e => e.name.toLowerCase().includes(exSearchQuery.toLowerCase()))
      : ALL_EXERCISES;
    const dk = routineActiveDay;
    const html = filtered.slice(0,60).map(e => `
      <div class="ex-list-item" data-action="add-ex" data-day="${dk}" data-name="${e.name}">
        <span>${e.name}</span><span class="ex-list-group">${e.group}</span>
      </div>`).join('');
    const listEl = document.querySelector('.ex-list');
    if (listEl) listEl.innerHTML = html;
    return;
  }

  if (action === 'prog-ex-change') {
    progressExercise = el.value;
    navigate('progress');
    return;
  }

  if (action === 'bm-search') {
    bmSearchQuery = el.value;
    const filtered = bmSearchQuery
      ? ALL_EXERCISES.filter(e => e.name.toLowerCase().includes(bmSearchQuery.toLowerCase()))
      : ALL_EXERCISES;
    const html = filtered.slice(0,40).map(e => `
      <div class="ex-list-item" data-action="add-bm" data-name="${e.name}">
        <span>${e.name}</span><span class="ex-list-group">${e.group}</span>
      </div>`).join('');
    const listEl = document.querySelector('#bm-search').closest('.card').querySelector('.ex-list');
    if (listEl) listEl.innerHTML = html;
    return;
  }
});

// ─── SERVICE WORKER ───────────────────────────────────────────────────────────

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

updateHeaderDate();
navigate('today');
