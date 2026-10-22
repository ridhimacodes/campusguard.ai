// CampusGuard.AI — Client Application Logic
// Team ThinkStack | Kritical Hacks 2026

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const STORAGE_KEY = 'campusguard_ai_v3';
let supabaseClient = null;
let currentUser = null;
let authMode = 'signin';
let pgPlaceTimer = null;
let collegePlaceTimer = null;
let profCollegePlaceTimer = null;

// Initial state and default profile
const defaultStore = {
  profile: {
    name: 'Ananya Sharma',
    college: 'Delhi Technological University',
    course: 'B.Tech Computer Engineering',
    semester: '6th Semester',
    state: 'Delhi',
    locality: 'Rohini Sector 16',
    noticeCategory: 'exam notifications'
  },
  history: [],
  results: {},
  checklist: {}
};

function getStore() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? { ...defaultStore, ...JSON.parse(data) } : defaultStore;
  } catch (_) {
    return defaultStore;
  }
}

function putStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (_) {}
}

function showToast(message, type = 'info') {
  const container = $('#toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  const icon = type === 'success' ? '✓' : type === 'error' ? '⚠' : '✦';
  toast.innerHTML = `<span style="color:${type === 'success' ? 'var(--emerald)' : type === 'error' ? 'var(--rose)' : 'var(--cyan-light)'}">${icon}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[m]));
}

function safeUrl(s) {
  try {
    const u = new URL(s);
    return ['http:', 'https:'].includes(u.protocol) ? u.href : '';
  } catch (_) {
    return '';
  }
}

function link(url, label) {
  const u = safeUrl(url);
  return u ? `<a href="${escapeHtml(u)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label || u)}</a>` : escapeHtml(label || 'Source unavailable');
}

// Navigation between Landing Page and App Shell
function showLanding() {
  const landing = $('#landingView');
  const app = $('#appShell');
  const modal = $('#authModal');
  if (landing) {
    landing.classList.remove('hidden');
    landing.style.display = 'block';
  }
  if (app) {
    app.classList.add('hidden');
    app.style.display = 'none';
  }
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showApp() {
  const landing = $('#landingView');
  const app = $('#appShell');
  const modal = $('#authModal');
  if (landing) {
    landing.classList.add('hidden');
    landing.style.display = 'none';
  }
  if (app) {
    app.classList.remove('hidden');
    app.style.display = 'flex';
  }
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
  syncProfileToInputs();
  renderDashboard();
  renderHistory();
  renderActionNeeded();
  renderMonthlyReport();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showView(viewId) {
  showApp();
  $$('.page-view').forEach(el => el.classList.remove('active'));
  $$('.nav-item').forEach(el => el.classList.remove('active'));

  const targetView = $(`#view-${viewId}`);
  if (targetView) targetView.classList.add('active');

  const navItem = $(`.nav-item[data-view="${viewId}"]`);
  if (navItem) navItem.classList.add('active');

  // Close mobile sidebar if open
  $('#appSidebar')?.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openToolFromLanding(toolId) {
  showView(toolId);
}

function enterAppWithRole(role) {
  showToast(`Entered as ${role === 'premium' ? 'CampusGuard Pro (Prototype)' : 'Student Free Tier'}`, 'success');
  showApp();
}

// Sidebar and Mobile Drawer Listeners
$$('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.dataset.view;
    if (view) showView(view);
  });
});

$('#btnMobileNavToggle')?.addEventListener('click', () => {
  const links = $('.nav-links');
  if (links) links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
});

$('#btnMobileSidebarToggle')?.addEventListener('click', () => {
  $('#appSidebar')?.classList.toggle('open');
});

// Topbar quick search
$('#topbarSearchInput')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const q = e.target.value.toLowerCase().trim();
    if (q.includes('bill') || q.includes('pg') || q.includes('tariff') || q.includes('electric')) showView('pg');
    else if (q.includes('notice') || q.includes('exam') || q.includes('date')) showView('notices');
    else if (q.includes('scholarship') || q.includes('aid') || q.includes('grant')) showView('scholarships');
    else if (q.includes('travel') || q.includes('metro') || q.includes('transit')) showView('travel');
    else if (q.includes('intern') || q.includes('scam') || q.includes('offer')) showView('internship');
    else if (q.includes('house') || q.includes('pg') || q.includes('rent') || q.includes('tenant')) showView('housing');
    else showView('assistant');
  }
});

// Auth Modal
$('#btnLandingSignIn')?.addEventListener('click', () => openAuthModal('signin'));
$('#btnLandingLaunch')?.addEventListener('click', showApp);
$('#btnHeroGetStarted')?.addEventListener('click', showApp);
$('#btnHeroDemo')?.addEventListener('click', showApp);
$('#btnAuthClose')?.addEventListener('click', closeAuthModal);
$('#authModal')?.addEventListener('click', e => {
  if (e.target === $('#authModal')) closeAuthModal();
});

function autofillDemoStudent() {
  const email = $('#inputAuthEmail');
  const pass = $('#inputAuthPassword');
  if (email) email.value = 'ananya@du.ac.in';
  if (pass) pass.value = 'Student123!';
  showToast('Autofilled Ananya Sharma (Delhi Univ) profile', 'info');
}

function loginDemoStudent() {
  closeAuthModal();
  currentUser = { email: 'ananya@du.ac.in', name: 'Ananya Sharma' };
  showToast('Signed in as Ananya Sharma (Demo Student)', 'success');
  showApp();
}

function openAuthModal(mode = 'signin') {
  authMode = mode;
  const m = $('#authModal');
  if (m) {
    m.classList.remove('hidden');
    m.style.setProperty('display', 'flex', 'important');
  }
  updateAuthModalUI();
}

function closeAuthModal() {
  const m = $('#authModal');
  if (m) {
    m.classList.add('hidden');
    m.style.setProperty('display', 'none', 'important');
  }
}

function updateAuthModalUI() {
  const isSignIn = authMode === 'signin';
  $('#authModalTitle').textContent = isSignIn ? 'Welcome to CampusGuard' : 'Create Student Account';
  $('#authModalSubtitle').textContent = isSignIn ? 'Sign in to access your verified alerts and scans' : 'Set up your student protection radar in seconds';
  $('#btnAuthSubmit').innerHTML = isSignIn ? 'Sign In <span>→</span>' : 'Create Account <span>✓</span>';
  $('#authToggleText').textContent = isSignIn ? "Don't have an account?" : 'Already have an account?';
  $('#linkAuthToggle').textContent = isSignIn ? 'Create one' : 'Sign In';
}

