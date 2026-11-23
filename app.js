// =====================================================================
// VEKTOROVÉ SVG IKONY (NÁHRADA TEXTOVÝCH ŠÍPOK A ZNAKOV)
// =====================================================================
function svgIcon(name, cls = 'w-4 h-4') {
    const map = {
        'chev-l': '<svg class="' + cls + '" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>',
        'chev-r': '<svg class="' + cls + '" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>',
        'chev-d': '<svg class="' + cls + '" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>',
        'chev-u': '<svg class="' + cls + '" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"/></svg>',
        'arr-r': '<svg class="' + cls + '" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>',
        'ok': '<svg class="' + cls + '" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>',
        'close': '<svg class="' + cls + '" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>',
        'plus': '<svg class="' + cls + '" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>',
        'minus': '<svg class="' + cls + '" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14"/></svg>'
    };
    return map[name] || '';
}

function hydrateStaticSvgIcons() {
    const targets = {
        'nutri-prev-day-btn': svgIcon('chev-l', 'w-4 h-4'),
        'nutri-next-day-btn': svgIcon('chev-r', 'w-4 h-4'),
        'readiness-toggle-arrow': 'Upraviť ' + svgIcon('chev-d', 'w-3.5 h-3.5 inline')
    };
    Object.keys(targets).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = targets[id];
    });
}

// =====================================================================
// SUPABASE CLOUD PREPOJENIE, ROLE, AUTO-SYNC & AUTO-UPDATE
// =====================================================================
const APP_VERSION = '2.5.0';
const SUPABASE_URL = 'https://gfmiyksnjimznbussdia.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmbWl5a3Nuamltem5idXNzZGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxNzY2MjQsImV4cCI6MjExMDc1MjYyNH0.3PSwWSSmkNyvO_rQTWjQe3hz4zlcU-AFPUSU9hasCcM';

let currentTesterSession = JSON.parse(localStorage.getItem('mmlab_tester_session') || 'null');
let cloudSyncTimer = null;
let isCloudSyncing = false;

async function supabaseFetch(path, options = {}) {
    const headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
}

function setCloudSyncIndicator(state) {
    const dot = document.getElementById('cloud-sync-dot');
    const txt = document.getElementById('cloud-sync-status-text');
    if (state === 'syncing') {
        if (dot) dot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0';
        if (txt) txt.textContent = 'Ukladám do cloudu...';
    } else if (state === 'synced') {
        if (dot) dot.className = 'w-2 h-2 rounded-full bg-brand-400 shrink-0';
        if (txt) txt.textContent = `Zálohované v cloude (${new Date().toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })})`;
    } else {
        if (dot) dot.className = 'w-2 h-2 rounded-full bg-zinc-500 shrink-0';
        if (txt) txt.textContent = 'Offline režim (uložené v mobile)';
    }
}

function getUserRole() {
    const code = (currentTesterSession?.code || '').toUpperCase();
    if (code === 'MIRO-ADMIN') return 'super_admin';
    const r = (currentTesterSession?.role || 'client').toLowerCase();
    if (r === 'admin') return 'super_admin';
    if (r === 'tester') return 'client';
    return r;
}
function isSuperAdmin() { return getUserRole() === 'super_admin'; }
function isTrainerOrAdmin() { const r = getUserRole(); return r === 'super_admin' || r === 'trainer'; }
function isSoloUser() { return getUserRole() === 'solo'; }

function showTesterGate(alertMessage = '') {
    const modal = document.getElementById('modal-tester-gate');
    const alertBox = document.getElementById('tester-gate-alert');
    if (!modal) return;
    if (alertMessage) { alertBox.textContent = alertMessage; alertBox.classList.remove('hidden'); }
    else { alertBox.classList.add('hidden'); }
    modal.classList.remove('hidden');
}

function hideTesterGate() {
    const modal = document.getElementById('modal-tester-gate');
    if (modal) modal.classList.add('hidden');
    const lbl = document.getElementById('backup-tester-code-label');
    const profLbl = document.getElementById('profile-modal-code-label');
    const verLbl = document.getElementById('app-version-label');
    if (verLbl) verLbl.textContent = APP_VERSION;
    if (currentTesterSession) {
        if (lbl) lbl.textContent = `${currentTesterSession.code} (${currentTesterSession.name})`;
        if (profLbl) profLbl.textContent = `${currentTesterSession.name}`;
    }
    applyAdminPermissionsUI();
}

function toggleTesterCodeVisibility() {
    const inp = document.getElementById('tester-code-input');
    if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
}

function applyAdminPermissionsUI() {
    const coach = isTrainerOrAdmin();
    const superAdm = isSuperAdmin();
    const solo = isSoloUser();
    const addSec = document.getElementById('add-client-admin-section');
    const soloBox = document.getElementById('solo-coaching-cta-box');
    const cockpitTabBtn = document.getElementById('domain-btn-cockpit');
    const topGrid = document.getElementById('top-domain-grid');
    const sendMpBtn = document.getElementById('trainer-send-mealplan-btn');
    const addAccBtn = document.getElementById('cockpit-add-account-btn');

    if (addSec) addSec.classList.toggle('hidden', !coach);
    if (soloBox) soloBox.classList.toggle('hidden', !solo);
    if (addAccBtn) addAccBtn.classList.toggle('hidden', !superAdm);
    if (cockpitTabBtn) {
        cockpitTabBtn.style.display = coach ? 'flex' : 'none';
        cockpitTabBtn.classList.toggle('hidden', !coach);
    }
    if (topGrid) topGrid.className = coach
        ? 'grid grid-cols-4 gap-1 bg-dark-950 p-1 rounded-xl border border-zinc-800/90'
        : 'grid grid-cols-3 gap-1 bg-dark-950 p-1 rounded-xl border border-zinc-800/90';
    if (sendMpBtn) sendMpBtn.classList.toggle('hidden', !coach);
    if (!coach && activeDomain === 'cockpit') {
        switchAppDomain('training');
    }
    if (!coach && activeProfileId !== 'me') {
        activeProfileId = 'me';
        saveState(false);
        updateHeaderProfileUI();
    }
}

async function checkLatestAppVersionFromCloud() {
    try {
        const rows = await supabaseFetch('app_config?key=eq.latest_version&select=value');
        const remoteVer = rows?.[0]?.value;
        if (remoteVer && remoteVer !== APP_VERSION) {
            document.getElementById('remote-version-badge').textContent = remoteVer;
            const banner = document.getElementById('app-update-banner');
            if (banner) { banner.style.display = 'flex'; banner.classList.remove('hidden'); }
        }
    } catch (e) {}
}

async function applyAppUpdateNow() {
    try {
        if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
        }
    } catch (e) {}
    const baseUrl = window.location.href.split('?')[0];
    window.location.replace(`${baseUrl}?v=${Date.now()}`);
}

async function checkTesterAccessOnStartup() {
    if (!currentTesterSession || !currentTesterSession.code) {
        showTesterGate();
        return;
    }
    hideTesterGate();
    checkLatestAppVersionFromCloud();
    try {
        const rows = await supabaseFetch(`beta_testers?code=eq.${encodeURIComponent(currentTesterSession.code)}&select=code,name,is_active,role,trainer_code`);
        if (!rows || rows.length === 0 || !rows[0].is_active) {
            localStorage.removeItem('mmlab_tester_session');
            currentTesterSession = null;
            showTesterGate('Prístup do MM LAB bol pre tento kód pozastavený.');
            return;
        }
        currentTesterSession = {
            code: rows[0].code,
            name: rows[0].name,
            role: rows[0].role || (rows[0].code === 'MIRO-ADMIN' ? 'super_admin' : 'client'),
            trainer_code: rows[0].trainer_code || (rows[0].code === 'MIRO-ADMIN' ? null : 'MIRO-ADMIN')
        };
        localStorage.setItem('mmlab_tester_session', JSON.stringify(currentTesterSession));
        hideTesterGate();
        await pullOrMigrateUserStateFromCloud();
    } catch (e) {
        setCloudSyncIndicator('offline');
    }
}

async function verifyAndLoginTesterCode() {
    const input = document.getElementById('tester-code-input');
    const btn = document.getElementById('tester-login-btn');
    const code = (input?.value || '').trim().toUpperCase();
    if (!code) { showTesterGate('Zadaj prístupový kód.'); return; }
    btn.disabled = true; btn.textContent = 'Overujem kód...';
    try {
        const rows = await supabaseFetch(`beta_testers?code=eq.${encodeURIComponent(code)}&select=code,name,is_active,role,trainer_code`);
        if (!rows || rows.length === 0) { showTesterGate('Neplatný prístupový kód.'); return; }
        const tester = rows[0];
        if (!tester.is_active) { showTesterGate('Tento prístup je momentálne vypnutý.'); return; }

        currentTesterSession = {
            code: tester.code,
            name: tester.name,
            role: tester.role || (tester.code === 'MIRO-ADMIN' ? 'super_admin' : 'client'),
            trainer_code: tester.trainer_code || (tester.code === 'MIRO-ADMIN' ? null : 'MIRO-ADMIN')
        };
        localStorage.setItem('mmlab_tester_session', JSON.stringify(currentTesterSession));

        if (profiles[0] && tester.name) {
            profiles[0].name = tester.name;
            activeProfileId = 'me';
            saveState(false);
            updateHeaderProfileUI();
        }

        hideTesterGate();
        await pullOrMigrateUserStateFromCloud();
        renderSplits(); renderDatabase(); renderHistory();
        fetchSharedTrainerSplits(false); fetchSharedTrainerMealPlans(false);
        fetchScheduledWorkouts(false); fetchLabFeedPosts(); fetchCommunityFoodCatalog();
        checkLatestAppVersionFromCloud();
        showToast(`Vitaj v MM LAB, ${tester.name}`);
        sendCloudTesterLog('login', { name: tester.name, version: APP_VERSION });
    } catch (err) {
        showTesterGate('Chyba pripojenia k serveru. Skontroluj internet.');
    } finally {
        btn.disabled = false; btn.textContent = 'Odomknúť aplikáciu →';
    }
}

function logoutTesterCode() {
    localStorage.removeItem('mmlab_tester_session');
    currentTesterSession = null;
    closeBackupModal();
    showTesterGate('Kód bol odhlásený.');
}

// =====================================================================
// PLNÁ CLOUDOVÁ SYNCHRONIZÁCIA STAVU (ZERO DATA LOSS)
// =====================================================================
function buildCurrentStatePayload() {
    return {
        appVersion: APP_VERSION,
        profiles, exercises, savedSplits, workoutHistory,
        userSupplementStacks, suppTakenByDate, nutritionDataByProfile,
        mealPresets, bodyCheckInsByProfile, weeklyCheckInsByProfile,
        biometricsByProfile, preWorkoutReadiness
    };
}

function hasMeaningfulLocalData() {
    return (
        workoutHistory.length > 0 ||
        Object.keys(bodyCheckInsByProfile).some(k => (bodyCheckInsByProfile[k] || []).length > 0) ||
        Object.keys(weeklyCheckInsByProfile).some(k => (weeklyCheckInsByProfile[k] || []).length > 0) ||
        Object.keys(nutritionDataByProfile).length > 0 ||
        savedSplits.length > DEFAULT_SPLITS.length
    );
}

async function pullOrMigrateUserStateFromCloud() {
    if (!currentTesterSession?.code) return;
    try {
        const rows = await supabaseFetch(`user_state?tester_code=eq.${encodeURIComponent(currentTesterSession.code)}&select=tester_code,state_json,updated_at`);
        const localTs = parseInt(localStorage.getItem('fitlog_local_updated_at') || '0', 10);

        if (!rows || rows.length === 0 || !rows[0].state_json) {
            await syncUserStateToCloud(false);
            return;
        }

        const cloudRow = rows[0];
        const cloudTs = new Date(cloudRow.updated_at).getTime() || 0;
        const cloudState = cloudRow.state_json;

        if (Array.isArray(cloudState.workoutHistory)) {
            const localIds = new Set(workoutHistory.map(w => w.id));
            cloudState.workoutHistory.forEach(cw => { if (!localIds.has(cw.id)) workoutHistory.push(cw); });
            workoutHistory.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
        }
        if (Array.isArray(cloudState.savedSplits)) {
            const localSplitIds = new Set(savedSplits.map(s => s.id));
            cloudState.savedSplits.forEach(cs => { if (!localSplitIds.has(cs.id)) savedSplits.push(cs); });
        }
        if (Array.isArray(cloudState.exercises)) {
            const localExIds = new Set(exercises.map(e => e.id));
            cloudState.exercises.forEach(ce => { if (!localExIds.has(ce.id)) exercises.push(ce); });
        }

        if (cloudTs > localTs || !hasMeaningfulLocalData()) {
            if (cloudState.nutritionDataByProfile) nutritionDataByProfile = { ...nutritionDataByProfile, ...cloudState.nutritionDataByProfile };
            if (cloudState.userSupplementStacks) userSupplementStacks = { ...userSupplementStacks, ...cloudState.userSupplementStacks };
            if (cloudState.suppTakenByDate) suppTakenByDate = { ...suppTakenByDate, ...cloudState.suppTakenByDate };
            if (cloudState.bodyCheckInsByProfile) bodyCheckInsByProfile = { ...bodyCheckInsByProfile, ...cloudState.bodyCheckInsByProfile };
            if (cloudState.weeklyCheckInsByProfile) weeklyCheckInsByProfile = { ...weeklyCheckInsByProfile, ...cloudState.weeklyCheckInsByProfile };
            if (cloudState.biometricsByProfile) biometricsByProfile = { ...biometricsByProfile, ...cloudState.biometricsByProfile };
            if (Array.isArray(cloudState.mealPresets) && cloudState.mealPresets.length > 0) {
                const existingNames = new Set(mealPresets.map(m => m.name));
                cloudState.mealPresets
                    .filter(mp => !LEGACY_DEFAULT_PRESET_IDS.has(mp.id))
                    .forEach(mp => { if (!existingNames.has(mp.name)) mealPresets.push(mp); });
            }
            if (cloudState.preWorkoutReadiness) preWorkoutReadiness = { ...preWorkoutReadiness, ...cloudState.preWorkoutReadiness };
        }

        saveState(false);
        initBiometricsUI(); initPreWorkoutReadinessUI(); updateSuppBadgeCount();
        renderDatabase(); renderSplits(); renderHistory();
        if (activeDomain === 'nutrition') renderNutritionSection();
        if (activeDomain === 'supplements') renderSupplementsSection();

        if (localTs > cloudTs) await syncUserStateToCloud(false);
        else setCloudSyncIndicator('synced');
    } catch (e) {
        setCloudSyncIndicator('offline');
    }
}

function scheduleCloudStateSync() {
    if (!currentTesterSession?.code) return;
    setCloudSyncIndicator('syncing');
    if (cloudSyncTimer) clearTimeout(cloudSyncTimer);
    cloudSyncTimer = setTimeout(() => { syncUserStateToCloud(false); }, 2000);
}

async function syncUserStateToCloud(showNotify = false) {
    if (!currentTesterSession?.code || isCloudSyncing) return;
    isCloudSyncing = true;
    setCloudSyncIndicator('syncing');
    try {
        await supabaseFetch('user_state', {
            method: 'POST',
            headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
            body: JSON.stringify({
                tester_code: currentTesterSession.code,
                state_json: buildCurrentStatePayload(),
                updated_at: new Date().toISOString()
            })
        });
        setCloudSyncIndicator('synced');
        if (showNotify) showToast('Zálohované v cloude ✓');
    } catch (e) {
        setCloudSyncIndicator('offline');
        if (showNotify) showToast('Uložené v mobile (offline)');
    } finally {
        isCloudSyncing = false;
    }
}

async function sendCloudTesterLog(logType, payload) {
    if (!currentTesterSession || !currentTesterSession.code) return;
    try {
        await supabaseFetch('tester_logs', {
            method: 'POST',
            headers: { 'Prefer': 'return=minimal' },
            body: JSON.stringify({
                tester_code: currentTesterSession.code,
                log_type: logType,
                payload: {
                    testerName: currentTesterSession.name,
                    trainerCode: currentTesterSession.trainer_code || null,
                    role: getUserRole(),
                    ...payload
                }
            })
        });
    } catch (e) {}
}