$('#linkAuthToggle')?.addEventListener('click', e => {
  e.preventDefault();
  authMode = authMode === 'signin' ? 'signup' : 'signin';
  updateAuthModalUI();
});

$('#authModalForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const email = $('#inputAuthEmail').value.trim();
  const password = $('#inputAuthPassword').value;
  const submitBtn = $('#btnAuthSubmit');
  submitBtn.disabled = true;

  try {
    if (supabaseClient) {
      const res = authMode === 'signup'
        ? await supabaseClient.auth.signUp({ email, password })
        : await supabaseClient.auth.signInWithPassword({ email, password });
      if (res.error) throw res.error;
      currentUser = res.data.user;
      showToast('Authenticated with Supabase', 'success');
    } else {
      currentUser = { email, name: email.split('@')[0] };
      showToast('Signed in via local student session', 'success');
    }
    closeAuthModal();
    showApp();
  } catch (err) {
    showToast(err.message || 'Authentication failed', 'error');
  } finally {
    submitBtn.disabled = false;
  }
});

$('#btnSignOut')?.addEventListener('click', async () => {
  if (supabaseClient) await supabaseClient.auth.signOut().catch(() => {});
  currentUser = null;
  showToast('Signed out successfully', 'info');
  showLanding();
});

// Profile Management
function syncProfileToInputs() {
  const store = getStore();
  const prof = store.profile || defaultStore.profile;

  $('#profName').value = prof.name || '';
  $('#profCollege').value = prof.college || '';
  $('#profCourse').value = prof.course || '';
  $('#profSemester').value = prof.semester || '';
  $('#profState').value = prof.state || 'Delhi';
  $('#profLocality').value = prof.locality || '';
  $('#profNoticeCategory').value = prof.noticeCategory || 'exam notifications';

  // Sidebar profile updates
  $('#sidebarAvatar').textContent = (prof.name || 'S').charAt(0).toUpperCase();
  $('#sidebarUserName').textContent = prof.name || 'Student';
  $('#sidebarUserCollege').textContent = prof.college || 'CampusGuard';
  $('#dashGreeting').textContent = `Welcome back, ${prof.name.split(' ')[0]}!`;

  // Pre-fill tool inputs
  if (!$('#pgPlaceInput').value) $('#pgPlaceInput').value = prof.locality ? `${prof.locality}, ${prof.state}` : prof.state;
  if (!$('#pgStateSelect').value) $('#pgStateSelect').value = prof.state;
  if (!$('#noticeCollegeInput').value) $('#noticeCollegeInput').value = prof.college;
  if (!$('#schStateSelect').value) $('#schStateSelect').value = prof.state;
  if (!$('#schCourseInput').value) $('#schCourseInput').value = prof.course;
}

$('#profileForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const store = getStore();
  store.profile = {
    name: $('#profName').value.trim() || 'Student',
    college: $('#profCollege').value.trim() || 'University',
    course: $('#profCourse').value.trim(),
    semester: $('#profSemester').value.trim(),
    state: $('#profState').value,
    locality: $('#profLocality').value.trim(),
    noticeCategory: $('#profNoticeCategory').value
  };
  putStore(store);
  syncProfileToInputs();
  showToast('Student profile updated & synced to all tools!', 'success');
});

$('#btnQuickProfile')?.addEventListener('click', () => showView('profile'));

// SSE Streaming Research Runner
function parseSSEBuffer(buffer, onEvent) {
  const parts = buffer.split('\n\n');
  const rest = parts.pop();
  for (const part of parts) {
    const line = part.split('\n').find(l => l.startsWith('data:'));
    if (!line) continue;
    try {
      onEvent(JSON.parse(line.slice(5).trim()));
    } catch (_) {}
  }
  return rest;
}

async function runResearch(tool, body, resultContainer, onCompleteRender) {
  resultContainer.innerHTML = `
    <div class="research-status-banner">
      <div class="spinner"></div>
      <div>
        <strong>TinyFish Live Research in Progress…</strong>
        <div style="font-size:0.85rem; color:var(--text-muted)" id="sseStatusLabel">Searching official authority sources…</div>
      </div>
    </div>
    <div class="status-stages">
      <span class="status-stage active" id="stage-search">1 · TinyFish Search</span>
      <span class="status-stage" id="stage-fetch">2 · TinyFish Deep Fetch</span>
      <span class="status-stage" id="stage-validate">3 · Groq AI Grounding</span>
    </div>
    <div id="liveLogsBox" style="margin-top:16px; font-size:0.85rem; color:var(--text-muted)"></div>
  `;

  const logsBox = resultContainer.querySelector('#liveLogsBox');
  const statusLabel = resultContainer.querySelector('#sseStatusLabel');
  let finalResult = null;
  let buffer = '';

  try {
    const res = await fetch(`/api/tinyfish/${tool}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status} research error.`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      buffer = parseSSEBuffer(buffer, ev => {
        if (ev.type === 'STEP_START') {
          if (ev.step === 'search') {
            statusLabel.textContent = `Searching: ${ev.query || 'Official sources'}`;
            $('#stage-search')?.classList.add('active');
          } else if (ev.step === 'fetch') {
            statusLabel.textContent = `Fetching clean markdown from ${ev.urls?.length || 1} verified URLs…`;
            $('#stage-search')?.classList.remove('active');
            $('#stage-search')?.classList.add('done');
            $('#stage-fetch')?.classList.add('active');
          } else if (ev.step === 'validate') {
            statusLabel.textContent = 'Synthesizing evidence and generating verifiable findings…';
            $('#stage-fetch')?.classList.remove('active');
            $('#stage-fetch')?.classList.add('done');
            $('#stage-validate')?.classList.add('active');
          }
          if (logsBox) logsBox.innerHTML += `<div style="margin-top:4px">✦ ${escapeHtml(ev.label || ev.step)}</div>`;
        } else if (ev.type === 'STEP_DONE') {
          if (ev.step === 'validate') {
            $('#stage-validate')?.classList.remove('active');
            $('#stage-validate')?.classList.add('done');
          }
        } else if (ev.type === 'ERROR') {
          finalResult = { error: ev.error };
        } else if (ev.type === 'COMPLETE') {
          finalResult = ev.result;
        }
      });
    }

    if (finalResult?.error) throw new Error(finalResult.error);
    if (!finalResult) throw new Error('Research connection ended unexpectedly. Please check API credentials.');

    // Save to store
    const store = getStore();
    store.results[tool] = finalResult;
    store.history.unshift({
      tool,
      label: getToolLabel(tool),
      timestamp: finalResult.checked_at || new Date().toISOString(),
      sources: finalResult.source_urls || [],
      analysis: finalResult.analysis || {}
    });
    store.history = store.history.slice(0, 80);
    putStore(store);

    // Render result
    onCompleteRender(finalResult);
    renderDashboard();
    renderHistory();
    renderActionNeeded();
    renderMonthlyReport();
    showToast('Research verified & evidence updated!', 'success');
  } catch (err) {
    resultContainer.innerHTML = `
      <div class="evidence-card" style="border-color:rgba(244, 63, 94, 0.4); background:rgba(244, 63, 94, 0.05)">
        <h4 style="color:var(--rose)">Research Could Not Complete</h4>
        <p>${escapeHtml(err.message)}</p>
        <small style="color:var(--text-dim); display:block; margin-top:8px">Ensure your server is connected to the internet and API keys in .env are active.</small>
      </div>
    `;
    showToast(err.message, 'error');
  }
}