// =====================================================================
// DYNAMICKÁ SPODNÁ NAVIGÁCIA PRE KAŽDÚ SEKCIU
// =====================================================================
const BOTTOM_NAV_CONFIG = {
    training: [
        { id: 'workout', label: 'Tréning', icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>`, action: () => switchTab('workout') },
        { id: 'splits', label: 'Splity', icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>`, action: () => switchTab('splits') },
        { id: 'database', label: 'Cviky', icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>`, action: () => switchTab('database') },
        { id: 'history', label: 'História', icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>`, action: () => switchTab('history') }
    ],
    nutrition: [
        { id: 'food', label: 'Denná strava', icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>`, action: () => setNutritionSubTab('food') },
        { id: 'add-food', label: '+ Jedlo', icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>`, action: () => openMealBuilderModal(false) },
        { id: 'scan-ean', label: 'Skenovať', icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M3 7V5a2 2 0 012-2h2m10 0h2a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M7 12h10"/>`, action: () => openMealBuilderModal(true) },
        { id: 'body', label: 'Telo & Check-in', icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>`, action: () => setNutritionSubTab('body') }
    ],
    supplements: [
        { id: 'mystack', label: 'Môj Stack', icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>`, action: () => setSuppSubTab('mystack') },
        { id: 'catalog', label: 'Encyklopédia', icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>`, action: () => setSuppSubTab('catalog') },
        { id: 'ics', label: 'Kalendár', icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>`, action: () => exportSupplementsToICS() },
        { id: 'new-supp', label: '+ Vlastný', icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>`, action: () => openNewSupplementModal() }
    ],
    cockpit: [
        { id: 'overview', label: 'Klienti & Grafy', icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>`, action: () => setCoachCockpitTab('overview') },
        { id: 'workouts', label: 'Tréningy', icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>`, action: () => setCoachCockpitTab('workouts') },
        { id: 'logs', label: 'Strava & Check-in', icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/>`, action: () => setCoachCockpitTab('logs') },
        { id: 'publish', label: 'Feed & Správy', icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>`, action: () => setCoachCockpitTab('publish') }
    ]
};

let dynamicNavHandlers = [];
function renderDynamicBottomNav(domain, activeSubId) {
    const grid = document.getElementById('dynamic-bottom-nav-grid');
    if (!grid) return;
    const items = BOTTOM_NAV_CONFIG[domain] || BOTTOM_NAV_CONFIG.training;
    dynamicNavHandlers = items.map(it => it.action);
    const activeAccent = domain === 'cockpit' || domain === 'supplements'
        ? 'text-amber-400 bg-amber-400/10'
        : 'text-brand-400 bg-brand-500/10';
    grid.innerHTML = items.map((item, idx) => {
        const isActive = item.id === activeSubId;
        return `
            <button type="button" onclick="dynamicNavHandlers[${idx}]()" class="flex flex-col items-center justify-center py-1.5 rounded-xl transition ${isActive ? activeAccent : 'text-zinc-400 hover:text-zinc-200'}">
                <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">${item.icon}</svg>
                <span class="text-[10px] font-bold truncate max-w-full px-1">${item.label}</span>
            </button>
        `;
    }).join('');
}

function switchAppDomain(domain) {
    if (domain === 'cockpit' && !isTrainerOrAdmin()) return;
    activeDomain = domain;
    const btns = {
        training: document.getElementById('domain-btn-training'),
        nutrition: document.getElementById('domain-btn-nutrition'),
        supplements: document.getElementById('domain-btn-supplements'),
        cockpit: document.getElementById('domain-btn-cockpit')
    };
    Object.keys(btns).forEach(k => {
        if (!btns[k]) return;
        if (k === domain) {
            const activeColor = (k === 'supplements' || k === 'cockpit') ? 'bg-amber-400 text-zinc-950' : 'bg-brand-500 text-zinc-950';
            btns[k].className = `py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1.5 ${activeColor} transition`;
        } else {
            const inactiveColor = k === 'cockpit' ? 'text-amber-300 hover:text-white' : 'text-zinc-400 hover:text-white';
            btns[k].className = `py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1.5 ${inactiveColor} transition`;
        }
    });

    ['workout', 'splits', 'database', 'history', 'nutrition', 'supplements', 'cockpit'].forEach(v => {
        const el = document.getElementById(`view-${v}`);
        if (el) el.classList.add('hidden');
    });

    if (domain === 'training') {
        switchTab(activeTrainingSubTab);
    } else if (domain === 'nutrition') {
        document.getElementById('view-nutrition').classList.remove('hidden');
        setNutritionSubTab(activeNutriSubTab);
        fetchSharedTrainerMealPlans(false);
    } else if (domain === 'supplements') {
        document.getElementById('view-supplements').classList.remove('hidden');
        updateSuppBadgeCount();
        setSuppSubTab(activeSuppSubTab);
    } else if (domain === 'cockpit') {
        document.getElementById('view-cockpit').classList.remove('hidden');
        const adminFilters = document.getElementById('cockpit-admin-group-filters');
        const sub = document.getElementById('cockpit-role-subtitle');
        const addAccBtn = document.getElementById('cockpit-add-account-btn');
        if (adminFilters) adminFilters.classList.toggle('hidden', !isSuperAdmin());
        if (addAccBtn) addAccBtn.classList.toggle('hidden', !isSuperAdmin());
        if (sub) sub.textContent = isSuperAdmin() ? 'Super Admin: Všetci klienti, tréneri & solo' : `Tréner (${currentTesterSession?.name}): Tvoji klienti`;
        renderDynamicBottomNav('cockpit', cockpitActiveTab);
        loadCoachCockpitData(false);
    }
}

let activeTrainingSubTab = 'workout';
function switchTab(tabName) {
    activeTrainingSubTab = tabName;
    ['workout', 'splits', 'database', 'history'].forEach(t => {
        const el = document.getElementById(`view-${t}`);
        if (el) el.classList.add('hidden');
    });
    document.getElementById(`view-${tabName}`).classList.remove('hidden');
    renderDynamicBottomNav('training', tabName);
    if (tabName === 'splits') { renderSplits(); fetchSharedTrainerSplits(false); }
    if (tabName === 'database') renderDatabase();
    if (tabName === 'workout') renderActiveWorkout();
    if (tabName === 'history') renderHistory();
}

// =====================================================================
// ROZDELENÁ SPÄTNÁ VÄZBA & MM LAB FEED
// =====================================================================
function openFeedbackModal() { document.getElementById('modal-feedback').classList.remove('hidden'); }
function closeFeedbackModal() { document.getElementById('modal-feedback').classList.add('hidden'); }

async function submitTesterFeedback() {
    const msgEl = document.getElementById('feedback-message');
    const targetTypeEl = document.getElementById('feedback-target-type');
    const btn = document.getElementById('feedback-send-btn');
    const message = (msgEl?.value || '').trim();
    if (!message) { showToast('Napíš prosím správu'); return; }
    const targetType = targetTypeEl?.value || 'trainer';
    const logType = targetType === 'tech' ? 'feedback_tech' : 'feedback_trainer';

    btn.disabled = true; btn.textContent = 'Odosielam...';
    try {
        await supabaseFetch('tester_logs', {
            method: 'POST',
            headers: { 'Prefer': 'return=minimal' },
            body: JSON.stringify({
                tester_code: currentTesterSession?.code || 'ANON',
                log_type: logType,
                payload: {
                    testerName: currentTesterSession?.name || getActiveProfile().name,
                    trainerCode: currentTesterSession?.trainer_code || 'MIRO-ADMIN',
                    targetType,
                    message,
                    device: targetType === 'tech' ? `${navigator.platform} | v${APP_VERSION}` : ''
                }
            })
        });
        msgEl.value = '';
        closeFeedbackModal();
        showToast(targetType === 'tech' ? 'Podnet odoslaný Mirovi ✓' : 'Správa odoslaná trénerovi ✓');
    } catch (err) {
        showToast('Nepodarilo sa odoslať – skontroluj internet');
    } finally {
        btn.disabled = false; btn.textContent = 'Odoslať správu ✓';
    }
}

async function requestIndividualCoaching() {
    if (!currentTesterSession?.code) return;
    await sendCloudTesterLog('coaching_inquiry', {
        message: `Používateľ ${currentTesterSession.name} (${currentTesterSession.code}) má záujem o individuálny coaching od Mira.`
    });
    closeProfileModal();
    showToast('Dopyt odoslaný Mirovi ✓');
}

let cachedFeedPosts = [];
async function fetchLabFeedPosts() {
    try {
        const rows = await supabaseFetch('mm_lab_feed?select=id,category,title,body,pros,cons,video_url,target_audience,likes_count,created_at&order=created_at.desc&limit=25');
        const role = getUserRole();
        cachedFeedPosts = (rows || []).filter(p => {
            const aud = (p.target_audience || 'ALL').toUpperCase();
            if (isSuperAdmin()) return true;
            if (aud === 'ALL') return true;
            if (aud === 'CLIENTS' && role === 'client') return true;
            if (aud === 'SOLO' && role === 'solo') return true;
            return false;
        });

        const readIds = new Set(JSON.parse(localStorage.getItem('fitlog_read_feed_ids') || '[]'));
        const unreadCount = cachedFeedPosts.filter(p => !readIds.has(p.id)).length;
        const badge = document.getElementById('feed-unread-badge');
        if (badge) {
            if (unreadCount > 0) { badge.textContent = unreadCount; badge.style.display = 'flex'; badge.classList.remove('hidden'); }
            else { badge.style.display = 'none'; badge.classList.add('hidden'); }
        }

        const banner = document.getElementById('latest-lab-tip-banner');
        const dismissedId = localStorage.getItem('fitlog_dismissed_tip_id');
        if (cachedFeedPosts.length > 0 && cachedFeedPosts[0].id !== dismissedId && banner) {
            const top = cachedFeedPosts[0];
            document.getElementById('latest-tip-tag').textContent = top.category || 'Tip z MM LAB';
            document.getElementById('latest-tip-date').textContent = new Date(top.created_at).toLocaleDateString('sk-SK');
            document.getElementById('latest-tip-title').textContent = top.title;
            document.getElementById('latest-tip-body').textContent = top.body;
            document.getElementById('latest-tip-likes').textContent = top.likes_count || 0;
            banner.classList.remove('hidden');
        }
    } catch (e) {}
}

function dismissLatestTipBanner() {
    if (cachedFeedPosts[0]) localStorage.setItem('fitlog_dismissed_tip_id', cachedFeedPosts[0].id);
    document.getElementById('latest-lab-tip-banner').classList.add('hidden');
}

function openLabFeedModal() {
    const readIds = new Set(JSON.parse(localStorage.getItem('fitlog_read_feed_ids') || '[]'));
    cachedFeedPosts.forEach(p => readIds.add(p.id));
    localStorage.setItem('fitlog_read_feed_ids', JSON.stringify([...readIds]));
    const badge = document.getElementById('feed-unread-badge');
    if (badge) { badge.style.display = 'none'; badge.classList.add('hidden'); }

    const listEl = document.getElementById('lab-feed-modal-list');
    if (cachedFeedPosts.length === 0) {
        listEl.innerHTML = `<div class="text-center py-8 text-xs text-zinc-500">Zatiaľ žiadne príspevky v MM LAB Feede.</div>`;
    } else {
        listEl.innerHTML = cachedFeedPosts.map(p => `
            <div class="subcard-surface p-4 space-y-2.5">
                <div class="flex items-center justify-between gap-2">
                    <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-400/15 text-amber-300">${p.category || 'Tip'}</span>
                    <span class="text-[10px] text-zinc-500">${new Date(p.created_at).toLocaleDateString('sk-SK')}</span>
                </div>
                <h4 class="text-sm font-extrabold text-white">${p.title}</h4>
                <p class="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">${p.body}</p>
                ${p.pros ? `<div class="bg-brand-500/10 border border-brand-500/25 rounded-xl p-2.5 text-[11px] text-brand-300"><strong>Plusy:</strong> ${p.pros}</div>` : ''}
                ${p.cons ? `<div class="bg-rose-500/10 border border-rose-500/25 rounded-xl p-2.5 text-[11px] text-rose-300"><strong>Pozor na chyby:</strong> ${p.cons}</div>` : ''}
                <div class="flex items-center justify-between pt-1 border-t border-zinc-800">
                    ${p.video_url ? `<a href="${p.video_url}" target="_blank" rel="noopener" class="text-[11px] font-extrabold text-sky-400 hover:underline">Pozrieť video →</a>` : '<span></span>'}
                    <button type="button" onclick="likeFeedPost('${p.id}')" class="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-dark-900 border border-zinc-800 text-zinc-200">Užitočné (${p.likes_count || 0})</button>
                </div>
            </div>
        `).join('');
    }
    document.getElementById('modal-lab-feed').classList.remove('hidden');
}

async function likeLatestFeedPost() { if (cachedFeedPosts[0]) await likeFeedPost(cachedFeedPosts[0].id); }
async function likeFeedPost(postId) {
    const post = cachedFeedPosts.find(p => p.id === postId);
    if (!post) return;
    const likedSet = new Set(JSON.parse(localStorage.getItem('fitlog_liked_feed_ids') || '[]'));
    if (likedSet.has(postId)) { showToast('Tento tip si už ocenil'); return; }
    likedSet.add(postId);
    localStorage.setItem('fitlog_liked_feed_ids', JSON.stringify([...likedSet]));
    post.likes_count = (post.likes_count || 0) + 1;
    const topLikesEl = document.getElementById('latest-tip-likes');
    if (topLikesEl && cachedFeedPosts[0]?.id === postId) topLikesEl.textContent = post.likes_count;
    if (!document.getElementById('modal-lab-feed').classList.contains('hidden')) openLabFeedModal();
    try {
        await supabaseFetch(`mm_lab_feed?id=eq.${postId}`, {
            method: 'PATCH',
            headers: { 'Prefer': 'return=minimal' },
            body: JSON.stringify({ likes_count: post.likes_count })
        });
    } catch (e) {}
}

// =====================================================================
// TRÉNERSKÝ KOKPIT & SPRÁVA TRÉNEROV / KLIENTOV
// =====================================================================
let cockpitLogsCache = [];
let cockpitTestersCache = [];
let cockpitUserStatesCache = {};
let cockpitActiveTab = 'overview';
let cockpitUserFilter = 'ALL';

async function openAddAccountModal() {
    if (!isSuperAdmin()) return;
    document.getElementById('modal-add-account').classList.remove('hidden');
    if (cockpitTestersCache.length === 0) {
        try {
            const testers = await supabaseFetch('beta_testers?select=code,name,is_active,role,trainer_code&order=name.asc');
            cockpitTestersCache = testers || [];
        } catch (e) {}
    }
    renderAddAccountModalData();
}

function renderAddAccountModalData() {
    const trainers = cockpitTestersCache.filter(t => t.role === 'trainer');
    const trainerSel = document.getElementById('modal-acc-trainer');
    if (trainerSel) {
        trainerSel.innerHTML = `<option value="MIRO-ADMIN">Miro (MIRO-ADMIN)</option>` +
            trainers.map(tr => `<option value="${tr.code}">${tr.name} (${tr.code})</option>`).join('');
    }
    const listEl = document.getElementById('modal-acc-list');
    if (!listEl) return;
    const others = cockpitTestersCache.filter(t => t.code !== 'MIRO-ADMIN');
    if (others.length === 0) {
        listEl.innerHTML = `<div class="text-center py-4 text-xs text-zinc-500">Zatiaľ žiadne ďalšie účty.</div>`;
        return;
    }
    listEl.innerHTML = others.map(acc => {
        const role = (acc.role || 'client').toLowerCase();
        const badge = role === 'trainer'
            ? `<span class="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">TRÉNER</span>`
            : (role === 'solo'
                ? `<span class="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">SOLO</span>`
                : `<span class="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-400">KLIENT</span>`);

        const trainerAssignDropdown = role === 'client' ? `
            <select onchange="reassignClientTrainer('${acc.code}', this.value)" class="bg-dark-900 border border-zinc-700 rounded-lg px-2 py-1 text-[10.5px] font-bold text-amber-300">
                <option value="MIRO-ADMIN" ${(acc.trainer_code || 'MIRO-ADMIN') === 'MIRO-ADMIN' ? 'selected' : ''}>Tréner: Miro</option>
                ${trainers.map(tr => `<option value="${tr.code}" ${acc.trainer_code === tr.code ? 'selected' : ''}>Tréner: ${tr.name}</option>`).join('')}
            </select>
        ` : '';

        return `
            <div class="subcard-surface p-2.5 space-y-2">
                <div class="flex items-center justify-between gap-2">
                    <div class="min-w-0">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <strong class="text-xs text-white">${acc.name}</strong>
                            <span class="text-[10px] text-zinc-400 font-bold">(${acc.code})</span>
                            ${badge}
                        </div>
                    </div>
                    <button type="button" onclick="toggleBetaAccountActive('${acc.code}', ${acc.is_active})" class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold shrink-0 ${acc.is_active ? 'bg-brand-500/20 text-brand-400' : 'bg-rose-500/20 text-rose-300'}">${acc.is_active ? 'Aktívny' : 'Vypnutý'}</button>
                </div>
                ${trainerAssignDropdown ? `<div class="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800"><span class="text-[10px] text-zinc-400">Priradený tréner:</span>${trainerAssignDropdown}</div>` : ''}
            </div>
        `;
    }).join('');
}

async function submitNewBetaAccountFromModal() {
    if (!isSuperAdmin()) return;
    const name = (document.getElementById('modal-acc-name')?.value || '').trim();
    const code = (document.getElementById('modal-acc-code')?.value || '').trim().toUpperCase();
    const role = document.getElementById('modal-acc-role')?.value || 'client';
    const trainerCode = role === 'client' ? (document.getElementById('modal-acc-trainer')?.value || 'MIRO-ADMIN') : null;
    if (!name || !code) { showToast('Zadaj meno aj prístupový kód'); return; }
    try {
        await supabaseFetch('beta_testers', {
            method: 'POST',
            headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
            body: JSON.stringify({ code, name, role, trainer_code: trainerCode, is_active: true })
        });
        document.getElementById('modal-acc-name').value = '';
        document.getElementById('modal-acc-code').value = '';
        await loadCoachCockpitData(false);
        renderAddAccountModalData();
        showToast(`Účet ${name} (${code}) vytvorený ✓`);
    } catch (e) {
        showToast('Chyba zápisu – spusti SQL povolenie v Supabase');
    }
}

async function reassignClientTrainer(clientCode, newTrainerCode) {
    if (!isSuperAdmin()) return;
    try {
        await supabaseFetch(`beta_testers?code=eq.${encodeURIComponent(clientCode)}`, {
            method: 'PATCH',
            headers: { 'Prefer': 'return=minimal' },
            body: JSON.stringify({ trainer_code: newTrainerCode })
        });
        await loadCoachCockpitData(false);
        renderAddAccountModalData();
        showToast(`Klient priradený trénerovi ✓`);
    } catch (e) { showToast('Nepodarilo sa zmeniť trénera'); }
}

async function toggleBetaAccountActive(code, currentActive) {
    if (!isSuperAdmin()) return;
    try {
        await supabaseFetch(`beta_testers?code=eq.${encodeURIComponent(code)}`, {
            method: 'PATCH',
            headers: { 'Prefer': 'return=minimal' },
            body: JSON.stringify({ is_active: !currentActive })
        });
        await loadCoachCockpitData(false);
        renderAddAccountModalData();
        showToast(!currentActive ? `Kód ${code} aktivovaný ✓` : `Kód ${code} vypnutý`);
    } catch (e) { showToast('Chyba zmeny stavu'); }
}

function setCockpitUserFilter(filter) {
    cockpitUserFilter = filter;
    ['ALL', 'MY_CLIENTS', 'TRAINERS', 'SOLO'].forEach(f => {
        const btn = document.getElementById(`cockpit-filter-${f}`);
        if (!btn) return;
        btn.className = f === filter
            ? 'px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold bg-amber-400 text-zinc-950 whitespace-nowrap'
            : 'px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold bg-dark-850 text-zinc-400 border border-zinc-800 whitespace-nowrap';
    });
    populateCockpitClientDropdown();
    renderCoachCockpitContent();
}

let cockpitNutritionDateISO = new Date().toISOString().slice(0, 10);

function shiftCockpitNutritionDate(deltaDays) {
    cockpitNutritionDateISO = getOffsetISO(deltaDays, cockpitNutritionDateISO);
    renderCoachCockpitContent();
}
function setCockpitNutritionDate(dateISO) {
    if (!dateISO) return;
    cockpitNutritionDateISO = dateISO;
    renderCoachCockpitContent();
}

function formatMealIngredientsSummary(meal) {
    if (!meal || !Array.isArray(meal.items) || meal.items.length === 0) return '';
    return meal.items.map(it => {
        const cleanName = (it.name || '').split('(')[0].replace('[EAN]', '').trim();
        const amt = it.unit === 'ks'
            ? `${it.qty} ks (${it.grams} g)`
            : (it.unit === 'ml' ? `${it.qty} ml` : `${it.grams || it.qty} g`);
        return `${cleanName} ${amt}`;
    }).join(' • ');
}

function renderCockpitClientNutritionCard(clientCode, clientName, stateJson, dateISO) {
    const st = stateJson || {};
    const nutri = st.nutritionDataByProfile?.me || {};
    const targets = nutri.targets || { kcal: 2400, p: 160, c: 260, f: 75, water: 2.5 };
    const dayLog = nutri.logsByDate?.[dateISO] || { meals: [], water: 0 };
    const meals = Array.isArray(dayLog.meals) ? dayLog.meals : [];
    const rolling = compute7DayRollingStats(nutri, st.bodyCheckInsByProfile?.me || []);

    let eatenP = 0, eatenC = 0, eatenF = 0;
    meals.forEach(m => {
        eatenP += parseFloat(m.p) || 0;
        eatenC += parseFloat(m.c) || 0;
        eatenF += parseFloat(m.f) || 0;
    });
    const eatenKcal = Math.round(eatenP * 4 + eatenC * 4 + eatenF * 9);
    const todayISO = getTodayISO();
    const dayTag = dateISO === todayISO ? 'Dnes' : (dateISO > todayISO ? 'Plán' : 'História');

    const validSlotIds = new Set(MEAL_SLOTS.map(s => s.id));
    const mealsBySlotHtml = meals.length === 0
        ? `<div class="text-center py-3 text-[11px] text-zinc-500 bg-dark-950/60 rounded-xl border border-dashed border-zinc-800">V tento deň nemá klient zapísané žiadne jedlá.</div>`
        : MEAL_SLOTS.map(slot => {
            const slotItems = meals.filter(m => (validSlotIds.has(m.slot) ? m.slot : 'lunch') === slot.id);
            if (slotItems.length === 0) return '';
            return `
                <div class="space-y-1.5">
                    <div class="text-[10.5px] font-extrabold uppercase tracking-wider text-amber-300 px-0.5">${slot.name}</div>
                    ${slotItems.map(m => {
                        const mkcal = Math.round((parseFloat(m.p) || 0) * 4 + (parseFloat(m.c) || 0) * 4 + (parseFloat(m.f) || 0) * 9);
                        const ingSummary = formatMealIngredientsSummary(m);
                        return `
                            <div class="bg-dark-900/90 border border-zinc-800/90 rounded-xl p-2.5 space-y-1">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="text-xs font-bold text-white leading-snug">${m.name}</div>
                                    <span class="text-[11px] font-extrabold text-brand-400 shrink-0">${mkcal} kcal</span>
                                </div>
                                ${ingSummary ? `<div class="text-[10.5px] text-zinc-300 leading-relaxed">${ingSummary}</div>` : ''}
                                <div class="text-[10px] text-zinc-400">B: <strong class="text-sky-400">${Math.round(m.p || 0)}g</strong> • S: <strong class="text-amber-400">${Math.round(m.c || 0)}g</strong> • T: <strong class="text-rose-400">${Math.round(m.f || 0)}g</strong></div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }).join('');

    return `
        <div class="card-surface p-3.5 space-y-3">
            <div class="flex items-center justify-between gap-2 flex-wrap">
                <div>
                    <span class="text-[10px] font-black uppercase tracking-wider text-brand-400">Aktuálna strava & Ciele</span>
                    <h4 class="text-sm font-extrabold text-white">${clientName} (${clientCode})</h4>
                </div>
                <div class="flex items-center gap-1">
                    <button type="button" onclick="shiftCockpitNutritionDate(-1)" class="w-8 h-8 rounded-lg bg-dark-850 hover:bg-dark-800 border border-zinc-800 text-zinc-200 flex items-center justify-center">${svgIcon('chev-l', 'w-3.5 h-3.5')}</button>
                    <label class="relative cursor-pointer px-2.5 py-1.5 rounded-lg bg-dark-850 border border-zinc-700 text-[11px] font-extrabold text-white flex items-center gap-1.5">
                        <span>${formatNutriDateHuman(dateISO)}</span>
                        <span class="text-[9px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400">${dayTag}</span>
                        <input type="date" value="${dateISO}" onchange="setCockpitNutritionDate(this.value)" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full">
                    </label>
                    <button type="button" onclick="shiftCockpitNutritionDate(1)" class="w-8 h-8 rounded-lg bg-dark-850 hover:bg-dark-800 border border-zinc-800 text-zinc-200 flex items-center justify-center">${svgIcon('chev-r', 'w-3.5 h-3.5')}</button>
                </div>
            </div>

            <div class="subcard-surface p-2.5 space-y-2">
                <div class="flex items-center justify-between text-[11px] flex-wrap gap-1">
                    <span>Príjem vs. Aktuálny cieľ: <strong class="text-white">${eatenKcal} / ${targets.kcal} kcal</strong></span>
                    <span class="text-sky-300 font-bold">7d priemer: ${rolling.avgKcal7 !== null ? rolling.avgKcal7 + ' kcal (B: ' + rolling.avgProt7 + 'g)' : '—'}</span>
                </div>
                <div class="grid grid-cols-4 gap-1.5 text-center text-[10.5px]">
                    <div class="bg-dark-900 p-1.5 rounded-lg"><span class="text-sky-400 block text-[9px]">Bielkoviny</span><strong>${Math.round(eatenP)} / ${targets.p}g</strong></div>
                    <div class="bg-dark-900 p-1.5 rounded-lg"><span class="text-amber-400 block text-[9px]">Sacharidy</span><strong>${Math.round(eatenC)} / ${targets.c}g</strong></div>
                    <div class="bg-dark-900 p-1.5 rounded-lg"><span class="text-rose-400 block text-[9px]">Tuky</span><strong>${Math.round(eatenF)} / ${targets.f}g</strong></div>
                    <div class="bg-dark-900 p-1.5 rounded-lg"><span class="text-sky-300 block text-[9px]">Voda</span><strong>${(dayLog.water || 0).toFixed(1)} / ${targets.water}L</strong></div>
                </div>
            </div>

            <div class="space-y-2.5">${mealsBySlotHtml}</div>
        </div>
    `;
}

function setCoachCockpitTab(tab) {
    cockpitActiveTab = tab;
    if (activeDomain === 'cockpit') renderDynamicBottomNav('cockpit', tab);
    renderCoachCockpitContent();
}

function getVisibleTestersForCoach() {
    const myCode = (currentTesterSession?.code || '').toUpperCase();
    return cockpitTestersCache.filter(t => {
        if (t.code === myCode) return false;
        if (!isSuperAdmin()) return (t.trainer_code || '').toUpperCase() === myCode;
        const role = (t.role || 'client').toLowerCase();
        if (cockpitUserFilter === 'MY_CLIENTS') return role === 'client' && (t.trainer_code || 'MIRO-ADMIN').toUpperCase() === 'MIRO-ADMIN';
        if (cockpitUserFilter === 'TRAINERS') return role === 'trainer';
        if (cockpitUserFilter === 'SOLO') return role === 'solo';
        return true;
    });
}

function populateCockpitClientDropdown() {
    const sel = document.getElementById('cockpit-client-select');
    if (!sel) return;
    const prevVal = sel.value;
    const visible = getVisibleTestersForCoach();
    sel.innerHTML = `<option value="ALL">Všetci zobrazení ľudia (${visible.length})</option>` +
        visible.map(t => {
            const roleTag = (t.role === 'solo') ? '[SOLO]' : (t.role === 'trainer' ? '[TRÉNER]' : '[KLIENT]');
            return `<option value="${t.code}">${t.name} ${roleTag} (${t.code})</option>`;
        }).join('');
    if ([...sel.options].some(o => o.value === prevVal)) sel.value = prevVal;
}

async function loadCoachCockpitData(showNotify = false) {
    const body = document.getElementById('coach-cockpit-body');
    if (body && cockpitTestersCache.length === 0) body.innerHTML = `<div class="text-center py-8 text-xs text-zinc-400">Načítavam dáta zo servera...</div>`;
    try {
        const [testers, logs, states] = await Promise.all([
            supabaseFetch('beta_testers?select=code,name,is_active,role,trainer_code&order=name.asc'),
            supabaseFetch('tester_logs?select=id,tester_code,log_type,payload,created_at&order=created_at.desc&limit=300'),
            supabaseFetch('user_state?select=tester_code,state_json,updated_at').catch(() => [])
        ]);
        cockpitTestersCache = testers || [];
        cockpitLogsCache = logs || [];
        cockpitUserStatesCache = {};
        (states || []).forEach(st => { cockpitUserStatesCache[st.tester_code] = st; });

        populateCockpitClientDropdown();
        renderCoachCockpitContent();
        if (showNotify) showToast('Dáta aktualizované ✓');
    } catch (e) {
        if (body) body.innerHTML = `<div class="bg-rose-500/15 border border-rose-500/40 rounded-2xl p-4 text-xs text-rose-200">Nepodarilo sa načítať dáta zo servera.</div>`;
    }
}

function buildSimpleSvgLineChart(points, strokeColor = '#10b981', unit = '') {
    if (!points || points.length < 2) {
        return `<div class="text-[11px] text-zinc-500 text-center py-4">Pre krivku sú potrebné aspoň 2 záznamy.</div>`;
    }
    const vals = points.map(p => parseFloat(p.val));
    const maxV = Math.max(...vals), minV = Math.min(...vals);
    const span = Math.max(0.5, maxV - minV);
    const wSvg = 280, hSvg = 92, pad = 16;
    const coords = points.map((p, i) => {
        const x = pad + (i / (points.length - 1)) * (wSvg - pad * 2);
        const y = hSvg - pad - ((parseFloat(p.val) - minV) / span) * (hSvg - pad * 2);
        return { x: x.toFixed(1), y: y.toFixed(1), val: p.val };
    });
    const poly = coords.map(c => `${c.x},${c.y}`).join(' ');
    return `<svg viewBox="0 0 ${wSvg} ${hSvg}" class="w-full h-24"><polyline fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" points="${poly}" />${coords.map(c => `<circle cx="${c.x}" cy="${c.y}" r="3.2" fill="#fbbf24" /><text x="${c.x}" y="${Math.max(10, parseFloat(c.y) - 6)}" fill="#e4e4e7" font-size="8" font-weight="bold" text-anchor="middle">${c.val}${unit}</text>`).join('')}</svg>`;
}

function openClientExerciseProgressInCockpit(clientCode, exerciseName) {
    const st = cockpitUserStatesCache[clientCode]?.state_json;
    const stateWorkouts = Array.isArray(st?.workoutHistory) ? [...st.workoutHistory].reverse() : [];
    const logWorkouts = cockpitLogsCache.filter(l => l.tester_code === clientCode && l.log_type === 'workout_completed').reverse().map(l => l.payload || {});
    const sourceWorkouts = stateWorkouts.length > 0 ? stateWorkouts : logWorkouts;

    const points = [];
    let best1RM = 0;
    const rowsHtml = [];

    sourceWorkouts.forEach(w => {
        const found = (w.exercises || []).find(e => e.name === exerciseName);
        if (!found) return;
        let maxW = 0;
        const setsSummary = (found.sets || []).map(s => {
            const weight = parseFloat(s.weight) || 0;
            const reps = parseInt(s.reps) || 1;
            if (weight > maxW) maxW = weight;
            if (s.mode !== 'time' && weight > 0) best1RM = Math.max(best1RM, Math.round(weight * (1 + reps / 30)));
            return `${s.weight ? s.weight + 'kg' : 'BW'}×${s.mode === 'time' ? formatDuration(s.duration) : s.reps + 'x'} (RIR ${s.rir})`;
        }).join(' | ');
        if (maxW > 0) points.push({ date: w.date || '', val: maxW });
        rowsHtml.unshift(`<div class="bg-dark-900 border border-zinc-800 rounded-xl p-2 text-[11px]"><div class="font-bold text-brand-400">${w.date || ''}</div><div class="text-zinc-300 mt-0.5">${setsSummary}</div></div>`);
    });

    document.getElementById('ex-detail-cat').textContent = `Progres klienta (${clientCode})`;
    document.getElementById('ex-detail-title').textContent = exerciseName;
    document.getElementById('ex-detail-guide').innerHTML = `<div>Vývoj maximálnej váhy, počtu opakovaní a rezervy <strong>RIR</strong> v čase.</div>`;
    document.getElementById('ex-detail-1rm-badge').textContent = best1RM > 0 ? `Odhad 1RM: ${best1RM} kg` : 'Bez váhového záznamu';
    document.getElementById('ex-detail-chart').innerHTML = buildSimpleSvgLineChart(points, '#10b981', 'kg');
    document.getElementById('ex-detail-history-rows').innerHTML = rowsHtml.join('');
    document.getElementById('modal-exercise-detail').classList.remove('hidden');
}

function renderCoachCockpitContent() {
    const body = document.getElementById('coach-cockpit-body');
    if (!body) return;
    const visibleUsers = getVisibleTestersForCoach();
    const visibleCodes = new Set(visibleUsers.map(u => u.code));
    const selectedCode = document.getElementById('cockpit-client-select')?.value || 'ALL';

    if (cockpitActiveTab === 'publish') {
        const myCode = (currentTesterSession?.code || '').toUpperCase();
        const allFeedbacks = cockpitLogsCache.filter(l => {
            if (l.log_type === 'feedback_tech' || l.log_type === 'coaching_inquiry') return isSuperAdmin();
            if (l.log_type === 'feedback_trainer' || l.log_type === 'feedback') {
                if (isSuperAdmin()) return true;
                return (l.payload?.trainerCode || '').toUpperCase() === myCode || visibleCodes.has(l.tester_code);
            }
            return false;
        });

        body.innerHTML = `
            ${isSuperAdmin() ? `
                <div class="card-surface p-3.5 space-y-2.5">
                    <div class="text-xs font-extrabold text-amber-300">Publikovať tip / oznam do MM LAB Feedu</div>
                    <div class="grid grid-cols-2 gap-2">
                        <select id="pub-feed-cat" class="bg-dark-850 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs font-bold text-white">
                            <option value="Technika & Cvik">Technika & Cvik</option>
                            <option value="Doplnok výživy">Doplnok výživy</option>
                            <option value="Strava & Makrá">Strava & Makrá</option>
                            <option value="Oznam MM LAB">Oznam MM LAB</option>
                        </select>
                        <select id="pub-feed-audience" class="bg-dark-850 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs font-bold text-white">
                            <option value="ALL">Všetkým používateľom</option>
                            <option value="CLIENTS">Len mojim klientom</option>
                            <option value="SOLO">Len solo používateľom</option>
                        </select>
                    </div>
                    <input type="text" id="pub-feed-title" placeholder="Nadpis (napr. Prečo zaradiť bulharský drep?)" class="w-full bg-dark-850 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white">
                    <textarea id="pub-feed-body" rows="2" placeholder="Text príspevku..." class="w-full bg-dark-850 border border-zinc-800 rounded-xl p-2.5 text-xs text-white"></textarea>
                    <div class="grid grid-cols-2 gap-2">
                        <input type="text" id="pub-feed-pros" placeholder="Plusy (voliteľné)" class="bg-dark-850 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-white">
                        <input type="text" id="pub-feed-cons" placeholder="Pozor na chyby (voliteľné)" class="bg-dark-850 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-white">
                    </div>
                    <input type="url" id="pub-feed-video" placeholder="Odkaz na video / Reels (voliteľné)" class="w-full bg-dark-850 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white">
                    <button type="button" onclick="publishNewLabFeedPost()" class="w-full py-2.5 rounded-xl bg-amber-400 text-zinc-950 font-extrabold text-xs">Publikovať príspevok ✓</button>
                </div>

                <div class="card-surface p-3 flex items-center justify-between gap-2">
                    <div>
                        <div class="text-xs font-extrabold text-sky-300">Verzia aplikácie (v${APP_VERSION})</div>
                        <div class="text-[10.5px] text-zinc-400">Upozorní všetkých na novú verziu</div>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <input type="text" id="admin-new-ver-input" value="${APP_VERSION}" class="w-16 bg-dark-850 border border-zinc-700 rounded-lg px-2 py-1.5 text-center text-xs font-bold text-white">
                        <button type="button" onclick="pushAppVersionSignal()" class="px-3 py-1.5 rounded-lg bg-sky-500 text-zinc-950 font-extrabold text-xs">Vydať</button>
                    </div>
                </div>
            ` : ''}

            <div class="text-xs font-extrabold text-white pt-1">Prijaté správy (${allFeedbacks.length})</div>
            ${allFeedbacks.length === 0 ? `<div class="text-center py-6 text-xs text-zinc-500">Zatiaľ žiadne správy.</div>` : allFeedbacks.map(f => {
                const p = f.payload || {};
                const isTech = f.log_type === 'feedback_tech';
                const isInquiry = f.log_type === 'coaching_inquiry';
                const badge = isInquiry ? 'DOPYT NA COACHING' : (isTech ? 'TECHNICKÁ PODPORA' : 'TRÉNEROVI');
                return `
                    <div class="card-surface p-3.5 space-y-1.5">
                        <div class="flex items-center justify-between gap-2">
                            <span class="text-[10px] font-black px-2 py-0.5 rounded bg-dark-850 text-amber-300">${badge} • ${p.testerName || f.tester_code}</span>
                            <span class="text-[10px] text-zinc-500">${new Date(f.created_at).toLocaleDateString('sk-SK')}</span>
                        </div>
                        <p class="text-xs text-zinc-200 leading-relaxed">${p.message || ''}</p>
                        ${p.device ? `<div class="text-[10px] text-zinc-500">${p.device}</div>` : ''}
                    </div>
                `;
            }).join('')}
        `;
        return;
    }

    if (cockpitActiveTab === 'overview') {
        if (selectedCode === 'ALL') {
            if (visibleUsers.length === 0) {
                body.innerHTML = `<div class="text-center py-8 text-xs text-zinc-500">V tejto skupine zatiaľ nie sú žiadni používatelia.</div>`;
                return;
            }
            body.innerHTML = visibleUsers.map(u => {
                const st = cockpitUserStatesCache[u.code]?.state_json || {};
                const bio = st.biometricsByProfile?.me || {};
                const targets = st.nutritionDataByProfile?.me?.targets || {};
                const wCount = (st.workoutHistory || []).length;
                const lastSync = cockpitUserStatesCache[u.code]?.updated_at ? new Date(cockpitUserStatesCache[u.code].updated_at).toLocaleDateString('sk-SK') : '—';
                const roleBadge = u.role === 'trainer'
                    ? `<span class="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">TRÉNER</span>`
                    : (u.role === 'solo'
                        ? `<span class="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">SOLO</span>`
                        : `<span class="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-400">Tréner: ${u.trainer_code || 'MIRO'}</span>`);
                return `
                    <div onclick="document.getElementById('cockpit-client-select').value='${u.code}'; renderCoachCockpitContent();" class="cursor-pointer card-surface hover:border-zinc-700 p-3.5 space-y-2.5 transition">
                        <div class="flex items-center justify-between gap-2">
                            <div class="flex items-center gap-1.5 flex-wrap min-w-0">
                                <span class="text-xs font-extrabold text-white">${u.name}</span>
                                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-dark-850 text-zinc-400">${u.code}</span>
                                ${roleBadge}
                            </div>
                            <span class="text-[11px] font-extrabold text-brand-400 shrink-0">Otvoriť ${svgIcon('arr-r', 'w-3.5 h-3.5 inline')}</span>
                        </div>
                        <div class="grid grid-cols-4 gap-1.5 text-center text-[10.5px]">
                            <div class="subcard-surface p-1.5"><span class="text-zinc-500 block text-[9px]">Vek / Výška</span><strong class="text-zinc-200">${bio.age || '—'}r / ${bio.height || '—'}cm</strong></div>
                            <div class="subcard-surface p-1.5"><span class="text-zinc-500 block text-[9px]">Váha</span><strong class="text-white">${bio.weight || '—'} kg</strong></div>
                            <div class="subcard-surface p-1.5"><span class="text-zinc-500 block text-[9px]">Cieľ Kcal</span><strong class="text-amber-400">${targets.kcal || '—'}</strong></div>
                            <div class="subcard-surface p-1.5"><span class="text-zinc-500 block text-[9px]">Tréningy</span><strong class="text-brand-400">${wCount}× (${lastSync})</strong></div>
                        </div>
                    </div>
                `;
            }).join('');
            return;
        }

        const userObj = cockpitTestersCache.find(u => u.code === selectedCode) || { name: selectedCode, code: selectedCode };
        const st = cockpitUserStatesCache[selectedCode]?.state_json || {};
        const bio = st.biometricsByProfile?.me || {};
        const rawDailyCis = st.bodyCheckInsByProfile?.me || [];
        const rollingClient = compute7DayRollingStats(st.nutritionDataByProfile?.me, rawDailyCis);
        const dailyCis = [...rawDailyCis].reverse();
        const weightPoints = dailyCis.filter(c => c.weight).slice(-10).map(c => ({ date: c.date, val: c.weight }));
        const energyPoints = dailyCis.slice(-10).map(c => ({ date: c.date, val: c.energy }));
        const wHist = st.workoutHistory || [];
        const uniqueExercises = [...new Set(wHist.flatMap(w => (w.exercises || []).map(e => e.name)))];

        body.innerHTML = `
            <div class="card-surface p-3.5 space-y-2.5">
                <div class="flex items-center justify-between gap-2">
                    <div>
                        <h4 class="text-sm font-black text-white">${userObj.name} (${userObj.code})</h4>
                        <p class="text-[11px] text-zinc-400">Vek: <strong class="text-white">${bio.age || '—'} r</strong> • Výška: <strong class="text-white">${bio.height || '—'} cm</strong> • Váha (7d priem.): <strong class="text-brand-400">${rollingClient.avgW7 !== null ? rollingClient.avgW7 + ' kg' : (bio.weight || '—') + ' kg'}</strong></p>
                    </div>
                    <button type="button" onclick="openTrainingReminderModal('${userObj.code}')" class="px-2.5 py-1.5 rounded-xl bg-sky-500 text-zinc-950 font-extrabold text-[11px] shrink-0">Do kalendára</button>
                </div>
                ${bio.notes ? `<div class="text-[11px] text-amber-300 subcard-surface px-2.5 py-1.5">Poznámka: ${bio.notes}</div>` : ''}
            </div>

            ${renderCockpitClientNutritionCard(userObj.code, userObj.name, st, cockpitNutritionDateISO)}

            <div class="card-surface p-3.5 space-y-2">
                <div class="text-xs font-extrabold text-white">Vývoj rannej váhy (kg)</div>
                <div class="bg-dark-950 rounded-xl p-2 border border-zinc-800">${buildSimpleSvgLineChart(weightPoints, '#10b981', 'kg')}</div>
            </div>

            <div class="card-surface p-3.5 space-y-2">
                <div class="text-xs font-extrabold text-amber-300">Vývoj energie (1 – 10)</div>
                <div class="bg-dark-950 rounded-xl p-2 border border-zinc-800">${buildSimpleSvgLineChart(energyPoints, '#fbbf24', '')}</div>
            </div>

            <div class="card-surface p-3.5 space-y-2">
                <div class="text-xs font-extrabold text-sky-300">Progres konkrétneho cviku (klikni pre graf + RIR)</div>
                ${uniqueExercises.length === 0 ? `<div class="text-[11px] text-zinc-500">Zatiaľ bez zaznamenaných cvikov.</div>` : `
                    <div class="flex flex-wrap gap-1.5">
                        ${uniqueExercises.map(exName => `<button type="button" onclick="openClientExerciseProgressInCockpit('${selectedCode}', '${exName.replace(/'/g, '&#39;')}')" class="px-2.5 py-1.5 rounded-xl bg-dark-850 hover:bg-dark-800 border border-zinc-800 text-xs font-bold text-white">${exName}</button>`).join('')}
                    </div>
                `}
            </div>
        `;
        return;
    }

    const filteredLogs = cockpitLogsCache.filter(l => (selectedCode === 'ALL' ? visibleCodes.has(l.tester_code) : l.tester_code === selectedCode));

    if (cockpitActiveTab === 'workouts') {
        const workouts = filteredLogs.filter(l => l.log_type === 'workout_completed');
        if (workouts.length === 0) { body.innerHTML = `<div class="text-center py-8 text-xs text-zinc-500">Zatiaľ žiadne odtrénované tréningy.</div>`; return; }
        body.innerHTML = workouts.map(w => {
            const p = w.payload || {};
            const exList = p.exercises || [];
            return `<div class="card-surface p-3.5 space-y-2"><div class="flex items-start justify-between gap-2"><div><span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-brand-500/15 text-brand-400">${p.testerName || w.tester_code}</span><h4 class="text-sm font-extrabold text-white mt-1">${p.title || 'Tréning'}</h4></div><div class="text-right text-[10.5px] text-zinc-400"><div>${p.date || ''}</div><div class="text-amber-400 font-bold">${formatVolumeKg(p.totalVolume || 0)}</div></div></div><div class="space-y-1.5">${exList.map(ex => `<div onclick="openClientExerciseProgressInCockpit('${w.tester_code}', '${ex.name.replace(/'/g, '&#39;')}')" class="cursor-pointer subcard-surface p-2 flex items-center justify-between gap-2"><div class="min-w-0"><div class="text-xs font-bold text-white truncate">${ex.name}</div><div class="text-[10.5px] text-zinc-400 truncate">${(ex.sets || []).map(s => `${s.weight ? s.weight + 'kg' : 'BW'}×${s.mode === 'time' ? formatDuration(s.duration) : s.reps + 'x'} (RIR ${s.rir})`).join(' | ')}</div>${ex.note ? `<div class="text-[10px] text-amber-300 mt-0.5 truncate">Poznámka: ${ex.note}</div>` : ''}</div><span class="text-[10px] font-extrabold text-sky-400 shrink-0">Graf</span></div>`).join('')}</div></div>`;
        }).join('');
    } else if (cockpitActiveTab === 'logs') {
        const checkinsOnly = filteredLogs.filter(l => ['morning_checkin', 'weekly_checkin'].includes(l.log_type));
        let nutritionHtml = '';
        if (selectedCode !== 'ALL') {
            const userObj = cockpitTestersCache.find(u => u.code === selectedCode) || { name: selectedCode, code: selectedCode };
            const st = cockpitUserStatesCache[selectedCode]?.state_json || {};
            nutritionHtml = renderCockpitClientNutritionCard(userObj.code, userObj.name, st, cockpitNutritionDateISO);
        } else {
            const activeFoodUsers = visibleUsers.filter(u => {
                const meals = cockpitUserStatesCache[u.code]?.state_json?.nutritionDataByProfile?.me?.logsByDate?.[cockpitNutritionDateISO]?.meals || [];
                return meals.length > 0;
            });
            nutritionHtml = `
                <div class="card-surface p-3 flex items-center justify-between gap-2">
                    <span class="text-xs font-extrabold text-white">Strava klientov za deň</span>
                    <div class="flex items-center gap-1">
                        <button type="button" onclick="shiftCockpitNutritionDate(-1)" class="w-8 h-8 rounded-lg bg-dark-850 border border-zinc-800 text-zinc-200 flex items-center justify-center">${svgIcon('chev-l', 'w-3.5 h-3.5')}</button>
                        <span class="text-[11px] font-extrabold text-brand-400 px-2">${formatNutriDateHuman(cockpitNutritionDateISO)}</span>
                        <button type="button" onclick="shiftCockpitNutritionDate(1)" class="w-8 h-8 rounded-lg bg-dark-850 border border-zinc-800 text-zinc-200 flex items-center justify-center">${svgIcon('chev-r', 'w-3.5 h-3.5')}</button>
                    </div>
                </div>
                ${activeFoodUsers.length === 0
                    ? `<div class="text-center py-5 text-xs text-zinc-500 card-surface border-dashed">V tento deň nemá žiadny zobrazený klient zapísané jedlá.</div>`
                    : activeFoodUsers.map(u => renderCockpitClientNutritionCard(u.code, u.name, cockpitUserStatesCache[u.code]?.state_json || {}, cockpitNutritionDateISO)).join('')}
            `;
        }

        const checkinsHtml = checkinsOnly.length === 0
            ? `<div class="text-center py-6 text-xs text-zinc-500 card-surface border-dashed">Zatiaľ žiadne check-iny.</div>`
            : checkinsOnly.map(item => {
                const p = item.payload || {};
                const isWeekly = item.log_type === 'weekly_checkin';
                return `<div class="card-surface p-3.5 space-y-1.5"><div class="flex items-center justify-between"><span class="text-xs font-extrabold ${isWeekly ? 'text-brand-400' : 'text-amber-300'}">${isWeekly ? 'Týždenný Check-in' : 'Ranný dotazník'} • ${p.testerName || item.tester_code}</span><span class="text-[11px] text-zinc-400">${p.date || ''}</span></div><div class="text-[11px] text-zinc-300">Váha: <strong>${p.weight || '—'} kg</strong> ${isWeekly ? `| Pás: <strong>${p.waist || '—'} cm</strong>` : ''} • Energia: <strong>${p.energy}/10</strong> • Spánok: <strong>${p.sleep}/10</strong></div>${p.note ? `<div class="text-xs text-zinc-200 subcard-surface p-2">${p.note}</div>` : ''}</div>`;
            }).join('');

        body.innerHTML = `
            ${nutritionHtml}
            <div class="text-xs font-extrabold text-white pt-1">Check-iny & Ranné dotazníky (${checkinsOnly.length})</div>
            ${checkinsHtml}
        `;
    }
}

async function publishNewLabFeedPost() {
    if (!isSuperAdmin()) return;
    const category = document.getElementById('pub-feed-cat').value;
    const target_audience = document.getElementById('pub-feed-audience').value;
    const title = document.getElementById('pub-feed-title').value.trim();
    const bodyText = document.getElementById('pub-feed-body').value.trim();
    const pros = document.getElementById('pub-feed-pros').value.trim();
    const cons = document.getElementById('pub-feed-cons').value.trim();
    const video_url = document.getElementById('pub-feed-video').value.trim();
    if (!title || !bodyText) { showToast('Zadaj nadpis aj text'); return; }
    try {
        await supabaseFetch('mm_lab_feed', {
            method: 'POST',
            headers: { 'Prefer': 'return=minimal' },
            body: JSON.stringify({ category, title, body: bodyText, pros: pros || null, cons: cons || null, video_url: video_url || null, target_audience })
        });
        document.getElementById('pub-feed-title').value = '';
        document.getElementById('pub-feed-body').value = '';
        document.getElementById('pub-feed-pros').value = '';
        document.getElementById('pub-feed-cons').value = '';
        document.getElementById('pub-feed-video').value = '';
        fetchLabFeedPosts();
        showToast('Príspevok publikovaný ✓');
    } catch (e) { showToast('Nepodarilo sa publikovať'); }
}

async function pushAppVersionSignal() {
    if (!isSuperAdmin()) return;
    const ver = (document.getElementById('admin-new-ver-input')?.value || '').trim();
    if (!ver) return;
    try {
        await supabaseFetch('app_config', {
            method: 'POST',
            headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
            body: JSON.stringify({ key: 'latest_version', value: ver, updated_at: new Date().toISOString() })
        });
        showToast(`Verzia ${ver} aktivovaná ✓`);
    } catch (e) { showToast('Chyba ukladania verzie'); }
}

// =====================================================================
// PLÁNOVANIE TRÉNINGOV DO KALENDÁRA
// =====================================================================
let latestScheduledWorkout = null;
async function openTrainingReminderModal(preselectClientCode = null) {
    const splitSel = document.getElementById('tr-rem-split-select');
    splitSel.innerHTML = savedSplits.map(s => `<option value="${s.id}">${s.name}</option>`).join('') + `<option value="CUSTOM">Vlastný tréning</option>`;
    document.getElementById('tr-rem-date').value = getTodayISO();

    const clientWrapper = document.getElementById('tr-rem-client-wrapper');
    const clientSel = document.getElementById('tr-rem-client-select');
    if (isTrainerOrAdmin()) {
        clientWrapper.classList.remove('hidden');
        clientSel.innerHTML = `<option value="SELF">Len pre seba</option>`;
        try {
            const testers = await supabaseFetch('beta_testers?is_active=eq.true&select=code,name,trainer_code');
            const myCode = (currentTesterSession?.code || '').toUpperCase();
            (testers || []).forEach(t => {
                if (t.code === myCode) return;
                if (isSuperAdmin() || (t.trainer_code || '').toUpperCase() === myCode) {
                    const opt = document.createElement('option');
                    opt.value = t.code;
                    opt.textContent = `Klient: ${t.name} (${t.code})`;
                    clientSel.appendChild(opt);
                }
            });
            if (preselectClientCode) clientSel.value = preselectClientCode;
        } catch (e) {}
    } else {
        clientWrapper.classList.add('hidden');
    }
    document.getElementById('modal-training-reminder').classList.remove('hidden');
}

function generateSingleCalendarICS(title, dateISO, timeHHMM, durationMin, descriptionText) {
    const compactDate = dateISO.replace(/-/g, '');
    const [hh, mm] = (timeHHMM || '17:00').split(':').map(x => parseInt(x, 10) || 0);
    const startStr = `${compactDate}T${hh < 10 ? '0' : ''}${hh}${mm < 10 ? '0' : ''}${mm}00`;
    const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const cleanDesc = (descriptionText || '').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,');
    const cleanSummary = title.replace(/,/g, '\\,');
    const ics = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MM LAB//Workout Calendar//SK', 'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT', `UID:mmlab-workout-${Date.now()}@miromedofit.lab`, `DTSTAMP:${dtStamp}`,
        `DTSTART:${startStr}`, `DURATION:PT${Math.max(15, parseInt(durationMin) || 60)}M`,
        `SUMMARY:${cleanSummary}`, `DESCRIPTION:${cleanDesc}`,
        'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', `DESCRIPTION:${cleanSummary}`, 'END:VALARM',
        'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `MM_LAB_Trening_${compactDate}.ics`; a.click();
    URL.revokeObjectURL(url);
}

async function confirmScheduleTrainingReminder() {
    const splitId = document.getElementById('tr-rem-split-select').value;
    const dateISO = document.getElementById('tr-rem-date').value || getTodayISO();
    const timeHHMM = document.getElementById('tr-rem-time').value || '17:00';
    const durationMin = parseInt(document.getElementById('tr-rem-duration').value) || 60;
    const note = document.getElementById('tr-rem-note').value.trim();
    const targetClient = isTrainerOrAdmin() ? (document.getElementById('tr-rem-client-select').value || 'SELF') : 'SELF';

    const splitObj = savedSplits.find(s => s.id === splitId);
    const title = splitObj ? splitObj.name : (document.getElementById('workout-title').value || 'Tréning MM LAB');
    const exSummary = splitObj
        ? splitObj.blocks.map((b, i) => `${i + 1}. ${exercises.find(x => x.id === b.exerciseId)?.name || ''} (${b.sets}×)`).join('\n')
        : 'Tréning v aplikácii MM LAB';
    const fullDesc = `${note ? note + '\n\n' : ''}Cviky:\n${exSummary}`;

    if (targetClient === 'SELF') {
        generateSingleCalendarICS(`MM LAB: ${title}`, dateISO, timeHHMM, durationMin, fullDesc);
        document.getElementById('modal-training-reminder').classList.add('hidden');
        showToast('Tréning uložený do Kalendára ✓');
    } else {
        try {
            await supabaseFetch('tester_logs', {
                method: 'POST',
                headers: { 'Prefer': 'return=minimal' },
                body: JSON.stringify({
                    tester_code: currentTesterSession.code,
                    log_type: 'scheduled_workout',
                    payload: { targetCode: targetClient, title, dateISO, timeHHMM, durationMin, note, splitSnapshot: splitObj ? JSON.parse(JSON.stringify(splitObj)) : null, description: fullDesc }
                })
            });
            document.getElementById('modal-training-reminder').classList.add('hidden');
            showToast(`Tréning naplánovaný pre ${targetClient} ✓`);
        } catch (e) { showToast('Nepodarilo sa odoslať pozvánku'); }
    }
}

async function fetchScheduledWorkouts() {
    if (!currentTesterSession?.code) return;
    try {
        const rows = await supabaseFetch('tester_logs?log_type=eq.scheduled_workout&select=id,payload,created_at&order=created_at.desc&limit=10');
        const myCode = currentTesterSession.code.toUpperCase();
        const mine = (rows || []).find(r => (r.payload?.targetCode || '').toUpperCase() === myCode);
        if (!mine) return;
        latestScheduledWorkout = mine.payload;
        document.getElementById('sched-w-title').textContent = mine.payload.title;
        document.getElementById('sched-w-meta').textContent = `${mine.payload.dateISO} o ${mine.payload.timeHHMM} (${mine.payload.durationMin} min)${mine.payload.note ? ' • ' + mine.payload.note : ''}`;
        document.getElementById('scheduled-workout-banner').classList.remove('hidden');
    } catch (e) {}
}

function downloadLatestScheduledWorkoutICS() {
    if (!latestScheduledWorkout) return;
    generateSingleCalendarICS(`MM LAB: ${latestScheduledWorkout.title}`, latestScheduledWorkout.dateISO, latestScheduledWorkout.timeHHMM, latestScheduledWorkout.durationMin, latestScheduledWorkout.description);
    showToast('Udalosť stiahnutá ✓');
}

function startLatestScheduledWorkoutNow() {
    if (!latestScheduledWorkout?.splitSnapshot) { switchTab('splits'); return; }
    const sp = JSON.parse(JSON.stringify(latestScheduledWorkout.splitSnapshot));
    sp.id = 'split-sched-' + Date.now();
    savedSplits.unshift(sp); saveState(); startWorkoutFromSplit(sp.id);
}

// =====================================================================
// ODOSIELANIE JEDÁLNIČKOV & MAKIER OD TRÉNERA KLIENTOM
// =====================================================================
let cachedSharedMealPlans = [];
async function openSendMealPlanModal() {
    if (!isTrainerOrAdmin()) return;
    const targets = getProfileNutrition().targets;
    document.getElementById('send-mp-p').value = targets.p;
    document.getElementById('send-mp-c').value = targets.c;
    document.getElementById('send-mp-f').value = targets.f;
    document.getElementById('send-mp-water').value = targets.water;
    document.getElementById('send-mp-presets-count').textContent = mealPresets.length;
    const sel = document.getElementById('send-mp-target-select');
    sel.innerHTML = `<option value="ALL">Všetkým mojim klientom</option>`;
    document.getElementById('modal-send-mealplan').classList.remove('hidden');
    try {
        const testers = await supabaseFetch('beta_testers?is_active=eq.true&select=code,name,trainer_code');
        const myCode = (currentTesterSession?.code || '').toUpperCase();
        (testers || []).forEach(t => {
            if (t.code === myCode) return;
            if (isSuperAdmin() || (t.trainer_code || '').toUpperCase() === myCode) {
                const opt = document.createElement('option');
                opt.value = t.code;
                opt.textContent = `${t.name} (${t.code})`;
                sel.appendChild(opt);
            }
        });
    } catch (e) {}
}

async function confirmSendMealPlanToClients() {
    if (!isTrainerOrAdmin()) return;
    const targetCode = document.getElementById('send-mp-target-select').value || 'ALL';
    const title = document.getElementById('send-mp-title').value.trim() || 'Jedálniček od trénera';
    const p = parseInt(document.getElementById('send-mp-p').value) || 160;
    const c = parseInt(document.getElementById('send-mp-c').value) || 250;
    const f = parseInt(document.getElementById('send-mp-f').value) || 70;
    const water = parseFloat(document.getElementById('send-mp-water').value) || 2.5;
    const kcal = Math.round(p * 4 + c * 4 + f * 9);
    const includePresets = document.getElementById('send-mp-include-presets').checked;
    const note = document.getElementById('send-mp-note').value.trim();

    const btn = document.getElementById('send-mp-confirm-btn');
    btn.disabled = true; btn.textContent = 'Odosielam...';
    try {
        await supabaseFetch('tester_logs', {
            method: 'POST',
            headers: { 'Prefer': 'return=minimal' },
            body: JSON.stringify({
                tester_code: currentTesterSession.code,
                log_type: 'shared_mealplan',
                payload: { targetCode, trainerCode: currentTesterSession.code, title, note, targets: { kcal, p, c, f, water }, presets: includePresets ? mealPresets.slice(0, 8) : [] }
            })
        });
        document.getElementById('modal-send-mealplan').classList.add('hidden');
        showToast('Jedálniček odoslaný ✓');
    } catch (e) { showToast('Nepodarilo sa odoslať'); }
    finally { btn.disabled = false; btn.textContent = 'Odoslať jedálniček ✓'; }
}

async function fetchSharedTrainerMealPlans(notifyIfEmpty = false) {
    if (!currentTesterSession?.code) return;
    const box = document.getElementById('shared-trainer-mealplans-box');
    const listEl = document.getElementById('shared-trainer-mealplans-list');
    if (!box || !listEl) return;
    try {
        const rows = await supabaseFetch('tester_logs?log_type=eq.shared_mealplan&select=id,payload,created_at&order=created_at.desc&limit=10');
        const myCode = currentTesterSession.code.toUpperCase();
        const myTrainer = (currentTesterSession.trainer_code || '').toUpperCase();
        const matching = (rows || []).filter(r => {
            const target = (r.payload?.targetCode || 'ALL').toUpperCase();
            const sender = (r.payload?.trainerCode || 'MIRO-ADMIN').toUpperCase();
            if (target === myCode) return true;
            if (target === 'ALL' && !isSoloUser() && sender === myTrainer) return true;
            return false;
        });
        cachedSharedMealPlans = matching;
        if (matching.length === 0) { box.classList.add('hidden'); if (notifyIfEmpty) showToast('Žiadny nový jedálniček'); return; }
        box.classList.remove('hidden');
        listEl.innerHTML = matching.map((item, idx) => {
            const pl = item.payload || {};
            const t = pl.targets || {};
            return `<div class="subcard-surface p-2.5 flex items-center justify-between gap-2"><div class="min-w-0"><div class="text-xs font-extrabold text-white truncate">${pl.title || 'Jedálniček'}</div><div class="text-[10px] text-zinc-400 truncate">${t.kcal || 0} kcal • B:${t.p}g S:${t.c}g T:${t.f}g ${pl.note ? `• ${pl.note}` : ''}</div></div><button type="button" onclick="applySharedTrainerMealPlan(${idx})" class="px-2.5 py-1.5 rounded-lg bg-amber-400 text-zinc-950 font-extrabold text-[11px] shrink-0">Nastaviť</button></div>`;
        }).join('');
    } catch (e) {}
}

function applySharedTrainerMealPlan(idx) {
    const pl = cachedSharedMealPlans[idx]?.payload;
    if (!pl || !pl.targets) return;
    getProfileNutrition().targets = { ...pl.targets };
    if (Array.isArray(pl.presets) && pl.presets.length > 0) {
        const existingNames = new Set(mealPresets.map(m => m.name));
        pl.presets.forEach(pr => {
            if (!existingNames.has(pr.name)) mealPresets.unshift({ ...pr, id: 'mp-tr-' + Date.now() + Math.random().toString(16).slice(2, 5) });
        });
    }
    saveState(); renderNutritionFoodView(); showToast(`Jedálniček aktivovaný ✓`);
}





function openEduModal(topicKey) {
    const topic = EDU_TOPICS[topicKey];
    if (!topic) return;
    document.getElementById('edu-modal-title').textContent = topic.title;
    document.getElementById('edu-modal-body').textContent = topic.body;
    document.getElementById('modal-edu').classList.remove('hidden');
}





function getExerciseTechniqueSteps(exName) {
    const n = exName.toLowerCase();
    if (n.includes('drep') || n.includes('squat')) {
        return ['<strong>1. Postoj:</strong> Chodidlá na šírku ramien, špičky mierne vytočené von, spevni brucho.', '<strong>2. Pohyb:</strong> Sadaj zadkom dozadu a dole, kolená v línii špičiek.', '<strong>3. Chyba:</strong> Nepadaj kolenami dovnútra a nezdvíhaj päty.'];
    }
    if (n.includes('plank')) {
        return ['<strong>1. Poloha:</strong> Lakte pod ramenami, telo v jednej priamke.', '<strong>2. Pohyb:</strong> Stiahni zadok, brucho a stehná, dýchaj nosom.', '<strong>3. Chyba:</strong> Neprehýbaj sa v krížoch.'];
    }
    return ['<strong>1. Príprava:</strong> Stabilná poloha, spevnený stred tela.', '<strong>2. Pohyb:</strong> Kontrolovaná cesta dole (2 s), plynulý záber hore.', '<strong>3. Chyba:</strong> Nepomáhaj si švihom trupu.'];
}















let communityFoods = JSON.parse(localStorage.getItem('fitlog_community_foods') || '[]');
function getAllFoodsList() { return [...communityFoods, ...BASE_FOOD_DATABASE]; }

let storedExercises = JSON.parse(localStorage.getItem('fitlog_exercises')) || [];
if (storedExercises.length === 0) storedExercises = [...DEFAULT_EXERCISES];
else {
    const existingIds = new Set(storedExercises.map(e => e.id));
    DEFAULT_EXERCISES.forEach(defEx => { if (!existingIds.has(defEx.id)) storedExercises.push(defEx); });
}
let exercises = storedExercises;
let activeWorkout = JSON.parse(localStorage.getItem('fitlog_active_workout')) || [];
let workoutHistory = JSON.parse(localStorage.getItem('fitlog_history')) || [];
let storedSplits = JSON.parse(localStorage.getItem('fitlog_splits')) || [];
if (storedSplits.length === 0) storedSplits = [...DEFAULT_SPLITS];
else {
    const existingSplitIds = new Set(storedSplits.map(s => s.id));
    DEFAULT_SPLITS.forEach(defSp => { if (!existingSplitIds.has(defSp.id)) storedSplits.push(defSp); });
}
let savedSplits = storedSplits;

let storedSupplements = JSON.parse(localStorage.getItem('fitlog_supplements')) || [];
if (storedSupplements.length === 0) storedSupplements = [...DEFAULT_SUPPLEMENTS];
else {
    const existingSuppIds = new Set(storedSupplements.map(s => s.id));
    DEFAULT_SUPPLEMENTS.forEach(defSupp => { if (!existingSuppIds.has(defSupp.id)) storedSupplements.push(defSupp); });
}
let supplements = storedSupplements;
let userSupplementStacks = JSON.parse(localStorage.getItem('fitlog_user_supp_stacks')) || {};
let suppTakenByDate = JSON.parse(localStorage.getItem('fitlog_supp_taken_by_date')) || {};
let profiles = JSON.parse(localStorage.getItem('fitlog_profiles')) || [{ id: 'me', name: 'Môj profil', role: 'trainer' }];
let activeProfileId = localStorage.getItem('fitlog_active_profile') || 'me';
let nutritionDataByProfile = JSON.parse(localStorage.getItem('fitlog_nutrition_by_profile')) || {};

let storedMealPresets = JSON.parse(localStorage.getItem('fitlog_meal_presets')) || [];
let mealPresets = storedMealPresets.filter(m => !LEGACY_DEFAULT_PRESET_IDS.has(m.id));

let bodyCheckInsByProfile = JSON.parse(localStorage.getItem('fitlog_body_checkins')) || {};
let weeklyCheckInsByProfile = JSON.parse(localStorage.getItem('fitlog_weekly_checkins')) || {};
let biometricsByProfile = JSON.parse(localStorage.getItem('fitlog_biometrics_by_profile')) || {};
let preWorkoutReadiness = JSON.parse(localStorage.getItem('fitlog_pre_readiness')) || { energy: 8, sleep: 8, rhr: '', hrv: '' };
let editingHistoryId = localStorage.getItem('fitlog_editing_history_id') || null;
let activeBodyCheckInMode = 'daily';

let activeDomain = 'training';
let activeNutriSubTab = 'food';
let activeSuppSubTab = 'mystack';
let selectedCategory = 'all';
let selectedSuppCategory = 'all';
let expandedExerciseIndex = parseInt(localStorage.getItem('fitlog_expanded_idx')) || 0;
let workoutStartTime = localStorage.getItem('fitlog_workout_start') ? parseInt(localStorage.getItem('fitlog_workout_start')) : null;
let workoutTimerInterval = null;
let restTimerInterval = null;
let restTimerRemaining = 0;
let liveCountdownState = { exIdx: null, setIdx: null, remaining: 0, paused: false, interval: null };
let editingTimeTarget = { exIndex: null, setIndex: null };
let builderMode = 'single';
let draftSplitBlocks = [];
let expandedSuppSlots = { morning_empty: true };

function getActiveProfile() { return profiles.find(p => p.id === activeProfileId) || profiles[0]; }
function updateHeaderProfileUI() {
    const prof = getActiveProfile();
    const nameEl = document.getElementById('header-profile-name');
    const dotEl = document.getElementById('header-profile-dot');
    if (nameEl) nameEl.textContent = prof.name;
    if (dotEl) dotEl.className = `w-2 h-2 rounded-full shrink-0 ${prof.id === 'me' ? 'bg-brand-400' : 'bg-amber-400'}`;
}

function saveState(triggerCloud = true) {
    localStorage.setItem('fitlog_exercises', JSON.stringify(exercises));
    localStorage.setItem('fitlog_active_workout', JSON.stringify(activeWorkout));
    localStorage.setItem('fitlog_history', JSON.stringify(workoutHistory));
    localStorage.setItem('fitlog_splits', JSON.stringify(savedSplits));
    localStorage.setItem('fitlog_supplements', JSON.stringify(supplements));
    localStorage.setItem('fitlog_user_supp_stacks', JSON.stringify(userSupplementStacks));
    localStorage.setItem('fitlog_supp_taken_by_date', JSON.stringify(suppTakenByDate));
    localStorage.setItem('fitlog_profiles', JSON.stringify(profiles));
    localStorage.setItem('fitlog_active_profile', activeProfileId);
    localStorage.setItem('fitlog_expanded_idx', expandedExerciseIndex.toString());
    localStorage.setItem('fitlog_nutrition_by_profile', JSON.stringify(nutritionDataByProfile));
    localStorage.setItem('fitlog_meal_presets', JSON.stringify(mealPresets));
    localStorage.setItem('fitlog_body_checkins', JSON.stringify(bodyCheckInsByProfile));
    localStorage.setItem('fitlog_weekly_checkins', JSON.stringify(weeklyCheckInsByProfile));
    localStorage.setItem('fitlog_biometrics_by_profile', JSON.stringify(biometricsByProfile));
    localStorage.setItem('fitlog_pre_readiness', JSON.stringify(preWorkoutReadiness));
    localStorage.setItem('fitlog_community_foods', JSON.stringify(communityFoods));
    localStorage.setItem('fitlog_local_updated_at', Date.now().toString());
    if (editingHistoryId) localStorage.setItem('fitlog_editing_history_id', editingHistoryId);
    else localStorage.removeItem('fitlog_editing_history_id');
    if (triggerCloud) scheduleCloudStateSync();
}

// =====================================================================
// BIOMETRIA & PREDPRÍPRAVA
// =====================================================================
function initBiometricsUI() {
    const bio = biometricsByProfile[activeProfileId] || {};
    if (document.getElementById('bio-age')) document.getElementById('bio-age').value = bio.age || '';
    if (document.getElementById('bio-height')) document.getElementById('bio-height').value = bio.height || '';
    if (document.getElementById('bio-weight')) document.getElementById('bio-weight').value = bio.weight || '';
    if (document.getElementById('bio-gender')) document.getElementById('bio-gender').value = bio.gender || 'male';
    if (document.getElementById('bio-goal')) document.getElementById('bio-goal').value = bio.goal || 'maintain';
    if (document.getElementById('bio-notes')) document.getElementById('bio-notes').value = bio.notes || '';
}

function saveBiometricsFromUI() {
    biometricsByProfile[activeProfileId] = {
        age: document.getElementById('bio-age')?.value.trim() || '',
        height: document.getElementById('bio-height')?.value.trim() || '',
        weight: document.getElementById('bio-weight')?.value.trim() || '',
        gender: document.getElementById('bio-gender')?.value || 'male',
        goal: document.getElementById('bio-goal')?.value || 'maintain',
        notes: document.getElementById('bio-notes')?.value.trim() || ''
    };
    saveState();
}

function initPreWorkoutReadinessUI() {
    if (document.getElementById('prep-energy')) document.getElementById('prep-energy').value = preWorkoutReadiness.energy ?? 8;
    if (document.getElementById('prep-sleep')) document.getElementById('prep-sleep').value = preWorkoutReadiness.sleep ?? 8;
    if (document.getElementById('prep-rhr')) document.getElementById('prep-rhr').value = preWorkoutReadiness.rhr || '';
    if (document.getElementById('prep-hrv')) document.getElementById('prep-hrv').value = preWorkoutReadiness.hrv || '';
    refreshReadinessSummaryBadge();
}
function togglePreWorkoutReadiness() {
    const panel = document.getElementById('pre-workout-readiness-panel');
    const arrow = document.getElementById('readiness-toggle-arrow');
    const isHidden = panel.classList.contains('hidden');
    panel.classList.toggle('hidden');
    arrow.innerHTML = isHidden ? 'Skryť ' + svgIcon('chev-u', 'w-3.5 h-3.5 inline') : 'Upraviť ' + svgIcon('chev-d', 'w-3.5 h-3.5 inline');
}
function updatePreWorkoutReadiness() {
    preWorkoutReadiness = {
        energy: parseInt(document.getElementById('prep-energy').value) || 8,
        sleep: parseInt(document.getElementById('prep-sleep').value) || 8,
        rhr: document.getElementById('prep-rhr').value.trim(),
        hrv: document.getElementById('prep-hrv').value.trim()
    };
    saveState(); refreshReadinessSummaryBadge();
}
function refreshReadinessSummaryBadge() {
    const badge = document.getElementById('readiness-summary-badge');
    const tip = document.getElementById('readiness-coaching-tip');
    if (!badge) return;
    const e = preWorkoutReadiness.energy || 8, s = preWorkoutReadiness.sleep || 8;
    badge.textContent = `Energia ${e}/10 • Spánok ${s}/10`;
    if (tip) {
        if (e <= 4 || s <= 4) tip.textContent = 'Nižšia regenerácia – nechaj si väčšiu rezervu (RIR 3–4).';
        else if (e >= 8 && s >= 7) tip.textContent = 'Výborná pripravenosť – ideálny deň na progres (RIR 1–2).';
        else tip.textContent = 'Stabilný stav – drž sa plánovaného rozpisu (RIR 2–3).';
    }
}

// =====================================================================
// HODINKY & ZDRAVIE
// =====================================================================
function openWearablesModal() { document.getElementById('wearable-file-preview').classList.add('hidden'); document.getElementById('modal-wearables').classList.remove('hidden'); }
function closeWearablesModal() { document.getElementById('modal-wearables').classList.add('hidden'); }
function handleWearableFileImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        const parsed = parseWearableFileContent(file.name, String(e.target.result || ''));
        const previewEl = document.getElementById('wearable-file-preview');
        previewEl.classList.remove('hidden');
        previewEl.innerHTML = `<div class="font-extrabold text-brand-400">Načítané: ${file.name}</div><div class="text-zinc-300">Aktivita: <strong>${parsed.title}</strong> • Čas: <strong>${parsed.durationMin} min</strong></div><button type="button" onclick='saveImportedWearableActivity(${JSON.stringify(parsed).replace(/'/g, "&#39;")})' class="w-full py-2 rounded-lg bg-brand-500 text-zinc-950 font-extrabold text-xs">Zapísať do Histórie ✓</button>`;
    };
    reader.readAsText(file);
}
function parseWearableFileContent(fileName, content) {
    let title = fileName.replace(/\.[^.]+$/, ''), durationMin = 45;
    const timeMatches = [...content.matchAll(/<TotalTimeSeconds>([\d.]+)<\/TotalTimeSeconds>/gi)];
    if (timeMatches.length > 0) durationMin = Math.max(1, Math.round(timeMatches.reduce((a, m) => a + parseFloat(m[1]), 0) / 60));
    return { title, durationMin };
}
function saveImportedWearableActivity(parsed) {
    const prof = getActiveProfile();
    const dateStr = new Date().toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric' });
    workoutHistory.unshift({ id: 'wearable-' + Date.now(), profileId: prof.id, profileName: prof.name, title: parsed.title, date: dateStr, durationMin: parsed.durationMin || 45, totalVolume: 0, exercises: [] });
    saveState(); renderHistory(); closeWearablesModal(); showToast('Aktivita uložená ✓');
}
function parseAndApplyWearableText() {
    const raw = (document.getElementById('wearable-smart-paste').value || '').trim();
    if (!raw) return;
    const extractNum = (regex) => { const m = raw.match(regex); return m ? m[1] : ''; };
    const steps = extractNum(/(?:kroky|steps)[^\d]*(\d+)/i);
    const rhr = extractNum(/(?:tep|rhr|pulse|bpm)[^\d]*(\d+)/i);
    const hrv = extractNum(/(?:hrv)[^\d]*(\d+)/i);
    const sleep = extractNum(/(?:spánok|spanok|sleep)[^\d]*(\d+)/i);
    if (sleep) preWorkoutReadiness.sleep = Math.min(10, Math.max(1, parseInt(sleep, 10)));
    if (rhr) preWorkoutReadiness.rhr = rhr;
    if (hrv) preWorkoutReadiness.hrv = hrv;
    initPreWorkoutReadinessUI();
    const dateStr = new Date().toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (!bodyCheckInsByProfile[activeProfileId]) bodyCheckInsByProfile[activeProfileId] = [];
    bodyCheckInsByProfile[activeProfileId].unshift({ id: 'ci-smart-' + Date.now(), isoDate: getTodayISO(), date: dateStr, dayType: 'training', weight: '', waist: '', steps: steps || '', rhr: rhr || '', sleep: preWorkoutReadiness.sleep || 8, fatigue: 7, energy: preWorkoutReadiness.energy || 8, strength: 8, hunger: 6 });
    saveState(); document.getElementById('wearable-smart-paste').value = ''; closeWearablesModal(); showToast('Údaje zapísané ✓');
}
function copyAppleShortcutRecipe() {
    copyTextToClipboard(`iOS Skratka pre MM LAB:\n1. Skratky -> '+' -> 'Nájsť vzorky zdravia' (Kroky, Kľudový tep, HRV)\n2. 'Text': Kroky: [Kroky], Tep: [Tep], HRV: [HRV]\n3. 'Kopírovať do schránky' -> Vlož do MM LAB.`, 'Návod skopírovaný!');
}
function exportWorkoutToTCX(workoutId) {
    const w = workoutHistory.find(x => x.id === workoutId);
    if (!w) return;
    const isoStart = new Date().toISOString();
    const durSec = Math.max(300, (w.durationMin || 45) * 60);
    const tcx = `<?xml version="1.0" encoding="UTF-8"?>\n<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"><Activities><Activity Sport="Other"><Id>${isoStart}</Id><Lap StartTime="${isoStart}"><TotalTimeSeconds>${durSec}</TotalTimeSeconds><DistanceMeters>0</DistanceMeters><Calories>${Math.round((w.durationMin || 45) * 7.5)}</Calories><Intensity>Active</Intensity><TriggerMethod>Manual</TriggerMethod></Lap></Activity></Activities></TrainingCenterDatabase>`;
    const blob = new Blob([tcx], { type: 'application/vnd.garmin.tcx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `MM_LAB_${w.date.replace(/\./g, '-')}.tcx`; a.click();
    URL.revokeObjectURL(url); showToast('Súbor .TCX stiahnutý ✓');
}

function playBeepTone(freq = 880, duration = 0.4, doubleBeep = false) {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        const trigger = (startTime, f, dur) => {
            const osc = ctx.createOscillator(), gain = ctx.createGain();
            osc.type = 'sine'; osc.frequency.setValueAtTime(f, startTime);
            gain.gain.setValueAtTime(0.28, startTime); gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
            osc.connect(gain); gain.connect(ctx.destination); osc.start(startTime); osc.stop(startTime + dur);
        };
        trigger(ctx.currentTime, freq, duration);
        if (doubleBeep) { trigger(ctx.currentTime + 0.22, freq * 1.25, duration); if (navigator.vibrate) navigator.vibrate([250, 100, 300]); }
        else if (navigator.vibrate) navigator.vibrate(90);
    } catch (e) {}
}

// =====================================================================
// PAUZOVAČ, ODPOČET, ROZOHRIATIE & DETAIL CVIKU
// =====================================================================
function startRestTimer(seconds = 90) {
    restTimerRemaining = seconds;
    document.getElementById('floating-rest-timer').classList.remove('hidden');
    updateRestTimerDisplay();
    if (restTimerInterval) clearInterval(restTimerInterval);
    restTimerInterval = setInterval(() => {
        restTimerRemaining--;
        if (restTimerRemaining <= 0) { stopRestTimer(); playBeepTone(980, 0.35, true); showToast('Pauza skončila'); }
        else { if (restTimerRemaining <= 3) playBeepTone(620, 0.14, false); updateRestTimerDisplay(); }
    }, 1000);
}
function adjustRestTimer(deltaSec) { restTimerRemaining = Math.max(5, restTimerRemaining + deltaSec); updateRestTimerDisplay(); }
function stopRestTimer() { if (restTimerInterval) clearInterval(restTimerInterval); restTimerInterval = null; document.getElementById('floating-rest-timer').classList.add('hidden'); }
function updateRestTimerDisplay() {
    const m = Math.floor(restTimerRemaining / 60), s = restTimerRemaining % 60;
    document.getElementById('rest-timer-value').textContent = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

function startLiveSetCountdown(exIdx, setIdx) {
    const ex = activeWorkout[exIdx], set = ex?.sets[setIdx];
    if (!set) return;
    if (liveCountdownState.interval) clearInterval(liveCountdownState.interval);
    liveCountdownState = { exIdx, setIdx, remaining: parseInt(set.duration) || 30, paused: false, interval: null };
    document.getElementById('countdown-ex-name').textContent = ex.name;
    document.getElementById('countdown-set-label').textContent = `Séria ${setIdx + 1} • Cieľ: ${formatDuration(set.duration)}`;
    document.getElementById('countdown-toggle-btn').textContent = 'Pozastaviť';
    updateLiveCountdownUI();
    document.getElementById('modal-live-countdown').classList.remove('hidden');
    liveCountdownState.interval = setInterval(() => {
        if (liveCountdownState.paused) return;
        liveCountdownState.remaining--;
        if (liveCountdownState.remaining <= 0) finishLiveCountdownNow();
        else updateLiveCountdownUI();
    }, 1000);
}
function updateLiveCountdownUI() {
    const m = Math.floor(liveCountdownState.remaining / 60), s = liveCountdownState.remaining % 60;
    document.getElementById('countdown-big-time').textContent = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}
function toggleLiveCountdownPause() {
    liveCountdownState.paused = !liveCountdownState.paused;
    document.getElementById('countdown-toggle-btn').textContent = liveCountdownState.paused ? 'Pokračovať' : 'Pozastaviť';
}
function finishLiveCountdownNow() {
    if (liveCountdownState.interval) clearInterval(liveCountdownState.interval);
    const { exIdx, setIdx } = liveCountdownState;
    document.getElementById('modal-live-countdown').classList.add('hidden');
    playBeepTone(980, 0.35, true);
    if (exIdx !== null && setIdx !== null && activeWorkout[exIdx]?.sets[setIdx]) {
        activeWorkout[exIdx].sets[setIdx].completed = true;
        saveState(); renderActiveWorkout(); startRestTimer(60); showToast('Séria splnená ✓');
    }
}
function closeLiveCountdown() { if (liveCountdownState.interval) clearInterval(liveCountdownState.interval); document.getElementById('modal-live-countdown').classList.add('hidden'); }

function openWarmupModal(suggestedWeight) {
    document.getElementById('warmup-target-weight').value = parseFloat(suggestedWeight) || 60;
    recalcWarmupSets();
    document.getElementById('modal-warmup').classList.remove('hidden');
}
function recalcWarmupSets() {
    const target = parseFloat(document.getElementById('warmup-target-weight').value) || 0;
    const out = document.getElementById('warmup-sets-output');
    if (target <= 20) { out.innerHTML = `<div class="text-xs text-zinc-300 subcard-surface p-3">Stačí 1–2 série s prázdnou tyčou.</div>`; return; }
    const r25 = val => Math.max(5, Math.round(val / 2.5) * 2.5);
    out.innerHTML = `
        <div class="subcard-surface p-2.5 flex justify-between text-xs"><span class="text-zinc-400">1. Séria (45 %):</span><strong class="text-white">${r25(target * 0.45)} kg × 8–10</strong></div>
        <div class="subcard-surface p-2.5 flex justify-between text-xs"><span class="text-zinc-400">2. Séria (65 %):</span><strong class="text-white">${r25(target * 0.65)} kg × 4–5</strong></div>
        <div class="subcard-surface p-2.5 flex justify-between text-xs"><span class="text-zinc-400">3. Séria (85 %):</span><strong class="text-brand-400">${r25(target * 0.85)} kg × 1–2</strong></div>
    `;
}

function openExerciseDetailModal(exerciseId) {
    const ex = exercises.find(e => e.id === exerciseId);
    if (!ex) return;
    const catObj = CATEGORIES.find(c => c.id === ex.category);
    document.getElementById('ex-detail-cat').textContent = catObj ? catObj.name : '';
    document.getElementById('ex-detail-title').textContent = ex.name;
    document.getElementById('ex-detail-guide').innerHTML = getExerciseTechniqueSteps(ex.name).map(s => `<div>${s}</div>`).join('');

    const points = [];
    let best1RM = 0;
    const historyRows = [];
    [...workoutHistory].reverse().forEach(w => {
        if ((w.profileId || 'me') !== activeProfileId) return;
        const found = (w.exercises || []).find(item => item.exerciseId === exerciseId);
        if (!found) return;
        let maxVal = 0;
        const setsSummary = (found.sets || []).map(s => {
            const weight = parseFloat(s.weight) || 0;
            const reps = parseInt(s.reps) || 1;
            if (weight > maxVal) maxVal = weight;
            if (s.mode !== 'time' && weight > 0) best1RM = Math.max(best1RM, Math.round(weight * (1 + reps / 30)));
            return `${s.weight ? s.weight + 'kg' : 'BW'}×${s.mode === 'time' ? formatDuration(s.duration) : s.reps + 'x'} (RIR ${s.rir})`;
        }).join(' | ');
        if (maxVal > 0) points.push({ date: w.date, val: maxVal });
        historyRows.unshift(`<div class="bg-dark-900 border border-zinc-800 rounded-xl p-2 text-[11px]"><div class="font-bold text-brand-400">${w.date}</div><div class="text-zinc-300 mt-0.5">${setsSummary}</div></div>`);
    });

    document.getElementById('ex-detail-1rm-badge').textContent = best1RM > 0 ? `Odhad 1RM: ${best1RM} kg` : 'Bez váhového záznamu';
    document.getElementById('ex-detail-chart').innerHTML = buildSimpleSvgLineChart(points, '#10b981', 'kg');
    document.getElementById('ex-detail-history-rows').innerHTML = historyRows.join('');
    document.getElementById('ex-detail-add-btn').onclick = () => { document.getElementById('modal-exercise-detail').classList.add('hidden'); addExerciseToWorkout(exerciseId); };
    document.getElementById('modal-exercise-detail').classList.remove('hidden');
}

// =====================================================================
// SEKCIA STRAVA & TELO (KALENDÁR, CHODY, KOPÍROVANIE, GRAMÁŽE & INŠPIRÁCIE)
// =====================================================================
function formatLocalISO(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
function getTodayISO() { return formatLocalISO(new Date()); }
function getYesterdayISO() { return getOffsetISO(-1); }
function getOffsetISO(daysDelta, baseISO = null) {
    const base = baseISO ? new Date(baseISO + 'T12:00:00') : new Date();
    base.setDate(base.getDate() + daysDelta);
    return formatLocalISO(base);
}
function formatNutriDateHuman(dateISO) {
    const d = new Date(dateISO + 'T12:00:00');
    return d.toLocaleDateString('sk-SK', { weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric' });
}

let selectedNutritionDateISO = getTodayISO();

function getProfileNutrition(dateISO = selectedNutritionDateISO) {
    if (!nutritionDataByProfile[activeProfileId]) {
        nutritionDataByProfile[activeProfileId] = { targets: { kcal: 2400, p: 160, c: 260, f: 75, water: 2.5 }, logsByDate: {} };
    }
    const targetDay = dateISO || getTodayISO();
    if (!nutritionDataByProfile[activeProfileId].logsByDate[targetDay]) {
        nutritionDataByProfile[activeProfileId].logsByDate[targetDay] = { meals: [], water: 0 };
    }
    return nutritionDataByProfile[activeProfileId];
}

function setNutritionDate(dateISO) {
    if (!dateISO) return;
    selectedNutritionDateISO = dateISO;
    renderNutritionFoodView();
}
function shiftNutritionDate(deltaDays) {
    selectedNutritionDateISO = getOffsetISO(deltaDays, selectedNutritionDateISO);
    renderNutritionFoodView();
}

function syncTodayNutritionToCloud(lastMealName = '') {
    const todayISO = getTodayISO();
    const data = getProfileNutrition(todayISO);
    const todayLog = data.logsByDate[todayISO];
    let totP = 0, totC = 0, totF = 0;
    todayLog.meals.forEach(m => { totP += parseFloat(m.p) || 0; totC += parseFloat(m.c) || 0; totF += parseFloat(m.f) || 0; });
    const kcal = Math.round(totP * 4 + totC * 4 + totF * 9);
    sendCloudTesterLog('nutrition_log', {
        date: new Date().toLocaleDateString('sk-SK'),
        kcal, targetKcal: data.targets.kcal,
        p: Math.round(totP), c: Math.round(totC), f: Math.round(totF),
        water: todayLog.water || 0, mealsCount: todayLog.meals.length, lastMeal: lastMealName
    });
}

function setNutritionSubTab(sub) {
    activeNutriSubTab = sub;
    const foodView = document.getElementById('nutri-view-food');
    const bodyView = document.getElementById('nutri-view-body');
    if (activeDomain === 'nutrition') renderDynamicBottomNav('nutrition', sub);
    if (sub === 'food') {
        foodView.classList.remove('hidden'); bodyView.classList.add('hidden');
        renderNutritionFoodView();
    } else {
        bodyView.classList.remove('hidden'); foodView.classList.add('hidden');
        initBiometricsUI(); renderBodyCheckInView();
    }
}

function renderNutritionSection() { setNutritionSubTab(activeNutriSubTab); }

function renderNutritionFoodView() {
    const todayISO = getTodayISO();
    const activeISO = selectedNutritionDateISO || todayISO;
    const data = getProfileNutrition(activeISO);
    const dayLog = data.logsByDate[activeISO];
    const targets = data.targets;

    const dateLabel = document.getElementById('nutri-date-label');
    const dateBadge = document.getElementById('nutri-date-badge');
    const datePicker = document.getElementById('nutri-date-picker');
    const jumpTodayBtn = document.getElementById('nutri-jump-today-btn');
    const summaryHeading = document.getElementById('nutri-summary-heading');
    if (datePicker) datePicker.value = activeISO;
    if (dateLabel) dateLabel.textContent = formatNutriDateHuman(activeISO);
    if (activeISO === todayISO) {
        if (dateBadge) { dateBadge.textContent = 'Dnes'; dateBadge.className = 'text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 shrink-0'; }
        if (jumpTodayBtn) jumpTodayBtn.classList.add('hidden');
        if (summaryHeading) summaryHeading.textContent = 'Dnešný príjem';
    } else if (activeISO > todayISO) {
        if (dateBadge) { dateBadge.textContent = 'Plán'; dateBadge.className = 'text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 shrink-0'; }
        if (jumpTodayBtn) jumpTodayBtn.classList.remove('hidden');
        if (summaryHeading) summaryHeading.textContent = 'Plánovaný príjem';
    } else {
        if (dateBadge) { dateBadge.textContent = 'História'; dateBadge.className = 'text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 shrink-0'; }
        if (jumpTodayBtn) jumpTodayBtn.classList.remove('hidden');
        if (summaryHeading) summaryHeading.textContent = 'Príjem za deň';
    }

    let totP = 0, totC = 0, totF = 0;
    dayLog.meals.forEach(m => { totP += parseFloat(m.p) || 0; totC += parseFloat(m.c) || 0; totF += parseFloat(m.f) || 0; });
    const totKcal = Math.round(totP * 4 + totC * 4 + totF * 9);
    totP = Math.round(totP); totC = Math.round(totC); totF = Math.round(totF);

    const pct = (cur, tar) => Math.min(100, Math.round((cur / Math.max(1, tar)) * 100));
    document.getElementById('nutri-kcal-current').textContent = totKcal;
    document.getElementById('nutri-kcal-target').textContent = targets.kcal;
    document.getElementById('nutri-kcal-bar').style.width = `${pct(totKcal, targets.kcal)}%`;

    document.getElementById('nutri-p-cur').textContent = totP;
    document.getElementById('nutri-p-tar').textContent = targets.p;
    document.getElementById('nutri-p-bar').style.width = `${pct(totP, targets.p)}%`;

    document.getElementById('nutri-c-cur').textContent = totC;
    document.getElementById('nutri-c-tar').textContent = targets.c;
    document.getElementById('nutri-c-bar').style.width = `${pct(totC, targets.c)}%`;

    document.getElementById('nutri-f-cur').textContent = totF;
    document.getElementById('nutri-f-tar').textContent = targets.f;
    document.getElementById('nutri-f-bar').style.width = `${pct(totF, targets.f)}%`;

    document.getElementById('nutri-water-cur').textContent = (dayLog.water || 0).toFixed(2);
    document.getElementById('nutri-water-tar').textContent = targets.water;

    const presetsCard = document.getElementById('nutri-presets-card');
    if (mealPresets.length === 0) {
        presetsCard.classList.add('hidden');
    } else {
        presetsCard.classList.remove('hidden');
        document.getElementById('nutri-presets-list').innerHTML = mealPresets.map(mp => {
            const mkcal = Math.round(mp.p * 4 + mp.c * 4 + mp.f * 9);
            return `<div class="subcard-surface p-2.5 flex items-center justify-between gap-2"><div class="min-w-0"><div class="text-xs font-bold text-white truncate">${mp.name}</div><div class="text-[10px] text-zinc-400 mt-0.5">${mkcal} kcal • B:${mp.p}g S:${mp.c}g T:${mp.f}g</div></div><div class="flex items-center gap-1.5 shrink-0"><button onclick="addPresetMealToToday('${mp.id}')" class="px-2.5 py-1.5 rounded-lg bg-brand-500 text-zinc-950 text-[11px] font-extrabold">+ Pridať</button><button onclick="deleteUserMealPreset('${mp.id}')" class="p-1 text-zinc-500 hover:text-rose-400">${svgIcon('close', 'w-3.5 h-3.5')}</button></div></div>`;
        }).join('');
    }

    document.getElementById('nutri-meals-count').textContent = `${dayLog.meals.length} jedál`;
    const coursesContainer = document.getElementById('nutri-courses-container');
    const validSlotIds = new Set(MEAL_SLOTS.map(s => s.id));
    const indexedMeals = dayLog.meals.map((m, idx) => ({
        ...m,
        _idx: idx,
        _slot: validSlotIds.has(m.slot) ? m.slot : 'lunch'
    }));

    coursesContainer.innerHTML = MEAL_SLOTS.map(slot => {
        const slotMeals = indexedMeals.filter(m => m._slot === slot.id);
        let sP = 0, sC = 0, sF = 0;
        slotMeals.forEach(m => { sP += parseFloat(m.p) || 0; sC += parseFloat(m.c) || 0; sF += parseFloat(m.f) || 0; });
        const sKcal = Math.round(sP * 4 + sC * 4 + sF * 9);
        const hasMeals = slotMeals.length > 0;

        const mealsRowsHtml = hasMeals ? slotMeals.map(m => {
            const mkcal = Math.round(m.p * 4 + m.c * 4 + m.f * 9);
            const ingSummary = formatMealIngredientsSummary(m);
            return `
                <div class="subcard-surface px-3 py-2.5 space-y-1.5">
                    <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0 flex-1">
                            <div class="text-xs font-bold text-white leading-snug">${m.name}</div>
                            <div class="text-[10px] text-zinc-400 mt-0.5">${mkcal} kcal • B:${Math.round(m.p)}g S:${Math.round(m.c)}g T:${Math.round(m.f)}g</div>
                        </div>
                        <div class="flex items-center gap-1 shrink-0">
                            <button type="button" onclick="editMealFromDay(${m._idx})" title="Zobraziť a upraviť gramáže" class="px-2 py-1 rounded-lg bg-dark-900 hover:bg-dark-800 border border-zinc-800 text-[10px] font-bold text-amber-300">Upraviť</button>
                            <button type="button" onclick="openCopyNutritionModal('meal', '${slot.id}', ${m._idx})" title="Kopírovať toto jedlo do iného dňa" class="px-2 py-1 rounded-lg bg-dark-900 hover:bg-dark-800 border border-zinc-800 text-[10px] font-bold text-sky-300">Kopírovať</button>
                            <button type="button" onclick="removeMealFromToday(${m._idx})" class="p-1.5 text-zinc-500 hover:text-rose-400">${svgIcon('close', 'w-3.5 h-3.5')}</button>
                        </div>
                    </div>
                    ${ingSummary ? `<div class="text-[10.5px] text-zinc-300 bg-dark-950/60 border border-zinc-800/70 rounded-lg px-2.5 py-1.5 leading-relaxed">${ingSummary}</div>` : ''}
                </div>
            `;
        }).join('') : `<div class="text-[11px] text-zinc-500 px-1 py-0.5">Zatiaľ bez jedla</div>`;

        return `
            <div class="card-surface p-3 space-y-2">
                <div class="flex items-center justify-between gap-2">
                    <div class="min-w-0">
                        <div class="text-xs font-extrabold text-white">${slot.name}</div>
                        <div class="text-[10.5px] text-zinc-400">${hasMeals ? `${sKcal} kcal • B:${Math.round(sP)}g S:${Math.round(sC)}g T:${Math.round(sF)}g` : '0 kcal'}</div>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                        ${hasMeals ? `<button type="button" onclick="openCopyNutritionModal('slot', '${slot.id}')" class="px-2 py-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 border border-zinc-800 text-sky-300 text-[10.5px] font-bold">Kopírovať</button>` : ''}
                        <button type="button" onclick="openMealBuilderModal(false, '${slot.id}')" class="px-2.5 py-1.5 rounded-lg bg-brand-500/15 hover:bg-brand-500 text-brand-400 hover:text-zinc-950 border border-brand-500/35 text-[11px] font-extrabold transition">+ Pridať</button>
                    </div>
                </div>
                <div class="space-y-1.5">${mealsRowsHtml}</div>
            </div>
        `;
    }).join('');
}

function deleteUserMealPreset(presetId) {
    mealPresets = mealPresets.filter(m => m.id !== presetId);
    saveState(); renderNutritionFoodView();
}

function copyPreviousDayIntoSelected() {
    const prevISO = getOffsetISO(-1, selectedNutritionDateISO);
    const data = getProfileNutrition(selectedNutritionDateISO);
    const prevMeals = data.logsByDate[prevISO]?.meals || [];
    if (prevMeals.length === 0) { showToast('Predošlý deň nemá žiadne jedlá'); return; }
    const targetMeals = data.logsByDate[selectedNutritionDateISO].meals;
    prevMeals.forEach(m => targetMeals.push(JSON.parse(JSON.stringify(m))));
    saveState(); renderNutritionFoodView();
    if (selectedNutritionDateISO === getTodayISO()) syncTodayNutritionToCloud('Skopírovaný predošlý deň');
    showToast(`Pridaných ${prevMeals.length} jedál ✓`);
}

let copyNutriContext = { mode: 'day', slotId: null, mealIdx: null };

function openCopyNutritionModal(mode, slotId = null, mealIdx = null) {
    const data = getProfileNutrition(selectedNutritionDateISO);
    const dayMeals = data.logsByDate[selectedNutritionDateISO]?.meals || [];
    if (dayMeals.length === 0) { showToast('V tomto dni zatiaľ nie je čo kopírovať'); return; }

    copyNutriContext = { mode, slotId, mealIdx };
    const titleEl = document.getElementById('copy-nutri-modal-title');
    const subEl = document.getElementById('copy-nutri-modal-sub');
    const slotWrap = document.getElementById('copy-nutri-target-slot-wrap');
    const slotSel = document.getElementById('copy-nutri-target-slot');

    if (mode === 'day') {
        titleEl.textContent = 'Kopírovať celý deň';
        subEl.textContent = `Z dňa ${formatNutriDateHuman(selectedNutritionDateISO)} (${dayMeals.length} jedál)`;
        slotWrap.classList.add('hidden');
    } else if (mode === 'slot') {
        const slotName = MEAL_SLOTS.find(s => s.id === slotId)?.name || 'Chod';
        const count = dayMeals.filter(m => (m.slot || 'lunch') === slotId).length;
        titleEl.textContent = `Kopírovať chod: ${slotName}`;
        subEl.textContent = `Z dňa ${formatNutriDateHuman(selectedNutritionDateISO)} (${count} jedál)`;
        slotWrap.classList.remove('hidden');
        slotSel.value = 'SAME';
    } else {
        const meal = dayMeals[mealIdx];
        if (!meal) return;
        titleEl.textContent = 'Kopírovať jedlo';
        subEl.textContent = `${meal.name}`;
        slotWrap.classList.remove('hidden');
        slotSel.value = 'SAME';
    }

    const defaultTarget = selectedNutritionDateISO === getTodayISO() ? getOffsetISO(1) : getTodayISO();
    document.getElementById('copy-nutri-target-date').value = defaultTarget;
    document.getElementById('modal-copy-nutrition').classList.remove('hidden');
}

function setCopyNutriTargetDate(dateISO) {
    const inp = document.getElementById('copy-nutri-target-date');
    if (inp && dateISO) inp.value = dateISO;
}

function confirmCopyNutrition() {
    const targetDateISO = document.getElementById('copy-nutri-target-date')?.value;
    if (!targetDateISO) { showToast('Vyber cieľový dátum'); return; }

    const sourceData = getProfileNutrition(selectedNutritionDateISO);
    const sourceMeals = sourceData.logsByDate[selectedNutritionDateISO]?.meals || [];
    const targetSlotChoice = document.getElementById('copy-nutri-target-slot')?.value || 'SAME';

    let itemsToCopy = [];
    if (copyNutriContext.mode === 'day') {
        itemsToCopy = sourceMeals.map(m => JSON.parse(JSON.stringify(m)));
    } else if (copyNutriContext.mode === 'slot') {
        itemsToCopy = sourceMeals
            .filter(m => (m.slot || 'lunch') === copyNutriContext.slotId)
            .map(m => ({ ...JSON.parse(JSON.stringify(m)), slot: targetSlotChoice === 'SAME' ? (m.slot || copyNutriContext.slotId) : targetSlotChoice }));
    } else if (copyNutriContext.mode === 'meal') {
        const one = sourceMeals[copyNutriContext.mealIdx];
        if (one) {
            itemsToCopy = [{ ...JSON.parse(JSON.stringify(one)), slot: targetSlotChoice === 'SAME' ? (one.slot || 'lunch') : targetSlotChoice }];
        }
    }

    if (itemsToCopy.length === 0) { showToast('Žiadne položky na kopírovanie'); return; }

    const destData = getProfileNutrition(targetDateISO);
    itemsToCopy.forEach(item => destData.logsByDate[targetDateISO].meals.push(item));

    selectedNutritionDateISO = targetDateISO;
    saveState();
    document.getElementById('modal-copy-nutrition').classList.add('hidden');
    renderNutritionFoodView();
    if (targetDateISO === getTodayISO()) syncTodayNutritionToCloud('Skopírované jedlá');
    showToast(`Skopírované do ${formatNutriDateHuman(targetDateISO)} ✓`);
}

function addWater(deltaL) {
    const log = getProfileNutrition(selectedNutritionDateISO).logsByDate[selectedNutritionDateISO];
    log.water = Math.max(0, Math.round(((log.water || 0) + deltaL) * 100) / 100);
    saveState(); renderNutritionFoodView();
}

function addPresetMealToToday(presetId) {
    const mp = mealPresets.find(x => x.id === presetId);
    if (!mp) return;
    getProfileNutrition(selectedNutritionDateISO).logsByDate[selectedNutritionDateISO].meals.push({
        name: mp.name, slot: mp.slot || 'lunch', p: mp.p, c: mp.c, f: mp.f,
        items: Array.isArray(mp.items) ? JSON.parse(JSON.stringify(mp.items)) : []
    });
    saveState(); renderNutritionFoodView();
    if (selectedNutritionDateISO === getTodayISO()) syncTodayNutritionToCloud(mp.name);
    showToast('Jedlo zapísané ✓');
}

function removeMealFromToday(idx) {
    getProfileNutrition(selectedNutritionDateISO).logsByDate[selectedNutritionDateISO].meals.splice(idx, 1);
    saveState(); renderNutritionFoodView();
}

function openMacroCalcModal(mode = 'calc') {
    const targets = getProfileNutrition().targets;
    const bio = biometricsByProfile[activeProfileId] || {};
    if (bio.age) document.getElementById('calc-age').value = bio.age;
    if (bio.height) document.getElementById('calc-height').value = bio.height;
    if (bio.weight) document.getElementById('calc-weight').value = bio.weight;
    if (bio.gender) document.getElementById('calc-gender').value = bio.gender;

    document.getElementById('manual-p').value = targets.p;
    document.getElementById('manual-c').value = targets.c;
    document.getElementById('manual-f').value = targets.f;
    document.getElementById('manual-water').value = targets.water;
    updateManualKcalPreview();
    setMacroModalMode(mode);
    document.getElementById('modal-macro-calc').classList.remove('hidden');
}
function setMacroModalMode(mode) {
    const btns = {
        calc: document.getElementById('macro-mode-calc-btn'),
        manual: document.getElementById('macro-mode-manual-btn'),
        guide: document.getElementById('macro-mode-guide-btn')
    };
    const panels = {
        calc: document.getElementById('macro-panel-calc'),
        manual: document.getElementById('macro-panel-manual'),
        guide: document.getElementById('macro-panel-guide')
    };
    Object.keys(btns).forEach(k => {
        if (!btns[k] || !panels[k]) return;
        if (k === mode) {
            btns[k].className = 'py-2 rounded-lg text-xs font-extrabold bg-brand-500 text-zinc-950 transition';
            panels[k].classList.remove('hidden');
        } else {
            btns[k].className = 'py-2 rounded-lg text-xs font-extrabold text-zinc-400 hover:text-white transition';
            panels[k].classList.add('hidden');
        }
    });
}
function updateManualKcalPreview() {
    const p = parseFloat(document.getElementById('manual-p').value) || 0;
    const c = parseFloat(document.getElementById('manual-c').value) || 0;
    const f = parseFloat(document.getElementById('manual-f').value) || 0;
    document.getElementById('manual-kcal-preview').textContent = `${Math.round(p * 4 + c * 4 + f * 9)} kcal`;
}
function applyManualMacros() {
    const p = Math.max(0, Math.round(parseFloat(document.getElementById('manual-p').value) || 0));
    const c = Math.max(0, Math.round(parseFloat(document.getElementById('manual-c').value) || 0));
    const f = Math.max(0, Math.round(parseFloat(document.getElementById('manual-f').value) || 0));
    const water = Math.max(0.5, Math.round((parseFloat(document.getElementById('manual-water').value) || 2.5) * 10) / 10);
    const kcal = Math.round(p * 4 + c * 4 + f * 9);
    getProfileNutrition().targets = { kcal, p, c, f, water };
    saveState(); document.getElementById('modal-macro-calc').classList.add('hidden'); renderNutritionFoodView(); showToast(`Cieľ: ${kcal} kcal`);
}
function applyCalculatedMacros() {
    const gender = document.getElementById('calc-gender').value;
    const age = parseFloat(document.getElementById('calc-age').value) || 30;
    const height = parseFloat(document.getElementById('calc-height').value) || 175;
    const weight = parseFloat(document.getElementById('calc-weight').value) || 75;
    const activity = parseFloat(document.getElementById('calc-activity').value) || 1.55;
    const goal = document.getElementById('calc-goal').value;

    biometricsByProfile[activeProfileId] = { ...(biometricsByProfile[activeProfileId] || {}), gender, age: String(age), height: String(height), weight: String(weight), goal };
    let bmr = 10 * weight + 6.25 * height - 5 * age + (gender === 'male' ? 5 : -161);
    let tdee = bmr * activity;
    if (goal === 'cut') tdee *= 0.82;
    if (goal === 'bulk') tdee *= 1.12;
    const kcal = Math.round(tdee);
    const p = Math.round(weight * 1.9);
    const f = Math.round(weight * 0.85);
    const c = Math.max(50, Math.round((kcal - p * 4 - f * 9) / 4));
    const water = Math.round(weight * 0.035 * 10) / 10;
    getProfileNutrition().targets = { kcal, p, c, f, water };
    saveState(); document.getElementById('modal-macro-calc').classList.add('hidden'); renderNutritionFoodView(); showToast(`Cieľ: ${kcal} kcal`);
}

// SKLADAČKA JEDLA + SKENER ČIAROVÝCH KÓDOV (EAN) + JEDNOTKY KS / ML / G + ÚPRAVA JEDLA
let selectedFoodCat = 'all', draftMealIngredients = [];
let html5QrScannerInstance = null;
let pendingNewEanCode = '';
let mbActiveUnit = 'g';
let editingMealIndex = null;

async function fetchCommunityFoodCatalog() {
    try {
        const existingUnits = new Map((communityFoods || []).map(f => [f.barcode, f.unit]));
        const rows = await supabaseFetch('food_catalog?select=barcode,name,p_100g,c_100g,f_100g&order=created_at.desc&limit=300');
        if (Array.isArray(rows) && rows.length > 0) {
            communityFoods = rows.map(r => {
                const detectedUnit = existingUnits.get(r.barcode) || (/\(ml\)|mlije|mlieko|kefír|acidko|olej|nápoj|džús/i.test(r.name) ? 'ml' : 'g');
                return {
                    id: `ean-${r.barcode}`, barcode: r.barcode, name: `${r.name} [EAN]`, cat: 'scanned',
                    p: parseFloat(r.p_100g) || 0, c: parseFloat(r.c_100g) || 0, f: parseFloat(r.f_100g) || 0,
                    unit: detectedUnit, unitGrams: 1, defaultQty: 100
                };
            });
            localStorage.setItem('fitlog_community_foods', JSON.stringify(communityFoods));
        }
    } catch (e) {}
}

function openMealBuilderModal(autoStartCamera = false, preselectSlot = null) {
    editingMealIndex = null;
    selectedFoodCat = 'all'; draftMealIngredients = [];
    document.getElementById('mb-meal-title').value = '';
    document.getElementById('ean-manual-input').value = '';
    document.getElementById('ean-status-box').classList.add('hidden');
    document.getElementById('ean-new-product-form').classList.add('hidden');
    document.getElementById('mb-save-as-preset').checked = false;
    const slotSel = document.getElementById('mb-meal-slot');
    if (slotSel) slotSel.value = preselectSlot || 'lunch';
    const subEl = document.getElementById('mb-target-date-subtitle');
    if (subEl) subEl.textContent = `Zápis pre: ${formatNutriDateHuman(selectedNutritionDateISO)}`;
    const searchEl = document.getElementById('mb-food-search');
    if (searchEl) searchEl.value = '';
    fetchCommunityFoodCatalog().then(() => { renderMealBuilderFoodPills(); renderMealBuilderFoodSelect(); });
    renderMealBuilderFoodPills(); renderMealBuilderFoodSelect(); renderMealBuilderIngredients();
    document.getElementById('modal-meal-builder').classList.remove('hidden');
    if (autoStartCamera) setTimeout(() => { toggleBarcodeCameraScanner(); }, 250);
}

function editMealFromDay(mealIdx) {
    const dayLog = getProfileNutrition(selectedNutritionDateISO).logsByDate[selectedNutritionDateISO];
    const meal = dayLog?.meals?.[mealIdx];
    if (!meal) return;
    openMealBuilderModal(false, meal.slot || 'lunch');
    editingMealIndex = mealIdx;
    document.getElementById('mb-meal-title').value = meal.name || '';
    const subEl = document.getElementById('mb-target-date-subtitle');
    if (subEl) subEl.textContent = `Úprava jedla • ${formatNutriDateHuman(selectedNutritionDateISO)}`;
    if (Array.isArray(meal.items) && meal.items.length > 0) {
        draftMealIngredients = JSON.parse(JSON.stringify(meal.items));
    } else {
        draftMealIngredients = [{
            name: meal.name,
            qty: 100,
            unit: 'g',
            unitGrams: 1,
            grams: 100,
            p: parseFloat(meal.p) || 0,
            c: parseFloat(meal.c) || 0,
            f: parseFloat(meal.f) || 0
        }];
    }
    renderMealBuilderIngredients();
}

function closeMealBuilderModal() { editingMealIndex = null; stopBarcodeCameraScanner(); document.getElementById('modal-meal-builder').classList.add('hidden'); }

async function toggleBarcodeCameraScanner() {
    const wrapper = document.getElementById('ean-camera-wrapper');
    if (!wrapper.classList.contains('hidden')) { await stopBarcodeCameraScanner(); return; }
    if (typeof Html5Qrcode === 'undefined') { showToast('Zadaj číslo EAN ručne'); return; }
    wrapper.classList.remove('hidden');
    try {
        html5QrScannerInstance = new Html5Qrcode('ean-qr-reader');
        await html5QrScannerInstance.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 240, height: 120 } },
            async (decodedText) => {
                const cleanEan = decodedText.replace(/\D/g, '');
                if (cleanEan.length >= 8) {
                    playBeepTone(1040, 0.2, false);
                    document.getElementById('ean-manual-input').value = cleanEan;
                    await stopBarcodeCameraScanner();
                    await lookupBarcodeProduct();
                }
            },
            () => {}
        );
    } catch (err) {
        wrapper.classList.add('hidden');
        showToast('Povoľ kameru v prehliadači alebo zadaj EAN ručne');
    }
}

async function stopBarcodeCameraScanner() {
    const wrapper = document.getElementById('ean-camera-wrapper');
    if (wrapper) wrapper.classList.add('hidden');
    if (html5QrScannerInstance) {
        try { await html5QrScannerInstance.stop(); } catch (e) {}
        try { html5QrScannerInstance.clear(); } catch (e) {}
        html5QrScannerInstance = null;
    }
}

async function lookupBarcodeProduct() {
    const ean = (document.getElementById('ean-manual-input').value || '').replace(/\D/g, '').trim();
    const statusBox = document.getElementById('ean-status-box');
    const newForm = document.getElementById('ean-new-product-form');
    if (ean.length < 8) { showToast('Zadaj platný EAN kód (min. 8 číslic)'); return; }

    statusBox.classList.remove('hidden');
    statusBox.className = 'text-xs rounded-xl p-2.5 bg-sky-500/15 border border-sky-500/35 text-sky-300';
    statusBox.textContent = `Hľadám produkt ${ean}...`;
    newForm.classList.add('hidden');

    try {
        const localRows = await supabaseFetch(`food_catalog?barcode=eq.${encodeURIComponent(ean)}&select=barcode,name,p_100g,c_100g,f_100g`).catch(() => []);
        if (localRows && localRows.length > 0) {
            const item = localRows[0];
            addScannedFoodDirectlyToPlate(item.name, parseFloat(item.p_100g) || 0, parseFloat(item.c_100g) || 0, parseFloat(item.f_100g) || 0, ean);
            statusBox.className = 'text-xs rounded-xl p-2.5 bg-brand-500/15 border border-brand-500/40 text-brand-300';
            statusBox.textContent = `Nájdené: ${item.name} (pridané na tanier)`;
            return;
        }

        const offRes = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(ean)}.json`);
        const offData = await offRes.json();
        if (offData && offData.status === 1 && offData.product) {
            const prod = offData.product;
            const nutr = prod.nutriments || {};
            const prodName = (prod.product_name_sk || prod.product_name_cs || prod.product_name || 'Produkt z obchodu').trim();
            const brand = (prod.brands || '').split(',')[0].trim();
            const fullName = brand && !prodName.toLowerCase().includes(brand.toLowerCase()) ? `${brand} – ${prodName}` : prodName;
            const p100 = Math.round((parseFloat(nutr.proteins_100g) || 0) * 10) / 10;
            const c100 = Math.round((parseFloat(nutr.carbohydrates_100g) || 0) * 10) / 10;
            const f100 = Math.round((parseFloat(nutr.fat_100g) || 0) * 10) / 10;

            supabaseFetch('food_catalog', {
                method: 'POST',
                headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
                body: JSON.stringify({ barcode: ean, name: fullName, p_100g: p100, c_100g: c100, f_100g: f100, added_by: currentTesterSession?.code || 'ANON' })
            }).catch(() => {});

            addScannedFoodDirectlyToPlate(fullName, p100, c100, f100, ean);
            statusBox.className = 'text-xs rounded-xl p-2.5 bg-brand-500/15 border border-brand-500/40 text-brand-300';
            statusBox.textContent = `Nájdené: ${fullName} (pridané na tanier)`;
            return;
        }

        pendingNewEanCode = ean;
        document.getElementById('ean-new-code-label').textContent = ean;
        statusBox.classList.add('hidden');
        newForm.classList.remove('hidden');
    } catch (e) {
        pendingNewEanCode = ean;
        document.getElementById('ean-new-code-label').textContent = ean;
        statusBox.classList.add('hidden');
        newForm.classList.remove('hidden');
    }
}

function addScannedFoodDirectlyToPlate(name, p100, c100, f100, ean, unit = 'g') {
    const rawQty = parseFloat(document.getElementById('mb-food-grams').value) || 100;
    const qty = mbActiveUnit === 'ks' ? 100 : rawQty;
    const mult = qty / 100;
    draftMealIngredients.push({ name, qty, unit, unitGrams: 1, grams: qty, p: Math.round(p100 * mult * 10) / 10, c: Math.round(c100 * mult * 10) / 10, f: Math.round(f100 * mult * 10) / 10 });
    if (!communityFoods.some(f => f.barcode === ean)) {
        communityFoods.unshift({ id: `ean-${ean}`, barcode: ean, name: `${name} [EAN]`, cat: 'scanned', p: p100, c: c100, f: f100, unit, unitGrams: 1, defaultQty: 100 });
        saveState(); renderMealBuilderFoodSelect();
    }
    renderMealBuilderIngredients();
}

async function saveNewScannedFoodToCatalog() {
    const name = document.getElementById('ean-new-name').value.trim();
    if (!name || !pendingNewEanCode) { showToast('Zadaj názov produktu'); return; }
    const unit = document.getElementById('ean-new-unit')?.value || 'g';
    const p100 = parseFloat(document.getElementById('ean-new-p').value) || 0;
    const c100 = parseFloat(document.getElementById('ean-new-c').value) || 0;
    const f100 = parseFloat(document.getElementById('ean-new-f').value) || 0;

    try {
        await supabaseFetch('food_catalog', {
            method: 'POST',
            headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
            body: JSON.stringify({ barcode: pendingNewEanCode, name, p_100g: p100, c_100g: c100, f_100g: f100, added_by: currentTesterSession?.code || 'ANON' })
        });
    } catch (e) {}

    addScannedFoodDirectlyToPlate(name, p100, c100, f100, pendingNewEanCode, unit);
    document.getElementById('ean-new-product-form').classList.add('hidden');
    showToast(`Produkt uložený & pridaný ✓`);
}

function renderMealBuilderFoodPills() {
    document.getElementById('mb-food-cat-pills').innerHTML = FOOD_CATEGORIES.map(c => `<button type="button" onclick="selectedFoodCat='${c.id}'; renderMealBuilderFoodPills(); renderMealBuilderFoodSelect();" class="px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${selectedFoodCat === c.id ? 'bg-brand-500 text-zinc-950' : 'bg-dark-900 text-zinc-400 border border-zinc-800'}">${c.name}</button>`).join('');
}
function renderMealBuilderFoodSelect() {
    const q = (document.getElementById('mb-food-search')?.value || '').toLowerCase().trim();
    const allFoods = getAllFoodsList();
    const list = allFoods.filter(f => (selectedFoodCat === 'all' || f.cat === selectedFoodCat) && (!q || f.name.toLowerCase().includes(q)));
    const sel = document.getElementById('mb-food-select');
    if (list.length === 0) { sel.innerHTML = `<option value="">Žiadna potravina sa nenašla</option>`; return; }
    sel.innerHTML = list.map(f => {
        const kcal = Math.round(f.p * 4 + f.c * 4 + f.f * 9);
        const uLabel = f.unit === 'ml' ? '/100ml' : '/100g';
        return `<option value="${f.id}">${f.name} — ${kcal} kcal ${uLabel} (B:${f.p} S:${f.c} T:${f.f})</option>`;
    }).join('');
    onMealBuilderFoodChange();
}
function onMealBuilderFoodChange() {
    const foodId = document.getElementById('mb-food-select')?.value;
    const food = getAllFoodsList().find(f => f.id === foodId);
    const qtyInp = document.getElementById('mb-food-grams');
    if (!food || !qtyInp) return;
    mbActiveUnit = food.unit || 'g';
    qtyInp.value = food.defaultQty || (mbActiveUnit === 'ks' ? 1 : 100);
    renderMealBuilderUnitPills(food);
    updateMealBuilderUnitHint();
}
function setMealBuilderUnit(unit) {
    const foodId = document.getElementById('mb-food-select')?.value;
    const food = getAllFoodsList().find(f => f.id === foodId);
    const qtyInp = document.getElementById('mb-food-grams');
    if (!food || !qtyInp) return;
    const prevUnit = mbActiveUnit;
    const curVal = parseFloat(qtyInp.value) || 0;
    mbActiveUnit = unit;
    if (prevUnit !== unit && food.unitGrams && food.unitGrams > 1) {
        if (unit === 'ks') qtyInp.value = Math.max(0.5, Math.round((curVal / food.unitGrams) * 2) / 2);
        else if (prevUnit === 'ks') qtyInp.value = Math.round(curVal * food.unitGrams);
    }
    renderMealBuilderUnitPills(food);
    updateMealBuilderUnitHint();
}
function renderMealBuilderUnitPills(food) {
    const pillsEl = document.getElementById('mb-unit-pills');
    if (!pillsEl) return;
    let options = ['g', 'ml'];
    if (food?.unit === 'ks') options = ['ks', 'g'];
    else if (food?.unit === 'ml') options = ['ml', 'g'];
    pillsEl.innerHTML = options.map(u => `
        <button type="button" onclick="setMealBuilderUnit('${u}')" class="px-2.5 py-1 rounded-lg text-xs font-extrabold transition ${mbActiveUnit === u ? 'bg-brand-500 text-zinc-950' : 'text-zinc-400 hover:text-white'}">${u}</button>
    `).join('');
}
function updateMealBuilderUnitHint() {
    const hintEl = document.getElementById('mb-unit-hint');
    if (!hintEl) return;
    const foodId = document.getElementById('mb-food-select')?.value;
    const food = getAllFoodsList().find(f => f.id === foodId);
    const qty = parseFloat(document.getElementById('mb-food-grams')?.value) || 0;
    if (!food || qty <= 0) { hintEl.textContent = ''; return; }
    if (mbActiveUnit === 'ks') {
        const g = Math.round(qty * (food.unitGrams || 60));
        hintEl.textContent = `= ${g} g`;
    } else {
        hintEl.textContent = '';
    }
}
function addIngredientToMealBuilder() {
    const foodId = document.getElementById('mb-food-select').value;
    const qty = parseFloat(document.getElementById('mb-food-grams').value) || 0;
    const food = getAllFoodsList().find(f => f.id === foodId);
    if (!food || qty <= 0) return;
    const unitGrams = food.unitGrams || 1;
    const grams = mbActiveUnit === 'ks' ? Math.round(qty * unitGrams) : qty;
    const mult = grams / 100;
    draftMealIngredients.push({
        name: food.name,
        qty,
        unit: mbActiveUnit,
        unitGrams,
        grams,
        p: Math.round(food.p * mult * 10) / 10,
        c: Math.round(food.c * mult * 10) / 10,
        f: Math.round(food.f * mult * 10) / 10
    });
    renderMealBuilderIngredients();
}
function removeIngredientFromMealBuilder(idx) { draftMealIngredients.splice(idx, 1); renderMealBuilderIngredients(); }
function updateDraftIngredientQty(idx, newQtyRaw) {
    const item = draftMealIngredients[idx];
    if (!item) return;
    const newQty = Math.max(0.5, parseFloat(newQtyRaw) || 0);
    if (newQty <= 0) return;
    const oldGrams = Math.max(1, item.grams || 100);
    const newGrams = item.unit === 'ks' ? Math.round(newQty * (item.unitGrams || Math.round(oldGrams / Math.max(0.5, item.qty || 1)))) : Math.round(newQty);
    const ratio = newGrams / oldGrams;
    item.qty = newQty;
    item.grams = newGrams;
    item.p = Math.round(item.p * ratio * 10) / 10;
    item.c = Math.round(item.c * ratio * 10) / 10;
    item.f = Math.round(item.f * ratio * 10) / 10;
    renderMealBuilderIngredients();
}
function scaleDraftMealToUserGoal() {
    if (draftMealIngredients.length === 0) return;
    const data = getProfileNutrition(selectedNutritionDateISO);
    const targetDayKcal = data.targets?.kcal || 2400;
    const slot = document.getElementById('mb-meal-slot')?.value || 'lunch';
    const slotShares = { breakfast: 0.25, snack1: 0.12, lunch: 0.33, snack2: 0.12, dinner: 0.28 };
    const desiredKcal = Math.round(targetDayKcal * (slotShares[slot] || 0.28));

    let curP = 0, curC = 0, curF = 0;
    draftMealIngredients.forEach(i => { curP += i.p; curC += i.c; curF += i.f; });
    const curKcal = curP * 4 + curC * 4 + curF * 9;
    if (curKcal <= 0) return;

    const factor = Math.max(0.35, Math.min(2.8, desiredKcal / curKcal));
    draftMealIngredients.forEach(item => {
        const newQty = item.unit === 'ks'
            ? Math.max(0.5, Math.round(item.qty * factor * 2) / 2)
            : Math.max(5, Math.round((item.qty * factor) / 5) * 5);
        const oldGrams = Math.max(1, item.grams || 100);
        const newGrams = item.unit === 'ks' ? Math.round(newQty * (item.unitGrams || 60)) : newQty;
        const ratio = newGrams / oldGrams;
        item.qty = newQty;
        item.grams = newGrams;
        item.p = Math.round(item.p * ratio * 10) / 10;
        item.c = Math.round(item.c * ratio * 10) / 10;
        item.f = Math.round(item.f * ratio * 10) / 10;
    });
    renderMealBuilderIngredients();
    showToast(`Porcia upravená na ~${desiredKcal} kcal ✓`);
}
function formatIngredientAmountLabel(item) {
    if (item.unit === 'ks') return `${item.qty} ks (${item.grams} g)`;
    if (item.unit === 'ml') return `${item.qty} ml`;
    return `${item.grams} g`;
}
function renderMealBuilderIngredients() {
    const container = document.getElementById('mb-ingredients-list');
    const scaleBtn = document.getElementById('mb-scale-to-goal-btn');
    let p = 0, c = 0, f = 0;
    draftMealIngredients.forEach(i => { p += i.p; c += i.c; f += i.f; });
    document.getElementById('mb-total-kcal').textContent = `${Math.round(p * 4 + c * 4 + f * 9)} kcal`;
    document.getElementById('mb-total-p').textContent = Math.round(p);
    document.getElementById('mb-total-c').textContent = Math.round(c);
    document.getElementById('mb-total-f').textContent = Math.round(f);
    if (scaleBtn) scaleBtn.classList.toggle('hidden', draftMealIngredients.length === 0);
    if (draftMealIngredients.length === 0) { container.innerHTML = `<div class="text-center py-3 text-[11px] text-zinc-500 border border-dashed border-zinc-800 rounded-xl">Naskenuj obal alebo pridaj surovinu vyššie.</div>`; return; }
    container.innerHTML = draftMealIngredients.map((item, idx) => `
        <div class="subcard-surface px-3 py-2 flex items-center justify-between gap-2 text-xs">
            <div class="min-w-0 flex-1">
                <div class="font-bold text-white truncate">${item.name.split('(')[0].trim()}</div>
                <div class="text-[10px] text-zinc-400">B:${item.p}g • S:${item.c}g • T:${item.f}g</div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
                <input type="number" step="any" min="0.5" value="${item.qty}" onchange="updateDraftIngredientQty(${idx}, this.value)" class="w-16 bg-dark-900 border border-zinc-700 rounded-lg px-1.5 py-1 text-center text-xs font-extrabold text-brand-400">
                <span class="text-[10.5px] font-bold text-zinc-400 w-5">${item.unit || 'g'}</span>
                <button type="button" onclick="removeIngredientFromMealBuilder(${idx})" class="text-rose-400 p-1">${svgIcon('close', 'w-3.5 h-3.5')}</button>
            </div>
        </div>
    `).join('');
}

function computeSampleMealMacros(sampleMeal, scaleFactor = 1) {
    let p = 0, c = 0, f = 0;
    const resolvedItems = [];
    (sampleMeal.items || []).forEach(it => {
        const food = getAllFoodsList().find(x => x.id === it.foodId);
        if (!food) return;
        const rawQty = it.qty * scaleFactor;
        const qty = it.unit === 'ks'
            ? Math.max(0.5, Math.round(rawQty * 2) / 2)
            : Math.max(5, Math.round(rawQty / 5) * 5);
        const unitGrams = food.unitGrams || 1;
        const grams = it.unit === 'ks' ? Math.round(qty * unitGrams) : qty;
        const mult = grams / 100;
        const ip = Math.round(food.p * mult * 10) / 10;
        const ic = Math.round(food.c * mult * 10) / 10;
        const inf = Math.round(food.f * mult * 10) / 10;
        p += ip; c += ic; f += inf;
        resolvedItems.push({ name: food.name, qty, unit: it.unit, unitGrams, grams, p: ip, c: ic, f: inf });
    });
    return {
        p: Math.round(p), c: Math.round(c), f: Math.round(f),
        kcal: Math.round(p * 4 + c * 4 + f * 9),
        resolvedItems
    };
}

let activeInspTab = 'meals';
let selectedInspSlotFilter = 'all';

function openMealInspirationsModal() {
    const sub = document.getElementById('insp-target-date-sub');
    if (sub) sub.textContent = `Cieľový deň: ${formatNutriDateHuman(selectedNutritionDateISO)} • Tvoj cieľ: ${getProfileNutrition().targets.kcal} kcal`;
    setInspirationTab('meals');
    document.getElementById('modal-meal-inspirations').classList.remove('hidden');
}

function setInspirationTab(tab) {
    activeInspTab = tab;
    const mBtn = document.getElementById('insp-tab-meals-btn');
    const dBtn = document.getElementById('insp-tab-days-btn');
    const pills = document.getElementById('insp-meal-slot-pills');
    if (tab === 'meals') {
        mBtn.className = 'py-2 rounded-lg text-xs font-extrabold bg-amber-400 text-zinc-950 transition';
        dBtn.className = 'py-2 rounded-lg text-xs font-extrabold text-zinc-400 hover:text-white transition';
        pills.classList.remove('hidden');
        renderInspirationSlotPills();
        renderSampleMealsList();
    } else {
        dBtn.className = 'py-2 rounded-lg text-xs font-extrabold bg-amber-400 text-zinc-950 transition';
        mBtn.className = 'py-2 rounded-lg text-xs font-extrabold text-zinc-400 hover:text-white transition';
        pills.classList.add('hidden');
        renderSampleDaysList();
    }
}

function renderInspirationSlotPills() {
    const filters = [
        { id: 'all', name: 'Všetko' },
        { id: 'breakfast', name: 'Raňajky' },
        { id: 'snack', name: 'Desiata / Olovrant' },
        { id: 'lunch', name: 'Obed' },
        { id: 'dinner', name: 'Večera' }
    ];
    document.getElementById('insp-meal-slot-pills').innerHTML = filters.map(f => `
        <button type="button" onclick="selectedInspSlotFilter='${f.id}'; renderInspirationSlotPills(); renderSampleMealsList();" class="px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${selectedInspSlotFilter === f.id ? 'bg-brand-500 text-zinc-950' : 'bg-dark-950 text-zinc-400 border border-zinc-800'}">${f.name}</button>
    `).join('');
}

function renderSampleMealsList() {
    const listEl = document.getElementById('insp-content-list');
    const filtered = SLOVAK_SAMPLE_MEALS.filter(m => {
        if (selectedInspSlotFilter === 'all') return true;
        if (selectedInspSlotFilter === 'snack') return m.slot === 'snack1' || m.slot === 'snack2';
        return m.slot === selectedInspSlotFilter;
    });
    listEl.innerHTML = filtered.map(m => {
        const calc = computeSampleMealMacros(m, 1);
        const slotName = MEAL_SLOTS.find(s => s.id === m.slot)?.name || 'Jedlo';
        const ingText = calc.resolvedItems.map(i => `${i.name.split('(')[0].trim()} (${i.unit === 'ks' ? i.qty + ' ks' : i.grams + i.unit})`).join(', ');
        return `
            <div class="subcard-surface p-3.5 space-y-2.5">
                <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="text-[9.5px] font-black uppercase px-2 py-0.5 rounded bg-amber-400/15 text-amber-300">${slotName}</span>
                            <span class="text-[10px] font-bold text-zinc-400">B:${calc.p}g • S:${calc.c}g • T:${calc.f}g</span>
                        </div>
                        <h4 class="text-xs sm:text-sm font-extrabold text-white mt-1.5 leading-snug">${m.title}</h4>
                    </div>
                    <span class="text-xs font-black text-brand-400 shrink-0">${calc.kcal} kcal</span>
                </div>
                <p class="text-[11px] text-zinc-400 leading-relaxed">${ingText}</p>
                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80">
                    <button type="button" onclick="openSampleMealInBuilder('${m.id}')" class="py-2 px-2.5 rounded-xl bg-dark-900 hover:bg-dark-800 border border-zinc-700 text-amber-300 text-[11px] font-bold text-center">Upraviť gramáže</button>
                    <button type="button" onclick="addSampleMealDirectly('${m.id}')" class="py-2 px-2.5 rounded-xl bg-brand-500 text-zinc-950 text-[11px] font-extrabold text-center">+ Pridať do dňa</button>
                </div>
            </div>
        `;
    }).join('');
}

function openSampleMealInBuilder(sampleMealId) {
    const sample = SLOVAK_SAMPLE_MEALS.find(m => m.id === sampleMealId);
    if (!sample) return;
    const calc = computeSampleMealMacros(sample, 1);
    document.getElementById('modal-meal-inspirations').classList.add('hidden');
    openMealBuilderModal(false, sample.slot);
    document.getElementById('mb-meal-title').value = sample.title;
    draftMealIngredients = calc.resolvedItems;
    renderMealBuilderIngredients();
}

function addSampleMealDirectly(sampleMealId) {
    const sample = SLOVAK_SAMPLE_MEALS.find(m => m.id === sampleMealId);
    if (!sample) return;
    const calc = computeSampleMealMacros(sample, 1);
    getProfileNutrition(selectedNutritionDateISO).logsByDate[selectedNutritionDateISO].meals.push({
        name: sample.title,
        slot: sample.slot,
        p: calc.p,
        c: calc.c,
        f: calc.f,
        items: calc.resolvedItems
    });
    saveState();
    document.getElementById('modal-meal-inspirations').classList.add('hidden');
    renderNutritionFoodView();
    if (selectedNutritionDateISO === getTodayISO()) syncTodayNutritionToCloud(sample.title);
    showToast('Jedlo pridané do dňa ✓');
}

function renderSampleDaysList() {
    const listEl = document.getElementById('insp-content-list');
    const userTargetKcal = getProfileNutrition().targets?.kcal || 2400;
    listEl.innerHTML = SLOVAK_SAMPLE_DAYS.map(day => {
        const meals = day.mealIds.map(id => SLOVAK_SAMPLE_MEALS.find(m => m.id === id)).filter(Boolean);
        let totP = 0, totC = 0, totF = 0, totKcal = 0;
        const rows = meals.map(m => {
            const c = computeSampleMealMacros(m, 1);
            totP += c.p; totC += c.c; totF += c.f; totKcal += c.kcal;
            const slotName = MEAL_SLOTS.find(s => s.id === m.slot)?.name || '';
            return `<div class="text-[11px] text-zinc-300"><strong class="text-amber-300">${slotName}:</strong> ${m.title} <span class="text-zinc-500">(${c.kcal} kcal)</span></div>`;
        }).join('');
        return `
            <div class="subcard-surface p-3.5 space-y-2.5">
                <div class="flex items-start justify-between gap-2">
                    <div>
                        <h4 class="text-xs sm:text-sm font-extrabold text-white">${day.title}</h4>
                        <div class="text-[10.5px] text-zinc-400 mt-0.5">${totKcal} kcal • B:${totP}g S:${totC}g T:${totF}g</div>
                    </div>
                </div>
                <div class="space-y-1 bg-dark-950/70 border border-zinc-800/80 rounded-xl p-2.5">${rows}</div>
                <div class="grid grid-cols-2 gap-2 pt-1">
                    <button type="button" onclick="applySampleDayToSelectedDate('${day.id}', false)" class="py-2 px-2 rounded-xl bg-dark-900 border border-zinc-700 text-zinc-200 font-bold text-[11px] text-center truncate">Vložiť pôvodné</button>
                    <button type="button" onclick="applySampleDayToSelectedDate('${day.id}', true)" class="py-2 px-2 rounded-xl bg-brand-500 text-zinc-950 font-extrabold text-[11px] text-center truncate">Na cieľ (${userTargetKcal} kcal)</button>
                </div>
            </div>
        `;
    }).join('');
}

function applySampleDayToSelectedDate(dayId, scaleToUserGoal = true) {
    const day = SLOVAK_SAMPLE_DAYS.find(d => d.id === dayId);
    if (!day) return;
    const meals = day.mealIds.map(id => SLOVAK_SAMPLE_MEALS.find(m => m.id === id)).filter(Boolean);
    let baseKcal = 0;
    meals.forEach(m => { baseKcal += computeSampleMealMacros(m, 1).kcal; });
    const targetKcal = getProfileNutrition().targets?.kcal || 2400;
    const scaleFactor = (scaleToUserGoal && baseKcal > 0) ? (targetKcal / baseKcal) : 1;

    const destMeals = getProfileNutrition(selectedNutritionDateISO).logsByDate[selectedNutritionDateISO].meals;
    meals.forEach(m => {
        const scaled = computeSampleMealMacros(m, scaleFactor);
        destMeals.push({
            name: m.title,
            slot: m.slot,
            p: scaled.p,
            c: scaled.c,
            f: scaled.f,
            items: scaled.resolvedItems
        });
    });
    saveState();
    document.getElementById('modal-meal-inspirations').classList.add('hidden');
    renderNutritionFoodView();
    if (selectedNutritionDateISO === getTodayISO()) syncTodayNutritionToCloud(day.title);
    showToast(`Vzorový deň vložený ✓`);
}

function saveBuiltMealToToday() {
    if (draftMealIngredients.length === 0) { showToast('Pridaj najprv aspoň jednu surovinu'); return; }
    let p = 0, c = 0, f = 0;
    draftMealIngredients.forEach(i => { p += i.p; c += i.c; f += i.f; });
    const autoName = draftMealIngredients.map(i => {
        const cleanBase = i.name.split('(')[0].replace('[EAN]', '').trim();
        const amt = i.unit === 'ks' ? `${i.qty} ks` : (i.unit === 'ml' ? `${i.qty} ml` : `${i.grams}g`);
        return `${cleanBase} ${amt}`;
    }).join(' + ');
    const name = document.getElementById('mb-meal-title').value.trim() || autoName;
    const slot = document.getElementById('mb-meal-slot')?.value || 'lunch';
    const savedItems = JSON.parse(JSON.stringify(draftMealIngredients));
    const mealObj = { name, slot, p: Math.round(p), c: Math.round(c), f: Math.round(f), items: savedItems };
    const targetList = getProfileNutrition(selectedNutritionDateISO).logsByDate[selectedNutritionDateISO].meals;
    if (editingMealIndex !== null && targetList[editingMealIndex]) {
        targetList[editingMealIndex] = mealObj;
    } else {
        targetList.push(mealObj);
    }
    if (document.getElementById('mb-save-as-preset').checked) mealPresets.unshift({ id: 'mp-user-' + Date.now(), ...mealObj });
    saveState(); closeMealBuilderModal();
    renderNutritionFoodView();
    if (selectedNutritionDateISO === getTodayISO()) syncTodayNutritionToCloud(name);
    showToast('Jedlo uložené ✓');
}

// CHECK-INY

function setBodyCheckInMode(mode) {
    activeBodyCheckInMode = mode;
    const dailyBtn = document.getElementById('body-mode-daily-btn'), weeklyBtn = document.getElementById('body-mode-weekly-btn');
    const dailyPanel = document.getElementById('body-panel-daily'), weeklyPanel = document.getElementById('body-panel-weekly');
    if (mode === 'weekly') {
        weeklyBtn.className = 'py-2 px-3 rounded-lg text-xs font-extrabold bg-brand-500 text-zinc-950 transition';
        dailyBtn.className = 'py-2 px-3 rounded-lg text-xs font-extrabold text-zinc-400 hover:text-white transition';
        weeklyPanel.classList.remove('hidden'); dailyPanel.classList.add('hidden');
        renderWeeklyCheckInView();
    } else {
        dailyBtn.className = 'py-2 px-3 rounded-lg text-xs font-extrabold bg-amber-400 text-zinc-950 transition';
        weeklyBtn.className = 'py-2 px-3 rounded-lg text-xs font-extrabold text-zinc-400 hover:text-white transition';
        dailyPanel.classList.remove('hidden'); weeklyPanel.classList.add('hidden');
        renderDailyCheckInHistory();
    }
}
function saveBodyCheckIn() {
    const weight = document.getElementById('checkin-weight').value.trim();
    const dayType = document.getElementById('checkin-day-type').value;
    const sleep = document.getElementById('checkin-sleep').value;
    const fatigue = document.getElementById('checkin-fatigue').value;
    const energy = document.getElementById('checkin-energy').value;
    const strength = document.getElementById('checkin-strength').value;
    const hunger = document.getElementById('checkin-hunger').value;
    const steps = document.getElementById('checkin-steps')?.value.trim() || '';
    const rhr = document.getElementById('checkin-rhr')?.value.trim() || '';
    if (!bodyCheckInsByProfile[activeProfileId]) bodyCheckInsByProfile[activeProfileId] = [];
    const isoDate = getTodayISO();
    const dateStr = new Date().toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const existingIdx = bodyCheckInsByProfile[activeProfileId].findIndex(item => item.isoDate === isoDate);
    const entry = { id: existingIdx >= 0 ? bodyCheckInsByProfile[activeProfileId][existingIdx].id : 'ci-' + Date.now(), isoDate, date: dateStr, dayType, weight, sleep, fatigue, energy, strength, hunger, steps, rhr };
    if (existingIdx >= 0) bodyCheckInsByProfile[activeProfileId][existingIdx] = entry;
    else bodyCheckInsByProfile[activeProfileId].unshift(entry);
    if (weight) { biometricsByProfile[activeProfileId] = { ...(biometricsByProfile[activeProfileId] || {}), weight }; initBiometricsUI(); }
    preWorkoutReadiness.energy = parseInt(energy) || 8;
    preWorkoutReadiness.sleep = parseInt(sleep) || 8;
    if (rhr) preWorkoutReadiness.rhr = rhr;
    initPreWorkoutReadinessUI();
    saveState(); renderDailyCheckInHistory(); sendCloudTesterLog('morning_checkin', entry); showToast('Ranný dotazník uložený ✓');
}
function renderBodyCheckInView() { setBodyCheckInMode(activeBodyCheckInMode); }
function compute7DayRollingStats(nutriObj, dailyCheckInsList) {
    const weightEntries = (dailyCheckInsList || []).filter(x => parseFloat(x.weight) > 0);
    const wLast7 = weightEntries.slice(0, 7);
    const wPrev7 = weightEntries.slice(7, 14);
    const avgW7 = wLast7.length ? Math.round((wLast7.reduce((a, x) => a + parseFloat(x.weight), 0) / wLast7.length) * 10) / 10 : null;
    const avgWPrev7 = wPrev7.length ? Math.round((wPrev7.reduce((a, x) => a + parseFloat(x.weight), 0) / wPrev7.length) * 10) / 10 : null;
    const weightDelta = (avgW7 !== null && avgWPrev7 !== null) ? Math.round((avgW7 - avgWPrev7) * 10) / 10 : null;

    const logsMap = nutriObj?.logsByDate || {};
    const last7Dates = Array.from({ length: 7 }, (_, i) => getOffsetISO(-i));
    let kcalSum = 0, protSum = 0, loggedDays = 0;
    last7Dates.forEach(dISO => {
        const meals = logsMap[dISO]?.meals || [];
        if (meals.length > 0) {
            let dp = 0, dc = 0, df = 0;
            meals.forEach(m => { dp += parseFloat(m.p) || 0; dc += parseFloat(m.c) || 0; df += parseFloat(m.f) || 0; });
            kcalSum += (dp * 4 + dc * 4 + df * 9);
            protSum += dp;
            loggedDays++;
        }
    });
    return {
        avgW7,
        weightDelta,
        avgKcal7: loggedDays > 0 ? Math.round(kcalSum / loggedDays) : null,
        avgProt7: loggedDays > 0 ? Math.round(protSum / loggedDays) : null,
        loggedDays
    };
}

function renderDailyCheckInHistory() {
    const container = document.getElementById('body-checkin-history');
    const list = bodyCheckInsByProfile[activeProfileId] || [];
    const last7 = list.slice(0, 7);
    const avgE = last7.length ? (last7.reduce((a, x) => a + (parseFloat(x.energy) || 0), 0) / last7.length).toFixed(1) : '—';
    const avgS = last7.length ? (last7.reduce((a, x) => a + (parseFloat(x.sleep) || 0), 0) / last7.length).toFixed(1) : '—';
    const rolling = compute7DayRollingStats(getProfileNutrition(), list);

    document.getElementById('weekly-avg-energy').textContent = `${avgE} / 10`;
    document.getElementById('weekly-avg-sleep').textContent = `${avgS} / 10`;
    document.getElementById('weekly-last-weight').textContent = rolling.avgW7 !== null ? `${rolling.avgW7} kg` : '— kg';
    const wTrendEl = document.getElementById('weekly-weight-trend');
    if (wTrendEl) {
        if (rolling.weightDelta !== null) {
            const sign = rolling.weightDelta > 0 ? '+' : '';
            wTrendEl.textContent = `${sign}${rolling.weightDelta} kg vs min. týž.`;
        } else {
            wTrendEl.textContent = 'posledných 7 vážení';
        }
    }
    const avgKcalEl = document.getElementById('weekly-avg-kcal');
    const avgProtEl = document.getElementById('weekly-avg-prot');
    if (avgKcalEl) avgKcalEl.textContent = rolling.avgKcal7 !== null ? `${rolling.avgKcal7} kcal` : '— kcal';
    if (avgProtEl) avgProtEl.textContent = rolling.avgProt7 !== null ? `B: ${rolling.avgProt7} g/deň` : 'bez zápisu stravy';
    if (list.length === 0) { container.innerHTML = `<div class="text-center py-6 text-xs text-zinc-500 card-surface border-dashed">Zatiaľ žiadny záznam.</div>`; return; }
    container.innerHTML = list.map(ci => `
        <div class="card-surface p-3.5 space-y-2">
            <div class="flex items-center justify-between"><span class="text-xs font-extrabold text-brand-400">${ci.date} • ${DAY_TYPE_LABELS[ci.dayType] || ''}</span><span class="text-xs font-bold text-white">${ci.weight ? ci.weight + ' kg' : ''}</span></div>
            <div class="grid grid-cols-4 gap-1.5 text-center text-[10.5px]">
                <div class="subcard-surface p-1.5"><span class="text-zinc-500 block text-[9px]">Spánok</span><strong class="text-brand-400">${ci.sleep}/10</strong></div>
                <div class="subcard-surface p-1.5"><span class="text-zinc-500 block text-[9px]">Sviežosť</span><strong class="text-sky-400">${ci.fatigue ?? '—'}/10</strong></div>
                <div class="subcard-surface p-1.5"><span class="text-zinc-500 block text-[9px]">Energia</span><strong class="text-amber-400">${ci.energy}/10</strong></div>
                <div class="subcard-surface p-1.5"><span class="text-zinc-500 block text-[9px]">Hlad</span><strong class="text-rose-400">${ci.hunger ?? '—'}/10</strong></div>
            </div>
        </div>
    `).join('');
}


function toggleMeasureGuide() {
    const box = document.getElementById('measure-guide-box');
    if (!box) return;
    box.classList.toggle('hidden');
    box.innerHTML = MEASURE_GUIDES.all;
}

function saveWeeklyCheckIn() {
    const wVal = document.getElementById('wk-weight').value.trim();
    const entry = {
        id: 'wk-' + Date.now(),
        date: new Date().toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        weight: wVal, waist: document.getElementById('wk-waist').value.trim(), hips: document.getElementById('wk-hips').value.trim(),
        chest: document.getElementById('wk-chest').value.trim(), thigh: document.getElementById('wk-thigh').value.trim(), arm: document.getElementById('wk-arm').value.trim(),
        energy: document.getElementById('wk-energy').value, hunger: document.getElementById('wk-hunger').value, sleep: document.getElementById('wk-sleep').value,
        recovery: document.getElementById('wk-recovery').value, adherence: document.getElementById('wk-adherence').value, stress: document.getElementById('wk-stress').value,
        note: document.getElementById('wk-note').value.trim()
    };
    if (!weeklyCheckInsByProfile[activeProfileId]) weeklyCheckInsByProfile[activeProfileId] = [];
    weeklyCheckInsByProfile[activeProfileId].unshift(entry);
    if (wVal) { biometricsByProfile[activeProfileId] = { ...(biometricsByProfile[activeProfileId] || {}), weight: wVal }; initBiometricsUI(); }
    document.getElementById('wk-note').value = '';
    saveState(); renderWeeklyCheckInView(); sendCloudTesterLog('weekly_checkin', entry); showToast('Týždenný Check-in uložený ✓');
}
function renderWeeklyCheckInView() {
    const container = document.getElementById('weekly-checkin-history');
    const list = weeklyCheckInsByProfile[activeProfileId] || [];
    if (list.length === 0) { container.innerHTML = `<div class="text-center py-6 text-xs text-zinc-500 card-surface border-dashed">Zatiaľ žiadny týždenný Check-in.</div>`; return; }
    container.innerHTML = list.map(w => `
        <div class="card-surface p-3.5 space-y-2">
            <div class="flex items-center justify-between"><span class="text-xs font-extrabold text-brand-400">${w.date}</span><span class="text-xs font-bold text-white">${w.weight || '—'} kg • Pás ${w.waist || '—'} cm</span></div>
            <div class="flex flex-wrap gap-1.5 text-[10px]">
                <span class="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold">Energia ${w.energy}/10</span>
                <span class="px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 font-bold">Hlad ${w.hunger}/10</span>
                <span class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold">Spánok ${w.sleep}/10</span>
            </div>
            ${w.note ? `<div class="text-xs text-zinc-300 subcard-surface p-2">${w.note}</div>` : ''}
        </div>
    `).join('');
}

// =====================================================================
// SEKCIA DOPLNKY VÝŽIVY
// =====================================================================
function getActiveProfileSuppStack() {
    if (!Array.isArray(userSupplementStacks[activeProfileId])) userSupplementStacks[activeProfileId] = [];
    return userSupplementStacks[activeProfileId];
}
function getTodayTakenSuppsSet() {
    const key = `${activeProfileId}_${getTodayISO()}`;
    if (!Array.isArray(suppTakenByDate[key])) suppTakenByDate[key] = [];
    return new Set(suppTakenByDate[key]);
}
function toggleSuppTakenToday(suppId) {
    const key = `${activeProfileId}_${getTodayISO()}`;
    if (!Array.isArray(suppTakenByDate[key])) suppTakenByDate[key] = [];
    const idx = suppTakenByDate[key].indexOf(suppId);
    if (idx === -1) suppTakenByDate[key].push(suppId);
    else suppTakenByDate[key].splice(idx, 1);
    saveState(); renderMySupplementStack();
}
function updateSuppBadgeCount() {
    const stack = getActiveProfileSuppStack();
    const badge = document.getElementById('domain-supp-badge');
    if (badge) badge.textContent = stack.length;
}
function setSuppSubTab(subTab) {
    activeSuppSubTab = subTab;
    const myView = document.getElementById('supp-view-mystack'), catView = document.getElementById('supp-view-catalog');
    if (activeDomain === 'supplements') renderDynamicBottomNav('supplements', subTab);
    if (subTab === 'mystack') {
        myView.classList.remove('hidden'); catView.classList.add('hidden');
        renderMySupplementStack();
    } else {
        catView.classList.remove('hidden'); myView.classList.add('hidden');
        renderSuppCategoryPills(); renderSupplementsCatalog();
    }
}
function renderSupplementsSection() { updateSuppBadgeCount(); setSuppSubTab(activeSuppSubTab); }
function toggleSupplementInStack(suppId) {
    const stack = getActiveProfileSuppStack();
    const idx = stack.indexOf(suppId);
    const supp = supplements.find(s => s.id === suppId);
    if (idx === -1) { stack.push(suppId); if (supp) showToast(`Pridané: ${supp.name}`); }
    else { stack.splice(idx, 1); if (supp) showToast(`Odobrané: ${supp.name}`); }
    saveState(); updateSuppBadgeCount();
    if (activeSuppSubTab === 'mystack') renderMySupplementStack();
    else renderSupplementsCatalog();
}
function toggleSuppSlotAccordion(slotKey) { expandedSuppSlots[slotKey] = !expandedSuppSlots[slotKey]; renderMySupplementStack(); }
function applyStarterSuppPack(packKey) {
    const packs = {
        health: ['supp-vit-d3k2', 'supp-vit-c', 'supp-omega3', 'supp-magnesium-bisglycinate'],
        strength: ['supp-creatine', 'supp-whey', 'supp-citrulline', 'supp-magnesium-bisglycinate'],
        runner: ['supp-joints', 'supp-electrolytes', 'supp-cordyceps', 'supp-magnesium-malate']
    };
    const stack = getActiveProfileSuppStack();
    (packs[packKey] || []).forEach(id => { if (!stack.includes(id)) stack.push(id); });
    saveState(); updateSuppBadgeCount(); renderMySupplementStack(); showToast('Balíček pridaný ✓');
}
function renderMySupplementStack() {
    const selectedSupps = getActiveProfileSuppStack().map(id => supplements.find(s => s.id === id)).filter(Boolean);
    const actionsBar = document.getElementById('mystack-actions-bar');
    const container = document.getElementById('mystack-timeline-container');
    if (!container) return;
    if (selectedSupps.length === 0) {
        actionsBar.classList.add('hidden');
        container.innerHTML = `<div class="text-center py-8 px-4 card-surface border-dashed"><h3 class="text-sm font-bold text-white mb-1">Zatiaľ nemáš zvolené doplnky</h3><p class="text-xs text-zinc-400 mb-4">Vyber si balíček vyššie alebo otvor Encyklopédiu.</p><button onclick="setSuppSubTab('catalog')" class="bg-amber-400 text-zinc-950 font-extrabold text-xs px-4 py-2.5 rounded-xl">Otvoriť Encyklopédiu</button></div>`;
        return;
    }
    const takenSet = getTodayTakenSuppsSet();
    actionsBar.classList.remove('hidden');
    container.innerHTML = ['morning_empty', 'with_meal', 'pre_workout', 'post_workout', 'evening'].map(slotKey => {
        const items = selectedSupps.filter(s => s.timingSlot === slotKey);
        if (items.length === 0) return '';
        const slotMeta = TIMING_SLOTS[slotKey];
        const isOpen = !!expandedSuppSlots[slotKey];
        const takenInSlot = items.filter(i => takenSet.has(i.id)).length;
        return `
            <div class="card-surface ${isOpen ? 'border-amber-400/45' : ''} overflow-hidden">
                <button type="button" onclick="toggleSuppSlotAccordion('${slotKey}')" class="w-full p-3.5 flex items-center justify-between gap-2.5 text-left hover:bg-dark-850 transition">
                    <div class="min-w-0">
                        <h3 class="text-xs sm:text-sm font-extrabold text-white">${slotMeta.title}</h3>
                        <p class="text-[11px] text-zinc-400 truncate mt-0.5">${isOpen ? slotMeta.subtitle : items.map(i => i.name.split('(')[0].trim()).join(' • ')}</p>
                    </div>
                    <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${slotMeta.color} shrink-0">${takenInSlot}/${items.length} ✓</span>
                </button>
                ${isOpen ? `<div class="px-3.5 pb-3.5 pt-1 border-t border-zinc-800 space-y-2">${items.map(s => {
                    const isTaken = takenSet.has(s.id);
                    return `<div class="subcard-surface ${isTaken ? 'border-brand-500/45 bg-brand-500/5' : ''} p-3 space-y-1.5"><div class="flex items-start justify-between gap-2"><div class="font-extrabold text-xs text-white">${s.name}</div><div class="flex items-center gap-1.5 shrink-0"><button onclick="toggleSuppTakenToday('${s.id}')" class="text-[10px] font-extrabold px-2.5 py-1 rounded-lg border ${isTaken ? 'bg-brand-500 text-zinc-950 border-brand-400' : 'bg-dark-900 text-zinc-300 border-zinc-700'}">${isTaken ? 'Užité ${svgIcon('ok', 'w-3.5 h-3.5 inline')}' : 'Užiť'}</button><button onclick="toggleSupplementInStack('${s.id}')" class="text-[10px] font-bold px-2 py-1 rounded-lg bg-rose-500/15 text-rose-300">${svgIcon('close', 'w-3.5 h-3.5')}</button></div></div><div class="text-[11px] font-bold text-amber-400">Dávka: ${s.dosage}</div><div class="text-[11px] text-zinc-400">${s.benefit}</div></div>`;
                }).join('')}</div>` : ''}
            </div>
        `;
    }).join('');
}
function renderSuppCategoryPills() {
    const container = document.getElementById('supp-category-pills');
    if (!container) return;
    container.innerHTML = SUPP_CATEGORIES.map(cat => `<button onclick="selectedSuppCategory='${cat.id}'; renderSuppCategoryPills(); renderSupplementsCatalog();" class="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${selectedSuppCategory === cat.id ? 'bg-amber-400 text-zinc-950' : 'bg-dark-900 text-zinc-400 border border-zinc-800'}">${cat.name}</button>`).join('');
}
function renderSupplementsCatalog() {
    const container = document.getElementById('supp-catalog-list');
    if (!container) return;
    const query = (document.getElementById('search-supplement')?.value || '').toLowerCase().trim();
    const stackIds = new Set(getActiveProfileSuppStack());
    const filtered = supplements.filter(s => (selectedSuppCategory === 'all' ? true : (selectedSuppCategory === 'with_meal_group' ? s.timingSlot === 'with_meal' : s.category === selectedSuppCategory)) && (!query || s.name.toLowerCase().includes(query) || s.benefit.toLowerCase().includes(query)));
    container.innerHTML = filtered.map(s => {
        const inStack = stackIds.has(s.id);
        const slotMeta = TIMING_SLOTS[s.timingSlot] || TIMING_SLOTS.with_meal;
        return `<div class="card-surface ${inStack ? 'border-amber-400/45' : ''} p-3.5 space-y-2"><div class="flex items-start justify-between gap-2"><div class="min-w-0"><span class="text-[10px] font-bold px-2 py-0.5 rounded-md border ${slotMeta.color}">${slotMeta.badge}</span><h3 class="text-sm font-extrabold text-white mt-1.5">${s.name}</h3></div><button onclick="toggleSupplementInStack('${s.id}')" class="px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 ${inStack ? 'bg-amber-400 text-zinc-950' : 'bg-dark-850 text-zinc-200 border border-zinc-700'}">${inStack ? 'Užívam ${svgIcon('ok', 'w-3.5 h-3.5 inline')}' : '+ Pridať'}</button></div><p class="text-xs text-zinc-300 leading-relaxed">${s.benefit}</p><div class="text-[11px] text-zinc-400">Dávkovanie: <strong class="text-zinc-200">${s.dosage}</strong> • ${s.withWhat}</div></div>`;
    }).join('');
}
function openNewSupplementModal() { document.getElementById('modal-new-supplement').classList.remove('hidden'); }
function closeNewSupplementModal() { document.getElementById('modal-new-supplement').classList.add('hidden'); }
function createNewSupplement() {
    const name = document.getElementById('new-supp-name').value.trim();
    if (!name) return;
    const category = document.getElementById('new-supp-category').value;
    const timingSlot = document.getElementById('new-supp-timing-slot').value;
    const dosage = document.getElementById('new-supp-dosage').value.trim() || 'Podľa obalu';
    const desc = document.getElementById('new-supp-desc').value.trim() || 'Vlastný doplnok.';
    const slotMeta = TIMING_SLOTS[timingSlot] || TIMING_SLOTS.with_meal;
    const newSupp = { id: 'supp-custom-' + Date.now(), name, category, timingSlot, whenText: slotMeta.title, withWhat: 'S vodou.', dosage, benefit: desc };
    supplements.unshift(newSupp);
    getActiveProfileSuppStack().push(newSupp.id);
    saveState(); closeNewSupplementModal(); renderSupplementsSection(); showToast(`Pridané: ${name}`);
}
function copySupplementStackToClipboard() {
    const prof = getActiveProfile();
    const selected = getActiveProfileSuppStack().map(id => supplements.find(s => s.id === id)).filter(Boolean);
    let text = `MM LAB – Doplnky (${prof.name})\n-----------------------------\n`;
    selected.forEach((s, i) => { text += `${i + 1}. ${s.name} (${s.dosage}) – ${s.whenText}\n`; });
    copyTextToClipboard(text, 'Zoznam skopírovaný ✓');
}

function exportSupplementsToICS() {
    const selected = getActiveProfileSuppStack().map(id => supplements.find(s => s.id === id)).filter(Boolean);
    if (selected.length === 0) { showToast('Najprv pridaj doplnky do Stacku'); return; }
    const slotHours = { morning_empty: '080000', with_meal: '123000', pre_workout: '163000', post_workout: '183000', evening: '213000' };
    const todayCompact = getTodayISO().replace(/-/g, '');
    const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MM LAB//Supplements//SK', 'CALSCALE:GREGORIAN'];

    Object.keys(slotHours).forEach(slotKey => {
        const items = selected.filter(s => s.timingSlot === slotKey);
        if (items.length === 0) return;
        const meta = TIMING_SLOTS[slotKey];
        const shortNames = items.map(i => i.name.split('(')[0].trim()).join(' + ');
        const summary = `MM LAB ${meta.badge}: ${shortNames}`.replace(/,/g, '\\,');
        const descLines = [`${meta.title}`, ...items.map(i => `- ${i.name.split('(')[0].trim()}: ${i.dosage}`)].join('\\n').replace(/,/g, '\\,');
        lines.push('BEGIN:VEVENT', `UID:mmlab-supp-${slotKey}-${Date.now()}@miromedofit.lab`, `DTSTAMP:${dtStamp}`, `DTSTART:${todayCompact}T${slotHours[slotKey]}`, 'DURATION:PT10M', 'RRULE:FREQ=DAILY', `SUMMARY:${summary}`, `DESCRIPTION:${descLines}`, 'BEGIN:VALARM', 'TRIGGER:-PT0M', 'ACTION:DISPLAY', `DESCRIPTION:${summary}`, 'END:VALARM', 'END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'MM_LAB_Vitaminy.ics'; a.click();
    URL.revokeObjectURL(url); showToast('Pripomienky stiahnuté ✓');
}

// =====================================================================
// PROFILY, TRÉNINGY, SPLITY, DATABÁZA & HISTÓRIA
// =====================================================================
function openProfileModal() {
    const prof = getActiveProfile();
    document.getElementById('editing-profile-current-label').textContent = prof.name;
    document.getElementById('rename-active-profile-input').value = prof.name;
    applyAdminPermissionsUI(); renderProfilesList();
    document.getElementById('modal-profiles').classList.remove('hidden');
}
function closeProfileModal() { document.getElementById('modal-profiles').classList.add('hidden'); }
function renameActiveProfile() {
    const newName = document.getElementById('rename-active-profile-input').value.trim();
    if (!newName) return;
    getActiveProfile().name = newName;
    saveState(); updateHeaderProfileUI();
    document.getElementById('editing-profile-current-label').textContent = newName;
    renderProfilesList(); showToast(`Meno uložené: ${newName}`);
}
function renderProfilesList() {
    const visibleProfiles = isTrainerOrAdmin() ? profiles : profiles.filter(p => p.id === 'me');
    document.getElementById('profiles-list').innerHTML = visibleProfiles.map(p => {
        const isSelected = p.id === activeProfileId, isPrimary = p.id === 'me';
        const count = workoutHistory.filter(w => (w.profileId || 'me') === p.id).length;
        return `<div onclick="selectProfile('${p.id}')" class="cursor-pointer p-3 rounded-2xl border flex items-center justify-between gap-2 ${isSelected ? 'bg-brand-500/15 border-brand-500/50' : 'bg-dark-850 border-zinc-800'}"><div class="flex items-center gap-2.5 min-w-0"><div class="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold ${isPrimary ? 'bg-brand-500 text-zinc-950' : 'bg-amber-400 text-zinc-950'}">${p.name.slice(0, 2).toUpperCase()}</div><div class="min-w-0"><div class="text-xs font-extrabold text-white truncate">${p.name}</div><div class="text-[10px] text-zinc-400">${count} tréningov</div></div></div>${(!isPrimary && isTrainerOrAdmin()) ? `<button onclick="event.stopPropagation(); deleteClientProfile('${p.id}')" class="p-1 text-zinc-500 hover:text-rose-400">${svgIcon('close', 'w-3.5 h-3.5')}</button>` : ''}</div>`;
    }).join('');
}
function selectProfile(profileId) {
    if (!isTrainerOrAdmin() && profileId !== 'me') return;
    activeProfileId = profileId; saveState(); updateHeaderProfileUI(); initBiometricsUI();
    renderProfilesList(); renderDatabase(); renderActiveWorkout(); renderHistory();
    if (activeDomain === 'nutrition') renderNutritionSection();
    if (activeDomain === 'supplements') renderSupplementsSection();
    showToast(`Prepnuté na: ${getActiveProfile().name}`);
}
function addNewClientProfile() {
    if (!isTrainerOrAdmin()) return;
    const input = document.getElementById('new-client-name');
    const name = input.value.trim();
    if (!name) return;
    const newProf = { id: 'client-' + Date.now(), name, role: 'client' };
    profiles.push(newProf); input.value = ''; selectProfile(newProf.id); closeProfileModal();
}
function deleteClientProfile(profileId) {
    if (profileId === 'me') return;
    profiles = profiles.filter(p => p.id !== profileId);
    if (activeProfileId === profileId) activeProfileId = 'me';
    saveState(); updateHeaderProfileUI(); renderProfilesList();
}

function saveWorkoutMeta() { localStorage.setItem('fitlog_workout_title', document.getElementById('workout-title').value); }
function startWorkoutTimer() {
    if (workoutTimerInterval) clearInterval(workoutTimerInterval);
    updateTimerDisplay();
    workoutTimerInterval = setInterval(updateTimerDisplay, 1000);
}
function updateTimerDisplay() {
    const el = document.getElementById('workout-timer-display');
    if (!el) return;
    if (activeWorkout.length === 0 || !workoutStartTime) { el.textContent = '00:00'; return; }
    const sec = Math.max(0, Math.floor((Date.now() - workoutStartTime) / 1000));
    const m = Math.floor(sec / 60), s = sec % 60;
    el.textContent = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}
function calculateTotalVolume(list) {
    let total = 0;
    (list || []).forEach(ex => {
        const done = (ex.sets || []).filter(s => s.completed);
        const toSum = done.length > 0 ? done : (ex.sets || []);
        toSum.forEach(s => {
            const w = parseFloat(s.weight) || 0;
            if (w <= 0) return;
            total += s.mode === 'time' ? w : w * (parseInt(s.reps) || 0);
        });
    });
    return Math.round(total * 10) / 10;
}
function formatVolumeKg(kg) { return `${kg.toLocaleString('sk-SK')} kg`; }
function formatDuration(totalSeconds) {
    const sec = parseInt(totalSeconds) || 0;
    if (sec < 60) return `${sec} s`;
    const m = Math.floor(sec / 60), s = sec % 60;
    return s === 0 ? `${m} min` : `${m}:${s < 10 ? '0' : ''}${s} min`;
}
function getRirBadgeStyle(rir) {
    const val = parseInt(rir);
    if (val === 0) return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
    if (val <= 2) return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    if (val <= 4) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    return 'bg-sky-500/20 text-sky-400 border-sky-500/40';
}
function getRirDescription(rir) {
    const val = parseInt(rir);
    if (val === 0) return 'Do zlyhania (0 v rezerve)';
    if (val === 1) return '1 opakovanie v rezerve';
    if (val === 2) return '2 opakovania v rezerve';
    return `${val} opakovaní v rezerve`;
}
function getTechniqueMeta(techId) { return SET_TECHNIQUES.find(t => t.id === techId) || SET_TECHNIQUES[0]; }

function getLastPerformance(exerciseId) {
    let latestNote = '';
    for (let i = 0; i < workoutHistory.length; i++) {
        const w = workoutHistory[i];
        if ((w.profileId || 'me') !== activeProfileId) continue;
        const found = (w.exercises || []).find(e => e.exerciseId === exerciseId);
        if (found && !latestNote && found.note) latestNote = found.note;
        if (found && found.sets?.length > 0) {
            const valid = found.sets.filter(s => s.completed);
            const setsToUse = valid.length > 0 ? valid : found.sets;
            let maxW = 0, maxDur = 0;
            setsToUse.forEach(s => {
                const wn = parseFloat(s.weight) || 0;
                if (wn > maxW) maxW = wn;
                if (s.mode === 'time') maxDur = Math.max(maxDur, parseInt(s.duration) || 0);
            });
            const headline = maxW > 0 ? `${maxW} kg` : (maxDur > 0 ? formatDuration(maxDur) : `${setsToUse[0].reps} opak.`);
            const setsText = setsToUse.map(s => `${s.weight ? s.weight + 'kg' : 'BW'}×${s.mode === 'time' ? formatDuration(s.duration) : s.reps + 'x'} (RIR ${s.rir})`).join(', ');
            return { date: w.date, headline, setsText, sets: setsToUse, maxWeight: maxW, lastNote: latestNote || found.note || '' };
        }
    }
    return null;
}

let selectedSplitTagFilter = 'all';
let expandedSplitIds = {};

function toggleSplitGuideBox() {
    const box = document.getElementById('split-guide-box');
    if (box) box.classList.toggle('hidden');
}
function toggleSplitCardExpand(splitId) {
    expandedSplitIds[splitId] = !expandedSplitIds[splitId];
    renderSplits();
}
function duplicateSplit(splitId) {
    const orig = savedSplits.find(s => s.id === splitId);
    if (!orig) return;
    const copy = JSON.parse(JSON.stringify(orig));
    copy.id = 'split-copy-' + Date.now();
    copy.name = `${orig.name} (Kópia)`;
    savedSplits.unshift(copy);
    expandedSplitIds[copy.id] = true;
    saveState();
    renderSplits();
    showToast('Split skopírovaný ✓');
}
function renderSplitFilterPills() {
    const container = document.getElementById('split-filter-pills');
    if (!container) return;
    const tags = [
        { id: 'all', name: 'Všetko' },
        { id: 'Fullbody', name: 'Fullbody' },
        { id: 'Zadok / Pre ženy', name: 'Zadok / Pre ženy' },
        { id: 'Upper / Lower', name: 'Upper / Lower' },
        { id: 'PPL', name: 'PPL' },
        { id: 'Atletika', name: 'Atletika' },
        { id: 'Doma', name: 'Doma' }
    ];
    container.innerHTML = tags.map(t => `
        <button type="button" onclick="selectedSplitTagFilter='${t.id}'; renderSplits();" class="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${selectedSplitTagFilter === t.id ? 'bg-brand-500 text-zinc-950' : 'bg-dark-900 text-zinc-400 border border-zinc-800'}">${t.name}</button>
    `).join('');
}

function renderSplits() {
    renderSplitFilterPills();
    const container = document.getElementById('splits-list');
    if (!container) return;
    const coach = isTrainerOrAdmin();
    const filteredSplits = savedSplits.filter(s => selectedSplitTagFilter === 'all' || (s.tag || '') === selectedSplitTagFilter);
    if (filteredSplits.length === 0) {
        container.innerHTML = `<div class="text-center py-8 px-4 card-surface border-dashed text-xs text-zinc-400">V tejto kategórii zatiaľ nemáš žiadny split.</div>`;
        return;
    }
    container.innerHTML = filteredSplits.map(split => {
        const isOpen = !!expandedSplitIds[split.id];
        const totalExCount = split.blocks.reduce((acc, b) => acc + (b.type === 'superset' ? 2 : 1), 0);
        const blocksHtml = isOpen ? split.blocks.map((block, idx) => {
            const ex1 = exercises.find(e => e.id === block.exerciseId);
            const tech = getTechniqueMeta(block.technique);
            if (block.type === 'superset') {
                const ex2 = exercises.find(e => e.id === block.exerciseId2);
                return `<div class="bg-purple-500/10 border border-purple-500/30 rounded-xl p-2.5 space-y-1"><span class="text-[10px] font-extrabold text-purple-300">SUPERSÉRIA • ${block.sets}×</span><div class="text-xs font-bold text-white">A1: ${ex1 ? ex1.name : ''}</div><div class="text-xs font-bold text-purple-200">A2: ${ex2 ? ex2.name : ''}</div></div>`;
            }
            return `<div class="subcard-surface px-3 py-2 flex items-center justify-between gap-2"><div class="min-w-0"><div class="text-xs font-bold text-zinc-200 truncate">${idx + 1}. ${ex1 ? ex1.name : ''}</div><div class="text-[10px] text-zinc-400">${block.sets} série</div></div>${tech.badge ? `<span class="text-[9px] font-extrabold px-2 py-0.5 rounded border ${tech.style}">${tech.badge}</span>` : ''}</div>`;
        }).join('') : '';

        const tagBadgeStyle = split.tag === 'Zadok / Pre ženy'
            ? 'text-pink-300 bg-pink-500/15'
            : 'text-brand-400 bg-brand-500/10';

        return `
            <div class="card-surface ${isOpen ? 'border-brand-500/45' : ''} p-3.5 space-y-2.5">
                <div class="flex items-start justify-between gap-2">
                    <div onclick="toggleSplitCardExpand('${split.id}')" class="cursor-pointer min-w-0 flex-1">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="text-[10px] font-extrabold uppercase ${tagBadgeStyle} px-2 py-0.5 rounded">${split.tag}</span>
                            <span class="text-[10.5px] text-zinc-400 font-semibold">${totalExCount} cvikov</span>
                        </div>
                        <h3 class="text-sm font-extrabold text-white mt-1 leading-snug">${split.name}</h3>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                        <button type="button" onclick="duplicateSplit('${split.id}')" title="Duplikovať split" class="px-2 py-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 border border-zinc-800 text-zinc-300 text-[10.5px] font-bold">Kópia</button>
                        ${coach ? `<button type="button" onclick="openSendSplitModal('${split.id}')" class="px-2 py-1.5 rounded-lg bg-amber-400/15 border border-amber-400/35 text-amber-300 text-[10.5px] font-extrabold">Odoslať</button>` : ''}
                        <button type="button" onclick="deleteSplit('${split.id}')" class="p-1.5 rounded-lg bg-dark-850 text-zinc-500 hover:text-rose-400">${svgIcon('close', 'w-3.5 h-3.5')}</button>
                    </div>
                </div>
                ${isOpen ? `<div class="space-y-1.5 pt-1 border-t border-zinc-800/80">${blocksHtml}</div>` : ''}
                <div class="flex items-center gap-2">
                    <button type="button" onclick="toggleSplitCardExpand('${split.id}')" class="px-3 py-2 rounded-xl bg-dark-850 hover:bg-dark-800 border border-zinc-800 text-zinc-300 font-bold text-xs shrink-0 flex items-center gap-1">${isOpen ? 'Skryť ' + svgIcon('chev-u', 'w-3.5 h-3.5 inline') : 'Cviky ' + svgIcon('chev-d', 'w-3.5 h-3.5 inline')}</button>
                    <button type="button" onclick="startWorkoutFromSplit('${split.id}')" class="flex-1 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-zinc-950 font-extrabold text-xs flex items-center justify-center gap-1 transition"><span>Spustiť tréning</span> ${svgIcon('arr-r', 'w-3.5 h-3.5 inline')}</button>
                </div>
            </div>
        `;
    }).join('');
}

let pendingSplitIdToSend = null, cachedSharedSplits = [];
async function openSendSplitModal(splitId) {
    if (!isTrainerOrAdmin()) return;
    const split = savedSplits.find(s => s.id === splitId);
    if (!split) return;
    pendingSplitIdToSend = splitId;
    document.getElementById('send-split-title-label').textContent = split.name;
    document.getElementById('send-split-note-input').value = '';
    const sel = document.getElementById('send-split-target-select');
    sel.innerHTML = `<option value="ALL">Všetkým mojim klientom</option>`;
    document.getElementById('modal-send-split').classList.remove('hidden');
    try {
        const testers = await supabaseFetch('beta_testers?is_active=eq.true&select=code,name,trainer_code');
        const myCode = (currentTesterSession?.code || '').toUpperCase();
        (testers || []).forEach(t => {
            if (t.code === myCode) return;
            if (isSuperAdmin() || (t.trainer_code || '').toUpperCase() === myCode) {
                const opt = document.createElement('option');
                opt.value = t.code;
                opt.textContent = `${t.name} (${t.code})`;
                sel.appendChild(opt);
            }
        });
    } catch (e) {}
}
async function confirmSendSplitToTesters() {
    if (!isTrainerOrAdmin() || !pendingSplitIdToSend) return;
    const split = savedSplits.find(s => s.id === pendingSplitIdToSend);
    if (!split) return;
    const targetCode = document.getElementById('send-split-target-select').value || 'ALL';
    const note = document.getElementById('send-split-note-input').value.trim();
    const btn = document.getElementById('send-split-confirm-btn');
    btn.disabled = true; btn.textContent = 'Odosielam...';
    try {
        await supabaseFetch('tester_logs', { method: 'POST', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify({ tester_code: currentTesterSession.code, log_type: 'shared_split', payload: { targetCode, trainerCode: currentTesterSession.code, note, split: JSON.parse(JSON.stringify(split)) } }) });
        document.getElementById('modal-send-split').classList.add('hidden');
        showToast('Split odoslaný ✓');
    } catch (e) { showToast('Chyba odosielania'); }
    finally { btn.disabled = false; btn.textContent = 'Odoslať plán ✓'; }
}
async function fetchSharedTrainerSplits(notifyIfEmpty = false) {
    if (!currentTesterSession?.code) return;
    const box = document.getElementById('shared-trainer-splits-box'), listEl = document.getElementById('shared-trainer-splits-list');
    if (!box || !listEl) return;
    try {
        const rows = await supabaseFetch('tester_logs?log_type=eq.shared_split&select=id,payload,created_at&order=created_at.desc&limit=15');
        const myCode = currentTesterSession.code.toUpperCase();
        const myTrainer = (currentTesterSession.trainer_code || '').toUpperCase();
        const matching = (rows || []).filter(r => {
            const t = (r.payload?.targetCode || 'ALL').toUpperCase();
            const sender = (r.payload?.trainerCode || 'MIRO-ADMIN').toUpperCase();
            if (t === myCode) return true;
            if (t === 'ALL' && !isSoloUser() && sender === myTrainer) return true;
            return false;
        });
        cachedSharedSplits = matching;
        if (matching.length === 0) { box.classList.add('hidden'); if (notifyIfEmpty) showToast('Žiadne nové plány'); return; }
        box.classList.remove('hidden');
        listEl.innerHTML = matching.map((item, idx) => {
            const sp = item.payload?.split;
            if (!sp) return '';
            return `<div class="subcard-surface p-2.5 flex items-center justify-between gap-2"><div class="min-w-0"><div class="text-xs font-extrabold text-white truncate">${sp.name}</div><div class="text-[10px] text-zinc-400 truncate">${sp.blocks?.length || 0} cvikov</div></div><button type="button" onclick="importSharedTrainerSplit(${idx})" class="px-2.5 py-1.5 rounded-lg bg-amber-400 text-zinc-950 font-extrabold text-[11px] shrink-0">Pridať</button></div>`;
        }).join('');
    } catch (e) {}
}
function importSharedTrainerSplit(idx) {
    const sp = cachedSharedSplits[idx]?.payload?.split;
    if (!sp) return;
    const copy = JSON.parse(JSON.stringify(sp));
    copy.id = 'split-trainer-' + Date.now();
    savedSplits.unshift(copy); saveState(); renderSplits(); showToast('Plán pridaný ✓');
}

function startWorkoutFromSplit(splitId) {
    const split = savedSplits.find(s => s.id === splitId);
    if (!split) return;
    editingHistoryId = null;
    const newWorkoutExercises = [];
    let ssCounter = 1;
    split.blocks.forEach(block => {
        if (block.type === 'superset') {
            const ssGroup = `SS-${ssCounter++}`;
            [block.exerciseId, block.exerciseId2].forEach((exId, subIdx) => {
                const exObj = exercises.find(e => e.id === exId);
                if (!exObj) return;
                const lastPerf = getLastPerformance(exObj.id);
                const sets = Array.from({ length: parseInt(block.sets) || 3 }, (_, i) => {
                    const prev = lastPerf?.sets[i];
                    return { mode: prev ? prev.mode : exObj.defaultMode, weight: '', reps: '', prevWeight: prev ? prev.weight : '', prevReps: prev ? prev.reps : '', duration: prev ? prev.duration : 45, rir: prev ? prev.rir : 2, technique: 'superset', completed: false };
                });
                newWorkoutExercises.push({ exerciseId: exObj.id, name: exObj.name, category: exObj.category, supersetGroup: ssGroup, supersetLabel: subIdx === 0 ? 'A1' : 'A2', sets });
            });
        } else {
            const exObj = exercises.find(e => e.id === block.exerciseId);
            if (!exObj) return;
            const lastPerf = getLastPerformance(exObj.id);
            const sets = Array.from({ length: parseInt(block.sets) || 3 }, (_, i) => {
                const prev = lastPerf?.sets[i];
                return { mode: prev ? prev.mode : exObj.defaultMode, weight: '', reps: '', prevWeight: prev ? prev.weight : '', prevReps: prev ? prev.reps : '', duration: prev ? prev.duration : 45, rir: prev ? prev.rir : 2, technique: block.technique || 'standard', completed: false };
            });
            newWorkoutExercises.push({ exerciseId: exObj.id, name: exObj.name, category: exObj.category, sets });
        }
    });
    activeWorkout = newWorkoutExercises; expandedExerciseIndex = 0; workoutStartTime = Date.now();
    localStorage.setItem('fitlog_workout_start', workoutStartTime.toString());
    document.getElementById('workout-title').value = split.name;
    saveWorkoutMeta(); saveState(); renderActiveWorkout(); switchTab('workout');
}
function deleteSplit(splitId) { savedSplits = savedSplits.filter(s => s.id !== splitId); saveState(); renderSplits(); }

function openSplitBuilderModal() {
    draftSplitBlocks = [];
    document.getElementById('split-builder-name').value = '';
    const catOptions = CATEGORIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    document.getElementById('builder-cat1-select').innerHTML = catOptions;
    document.getElementById('builder-cat2-select').innerHTML = catOptions;
    populateBuilderExerciseSelect(1); populateBuilderExerciseSelect(2);
    setSplitBuilderMode('single'); renderDraftSplitBlocks();
    document.getElementById('modal-split-builder').classList.remove('hidden');
}
function populateBuilderExerciseSelect(slotNum) {
    const catId = document.getElementById(`builder-cat${slotNum}-select`)?.value || 'all';
    const exSel = document.getElementById(`builder-ex${slotNum}-select`);
    if (exSel) exSel.innerHTML = exercises.filter(e => catId === 'all' || e.category === catId).map(ex => `<option value="${ex.id}">${ex.name}</option>`).join('');
}
function closeSplitBuilderModal() { document.getElementById('modal-split-builder').classList.add('hidden'); }
function setSplitBuilderMode(mode) {
    builderMode = mode;
    const ex2Wrap = document.getElementById('builder-ex2-wrapper');
    if (ex2Wrap) {
        ex2Wrap.style.display = mode === 'superset' ? 'grid' : 'none';
        ex2Wrap.classList.toggle('hidden', mode !== 'superset');
    }
    document.getElementById('builder-mode-superset').className = mode === 'superset' ? 'px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-600 text-white' : 'px-2.5 py-1 rounded-md text-[11px] font-bold text-zinc-400';
    document.getElementById('builder-mode-single').className = mode === 'single' ? 'px-2.5 py-1 rounded-md text-[11px] font-bold bg-zinc-700 text-white' : 'px-2.5 py-1 rounded-md text-[11px] font-bold text-zinc-400';
}
function addBlockToDraftSplit() {
    const ex1 = document.getElementById('builder-ex1-select').value, ex2 = document.getElementById('builder-ex2-select').value;
    const sets = parseInt(document.getElementById('builder-sets-count').value) || 3, technique = document.getElementById('builder-technique-select').value;
    draftSplitBlocks.push(builderMode === 'superset' ? { type: 'superset', exerciseId: ex1, exerciseId2: ex2, sets, technique: 'superset' } : { type: 'single', exerciseId: ex1, sets, technique });
    renderDraftSplitBlocks();
}
function renderDraftSplitBlocks() {
    document.getElementById('draft-blocks-count').textContent = draftSplitBlocks.length;
    document.getElementById('draft-split-blocks-list').innerHTML = draftSplitBlocks.map((b, i) => {
        const e1 = exercises.find(x => x.id === b.exerciseId);
        return `<div class="subcard-surface px-3 py-2 flex justify-between text-xs"><span class="font-bold text-white">${i + 1}. ${e1?.name || ''} (${b.sets}×)</span><button type="button" onclick="draftSplitBlocks.splice(${i},1);renderDraftSplitBlocks();" class="text-rose-400">${svgIcon('close', 'w-3.5 h-3.5')}</button></div>`;
    }).join('');
}
function saveNewSplit() {
    const name = document.getElementById('split-builder-name').value.trim();
    if (!name || draftSplitBlocks.length === 0) return;
    savedSplits.unshift({ id: 'split-' + Date.now(), name, tag: document.getElementById('split-builder-tag').value, blocks: [...draftSplitBlocks] });
    saveState(); renderSplits(); closeSplitBuilderModal();
}

function renderCategoryPills() {
    document.getElementById('category-pills').innerHTML = CATEGORIES.map(cat => `<button onclick="selectedCategory='${cat.id}'; renderCategoryPills(); renderDatabase();" class="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${selectedCategory === cat.id ? 'bg-brand-500 text-zinc-950' : 'bg-dark-900 text-zinc-400 border border-zinc-800'}">${cat.name}</button>`).join('');
}
function renderDatabase() {
    const container = document.getElementById('database-list');
    const query = (document.getElementById('search-exercise').value || '').toLowerCase().trim();
    const cats = CATEGORIES.filter(c => c.id !== 'all' && (selectedCategory === 'all' || selectedCategory === c.id));
    container.innerHTML = cats.map(cat => {
        const list = exercises.filter(ex => ex.category === cat.id && (!query || ex.name.toLowerCase().includes(query)));
        if (list.length === 0) return '';
        return `<div class="space-y-2"><div class="flex items-center justify-between px-1"><h3 class="text-xs font-extrabold uppercase tracking-wider text-brand-400">${cat.name}</h3><span class="text-[11px] text-zinc-500">${list.length}</span></div><div class="space-y-2">${list.map(ex => {
            const lastPerf = getLastPerformance(ex.id);
            return `<div class="card-surface p-3 flex items-center justify-between gap-2.5"><div onclick="openExerciseDetailModal('${ex.id}')" class="cursor-pointer min-w-0 flex-1"><h4 class="text-xs sm:text-sm font-bold text-white leading-snug">${ex.name}</h4><div class="mt-0.5">${lastPerf ? `<span class="text-[10px] font-bold text-amber-400">Naposledy: ${lastPerf.headline}</span>` : `<span class="text-[10px] text-zinc-500">Technika & Graf ${svgIcon('arr-r', 'w-3.5 h-3.5 inline')}</span>`}</div></div><button onclick="addExerciseToWorkout('${ex.id}')" class="bg-brand-500/15 hover:bg-brand-500 text-brand-400 hover:text-zinc-950 border border-brand-500/30 font-extrabold text-xs px-3 py-2 rounded-xl shrink-0">+ Pridať</button></div>`;
        }).join('')}</div></div>`;
    }).join('');
}
function openNewExerciseModal() { document.getElementById('modal-new-exercise').classList.remove('hidden'); }
function closeNewExerciseModal() { document.getElementById('modal-new-exercise').classList.add('hidden'); }
function createNewExercise() {
    const name = document.getElementById('new-ex-name').value.trim();
    if (!name) return;
    exercises.unshift({ id: 'ex-custom-' + Date.now(), name, category: document.getElementById('new-ex-category').value, defaultMode: document.querySelector('input[name="new-ex-type"]:checked').value });
    saveState(); document.getElementById('new-ex-name').value = ''; closeNewExerciseModal(); renderDatabase(); showToast('Cvik pridaný ✓');
}

function addExerciseToWorkout(exerciseId) {
    const exObj = exercises.find(e => e.id === exerciseId);
    if (!exObj) return;
    if (activeWorkout.length === 0) { workoutStartTime = Date.now(); localStorage.setItem('fitlog_workout_start', workoutStartTime.toString()); }
    const lastPerf = getLastPerformance(exObj.id);
    const initialSets = lastPerf?.sets?.length > 0
        ? lastPerf.sets.map(s => ({ mode: s.mode || exObj.defaultMode, weight: '', reps: '', prevWeight: s.weight || '', prevReps: s.reps || '', duration: s.duration || 45, rir: s.rir ?? 2, technique: s.technique || 'standard', completed: false }))
        : [{ mode: exObj.defaultMode, weight: '', reps: '', prevWeight: '', prevReps: '', duration: 45, rir: 2, technique: 'standard', completed: false }];
    activeWorkout.push({ exerciseId: exObj.id, name: exObj.name, category: exObj.category, sets: initialSets });
    expandedExerciseIndex = activeWorkout.length - 1;
    saveState(); renderActiveWorkout(); switchTab('workout');
}
function setExpandedExercise(idx) { expandedExerciseIndex = idx; saveState(); renderActiveWorkout(); }
function removeExerciseFromWorkout(exIdx) {
    const target = activeWorkout[exIdx];
    if (target?.supersetGroup) activeWorkout = activeWorkout.filter(item => item.supersetGroup !== target.supersetGroup);
    else activeWorkout.splice(exIdx, 1);
    if (expandedExerciseIndex >= activeWorkout.length) expandedExerciseIndex = Math.max(0, activeWorkout.length - 1);
    if (activeWorkout.length === 0) { workoutStartTime = null; localStorage.removeItem('fitlog_workout_start'); }
    saveState(); renderActiveWorkout();
}
function addSet(exIdx) {
    const ex = activeWorkout[exIdx];
    if (!ex) return;
    const targets = ex.supersetGroup ? activeWorkout.filter(item => item.supersetGroup === ex.supersetGroup) : [ex];
    targets.forEach(item => {
        const last = item.sets[item.sets.length - 1];
        item.sets.push(last
            ? { mode: last.mode, weight: '', reps: '', prevWeight: last.weight || last.prevWeight || '', prevReps: last.reps || last.prevReps || '', duration: last.duration || 45, rir: last.rir ?? 2, technique: last.technique || 'standard', completed: false }
            : { mode: 'reps', weight: '', reps: '', prevWeight: '', prevReps: '', duration: 45, rir: 2, technique: 'standard', completed: false });
    });
    saveState(); renderActiveWorkout();
}
function updateWorkoutStatsHeader() {
    const exCountEl = document.getElementById('stat-exercises'), setCountEl = document.getElementById('stat-sets');
    const volEl = document.getElementById('stat-volume'), finishBtn = document.getElementById('header-finish-btn');
    let totalSets = 0;
    activeWorkout.forEach(ex => { totalSets += (ex.sets || []).length; });
    if (exCountEl) exCountEl.textContent = activeWorkout.length;
    if (setCountEl) setCountEl.textContent = totalSets;
    if (volEl) volEl.textContent = formatVolumeKg(calculateTotalVolume(activeWorkout));
    if (finishBtn) finishBtn.classList.toggle('hidden', activeWorkout.length === 0);
}
function updateSetField(exIdx, setIdx, field, value) {
    if (!activeWorkout[exIdx]?.sets[setIdx]) return;
    activeWorkout[exIdx].sets[setIdx][field] = value;
    saveState(); updateWorkoutStatsHeader();
}
function adjustSetNumber(exIdx, setIdx, field, delta, minVal = 0) {
    const set = activeWorkout[exIdx]?.sets[setIdx];
    if (!set) return;
    const fallback = field === 'weight' ? (parseFloat(set.prevWeight) || 0) : (parseInt(set.prevReps) || 0);
    const current = set[field] === '' || set[field] === undefined ? fallback : parseFloat(set[field]) || 0;
    set[field] = Math.max(minVal, Math.round((current + delta) * 10) / 10);
    saveState(); renderActiveWorkout();
}
function toggleSetMode(exIdx, setIdx) {
    const set = activeWorkout[exIdx]?.sets[setIdx];
    if (!set) return;
    set.mode = set.mode === 'time' ? 'reps' : 'time';
    saveState(); renderActiveWorkout();
}
function removeSet(exIdx, setIdx) {
    const ex = activeWorkout[exIdx];
    if (!ex || ex.sets.length <= 1) return;
    ex.sets.splice(setIdx, 1); saveState(); renderActiveWorkout();
}
function toggleSetCompleted(exIdx, setIdx) {
    const set = activeWorkout[exIdx]?.sets[setIdx];
    if (!set) return;
    set.completed = !set.completed;
    saveState(); renderActiveWorkout();
    if (set.completed) startRestTimer(90);
}
function openTimeModal(exIdx, setIdx) {
    const set = activeWorkout[exIdx]?.sets[setIdx];
    if (!set) return;
    editingTimeTarget = { exIndex: exIdx, setIndex: setIdx };
    const totalSec = parseInt(set.duration) || 30;
    document.getElementById('time-input-min').value = Math.floor(totalSec / 60);
    document.getElementById('time-input-sec').value = totalSec % 60;
    document.getElementById('modal-time-picker').classList.remove('hidden');
}
function closeTimeModal() { document.getElementById('modal-time-picker').classList.add('hidden'); }
function applyPresetTime(seconds) {
    const { exIndex, setIndex } = editingTimeTarget;
    if (exIndex !== null && setIndex !== null && activeWorkout[exIndex]?.sets[setIndex]) {
        activeWorkout[exIndex].sets[setIndex].duration = seconds;
        saveState(); renderActiveWorkout();
    }
    closeTimeModal();
}
function saveCustomTime() {
    const mins = Math.max(0, parseInt(document.getElementById('time-input-min').value) || 0);
    const secs = Math.max(0, parseInt(document.getElementById('time-input-sec').value) || 0);
    applyPresetTime(Math.max(1, mins * 60 + secs));
}

function renderSingleSetCardHtml(ex, exIdx, set, setIdx, accentLabel = '') {
    return `
        <div class="subcard-surface ${set.completed ? 'border-brand-500/50 bg-brand-500/5' : ''} p-3 space-y-2.5">
            <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                    <span class="px-2 h-6 rounded-lg bg-dark-900 border border-zinc-800 text-xs font-extrabold text-zinc-200 flex items-center justify-center shrink-0">${accentLabel || (setIdx + 1)}</span>
                    <select onchange="updateSetField(${exIdx}, ${setIdx}, 'technique', this.value); renderActiveWorkout();" class="bg-dark-900 border border-zinc-800 rounded-lg px-2 py-1 text-[11px] font-bold text-zinc-200 truncate">
                        ${SET_TECHNIQUES.map(t => `<option value="${t.id}" ${set.technique === t.id ? 'selected' : ''}>${t.label}</option>`).join('')}
                    </select>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                    <button onclick="toggleSetMode(${exIdx}, ${setIdx})" class="px-2 py-1 rounded-lg bg-dark-900 border border-zinc-800 text-[10px] font-bold text-zinc-300">${set.mode === 'time' ? 'Čas' : 'Opak.'}</button>
                    ${ex.sets.length > 1 ? `<button onclick="removeSet(${exIdx}, ${setIdx})" class="p-1 text-zinc-500 hover:text-rose-400">${svgIcon('close', 'w-3.5 h-3.5')}</button>` : ''}
                </div>
            </div>
            <div class="grid grid-cols-12 gap-2 items-center">
                <div class="col-span-5">
                    <label class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Váha (kg)</label>
                    <div class="flex items-center bg-dark-900 border border-zinc-800 rounded-xl overflow-hidden">
                        <button type="button" onclick="adjustSetNumber(${exIdx}, ${setIdx}, 'weight', -2.5, 0)" class="px-2 py-2 text-zinc-400 hover:text-white font-black text-sm">${svgIcon('minus', 'w-3.5 h-3.5')}</button>
                        <input type="number" step="0.5" placeholder="${set.prevWeight || '0'}" value="${set.weight}" oninput="updateSetField(${exIdx}, ${setIdx}, 'weight', this.value)" class="w-full min-w-0 bg-transparent py-2 text-center text-sm font-extrabold text-white placeholder-zinc-600 focus:outline-none">
                        <button type="button" onclick="adjustSetNumber(${exIdx}, ${setIdx}, 'weight', 2.5, 0)" class="px-2 py-2 text-brand-400 font-black text-sm">${svgIcon('plus', 'w-3.5 h-3.5')}</button>
                    </div>
                </div>
                <div class="col-span-5">
                    ${set.mode === 'time' ? `
                        <label class="block text-[10px] font-bold uppercase text-sky-400 mb-1">Trvanie</label>
                        <button onclick="openTimeModal(${exIdx}, ${setIdx})" class="w-full bg-dark-900 border border-sky-500/40 rounded-xl px-2.5 py-2 text-center text-sm font-extrabold text-sky-300">${formatDuration(set.duration)}</button>
                    ` : `
                        <label class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Opakovania</label>
                        <div class="flex items-center bg-dark-900 border border-zinc-800 rounded-xl overflow-hidden">
                            <button type="button" onclick="adjustSetNumber(${exIdx}, ${setIdx}, 'reps', -1, 0)" class="px-2 py-2 text-zinc-400 hover:text-white font-black text-sm">${svgIcon('minus', 'w-3.5 h-3.5')}</button>
                            <input type="number" placeholder="${set.prevReps || '0'}" value="${set.reps}" oninput="updateSetField(${exIdx}, ${setIdx}, 'reps', this.value)" class="w-full min-w-0 bg-transparent py-2 text-center text-sm font-extrabold text-white placeholder-zinc-600 focus:outline-none">
                            <button type="button" onclick="adjustSetNumber(${exIdx}, ${setIdx}, 'reps', 1, 0)" class="px-2 py-2 text-brand-400 font-black text-sm">${svgIcon('plus', 'w-3.5 h-3.5')}</button>
                        </div>
                    `}
                </div>
                <div class="col-span-2 pt-4">
                    <button onclick="toggleSetCompleted(${exIdx}, ${setIdx})" class="w-full h-10 rounded-xl flex items-center justify-center font-extrabold text-sm border ${set.completed ? 'bg-brand-500 border-brand-400 text-zinc-950' : 'bg-dark-900 border-zinc-800 text-zinc-400'}">${svgIcon('ok', 'w-4 h-4')}</button>
                </div>
            </div>
            ${set.mode === 'time' ? `<button onclick="startLiveSetCountdown(${exIdx}, ${setIdx})" class="w-full py-2 rounded-xl bg-sky-500/15 border border-sky-500/35 text-sky-300 font-extrabold text-xs">Spustiť odpočet (${formatDuration(set.duration)})</button>` : ''}
            <div class="pt-1 border-t border-zinc-800/80">
                <div class="flex items-center justify-between mb-1">
                    <span class="text-[10px] font-bold text-zinc-400">${getRirDescription(set.rir)}</span>
                    <div class="flex items-center gap-1.5">
                        <button onclick="openEduModal('rir')" class="text-[10px] font-bold text-sky-400 underline">RIR?</button>
                        <span class="text-[10px] font-extrabold px-2 py-0.5 rounded border ${getRirBadgeStyle(set.rir)}">RIR ${set.rir}</span>
                    </div>
                </div>
                <input type="range" min="0" max="10" value="${set.rir}" oninput="updateSetField(${exIdx}, ${setIdx}, 'rir', this.value); renderActiveWorkout();" class="w-full accent-emerald-500 h-1.5 bg-dark-900 rounded-lg cursor-pointer">
            </div>
        </div>
    `;
}

function renderActiveWorkout() {
    const container = document.getElementById('active-exercises-container');
    const emptyState = document.getElementById('empty-workout-state');
    updateWorkoutStatsHeader();
    if (activeWorkout.length === 0) { container.innerHTML = ''; emptyState.classList.remove('hidden'); return; }
    emptyState.classList.add('hidden');
    if (expandedExerciseIndex >= activeWorkout.length || expandedExerciseIndex < 0) expandedExerciseIndex = 0;

    const blocks = [];
    for (let i = 0; i < activeWorkout.length; i++) {
        const cur = activeWorkout[i], next = activeWorkout[i + 1];
        if (cur.supersetGroup && next && next.supersetGroup === cur.supersetGroup) {
            blocks.push({ type: 'superset', items: [{ ex: cur, exIdx: i }, { ex: next, exIdx: i + 1 }] });
            i++;
        } else {
            blocks.push({ type: 'single', items: [{ ex: cur, exIdx: i }] });
        }
    }

    container.innerHTML = blocks.map((block, bIdx) => {
        const isExpanded = block.items.some(it => it.exIdx === expandedExerciseIndex);
        const firstIdx = block.items[0].exIdx;
        const lastBlockIdx = block.items[block.items.length - 1].exIdx;
        const isLastBlock = lastBlockIdx === activeWorkout.length - 1;
        const nextBlockFirstIdx = !isLastBlock ? blocks[bIdx + 1].items[0].exIdx : null;

        if (block.type === 'superset') {
            const [a1, a2] = block.items;
            const allDone = block.items.every(it => it.ex.sets.every(s => s.completed) && it.ex.sets.length > 0);
            const totalSetsCount = Math.max(a1.ex.sets.length, a2.ex.sets.length);
            const donePairs = Math.min(a1.ex.sets.filter(s => s.completed).length, a2.ex.sets.filter(s => s.completed).length);

            if (!isExpanded) {
                return `<div onclick="setExpandedExercise(${firstIdx})" class="cursor-pointer card-surface ${allDone ? 'border-brand-500/40' : 'border-purple-500/35'} px-3.5 py-2.5 flex items-center justify-between gap-2.5"><div class="flex items-center gap-2.5 min-w-0"><div class="w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 ${allDone ? 'bg-brand-500 text-zinc-950' : 'bg-purple-500/20 text-purple-300'}">${allDone ? '✓' : 'SS'}</div><div class="min-w-0"><div class="text-[10px] font-extrabold text-purple-400">SUPERSÉRIA (${donePairs}/${totalSetsCount})</div><h4 class="text-xs font-bold text-white truncate">A1: ${a1.ex.name} + A2: ${a2.ex.name}</h4></div></div><span class="text-xs font-bold text-purple-300 shrink-0">Otvoriť ${svgIcon('arr-r', 'w-3.5 h-3.5 inline')}</span></div>`;
            }

            const roundsHtml = Array.from({ length: totalSetsCount }, (_, sIdx) => `
                <div class="bg-dark-950/90 border border-purple-500/35 rounded-2xl p-2.5 space-y-2">
                    <div class="flex items-center justify-between px-1"><span class="text-[11px] font-black uppercase text-purple-300">Kolo ${sIdx + 1} z ${totalSetsCount}</span></div>
                    ${a1.ex.sets[sIdx] ? `<div class="space-y-1"><div class="text-[11px] font-extrabold text-white px-1 flex items-center justify-between"><span><span class="text-purple-400">A1:</span> ${a1.ex.name}</span><button onclick="openExerciseDetailModal('${a1.ex.exerciseId}')" class="text-[10px] text-sky-400">Info</button></div>${renderSingleSetCardHtml(a1.ex, a1.exIdx, a1.ex.sets[sIdx], sIdx, `A1 • ${sIdx + 1}`)}</div>` : ''}
                    ${a2.ex.sets[sIdx] ? `<div class="space-y-1 pt-1"><div class="text-[11px] font-extrabold text-white px-1 flex items-center justify-between"><span><span class="text-amber-400">A2:</span> ${a2.ex.name}</span><button onclick="openExerciseDetailModal('${a2.ex.exerciseId}')" class="text-[10px] text-sky-400">Info</button></div>${renderSingleSetCardHtml(a2.ex, a2.exIdx, a2.ex.sets[sIdx], sIdx, `A2 • ${sIdx + 1}`)}</div>` : ''}
                </div>
            `).join('');

            return `
                <div class="card-surface border-2 border-purple-500/60 p-4 space-y-3.5">
                    <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0"><span class="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">SUPERSÉRIA</span><h3 class="text-sm font-extrabold text-white mt-1">A1: ${a1.ex.name}</h3><h3 class="text-sm font-extrabold text-purple-200">A2: ${a2.ex.name}</h3></div>
                        <button onclick="removeExerciseFromWorkout(${firstIdx})" class="p-1.5 rounded-xl bg-dark-850 text-zinc-500 hover:text-rose-400">${svgIcon('close', 'w-3.5 h-3.5')}</button>
                    </div>
                    <div class="space-y-3">${roundsHtml}</div>
                    <button onclick="addSet(${firstIdx})" class="w-full py-2.5 rounded-xl bg-purple-500/15 border border-dashed border-purple-500/40 text-xs font-bold text-purple-200">+ Pridať kolo supersérie</button>
                    <div class="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
                        <span class="text-[11px] text-zinc-400">Blok ${bIdx + 1} z ${blocks.length}</span>
                        ${!isLastBlock ? `<button onclick="setExpandedExercise(${nextBlockFirstIdx})" class="bg-brand-500 text-zinc-950 font-extrabold text-xs px-4 py-2 rounded-xl">Ďalší cvik ${svgIcon('arr-r', 'w-3.5 h-3.5 inline')}</button>` : `<button onclick="saveWorkoutToHistory()" class="bg-brand-500 text-zinc-950 font-extrabold text-xs px-4 py-2 rounded-xl">Dokončiť ${svgIcon('ok', 'w-3.5 h-3.5 inline')}</button>`}
                    </div>
                </div>
            `;
        }

        const { ex, exIdx } = block.items[0];
        const catObj = CATEGORIES.find(c => c.id === ex.category);
        const doneCount = ex.sets.filter(s => s.completed).length;
        const allDone = doneCount === ex.sets.length && ex.sets.length > 0;

        if (!isExpanded) {
            const maxW = Math.max(...ex.sets.map(s => parseFloat(s.weight) || 0));
            const best = maxW > 0 ? `max ${maxW} kg` : '';
            return `<div onclick="setExpandedExercise(${exIdx})" class="cursor-pointer card-surface ${allDone ? 'border-brand-500/40' : ''} px-3.5 py-2.5 flex items-center justify-between gap-2.5"><div class="flex items-center gap-2.5 min-w-0"><div class="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 ${allDone ? 'bg-brand-500 text-zinc-950' : 'bg-dark-850 text-zinc-300 border border-zinc-800'}">${allDone ? '✓' : bIdx + 1}</div><div class="min-w-0"><h4 class="text-xs sm:text-sm font-bold text-white truncate">${ex.name}</h4><div class="text-[11px] text-zinc-400">${doneCount}/${ex.sets.length} sérií ${best ? `• <span class="text-amber-400">${best}</span>` : ''}</div></div></div><span class="text-xs font-bold text-brand-400 shrink-0">Otvoriť ${svgIcon('arr-r', 'w-3.5 h-3.5 inline')}</span></div>`;
        }

        const lastPerf = getLastPerformance(ex.exerciseId);
        const suggestedWarmupW = lastPerf?.maxWeight || parseFloat(ex.sets[0]?.weight) || 60;
        const setsRowsHtml = ex.sets.map((set, setIdx) => renderSingleSetCardHtml(ex, exIdx, set, setIdx)).join('');

        return `
            <div class="card-surface border-2 border-brand-500/60 p-4 space-y-3.5">
                <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0"><span class="text-[10px] font-extrabold uppercase text-brand-400">${catObj?.name || ''}</span><h3 onclick="openExerciseDetailModal('${ex.exerciseId}')" class="cursor-pointer text-base font-extrabold text-white leading-tight mt-0.5">${ex.name}</h3></div>
                    <div class="flex items-center gap-1.5 shrink-0">
                        <button onclick="openWarmupModal(${suggestedWarmupW})" class="px-2 py-1.5 rounded-xl bg-dark-850 border border-zinc-800 text-amber-300 text-[10px] font-bold">Rozohriať</button>
                        <button onclick="openExerciseDetailModal('${ex.exerciseId}')" class="px-2 py-1.5 rounded-xl bg-dark-850 border border-zinc-800 text-sky-300 text-[10px] font-bold">Graf</button>
                        <button onclick="removeExerciseFromWorkout(${exIdx})" class="p-1.5 rounded-xl bg-dark-850 text-zinc-500 hover:text-rose-400">${svgIcon('close', 'w-3.5 h-3.5')}</button>
                    </div>
                </div>
                ${lastPerf ? `<div class="subcard-surface p-2.5 text-[11px] space-y-0.5"><div class="font-extrabold text-amber-400">Naposledy (${lastPerf.date}): max ${lastPerf.headline}</div><div class="text-[10px] text-zinc-400">${lastPerf.setsText}</div>${lastPerf.lastNote ? `<div class="text-[10.5px] text-sky-300 pt-0.5">Poznámka z minula: ${lastPerf.lastNote}</div>` : ''}</div>` : ''}
                <input type="text" value="${(ex.note || '').replace(/"/g, '&quot;')}" oninput="updateExerciseNote(${exIdx}, this.value)" placeholder="Poznámka k cviku (sedadlo, úchop, pocit v kĺbe...)" class="w-full bg-dark-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand-500">
                <div class="space-y-2.5">${setsRowsHtml}</div>
                <button onclick="addSet(${exIdx})" class="w-full py-2.5 rounded-xl bg-dark-850 border border-dashed border-zinc-700 text-xs font-bold text-zinc-300">+ Pridať sériu</button>
                <div class="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
                    <span class="text-[11px] text-zinc-400">Blok ${bIdx + 1} z ${blocks.length}</span>
                    ${!isLastBlock ? `<button onclick="setExpandedExercise(${nextBlockFirstIdx})" class="bg-brand-500 text-zinc-950 font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1"><span>Ďalší cvik</span> ${svgIcon('arr-r', 'w-3.5 h-3.5 inline')}</button>` : `<button onclick="saveWorkoutToHistory()" class="bg-brand-500 text-zinc-950 font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1"><span>Dokončiť</span> ${svgIcon('ok', 'w-3.5 h-3.5 inline')}</button>`}
                </div>
            </div>
        `;
    }).join('');
}

function updateExerciseNote(exIdx, noteVal) {
    if (!activeWorkout[exIdx]) return;
    activeWorkout[exIdx].note = noteVal;
    saveState();
}

function saveWorkoutToHistory() {
    if (activeWorkout.length === 0) return;
    stopRestTimer();
    const title = document.getElementById('workout-title').value.trim() || 'Tréning';
    const totalVolume = calculateTotalVolume(activeWorkout);
    const prof = getActiveProfile();
    const dateStr = new Date().toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const durationMin = workoutStartTime ? Math.max(1, Math.round((Date.now() - workoutStartTime) / 60000)) : 0;
    const snapshotExercises = JSON.parse(JSON.stringify(activeWorkout));

    const existingIdx = editingHistoryId ? workoutHistory.findIndex(w => w.id === editingHistoryId) : -1;
    if (existingIdx >= 0) {
        const prev = workoutHistory[existingIdx];
        workoutHistory[existingIdx] = { ...prev, title, totalVolume, durationMin: Math.max(prev.durationMin || 0, durationMin), readiness: { ...preWorkoutReadiness }, exercises: snapshotExercises };
    } else {
        workoutHistory.unshift({ id: 'workout-' + Date.now(), profileId: prof.id, profileName: prof.name, title, date: dateStr, durationMin, totalVolume, readiness: { ...preWorkoutReadiness }, exercises: snapshotExercises });
    }

    editingHistoryId = null; activeWorkout = []; expandedExerciseIndex = 0; workoutStartTime = null;
    localStorage.removeItem('fitlog_workout_start');
    document.getElementById('workout-title').value = 'Dnešný tréning';
    saveWorkoutMeta(); saveState(); renderActiveWorkout(); renderDatabase(); renderHistory(); switchTab('history');
    sendCloudTesterLog('workout_completed', { title, date: dateStr, durationMin, totalVolume, exercisesCount: snapshotExercises.length, exercises: snapshotExercises });
    showToast(`Uložené (${formatVolumeKg(totalVolume)}) ✓`);
}

function repeatWorkoutToday(workoutId) {
    const w = workoutHistory.find(x => x.id === workoutId);
    if (!w) return;
    editingHistoryId = null;
    activeWorkout = (w.exercises || []).map(ex => ({
        exerciseId: ex.exerciseId,
        name: ex.name,
        category: ex.category,
        supersetGroup: ex.supersetGroup || undefined,
        supersetLabel: ex.supersetLabel || undefined,
        note: '',
        sets: (ex.sets || []).map(s => ({
            mode: s.mode || 'reps',
            weight: '',
            reps: '',
            prevWeight: s.weight || s.prevWeight || '',
            prevReps: s.reps || s.prevReps || '',
            duration: s.duration || 45,
            rir: s.rir ?? 2,
            technique: s.technique || 'standard',
            completed: false
        }))
    }));
    expandedExerciseIndex = 0;
    workoutStartTime = Date.now();
    localStorage.setItem('fitlog_workout_start', workoutStartTime.toString());
    document.getElementById('workout-title').value = w.title || 'Tréning';
    saveWorkoutMeta(); saveState(); renderActiveWorkout(); switchAppDomain('training'); switchTab('workout');
    showToast('Tréning pripravený na dnes ✓');
}

function reopenWorkoutFromHistory(workoutId) {
    const w = workoutHistory.find(x => x.id === workoutId);
    if (!w) return;
    editingHistoryId = w.id;
    activeWorkout = JSON.parse(JSON.stringify(w.exercises || []));
    expandedExerciseIndex = Math.max(0, activeWorkout.length - 1);
    workoutStartTime = Date.now() - ((w.durationMin || 0) * 60000);
    localStorage.setItem('fitlog_workout_start', workoutStartTime.toString());
    document.getElementById('workout-title').value = w.title || 'Tréning';
    saveWorkoutMeta(); saveState(); renderActiveWorkout(); switchAppDomain('training'); switchTab('workout');
}

function shareWorkoutReport(workoutId) {
    const w = workoutHistory.find(x => x.id === workoutId);
    if (!w) return;
    const vol = w.totalVolume !== undefined ? w.totalVolume : calculateTotalVolume(w.exercises || []);
    let report = `MM LAB – Report
Meno: ${w.profileName || getActiveProfile().name}
Dátum: ${w.date} | Objem: ${formatVolumeKg(vol)}
Tréning: ${w.title}
------------------------
`;
    (w.exercises || []).forEach((ex, i) => {
        const setsStr = (ex.sets || []).map(s => `${s.weight ? s.weight + 'kg' : 'BW'}×${s.mode === 'time' ? formatDuration(s.duration) : s.reps + 'x'} (RIR ${s.rir})`).join(', ');
        report += `${i + 1}. ${ex.name}: ${setsStr}${ex.note ? ` [${ex.note}]` : ''}
`;
    });
    copyTextToClipboard(report, 'Report skopírovaný ✓');
}

function deleteHistoryRecord(workoutId) { workoutHistory = workoutHistory.filter(w => w.id !== workoutId); saveState(); renderHistory(); renderDatabase(); }

function renderHistoryPRSummary(profileWorkouts) {
    const box = document.getElementById('history-pr-summary');
    if (!box) return;
    const prMap = {};
    (profileWorkouts || []).forEach(w => {
        (w.exercises || []).forEach(ex => {
            (ex.sets || []).forEach(s => {
                const weight = parseFloat(s.weight) || 0;
                const reps = parseInt(s.reps) || 1;
                if (s.mode === 'time' || weight <= 0) return;
                const est1RM = Math.round(weight * (1 + reps / 30));
                if (!prMap[ex.exerciseId] || est1RM > prMap[ex.exerciseId].est1RM) {
                    prMap[ex.exerciseId] = {
                        exerciseId: ex.exerciseId,
                        name: ex.name,
                        bestWeight: weight,
                        bestReps: reps,
                        est1RM
                    };
                }
            });
        });
    });
    const topPRs = Object.values(prMap).sort((a, b) => b.est1RM - a.est1RM).slice(0, 6);
    if (topPRs.length === 0) {
        box.classList.add('hidden');
        return;
    }
    box.classList.remove('hidden');
    box.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-xs font-extrabold text-amber-300">Osobné rekordy (PR & odhad 1RM)</span>
            <span class="text-[10px] text-zinc-400">Top ${topPRs.length} cvikov</span>
        </div>
        <div class="grid grid-cols-2 gap-2">
            ${topPRs.map(pr => `
                <div onclick="openExerciseDetailModal('${pr.exerciseId}')" class="cursor-pointer subcard-surface hover:border-amber-400/40 p-2.5 transition">
                    <div class="text-[11px] font-bold text-white truncate">${pr.name}</div>
                    <div class="flex items-baseline justify-between gap-1 mt-1">
                        <span class="text-xs font-black text-brand-400">${pr.bestWeight} kg × ${pr.bestReps}</span>
                        <span class="text-[10px] font-extrabold text-amber-300">1RM: ${pr.est1RM} kg</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderHistory() {
    const container = document.getElementById('history-list'), badge = document.getElementById('history-count-badge');
    if (!container) return;
    const list = workoutHistory.filter(w => (w.profileId || 'me') === activeProfileId);
    badge.textContent = `${list.length}`;
    renderHistoryPRSummary(list);
    if (list.length === 0) { container.innerHTML = `<div class="text-center py-10 px-4 card-surface border-dashed text-xs text-zinc-400">Zatiaľ žiadne uložené tréningy.</div>`; return; }
    container.innerHTML = list.map(w => {
        const vol = w.totalVolume !== undefined ? w.totalVolume : calculateTotalVolume(w.exercises || []);
        return `
            <div class="card-surface p-4 space-y-3">
                <div class="flex items-start justify-between gap-2">
                    <div>
                        <div class="flex items-center gap-2 flex-wrap"><span class="text-[11px] font-bold text-zinc-400">${w.date}</span>${vol > 0 ? `<span class="text-[10px] font-extrabold bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded">${formatVolumeKg(vol)}</span>` : ''}</div>
                        <h3 class="text-sm font-extrabold text-white mt-1">${w.title}</h3>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        <button onclick="repeatWorkoutToday('${w.id}')" class="px-2.5 py-1 rounded-lg bg-brand-500 text-zinc-950 text-[11px] font-extrabold">Zopakovať dnes</button>
                        <button onclick="reopenWorkoutFromHistory('${w.id}')" class="px-2 py-1 rounded-lg bg-dark-850 border border-zinc-800 text-amber-300 text-[11px] font-bold">Upraviť</button>
                        <button onclick="exportWorkoutToTCX('${w.id}')" class="px-2 py-1 rounded-lg bg-dark-850 border border-zinc-800 text-sky-300 text-[11px] font-bold">.TCX</button>
                        <button onclick="shareWorkoutReport('${w.id}')" class="px-2 py-1 rounded-lg bg-brand-500/15 text-brand-400 text-[11px] font-bold">Report</button>
                        <button onclick="deleteHistoryRecord('${w.id}')" class="p-1 text-zinc-500 hover:text-rose-400">${svgIcon('close', 'w-3.5 h-3.5')}</button>
                    </div>
                </div>
                <div class="space-y-1.5">
                    ${(w.exercises || []).map(ex => `<div onclick="openExerciseDetailModal('${ex.exerciseId}')" class="cursor-pointer subcard-surface p-2.5 flex items-center justify-between gap-2"><div class="min-w-0"><div class="text-xs font-bold text-white truncate">${ex.name}</div><div class="text-[11px] text-zinc-400 mt-0.5">${(ex.sets || []).map(s => `${s.weight ? s.weight + ' kg' : 'BW'} × ${s.mode === 'time' ? formatDuration(s.duration) : s.reps + '×'} (RIR ${s.rir})`).join(' | ')}</div>${ex.note ? `<div class="text-[10.5px] text-amber-300 mt-0.5 truncate">Poznámka: ${ex.note}</div>` : ''}</div><span class="text-[10px] font-extrabold text-sky-400 shrink-0">Graf</span></div>`).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function openBackupModal() { document.getElementById('modal-backup').classList.remove('hidden'); }
function closeBackupModal() { document.getElementById('modal-backup').classList.add('hidden'); }
function exportDataJSON() {
    const payload = { app: 'MM LAB', version: APP_VERSION, exportedAt: new Date().toISOString(), ...buildCurrentStatePayload() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `MM_LAB_zaloha_${getTodayISO()}.json`; a.click();
    URL.revokeObjectURL(url); closeBackupModal(); showToast('Záloha stiahnutá ✓');
}
function importDataJSON(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            if (Array.isArray(data.profiles)) profiles = data.profiles;
            if (Array.isArray(data.exercises)) exercises = data.exercises;
            if (Array.isArray(data.splits || data.savedSplits)) savedSplits = data.splits || data.savedSplits;
            if (Array.isArray(data.history || data.workoutHistory)) workoutHistory = data.history || data.workoutHistory;
            if (data.userSupplementStacks) userSupplementStacks = data.userSupplementStacks;
            if (data.nutritionDataByProfile) nutritionDataByProfile = data.nutritionDataByProfile;
            if (data.bodyCheckInsByProfile) bodyCheckInsByProfile = data.bodyCheckInsByProfile;
            if (data.weeklyCheckInsByProfile) weeklyCheckInsByProfile = data.weeklyCheckInsByProfile;
            if (data.biometricsByProfile) biometricsByProfile = data.biometricsByProfile;
            saveState(); updateHeaderProfileUI(); initBiometricsUI(); renderDatabase(); renderSplits(); renderHistory();
            closeBackupModal(); showToast('Dáta obnovené ✓');
        } catch (err) { showToast('Neplatný súbor .JSON'); }
    };
    reader.readAsText(file);
}

function copyTextToClipboard(text, successMsg) {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); showToast(successMsg); } catch (e) { showToast('Nepodarilo sa skopírovať'); }
    document.body.removeChild(ta);
}

let toastTimeout = null;
function showToast(msg) {
    const toast = document.getElementById('toast'), msgEl = document.getElementById('toast-message');
    if (!toast || !msgEl) return;
    msgEl.textContent = msg;
    toast.classList.remove('opacity-0', '-translate-y-2');
    toast.classList.add('opacity-100', 'translate-y-0');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { toast.classList.remove('opacity-100', 'translate-y-0'); toast.classList.add('opacity-0', '-translate-y-2'); }, 2400);
}

document.addEventListener('DOMContentLoaded', () => {
    hydrateStaticSvgIcons();
    const savedTitle = localStorage.getItem('fitlog_workout_title');
    if (savedTitle) document.getElementById('workout-title').value = savedTitle;
    const newExCat = document.getElementById('new-ex-category');
    if (newExCat) newExCat.innerHTML = CATEGORIES.filter(c => c.id !== 'all').map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    const techSel = document.getElementById('builder-technique-select');
    if (techSel) techSel.innerHTML = SET_TECHNIQUES.map(t => `<option value="${t.id}">${t.label}</option>`).join('');

    updateHeaderProfileUI(); initBiometricsUI(); initPreWorkoutReadinessUI(); updateSuppBadgeCount();
    renderCategoryPills(); renderDatabase(); renderSplits(); renderActiveWorkout(); renderHistory();
    renderDynamicBottomNav('training', 'workout');
    startWorkoutTimer();

    checkTesterAccessOnStartup().then(() => {
        renderSplits();
        fetchSharedTrainerSplits(false);
        fetchSharedTrainerMealPlans(false);
        fetchScheduledWorkouts(false);
        fetchLabFeedPosts();
        fetchCommunityFoodCatalog();
    });
});