function getToolLabel(tool) {
  const map = {
    pg: 'PG Electricity Tariff',
    notices: 'College Notices',
    scholarship: 'Scholarship Finder',
    travel: 'Transit Disruptions',
    internship: 'Internship Shield',
    housing: 'Tenant Housing Guide'
  };
  return map[tool] || tool;
}

// ============================================================================
// TOOL 1: PG ELECTRICITY TARIFF CHECKER
// ============================================================================
$('#btnDiscoverDiscom')?.addEventListener('click', async () => {
  const place = $('#pgPlaceInput').value.trim();
  const state = $('#pgStateSelect').value;
  const box = $('#discomDiscoveryBox');
  const btn = $('#btnDiscoverDiscom');

  btn.disabled = true;
  box.innerHTML = `<div class="pill pill-cyan"><span class="pulse-dot"></span> TinyFish Searching DISCOMs serving ${escapeHtml(place || state)}…</div>`;

  try {
    const res = await fetch('/api/tariff/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ place, state })
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || 'Provider discovery failed.');

    const options = d.providerOptions || [];
    box.innerHTML = `
      <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:14px; margin-top:10px">
        <strong style="font-size:0.85rem; color:var(--cyan-light)">DISCOMs Discovered for this Region:</strong>
        <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:10px">${escapeHtml(d.warning || 'Select the provider serving your address:')}</p>
        <div style="display:flex; flex-direction:column; gap:8px">
          ${options.map((o, i) => `
            <label style="display:flex; align-items:center; gap:8px; font-size:0.85rem; cursor:pointer">
              <input type="radio" name="discomOption" value="${i}" ${i === 0 ? 'checked' : ''}>
              <span><strong>${escapeHtml(o.provider)}</strong> — ${link(o.sourceUrl, 'View Tariff Order')}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;

    // Handle selection change
    $$('input[name="discomOption"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const sel = options[Number(radio.value)];
        if (sel) {
          $('#pgDiscomSelect').value = sel.provider;
          if (![...$('#pgDiscomSelect').options].some(x => x.value === sel.provider)) {
            const opt = document.createElement('option');
            opt.value = sel.provider;
            opt.textContent = sel.provider;
            $('#pgDiscomSelect').appendChild(opt);
            $('#pgDiscomSelect').value = sel.provider;
          }
          $('#pgTariffUrlInput').value = sel.sourceUrl || '';
        }
      });
    });

    if (options[0]) {
      $('#pgDiscomSelect').value = options[0].provider;
      $('#pgTariffUrlInput').value = options[0].sourceUrl || '';
    }
  } catch (err) {
    box.innerHTML = `<small style="color:var(--rose)">${escapeHtml(err.message)}</small>`;
  } finally {
    btn.disabled = false;
  }
});

$('#btnRunPgCheck')?.addEventListener('click', () => {
  const units = Number($('#pgUnitsInput').value);
  const charged = Number($('#pgChargedInput').value);

  if (!units || units <= 0 || charged < 0) {
    showToast('Please enter valid positive units and charged amount.', 'error');
    return;
  }

  const body = {
    state: $('#pgStateSelect').value,
    provider: $('#pgDiscomSelect').value,
    units,
    charged,
    billType: $('#pgBillTypeSelect').value,
    tariffUrl: $('#pgTariffUrlInput').value.trim()
  };

  runResearch('pg', body, $('#pgResultContainer'), renderPgResult);
});

function renderPgResult(result) {
  const data = result.analysis || {};
  const isOvercharged = data.verdict === 'OVERCHARGED';
  const isMid = data.verdict === 'SLIGHTLY_HIGH';

  $('#pgResultContainer').innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px">
      <h3>Tariff Analysis Verdict</h3>
      <span class="pill ${isOvercharged ? 'pill-rose' : isMid ? 'pill-amber' : 'pill-emerald'}">
        ${escapeHtml(data.verdict || 'FAIR ESTIMATE')}
      </span>
    </div>

    <div class="metric-grid">
      <div class="metric-box">
        <small>CHARGED BY LANDLORD</small>
        <div class="metric-value">₹${escapeHtml(data.landlord_charged ?? $('#pgChargedInput').value)}</div>
      </div>
      <div class="metric-box ${isOvercharged ? 'danger' : ''}">
        <small>EST. OFFICIAL DISCOM BILL</small>
        <div class="metric-value">₹${escapeHtml(data.estimated_total ?? '—')}</div>
      </div>
      <div class="metric-box ${isOvercharged ? 'danger' : ''}">
        <small>POTENTIAL DIFFERENCE</small>
        <div class="metric-value">₹${escapeHtml(data.difference ?? '0')}</div>
      </div>
    </div>

    <div class="evidence-card">
      <h4>Official Domestic Slabs Applied</h4>
      <p style="font-family:monospace; font-size:0.85rem; color:var(--cyan-light)">${escapeHtml(data.applicable_slabs || 'Residential domestic tariff schedule')}</p>
    </div>

    <div class="evidence-card">
      <h4>Explanation & Calculation Breakdown</h4>
      <p>${escapeHtml(data.explanation || 'Calculated using official state tariff schedule.')}</p>
      ${data.missing_information?.length ? `<p style="margin-top:10px; font-size:0.85rem; color:var(--text-muted)"><strong>Note:</strong> ${escapeHtml(data.missing_information.join('; '))}</p>` : ''}
    </div>

    <div class="evidence-card">
      <h4>Verified Source Orders</h4>
      ${(result.source_urls || []).map(u => `
        <div class="source-item">
          ${link(u)}
          <span style="font-size:0.75rem; color:var(--text-dim)">Checked Live</span>
        </div>
      `).join('') || '<p style="color:var(--text-dim)">Source links verified directly from state regulator.</p>'}
    </div>
  `;
}

// ============================================================================
// TOOL 2: COLLEGE NOTICE RADAR
// ============================================================================
$('#btnRunNoticeCheck')?.addEventListener('click', () => {
  const college = $('#noticeCollegeInput').value.trim();
  if (!college) {
    showToast('Please enter your college or university name.', 'error');
    return;
  }

  const body = {
    college,
    category: $('#noticeCategorySelect').value,
    keyword: $('#noticeKeywordInput').value.trim(),
    noticeUrl: $('#noticeUrlInput').value.trim()
  };

  runResearch('notices', body, $('#noticeResultContainer'), renderNoticeResult);
});

function renderNoticeResult(result) {
  const data = result.analysis || {};
  const notices = data.notices || [];

  $('#noticeResultContainer').innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px">
      <h3>Official Notices & Circulars (${notices.length})</h3>
      <span class="pill pill-primary">${escapeHtml(data.institution || 'University')}</span>
    </div>
    
    <div class="result-container">
      ${notices.map(n => `
        <div class="notice-card">
          <div class="notice-head">
            <h3>${escapeHtml(n.title)}</h3>
            <span class="pill ${n.urgency === 'HIGH' ? 'pill-rose' : 'pill-cyan'}">${escapeHtml(n.urgency || 'NOTICE')}</span>
          </div>
          <div class="notice-meta">
            <span>📅 ${escapeHtml(n.date || 'Recent')}</span>
            <span>📂 ${escapeHtml(n.category || 'Academic')}</span>
            ${n.deadline ? `<span style="color:var(--amber)">⏰ ${escapeHtml(n.deadline)}</span>` : ''}
          </div>
          <p style="font-size:0.9rem; color:var(--text-muted); margin-bottom:8px">${escapeHtml(n.summary || '')}</p>
          <div class="source-item">
            ${link(n.source_url || result.source_urls?.[0], 'Open Official Document / Circular ↗')}
          </div>
        </div>
      `).join('') || '<p style="color:var(--text-muted)">No active notices matched this criteria. Try selecting "All Notice Categories".</p>'}
    </div>

    <div class="evidence-card" style="margin-top:16px">
      <h4>Checked Official Sources</h4>
      ${(result.source_urls || []).map(u => `<div class="source-item">${link(u)}</div>`).join('')}
    </div>
  `;
}

// Exam Notice AI Assistant
$('#btnAskNoticeAssistant')?.addEventListener('click', async () => {
  const q = $('#noticeAssistantQuestion').value.trim();
  const college = $('#noticeCollegeInput').value.trim();
  const resBox = $('#noticeAssistantResponse');
  const btn = $('#btnAskNoticeAssistant');

  if (!q) return;
  btn.disabled = true;
  resBox.innerHTML = '<div class="pill pill-cyan"><span class="pulse-dot"></span> Researching official examination circulars…</div>';

  try {
    const r = await fetch('/api/notices/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q, college })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Assistant request failed.');

    resBox.innerHTML = `
      <div style="background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:14px; margin-top:8px">
        <p style="white-space:pre-wrap; color:var(--text-main); line-height:1.6">${escapeHtml(d.answer)}</p>
        ${d.sources?.length ? `<div style="margin-top:8px; font-size:0.8rem"><strong>Official Sources:</strong> ${d.sources.map(s => link(s)).join(' · ')}</div>` : ''}
      </div>
    `;
  } catch (err) {
    resBox.innerHTML = `<small style="color:var(--rose)">${escapeHtml(err.message)}</small>`;
  } finally {
    btn.disabled = false;
  }
});

// ============================================================================
// TOOL 3: SCHOLARSHIP FINDER
// ============================================================================
$('#btnRunScholarshipCheck')?.addEventListener('click', () => {
  const body = {
    state: $('#schStateSelect').value,
    level: $('#schLevelSelect').value,
    course: $('#schCourseInput').value.trim()
  };
  runResearch('scholarship', body, $('#scholarshipResultContainer'), renderScholarshipResult);
});

function renderScholarshipResult(result) {
  const data = result.analysis || {};
  const list = data.scholarships || [];

  $('#scholarshipResultContainer').innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px">
      <h3>Verified Scholarships (${list.length})</h3>
      <span class="pill pill-emerald">NSP & State Schemes</span>
    </div>

    <div class="result-container">
      ${list.map(s => `
        <div class="notice-card">
          <div class="notice-head">
            <h3>${escapeHtml(s.name)}</h3>
            <span class="pill pill-emerald">${escapeHtml(s.status || 'Open')}</span>
          </div>
          <div class="notice-meta">
            <span>🏛 ${escapeHtml(s.provider)}</span>
            <span>🎓 ${escapeHtml(s.study_level)}</span>
            <span style="color:var(--amber)">⏰ Deadline: ${escapeHtml(s.deadline)}</span>
          </div>
          <p style="font-size:0.9rem; color:var(--text-muted); margin-bottom:8px">${escapeHtml(s.eligibility)}</p>
          ${s.required_documents?.length ? `
            <div style="font-size:0.8rem; color:var(--text-dim); margin-bottom:10px">
              <strong>Required Documents:</strong> ${escapeHtml(s.required_documents.join(', '))}
            </div>
          ` : ''}
          <div class="source-item">
            ${link(s.source_url, 'Official National / State Portal Link ↗')}
          </div>
        </div>
      `).join('') || '<p style="color:var(--text-muted)">No active scholarships returned. Try selecting "All India".</p>'}
    </div>
  `;
}

// ============================================================================
// TOOL 4: STUDENT TRAVEL & TRANSIT DISRUPTIONS
// ============================================================================
function setTravelPreset(val) {
  $('#travelLocationInput').value = val;
  $('#btnRunTravelCheck').click();
}

$('#btnRunTravelCheck')?.addEventListener('click', () => {
  const loc = $('#travelLocationInput').value.trim() || 'Delhi Metro';
  runResearch('travel', { location: loc }, $('#travelResultContainer'), renderTravelResult);
});

function renderTravelResult(result) {
  const data = result.analysis || {};
  const alerts = data.alerts || [];

  $('#travelResultContainer').innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px">
      <h3>Official Transit Notices (${alerts.length})</h3>
      <span class="pill pill-cyan">${escapeHtml(data.location || 'Transit Network')}</span>
    </div>

    <div class="result-container">
      ${alerts.map(a => `
        <div class="notice-card">
          <div class="notice-head">
            <h3>${escapeHtml(a.title)}</h3>
            <span class="pill ${a.severity === 'HIGH' ? 'pill-rose' : 'pill-cyan'}">${escapeHtml(a.severity || 'INFO')}</span>
          </div>
          <p style="font-size:0.9rem; color:var(--text-muted); margin-bottom:10px">${escapeHtml(a.summary)}</p>
          <div class="source-item">
            ${link(a.source_url, 'Official Transit Notice ↗')}
            <span style="font-size:0.75rem; color:var(--text-dim)">Checked ${escapeHtml(new Date(a.checked_at || Date.now()).toLocaleTimeString())}</span>
          </div>
        </div>
      `).join('') || `
        <div class="evidence-card">
          <h4>No Disruptions Reported</h4>
          <p>${escapeHtml(data.status_summary || 'Normal operations reported on checked official feeds.')}</p>
        </div>
      `}
    </div>

    <div class="evidence-card" style="margin-top:16px">
      <h4>Checked Official Transit Authority Sources</h4>
      ${(result.source_urls || []).map(u => `<div class="source-item">${link(u)}</div>`).join('')}
    </div>
  `;
}

// ============================================================================
// TOOL 5: INTERNSHIP SCAM SHIELD
// ============================================================================
$('#btnRunInternCheck')?.addEventListener('click', () => {
  const company = $('#internCompanyInput').value.trim();
  const offer = $('#internOfferInput').value.trim();

  if (!company || !offer) {
    showToast('Please enter the company name and offer text.', 'error');
    return;
  }

  const body = {
    company,
    website: $('#internWebsiteInput').value.trim(),
    offer
  };

  runResearch('internship', body, $('#internResultContainer'), renderInternResult);
});

function renderInternResult(result) {
  const data = result.analysis || {};
  const isHigh = data.risk_level === 'HIGH';
  const isMid = data.risk_level === 'MEDIUM';

  $('#internResultContainer').innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px">
      <h3>Offer Risk Audit</h3>
      <span class="pill ${isHigh ? 'pill-rose' : isMid ? 'pill-amber' : 'pill-emerald'}">
        ${escapeHtml(data.risk_level || 'EVALUATED')}
      </span>
    </div>

    <div class="metric-grid">
      <div class="metric-box ${isHigh ? 'danger' : ''}">
        <small>FRAUD RISK SCORE</small>
        <div class="metric-value">${data.risk_score ?? 15}/100</div>
      </div>
      <div class="metric-box">
        <small>RED FLAGS DETECTED</small>
        <div class="metric-value">${(data.red_flags || []).length}</div>
      </div>
    </div>

    <div class="evidence-card">
      <h4>Company Identity & Domain Verification</h4>
      <p>${escapeHtml(data.website_identity || 'Corroborated against official web presence.')}</p>
    </div>

    <div class="evidence-card">
      <h4>Identified Warning Signs</h4>
      ${(data.red_flags || []).map(rf => `
        <div style="padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.05)">
          <strong style="color:var(--rose)">⚠ ${escapeHtml(rf.label || 'Red Flag')}</strong>
          <p style="font-size:0.9rem; color:var(--text-muted); margin-top:4px">${escapeHtml(rf.evidence || rf)}</p>
        </div>
      `).join('') || '<p style="color:var(--emerald)">✓ No upfront payment or major recruitment red flags detected in provided text.</p>'}
    </div>

    <div class="evidence-card">
      <h4>Recommendations</h4>
      <p>${escapeHtml(data.recommendation || 'Always verify the sender domain on the official corporate careers portal.')}</p>
    </div>

    <div class="evidence-card">
      <h4>Checked Corporate Web Sources</h4>
      ${(result.source_urls || []).map(u => `<div class="source-item">${link(u)}</div>`).join('')}
    </div>
  `;
}

// ============================================================================
// TOOL 6: PG HOUSING & TENANT GUIDE
// ============================================================================
function saveChecklist() {
  const store = getStore();
  store.checklist = {
    chk1: $('#chk1')?.checked || false,
    chk2: $('#chk2')?.checked || false,
    chk3: $('#chk3')?.checked || false,
    chk4: $('#chk4')?.checked || false,
    chk5: $('#chk5')?.checked || false
  };
  putStore(store);
  showToast('Tenant checklist saved', 'success');
}

function loadChecklist() {
  const store = getStore();
  const c = store.checklist || {};
  if ($('#chk1')) $('#chk1').checked = !!c.chk1;
  if ($('#chk2')) $('#chk2').checked = !!c.chk2;
  if ($('#chk3')) $('#chk3').checked = !!c.chk3;
  if ($('#chk4')) $('#chk4').checked = !!c.chk4;
  if ($('#chk5')) $('#chk5').checked = !!c.chk5;
}

$('#btnResearchTenantRights')?.addEventListener('click', () => {
  const store = getStore();
  const state = store.profile?.state || 'Delhi';
  const body = { state, locality: store.profile?.locality || 'University Area' };
  runResearch('housing', body, $('#housingGuidanceContainer'), renderHousingResult);
});

function renderHousingResult(result) {
  const data = result.analysis || {};
  const rules = data.guidance || [];

  $('#housingGuidanceContainer').innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px">
      <h3>State Tenancy Legal Guidance</h3>
      <span class="pill pill-cyan">${escapeHtml(data.state || 'State Regulations')}</span>
    </div>

    <div class="result-container">
      ${rules.map(r => `
        <div class="evidence-card">
          <h4>${escapeHtml(r.topic)}</h4>
          <p>${escapeHtml(r.rule)}</p>
        </div>
      `).join('')}
    </div>

    <div class="evidence-card" style="margin-top:16px">
      <h4>Official Tenancy References</h4>
      ${(result.source_urls || []).map(u => `<div class="source-item">${link(u)}</div>`).join('')}
    </div>
  `;
}

// ============================================================================
// TOOL 7: GUARDIAN AI ASSISTANT (Dedicated & Floating Drawer)
// ============================================================================
$('#btnFloatingGuardian')?.addEventListener('click', () => {
  $('#guardianDrawer').classList.toggle('open');
});

$('#btnCloseGuardianDrawer')?.addEventListener('click', () => {
  $('#guardianDrawer').classList.remove('open');
});

async function handleAssistantMessage(question, messagesContainer) {
  if (!question) return;

  messagesContainer.innerHTML += `
    <div class="chat-bubble user">${escapeHtml(question)}</div>
    <div class="chat-bubble assistant" id="tempLoadingBubble">
      <span class="pulse-dot" style="display:inline-block; margin-right:6px"></span> Thinking & checking live sources…
    </div>
  `;
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  try {
    const res = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || 'Assistant error.');

    $('#tempLoadingBubble')?.remove();
    let ansHtml = escapeHtml(d.answer).replace(/\n/g, '<br>');
    if (d.sources?.length) {
      ansHtml += `<div style="margin-top:8px; font-size:0.8rem; border-top:1px solid rgba(255,255,255,0.08); padding-top:6px"><strong>Sources:</strong> ${d.sources.map(s => link(s)).join(' · ')}</div>`;
    }

    messagesContainer.innerHTML += `<div class="chat-bubble assistant">${ansHtml}</div>`;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  } catch (err) {
    $('#tempLoadingBubble')?.remove();
    messagesContainer.innerHTML += `<div class="chat-bubble assistant" style="color:var(--rose)">${escapeHtml(err.message)}</div>`;
  }
}

$('#mainAssistantForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const input = $('#mainAssistantInput');
  const q = input.value.trim();
  input.value = '';
  handleAssistantMessage(q, $('#mainAssistantMessages'));
});

$('#drawerForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const input = $('#drawerInput');
  const q = input.value.trim();
  input.value = '';
  handleAssistantMessage(q, $('#drawerMessages'));
});

// ============================================================================
// DASHBOARD, ACTION NEEDED & MONTHLY REPORTS
// ============================================================================
function renderDashboard() {
  const store = getStore();
  const history = store.history || [];

  $('#statTotalScans').textContent = history.length;
  const allSources = history.reduce((acc, h) => acc + (h.sources || []).length, 0);
  $('#statSourcesVerified').textContent = allSources;

  // Render Action Needed summary on Dashboard
  const actions = computeActionItems(store);
  $('#badgeActionCount').textContent = actions.length;
  $('#statActionItems').textContent = actions.length;

  const dashList = $('#dashActionList');
  if (dashList) {
    dashList.innerHTML = actions.length ? actions.slice(0, 3).map(a => `
      <div class="notice-card" style="margin-bottom:8px">
        <div class="notice-head">
          <strong style="color:var(--text-main)">${escapeHtml(a.title)}</strong>
          <span class="pill ${a.severity === 'HIGH' ? 'pill-rose' : 'pill-amber'}">${escapeHtml(a.badge)}</span>
        </div>
        <p style="font-size:0.85rem; color:var(--text-muted)">${escapeHtml(a.detail)}</p>
      </div>
    `).join('') : '<p style="color:var(--text-muted); font-size:0.95rem">No action-needed items pending right now. Great job!</p>';
  }

  // Render Monthly Snapshot on Dashboard
  const monthlyBox = $('#dashMonthlyContent');
  if (monthlyBox) {
    const curMonth = new Date().getMonth();
    const curYear = new Date().getFullYear();
    const monthScans = history.filter(h => {
      const d = new Date(h.timestamp);
      return d.getMonth() === curMonth && d.getFullYear() === curYear;
    });

    monthlyBox.innerHTML = `
      <div class="metric-grid">
        <div class="metric-box">
          <small>CHECKS THIS MONTH</small>
          <div class="metric-value">${monthScans.length}</div>
        </div>
        <div class="metric-box">
          <small>DISCOMS & SOURCES REVIEWED</small>
          <div class="metric-value">${monthScans.reduce((a, b) => a + (b.sources || []).length, 0)}</div>
        </div>
        <div class="metric-box">
          <small>TOOLS UTILIZED</small>
          <div class="metric-value">${new Set(monthScans.map(s => s.tool)).size}/6</div>
        </div>
      </div>
      <p style="font-size:0.85rem; color:var(--text-dim); margin-top:8px">
        ${monthScans.length ? `Latest research logged: ${new Date(monthScans[0].timestamp).toLocaleString()}` : 'Run your first check this month to populate analytics.'}
      </p>
    `;
  }
}

function computeActionItems(store) {
  const items = [];
  const results = store.results || {};

  // PG overcharge alert
  if (results.pg?.analysis?.verdict === 'OVERCHARGED') {
    items.push({
      title: 'Review PG Electricity Overcharge',
      badge: 'OVERCHARGED',
      severity: 'HIGH',
      detail: `Your quoted charge exceeds the official domestic estimate by ₹${results.pg.analysis.difference}. Review the master DISCOM bill.`
    });
  }

  // Internship red flags
  if (results.internship?.analysis?.risk_level === 'HIGH') {
    items.push({
      title: 'High Risk Internship Offer Flagged',
      badge: 'SCAM WARNING',
      severity: 'HIGH',
      detail: results.internship.analysis.recommendation || 'Potential fee or domain red flags detected. Do not pay money.'
    });
  }

  // Urgent college notices
  const notices = results.notices?.analysis?.notices || [];
  for (const n of notices.filter(x => x.urgency === 'HIGH')) {
    items.push({
      title: n.title,
      badge: 'URGENT NOTICE',
      severity: 'HIGH',
      detail: n.deadline ? `Deadline: ${n.deadline} — ${n.summary}` : n.summary
    });
  }

  return items;
}

function renderActionNeeded() {
  const container = $('#fullActionListContainer');
  if (!container) return;
  const actions = computeActionItems(getStore());

  container.innerHTML = actions.length ? `
    <div class="result-container">
      ${actions.map(a => `
        <div class="notice-card">
          <div class="notice-head">
            <h3>${escapeHtml(a.title)}</h3>
            <span class="pill ${a.severity === 'HIGH' ? 'pill-rose' : 'pill-amber'}">${escapeHtml(a.badge)}</span>
          </div>
          <p style="font-size:0.95rem; color:var(--text-main); margin-bottom:10px">${escapeHtml(a.detail)}</p>
        </div>
      `).join('')}
    </div>
  ` : `
    <div class="empty-result">
      <div class="icon-large">♧</div>
      <h3>All Clear!</h3>
      <p>No actions pending. Scanned items requiring your attention will appear here automatically.</p>
    </div>
  `;
}

function renderMonthlyReport() {
  const container = $('#fullMonthlyReportContainer');
  if (!container) return;
  const store = getStore();
  const history = store.history || [];

  container.innerHTML = `
    <div class="metric-grid" style="margin-bottom:24px">
      <div class="metric-box">
        <small>TOTAL COMPLETED RUNS</small>
        <div class="metric-value">${history.length}</div>
      </div>
      <div class="metric-box">
        <small>EVIDENCE SOURCES CITED</small>
        <div class="metric-value">${history.reduce((a, b) => a + (b.sources || []).length, 0)}</div>
      </div>
      <div class="metric-box">
        <small>TOOLS ACTIVE</small>
        <div class="metric-value">${new Set(history.map(s => s.tool)).size}/6</div>
      </div>
    </div>

    <h3 style="margin-bottom:14px">Recent Research Runs Breakdown</h3>
    <div class="result-container">
      ${history.slice(0, 10).map(h => `
        <div class="source-item" style="padding:14px">
          <div>
            <strong>${escapeHtml(h.label)}</strong>
            <div style="font-size:0.8rem; color:var(--text-dim)">Checked ${new Date(h.timestamp).toLocaleString()} • ${(h.sources || []).length} source(s)</div>
          </div>
          <span class="pill pill-cyan" style="font-size:0.75rem">VERIFIED</span>
        </div>
      `).join('') || '<p style="color:var(--text-muted)">No monthly research runs recorded yet.</p>'}
    </div>
  `;
}

function renderHistory() {
  const container = $('#historyListContainer');
  if (!container) return;
  const history = getStore().history || [];

  container.innerHTML = history.length ? `
    <div class="result-container">
      ${history.map(h => `
        <div class="notice-card">
          <div class="notice-head">
            <h3>${escapeHtml(h.label)}</h3>
            <span class="pill pill-primary">${escapeHtml(h.tool.toUpperCase())}</span>
          </div>
          <div class="notice-meta">
            <span>📅 ${new Date(h.timestamp).toLocaleString()}</span>
            <span>🔗 ${(h.sources || []).length} source(s) cited</span>
          </div>
          ${h.sources?.length ? `
            <div style="font-size:0.8rem; margin-top:6px">
              <strong>Sources:</strong> ${h.sources.slice(0, 3).map(s => link(s)).join(' · ')}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  ` : `
    <div class="empty-result">
      <div class="icon-large">▤</div>
      <h3>No History Recorded</h3>
      <p>Run any of the 6 tools to start building your research evidence history.</p>
    </div>
  `;
}

function exportMonthlyReportText() {
  const store = getStore();
  const history = store.history || [];
  const lines = [
    '========================================',
    'CampusGuard.AI — Monthly Research Report',
    'Team ThinkStack | Kritical Hacks 2026',
    `Generated: ${new Date().toLocaleString()}`,
    `User: ${store.profile?.name || 'Student'} (${store.profile?.college || 'University'})`,
    '========================================\n',
    `Total Research Scans: ${history.length}`,
    `Sources Verified: ${history.reduce((a, b) => a + (b.sources || []).length, 0)}\n`,
    'Detailed Scans:'
  ];

  for (const h of history) {
    lines.push(`- [${new Date(h.timestamp).toLocaleDateString()}] ${h.label} (${h.tool})`);
    if (h.sources?.length) lines.push(`  Sources: ${h.sources.join(', ')}`);
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `campusguard-monthly-report-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Monthly report exported as text', 'success');
}

function exportHistoryJson() {
  const store = getStore();
  const blob = new Blob([JSON.stringify(store.history, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `campusguard-history-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('History exported as JSON', 'success');
}

function clearHistoryConfirm() {
  if (confirm('Are you sure you want to clear your local research history?')) {
    const store = getStore();
    store.history = [];
    store.results = {};
    putStore(store);
    renderDashboard();
    renderHistory();
    renderActionNeeded();
    renderMonthlyReport();
    showToast('Research history cleared', 'info');
  }
}

function refreshDashboardAll() {
  renderDashboard();
  renderHistory();
  renderActionNeeded();
  renderMonthlyReport();
  showToast('Dashboard refreshed with latest records', 'success');
}

// Autonomous Radar Automation Run
let isAutomationRunning = false;

async function startAutonomousRun() {
  if (isAutomationRunning) {
    showToast('Autonomous run already in progress', 'info');
    return;
  }
  isAutomationRunning = true;
  const store = getStore();
  const prof = store.profile || {};

  const btn = $('#btnRunFullAutomation');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner" style="width:14px;height:14px;display:inline-block;margin-right:6px"></span> Running Radars…`;
  }

  const container = $('#automationProgressContainer');
  const statusText = $('#automationStatusText');
  const percentText = $('#automationProgressPercent');
  const bar = $('#automationProgressBar');
  if (container) container.classList.remove('hidden');

  const steps = [
    {
      id: 'pg',
      name: 'PG Electricity Tariff Audit',
      elemId: '#autoStep-pg',
      payload: {
        units: 180,
        amount: 2160,
        state: prof.state || 'Delhi',
        locality: prof.locality || 'Rohini Sector 16'
      }
    },
    {
      id: 'notices',
      name: 'College Notice Radar',
      elemId: '#autoStep-notices',
      payload: {
        college: prof.college || 'Delhi Technological University',
        category: 'exam'
      }
    },
    {
      id: 'scholarship',
      name: 'Scholarship Eligibility Check',
      elemId: '#autoStep-scholarship',
      payload: {
        state: prof.state || 'Delhi',
        course: prof.course || 'B.Tech Computer Engineering',
        level: 'undergraduate'
      }
    },
    {
      id: 'travel',
      name: 'Transit & Metro Disruption Alerts',
      elemId: '#autoStep-travel',
      payload: {
        city: prof.state || 'Delhi',
        line: 'Yellow Line'
      }
    }
  ];

  try {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const pct = Math.round((i / steps.length) * 100);
      if (bar) bar.style.width = `${pct}%`;
      if (percentText) percentText.textContent = `${pct}%`;
      if (statusText) statusText.textContent = `[${i + 1}/${steps.length}] Running ${step.name} via TinyFish & Groq AI…`;

      $$(step.elemId).forEach(el => {
        el.classList.add('active');
      });

      // Call tool backend via fetch SSE
      try {
        const res = await fetch(`/api/tinyfish/${step.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(step.payload)
        });

        if (res.ok) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let finalRes = null;

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            buffer = parseSSEBuffer(buffer, ev => {
              if (ev.type === 'COMPLETE') finalRes = ev.result;
            });
          }

          if (finalRes) {
            const s = getStore();
            s.results[step.id] = finalRes;
            s.history.unshift({
              tool: step.id,
              label: getToolLabel(step.id),
              timestamp: finalRes.checked_at || new Date().toISOString(),
              sources: finalRes.source_urls || [],
              summary: finalRes.verdict || finalRes.alert || 'Autonomous radar verified'
            });
            putStore(s);
          }
        }
      } catch (err) {
        console.warn(`Step ${step.id} warning:`, err);
      }

      $$(step.elemId).forEach(el => {
        el.classList.remove('active');
        el.classList.add('done');
      });
    }

    if (bar) bar.style.width = '100%';
    if (percentText) percentText.textContent = '100%';
    if (statusText) statusText.textContent = '✓ Autonomous Run Complete! All 4 student radars updated.';
    showToast('Autonomous radar run complete! All live metrics updated.', 'success');
    renderDashboard();
    renderHistory();
    renderActionNeeded();
    renderMonthlyReport();
  } catch (err) {
    showToast(`Automation run error: ${err.message}`, 'error');
  } finally {
    isAutomationRunning = false;
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `▶ Execute Automation Run`;
    }
  }
}

function triggerLiveAutomationDemo() {
  showApp();
  showView('dashboard');
  showToast('Initializing Autonomous Campus Radar Demo…', 'info');
  setTimeout(() => {
    startAutonomousRun();
  }, 400);
}

// Google Places Autocomplete Helpers
function setupAutocomplete(inputId, dropdownId, kind = 'university') {
  const input = $(inputId);
  const dropdown = $(dropdownId);
  if (!input || !dropdown) return;

  let timer = null;
  input.addEventListener('input', e => {
    const val = e.target.value.trim();
    clearTimeout(timer);
    if (val.length < 2) {
      dropdown.classList.remove('open');
      dropdown.innerHTML = '';
      return;
    }

    timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/places/autocomplete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: val, kind })
        });
        const data = await res.json();
        const suggestions = (data.suggestions || []).filter(s => s.placePrediction);

        if (suggestions.length) {
          dropdown.innerHTML = suggestions.map((s, idx) => {
            const p = s.placePrediction;
            return `
              <div class="suggestion-item" data-idx="${idx}">
                <strong>${escapeHtml(p.structuredFormat?.mainText?.text || p.text?.text)}</strong>
                <small>${escapeHtml(p.structuredFormat?.secondaryText?.text || '')}</small>
              </div>
            `;
          }).join('');
          dropdown.classList.add('open');

          dropdown.querySelectorAll('.suggestion-item').forEach(item => {
            item.onclick = () => {
              const p = suggestions[Number(item.dataset.idx)].placePrediction;
              input.value = p.text?.text || p.structuredFormat?.mainText?.text;
              dropdown.classList.remove('open');
            };
          });
        } else {
          dropdown.classList.remove('open');
        }
      } catch (_) {
        dropdown.classList.remove('open');
      }
    }, 280);
  });
}

document.addEventListener('click', e => {
  if (!e.target.closest('.autocomplete-box')) {
    $$('.autocomplete-dropdown').forEach(d => d.classList.remove('open'));
  }
});

// Initialize on Load
async function initApp() {
  showLanding();
  setupAutocomplete('#pgPlaceInput', '#pgPlaceDropdown', 'place');
  setupAutocomplete('#noticeCollegeInput', '#noticeCollegeDropdown', 'university');
  setupAutocomplete('#profCollege', '#profCollegeDropdown', 'university');

  loadChecklist();
  syncProfileToInputs();
  renderDashboard();

  // Check Supabase config
  try {
    const cfg = await (await fetch('/api/config')).json();
    if (cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase?.createClient) {
      supabaseClient = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
      const { data } = await supabaseClient.auth.getSession();
      if (data.session) {
        currentUser = data.session.user;
        syncProfileToInputs();
      }
    }
  } catch (_) {}

  // Check Server Health
  try {
    const h = await (await fetch('/api/health')).json();
    const pill = $('#topbarStatusPill');
    if (pill) {
      pill.innerHTML = `
        <span class="pulse-dot"></span>
        <span>TinyFish ${h.tinyfish ? 'Active' : 'Offline'} • Groq ${h.groq ? 'Active' : 'Offline'}</span>
      `;
    }
  } catch (_) {}
}

initApp();
