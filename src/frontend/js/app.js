/**
 * ytninza — Frontend Application
 */

const API_BASE = '/api';

const LOADING_MESSAGES = [
    '유튜브 서버를 설득하는 중...',
    'Patience is bitter, but its fruit is sweet.\n― Aristotle',
    '서버 햄스터가 쳇바퀴를 돌리는 중...',
    'The server hamster is running on its wheel...',
    '천 리 길도 한 걸음부터.\n― 노자',
    'A journey of a thousand miles begins with a single step.\n― Lao Tzu',
    '데이터가 택배 기사를 기다리는 중...',
    'Good things come to those who wait.\n― English Proverb',
    '급할수록 돌아가라.\n― 한국 속담',
    'Slow and steady wins the race.\n― Aesop',
    '시작이 반이다. 지금 반은 했다.',
    'Well begun is half done.\n― Aristotle',
    '유튜브가 심호흡하는 중...',
    'YouTube is taking a deep breath...',
    '서버가 커피를 내리는 중...',
    'The server is brewing coffee...',
    '잠깐, 뭔가 대단한 일이 일어나고 있다...',
    'Something amazing is happening...',
    '기다림의 미학을 실천하는 중...',
    'The best things in life are worth waiting for.',
    '알고리즘이 워밍업하는 중...',
    'The algorithm is warming up...',
    '빠른 것보다 정확한 게 낫다.',
    'It does not matter how slowly you go,\nas long as you do not stop.\n― Confucius',
    '구글 서버에 정중하게 노크하는 중...',
    'Politely knocking on Google servers...',
    '아직 여기 있다. 도망 안 갔다.',
    'Still here. Didn\'t run away.',
    '위대한 영상에는 위대한 인내가 필요하다.',
    'Great videos require great patience.',
    '잠깐이면 된다. 아마도. 거의. 곧.',
    'Just a moment. Probably. Almost. Soon.',
    '인내는 쓰다. 그 열매는 달다.\n― 아리스토텔레스',
    'Stay hungry, stay foolish.\n― Steve Jobs',
    '모든 위대한 일은 느리게 시작된다.\n― 토마스 칼라일',
    'All great things start slowly.\n― Thomas Carlyle',
    '좋은 것은 기다리는 자에게 온다.\n― 영국 속담',
    'Have patience. All things are difficult\nbefore they become easy.\n― Saadi',
    '로딩은 예술이다. 지금 감상 중...',
    'Loading is an art. Enjoy the show...',
];

// ── Icons (Lucide subset) ─────────────────────────
const ICONS = {
    check: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    folder: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>',
};
function icon(name, size = 20) {
    return ICONS[name].replace(/width="\d+"/, `width="${size}"`).replace(/height="\d+"/, `height="${size}"`);
}

// ── State ─────────────────────────────────────────
let currentVideos = [];
let currentChannelName = '';
let currentPlaylistName = '';
let currentUrlType = '';
let currentFormat = '720p';
let isAnalyzing = false;
let isDownloading = false;
let stopRequested = false;
let currentDownloadControllers = [];
let selectedVideos = new Set();
let currentDownloadDir = '';

// ── DOM Elements ──────────────────────────────────
const elements = {
    channelUrl: document.getElementById('channelUrl'),
    searchBox: document.getElementById('searchBox'),
    clearUrlBtn: document.getElementById('clearUrlBtn'),
    includeShorts: document.getElementById('includeShorts'),
    analyzeBtn: document.getElementById('analyzeBtn'),
    downloadAllBtn: document.getElementById('downloadAllBtn'),
    videoList: document.getElementById('videoList'),

    totalVideos: document.getElementById('totalVideos'),
    alreadyDownloaded: document.getElementById('alreadyDownloaded'),

    progressWrap: document.getElementById('progressWrap'),
    stopDownloadBtn: document.getElementById('stopDownloadBtn'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),

    settingsBtn: document.getElementById('settingsBtn'),
    settingsPanel: document.getElementById('settingsPanel'),
    settingsCloseBtn: document.getElementById('settingsCloseBtn'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
    deleteApiKeyBtn: document.getElementById('deleteApiKeyBtn'),
    apiKeyMessage: document.getElementById('apiKeyMessage'),

    selectAllBox: document.getElementById('selectAllBox'),
    selectCount: document.getElementById('selectCount'),
    actionFooter: document.getElementById('actionFooter'),
    resultsHeader: document.getElementById('resultsHeader'),

    emptyState: document.getElementById('emptyState'),
    analyzingState: document.getElementById('analyzingState'),

    helpBtn: document.getElementById('helpBtn'),
    helpModal: document.getElementById('helpModal'),
    helpCloseBtn: document.getElementById('helpCloseBtn'),

    completeModal: document.getElementById('completeModal'),
    completeTitle: document.getElementById('completeTitle'),
    completeSummary: document.getElementById('completeSummary'),
    completePath: document.getElementById('completePath'),
    openFolderBtn: document.getElementById('openFolderBtn'),
    completeCloseBtn: document.getElementById('completeCloseBtn'),

    doneToast: document.getElementById('doneToast'),
    doneToastClose: document.getElementById('doneToastClose'),
};

// ── Init ──────────────────────────────────────────
async function init() {
    const savedApiKey = localStorage.getItem('youtube_api_key');
    if (savedApiKey) {
        try {
            await fetch(`${API_BASE}/settings/api-key`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_key: savedApiKey }),
            });
        } catch (e) {
            console.error('Failed to restore API key:', e);
        }
    }

    await checkHealth();
    await checkApiKeyStatus();
    await loadDownloadDir();

    // ── Format pills (roving tabindex) ──
    const pills = [...document.querySelectorAll('.format-pill')];
    function selectPill(pill) {
        pills.forEach(p => { p.classList.remove('active'); p.tabIndex = -1; p.setAttribute('aria-checked', 'false'); });
        pill.classList.add('active');
        pill.tabIndex = 0;
        pill.setAttribute('aria-checked', 'true');
        pill.focus();
        currentFormat = pill.dataset.value;
    }
    pills.forEach(pill => {
        pill.addEventListener('click', () => selectPill(pill));
        pill.addEventListener('keydown', (e) => {
            const idx = pills.indexOf(pill);
            let next = null;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                next = pills[(idx + 1) % pills.length];
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                next = pills[(idx - 1 + pills.length) % pills.length];
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                elements.analyzeBtn.click();
                return;
            }
            if (next) { e.preventDefault(); selectPill(next); }
        });
    });

    // ── URL input ──
    elements.analyzeBtn.addEventListener('click', analyzeUrl);
    elements.channelUrl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const active = pills.find(p => p.classList.contains('active')) || pills[0];
            active.focus();
        }
    });
    elements.channelUrl.addEventListener('input', () => {
        elements.clearUrlBtn.style.display = elements.channelUrl.value ? '' : 'none';
    });
    elements.channelUrl.addEventListener('focus', () => elements.searchBox.classList.add('focused'));
    elements.channelUrl.addEventListener('blur', () => elements.searchBox.classList.remove('focused'));
    elements.clearUrlBtn.addEventListener('click', () => {
        elements.channelUrl.value = '';
        elements.clearUrlBtn.style.display = 'none';
        elements.channelUrl.focus();
    });

    // ── Select All ──
    const selectAllEl = document.getElementById('selectAllToggle');
    selectAllEl.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); selectAllEl.click(); }
    });
    selectAllEl.addEventListener('click', () => {
        if (isDownloading) return;
        const allSelected = selectedVideos.size === currentVideos.length;
        if (allSelected) {
            selectedVideos.clear();
        } else {
            currentVideos.forEach((_, i) => selectedVideos.add(i));
        }
        document.querySelectorAll('.video-cb').forEach((cb, i) => {
            cb.classList.toggle('checked', selectedVideos.has(i));
        });
        document.querySelectorAll('.video-item').forEach((row, i) => {
            row.classList.toggle('unselected', !selectedVideos.has(i));
        });
        syncSelectAll();
        updateSelectionCount();
        if (selectedVideos.size > 0) elements.downloadAllBtn.focus();
    });

    // ── Video list keyboard ──
    elements.videoList.addEventListener('keydown', (e) => {
        const items = [...elements.videoList.querySelectorAll('.video-item')];
        const focused = document.activeElement.closest('.video-item');
        const idx = focused ? items.indexOf(focused) : -1;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const target = (e.metaKey || e.ctrlKey) ? items[items.length - 1] : items[Math.min(idx + 1, items.length - 1)];
            if (target) { target.focus(); target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const target = (e.metaKey || e.ctrlKey) ? items[0] : items[Math.max(idx - 1, 0)];
            if (target) { target.focus(); target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        } else if (e.key === ' ') {
            e.preventDefault();
            if (focused && !isDownloading) toggleVideoSelection(idx);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedVideos.size > 0 && !isDownloading) elements.downloadAllBtn.click();
        }
    });

    // ── Download ──
    elements.downloadAllBtn.addEventListener('click', downloadAll);
    elements.stopDownloadBtn.addEventListener('click', async () => {
        if (isDownloading) {
            stopRequested = true;
            elements.stopDownloadBtn.disabled = true;
            elements.stopDownloadBtn.style.opacity = '0.5';
            try { await fetch(`${API_BASE}/download/cancel`, { method: 'POST' }); } catch (_) {}
            currentDownloadControllers.forEach(c => c.abort());
            currentDownloadControllers = [];
        }
    });

    // ── Settings ──
    elements.settingsBtn.addEventListener('click', toggleSettings);
    elements.settingsCloseBtn.addEventListener('click', closeSettings);
    elements.saveApiKeyBtn.addEventListener('click', saveApiKey);
    if (elements.deleteApiKeyBtn) elements.deleteApiKeyBtn.addEventListener('click', deleteApiKey);
    document.getElementById('openLogFolderBtn')?.addEventListener('click', async () => {
        try { await fetch(`${API_BASE}/open-log-folder`, { method: 'POST' }); } catch (_) {}
    });
    document.getElementById('browseFolderBtn')?.addEventListener('click', browseFolder);
    document.getElementById('resetFolderBtn')?.addEventListener('click', resetDownloadDir);

    // ── Help modal ──
    elements.helpBtn.addEventListener('click', () => elements.helpModal.style.display = 'flex');
    elements.helpCloseBtn.addEventListener('click', () => elements.helpModal.style.display = 'none');
    elements.helpModal.addEventListener('click', (e) => {
        if (e.target === elements.helpModal) elements.helpModal.style.display = 'none';
    });

    // ── Folder button ──
    document.getElementById('openDownloadFolderBtn').addEventListener('click', () => {
        openDownloadFolder(buildSavePaths().folderPath);
    });

    // ── Complete modal ──
    elements.completeCloseBtn.addEventListener('click', () => elements.completeModal.style.display = 'none');
    elements.completeModal.addEventListener('click', (e) => {
        if (e.target === elements.completeModal) elements.completeModal.style.display = 'none';
    });
    elements.completeModal.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            const btns = [elements.openFolderBtn, elements.completeCloseBtn];
            const idx = btns.indexOf(document.activeElement);
            btns[(idx + 1) % 2].focus();
        }
    });

    // ── Done toast ──
    elements.doneToastClose.addEventListener('click', () => {
        elements.doneToast.style.display = 'none';
    });

    // ── Prevent titlebar-right interactions from triggering pywebview drag ──
    document.querySelector('.titlebar-right').addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });

    // ── Zoom ──
    const ZOOM_STEP = 10;
    const ZOOM_MIN = 80;
    const ZOOM_MAX = 150;
    let zoomPct = parseInt(localStorage.getItem('ytninza_zoom') || '100', 10);
    const zoomLevelEl = document.getElementById('zoomLevel');

    const zoomTarget = document.querySelector('main');
    function applyZoom() {
        zoomTarget.style.zoom = (zoomPct / 100).toString();
        zoomLevelEl.textContent = zoomPct + '%';
        localStorage.setItem('ytninza_zoom', zoomPct);
    }
    document.getElementById('zoomInBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        zoomPct = Math.min(zoomPct + ZOOM_STEP, ZOOM_MAX);
        applyZoom();
    });
    document.getElementById('zoomOutBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        zoomPct = Math.max(zoomPct - ZOOM_STEP, ZOOM_MIN);
        applyZoom();
    });
    document.addEventListener('keydown', (e) => {
        if (!e.shiftKey) return;
        if (e.key === '+' || e.key === '=') {
            e.preventDefault();
            zoomPct = Math.min(zoomPct + ZOOM_STEP, ZOOM_MAX);
            applyZoom();
        } else if (e.key === '-' || e.key === '_') {
            e.preventDefault();
            zoomPct = Math.max(zoomPct - ZOOM_STEP, ZOOM_MIN);
            applyZoom();
        }
    });
    applyZoom();

    elements.channelUrl.focus();
}

// ── Health ─────────────────────────────────────────
async function checkHealth() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        console.log('Health check:', data);
    } catch (error) {
        console.error('Health check failed:', error);
    }
}

// ── URL Detection ─────────────────────────────────
function detectUrlType(url) {
    if (url.includes('/shorts/')) return 'video';
    if (url.includes('playlist?list=') || url.includes('&list=')) return 'playlist';
    if (url.endsWith('/playlists')) return 'channel_playlists';
    if (url.includes('watch?v=') || url.includes('youtu.be/') || /^[\w-]{11}$/.test(url)) return 'video';
    return 'channel';
}

// ── Analyze ───────────────────────────────────────
async function analyzeUrl() {
    const url = elements.channelUrl.value.trim();
    if (!url) return;
    if (isAnalyzing) return;

    const urlType = detectUrlType(url);
    isAnalyzing = true;

    // UI: hide empty, show analyzing
    elements.emptyState.style.display = 'none';
    elements.resultsHeader.style.display = 'none';
    elements.videoList.innerHTML = '';
    elements.actionFooter.style.display = 'none';
    elements.analyzingState.style.display = 'flex';

    elements.analyzeBtn.disabled = true;
    elements.analyzeBtn.querySelector('.btn-text').style.display = 'none';
    elements.analyzeBtn.querySelector('.btn-loader').style.display = 'inline-flex';

    // Loading toast
    const toast = document.getElementById('loadingToast');
    const toastMsg = document.getElementById('loadingToastMsg');
    let msgIndex = 0;
    toastMsg.textContent = LOADING_MESSAGES[0];
    toastMsg.classList.remove('fade-out');
    toast.style.display = 'flex';

    const msgInterval = setInterval(() => {
        toastMsg.classList.add('fade-out');
        setTimeout(() => {
            msgIndex = (msgIndex + 1) % LOADING_MESSAGES.length;
            toastMsg.textContent = LOADING_MESSAGES[msgIndex];
            toastMsg.classList.remove('fade-out');
        }, 300);
    }, 2000);

    let endpoint = '/channel/analyze';
    if (urlType === 'video') endpoint = '/video/analyze';
    else if (urlType === 'playlist') endpoint = '/playlist/analyze';
    else if (urlType === 'channel_playlists') endpoint = '/channel/playlists/analyze';

    try {
        const body = { url };
        if (urlType === 'channel') body.include_shorts = elements.includeShorts.checked;

        const response = await fetchWithTimeout(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        }, 600000);

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Analysis failed');

        if (data.success) {
            currentUrlType = urlType;
            displayResults(data);
        } else {
            throw new Error(data.message || 'Analysis failed');
        }
    } catch (error) {
        console.error('Error analyzing:', error);
        alert(`Error: ${error.message}`);
        elements.emptyState.style.display = 'flex';
    } finally {
        clearInterval(msgInterval);
        toast.style.display = 'none';
        elements.analyzingState.style.display = 'none';
        isAnalyzing = false;
        elements.analyzeBtn.disabled = false;
        elements.analyzeBtn.querySelector('.btn-text').style.display = 'inline-flex';
        elements.analyzeBtn.querySelector('.btn-loader').style.display = 'none';
    }
}

// ── Display Results ───────────────────────────────
function displayResults(data) {
    elements.totalVideos.textContent = data.total_videos;
    elements.alreadyDownloaded.textContent = data.already_downloaded;

    currentVideos = data.videos;
    currentChannelName = data.channel_name || '';
    currentPlaylistName = data.playlist_name || '';

    renderVideoList(data.videos);

    elements.emptyState.style.display = 'none';
    elements.resultsHeader.style.display = 'flex';
    elements.actionFooter.style.display = 'flex';

    elements.resultsHeader.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
        const firstRow = document.getElementById('video-row-0');
        if (firstRow) firstRow.focus();
        else elements.downloadAllBtn.focus();
    }, 400);
}

// ── Render Video List ─────────────────────────────
function renderVideoList(videos) {
    elements.videoList.innerHTML = '';
    selectedVideos.clear();

    if (videos.length === 0) {
        elements.videoList.innerHTML = '<div style="padding:20px;text-align:center;color:var(--ink-faint)">No videos to download.</div>';
        return;
    }

    videos.forEach((video, index) => {
        selectedVideos.add(index);
        const row = document.createElement('div');
        row.className = 'video-item';
        row.tabIndex = 0;
        row.id = `video-row-${index}`;
        row.innerHTML = `
            <div class="checkbox checked video-cb" data-index="${index}">
                ${icon('check', 14)}
            </div>
            <img class="video-thumb" src="https://i.ytimg.com/vi/${video.id}/default.jpg" alt="" loading="lazy">
            <div class="video-title">${escapeHtml(video.title)}</div>
            <div class="video-status ytc-meta" id="video-status-${index}"></div>
        `;
        row.addEventListener('click', (e) => {
            if (isDownloading) return;
            toggleVideoSelection(index);
        });
        elements.videoList.appendChild(row);
    });

    syncSelectAll();
    updateSelectionCount();
}

// ── Toggle Video Selection ────────────────────────
function toggleVideoSelection(index) {
    if (selectedVideos.has(index)) {
        selectedVideos.delete(index);
    } else {
        selectedVideos.add(index);
    }

    const row = document.getElementById(`video-row-${index}`);
    if (row) {
        const cb = row.querySelector('.video-cb');
        cb.classList.toggle('checked', selectedVideos.has(index));
        row.classList.toggle('unselected', !selectedVideos.has(index));
    }

    syncSelectAll();
    updateSelectionCount();
}

// ── Sync Select All ───────────────────────────────
function syncSelectAll() {
    const total = currentVideos.length;
    const selected = selectedVideos.size;
    const box = elements.selectAllBox;

    box.classList.remove('checked', 'indeterminate');
    if (selected === total && total > 0) {
        box.classList.add('checked');
    } else if (selected > 0) {
        box.classList.add('indeterminate');
    }
}

// ── Update Selection Count ────────────────────────
function updateSelectionCount() {
    elements.selectCount.textContent = `${selectedVideos.size} / ${currentVideos.length}`;
    elements.downloadAllBtn.disabled = selectedVideos.size === 0;
}

// ── Download All ──────────────────────────────────
async function downloadAll() {
    if (selectedVideos.size === 0) return;
    if (isDownloading) return;

    isDownloading = true;
    stopRequested = false;
    elements.downloadAllBtn.disabled = true;
    elements.analyzeBtn.disabled = true;

    // Disable interactions on video rows
    elements.videoList.style.pointerEvents = 'none';

    const downloadIndices = [];
    for (let i = 0; i < currentVideos.length; i++) {
        if (selectedVideos.has(i)) downloadIndices.push(i);
    }

    downloadIndices.forEach(i => {
        const row = document.getElementById(`video-row-${i}`);
        if (row && row.getAttribute('data-state') === 'stopped') {
            updateVideoRow(i, 'pending', '');
        }
    });
    const totalSelected = downloadIndices.length;

    elements.progressWrap.style.display = 'flex';
    elements.stopDownloadBtn.disabled = false;
    elements.stopDownloadBtn.style.opacity = '1';
    elements.progressFill.style.width = '0%';
    elements.progressText.textContent = '0%';

    setTimeout(() => elements.stopDownloadBtn.focus(), 100);

    const quality = currentFormat;
    let completed = 0;
    let skipped = 0;
    let failed = 0;
    let stopped = false;
    let doneCount = 0;

    try { await fetch(`${API_BASE}/download/reset-cancel`, { method: 'POST' }); } catch (_) {}

    const queue = [...downloadIndices];
    let queueIndex = 0;

    function updateProgress() {
        const pct = Math.round((doneCount / totalSelected) * 100);
        elements.progressFill.style.width = `${pct}%`;
        elements.progressText.textContent = `${pct}%`;
    }

    async function worker() {
        while (queueIndex < queue.length && !stopRequested) {
            const i = queue[queueIndex++];
            const video = currentVideos[i];

            updateProgress();
            updateVideoRow(i, 'downloading', 'Downloading');

            let dotCount = 0;
            const pollId = setInterval(async () => {
                try {
                    const prog = await fetch(`${API_BASE}/download/progress/${video.id}`).then(r => r.json());
                    if (prog.status === 'downloading') {
                        const parts = [prog.percent, prog.total, prog.speed, prog.eta ? `ETA ${prog.eta}` : ''].filter(Boolean);
                        updateVideoRow(i, 'downloading', parts.join(' \u00b7 '));
                    } else if (prog.status === 'converting') {
                        dotCount = (dotCount % 3) + 1;
                        updateVideoRow(i, 'downloading', 'Converting audio' + '.'.repeat(dotCount));
                    }
                } catch (_) {}
            }, 1000);

            try {
                const controller = new AbortController();
                currentDownloadControllers.push(controller);
                const response = await fetchWithTimeout(`${API_BASE}/download/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        video_id: video.id,
                        quality: quality,
                        channel_name: currentChannelName || null,
                        playlist_name: video.playlist_name || currentPlaylistName || null,
                    }),
                    signal: controller.signal,
                }, 600000);

                clearInterval(pollId);
                currentDownloadControllers = currentDownloadControllers.filter(c => c !== controller);
                const data = await response.json();

                if (data.cancelled) {
                    updateVideoRow(i, 'stopped', 'Stopped');
                    stopped = true;
                    break;
                } else if (response.ok && data.success) {
                    if (data.skipped) {
                        skipped++;
                        updateVideoRow(i, 'skip', data.reason ? `Skip (${data.reason})` : 'Skip');
                    } else {
                        completed++;
                        const prog = await fetch(`${API_BASE}/download/progress/${video.id}`).then(r => r.json()).catch(() => ({}));
                        updateVideoRow(i, 'success', prog.total ? prog.total : '');
                    }
                    doneCount++;
                    updateProgress();
                } else {
                    throw new Error(data.detail || 'Download failed');
                }
            } catch (error) {
                clearInterval(pollId);
                if (error.name === 'AbortError' || stopRequested) {
                    updateVideoRow(i, 'stopped', 'Stopped');
                    stopped = true;
                    break;
                }
                console.error(`Error downloading ${video.title}:`, error);
                failed++;
                updateVideoRow(i, 'error', 'Failed');
                doneCount++;
                updateProgress();
            }
        }
    }

    await Promise.all([worker(), worker()]);

    if (stopped || stopRequested) {
        for (let qi = queueIndex; qi < queue.length; qi++) {
            updateVideoRow(queue[qi], 'stopped', 'Stopped');
        }
        stopped = true;
    }

    // Summary
    const parts = [];
    if (completed > 0) parts.push(`Done: ${completed}`);
    if (skipped > 0) parts.push(`Skip: ${skipped}`);
    if (failed > 0) parts.push(`Failed: ${failed}`);
    if (stopped) parts.push(`Stopped: ${totalSelected - completed - skipped - failed}`);
    const { displayPath, folderPath } = buildSavePaths();

    elements.completeTitle.textContent = stopped ? 'Download Stopped' : 'Download Complete';
    elements.completeSummary.textContent = parts.join(' \u00b7 ');
    elements.completePath.textContent = displayPath;
    elements.openFolderBtn.onclick = () => { openDownloadFolder(folderPath); elements.completeModal.style.display = 'none'; };
    elements.completeModal.style.display = 'flex';
    setTimeout(() => elements.openFolderBtn.focus(), 100);

    if (completed > 0) showDoneToast(completed);

    isDownloading = false;
    stopRequested = false;
    currentDownloadControllers = [];
    elements.downloadAllBtn.disabled = false;
    elements.analyzeBtn.disabled = false;
    elements.progressWrap.style.display = 'none';
    elements.videoList.style.pointerEvents = '';
}

// ── Update Video Row ──────────────────────────────
function updateVideoRow(index, type, statusText) {
    const row = document.getElementById(`video-row-${index}`);
    if (!row) return;
    const statusEl = document.getElementById(`video-status-${index}`);
    if (!statusEl) return;

    row.setAttribute('data-state', type);
    statusEl.className = `video-status video-status-${type}`;

    if (type === 'success') {
        statusEl.innerHTML = icon('check', 16);
        if (statusText) statusEl.innerHTML += ` <span class="ytc-meta">${statusText}</span>`;
    } else {
        statusEl.textContent = statusText;
    }

    if (type !== 'downloading' || statusText === 'Downloading') {
        row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// ── Done Toast ────────────────────────────────────
let doneToastTimer = null;
function showDoneToast(count) {
    if (doneToastTimer) clearTimeout(doneToastTimer);
    elements.doneToast.querySelector('.done-toast-text').textContent = `DONE \u00b7 ${count}`;
    elements.doneToast.style.display = 'flex';
    doneToastTimer = setTimeout(() => { elements.doneToast.style.display = 'none'; }, 5000);
}

// ── Settings ──────────────────────────────────────
function toggleSettings() {
    const isOpen = elements.settingsPanel.classList.toggle('is-open');
    elements.settingsBtn.classList.toggle('is-active', isOpen);
    if (isOpen) {
        document.addEventListener('mousedown', handleSettingsOutside);
        document.addEventListener('keydown', handleSettingsEscape);
    } else {
        document.removeEventListener('mousedown', handleSettingsOutside);
        document.removeEventListener('keydown', handleSettingsEscape);
    }
}
function closeSettings() {
    elements.settingsPanel.classList.remove('is-open');
    elements.settingsBtn.classList.remove('is-active');
    document.removeEventListener('mousedown', handleSettingsOutside);
    document.removeEventListener('keydown', handleSettingsEscape);
}
function handleSettingsOutside(e) {
    if (!elements.settingsPanel.contains(e.target) && e.target !== elements.settingsBtn && !elements.settingsBtn.contains(e.target)) {
        closeSettings();
    }
}
function handleSettingsEscape(e) {
    if (e.key === 'Escape') closeSettings();
}

// ── API Key ───────────────────────────────────────
async function checkApiKeyStatus() {
    try {
        const response = await fetch(`${API_BASE}/settings`);
        const data = await response.json();
        if (data.has_api_key) {
            const savedApiKey = localStorage.getItem('youtube_api_key');
            if (savedApiKey) elements.apiKeyInput.value = savedApiKey;
            elements.apiKeyInput.placeholder = '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022 (set)';
            elements.apiKeyMessage.textContent = 'API key is active.';
            elements.apiKeyMessage.className = 'settings-message success';
        } else {
            elements.apiKeyInput.placeholder = 'YouTube Data API v3';
            elements.apiKeyMessage.textContent = '';
        }
    } catch (error) {
        console.error('Failed to check API key status:', error);
    }
}

async function saveApiKey() {
    const apiKey = elements.apiKeyInput.value.trim();
    if (!apiKey) {
        elements.apiKeyMessage.textContent = 'Enter an API key.';
        elements.apiKeyMessage.className = 'settings-message error';
        return;
    }
    elements.saveApiKeyBtn.disabled = true;
    try {
        const response = await fetch(`${API_BASE}/settings/api-key`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: apiKey }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
            localStorage.setItem('youtube_api_key', apiKey);
            elements.apiKeyMessage.textContent = data.message;
            elements.apiKeyMessage.className = 'settings-message success';
            elements.apiKeyInput.value = '';
            await checkApiKeyStatus();
        } else {
            throw new Error(data.detail || data.message || 'Failed');
        }
    } catch (error) {
        elements.apiKeyMessage.textContent = error.message;
        elements.apiKeyMessage.className = 'settings-message error';
    } finally {
        elements.saveApiKeyBtn.disabled = false;
    }
}

async function deleteApiKey() {
    if (!confirm('Delete saved API key?')) return;
    elements.deleteApiKeyBtn.disabled = true;
    try {
        const response = await fetch(`${API_BASE}/settings/api-key`, { method: 'DELETE' });
        const data = await response.json();
        if (response.ok && data.success) {
            localStorage.removeItem('youtube_api_key');
            elements.apiKeyInput.value = '';
            elements.apiKeyMessage.textContent = data.message;
            elements.apiKeyMessage.className = 'settings-message success';
            await checkApiKeyStatus();
        } else {
            throw new Error(data.message || 'Failed');
        }
    } catch (error) {
        elements.apiKeyMessage.textContent = error.message;
        elements.apiKeyMessage.className = 'settings-message error';
    } finally {
        elements.deleteApiKeyBtn.disabled = false;
    }
}

// ── Download Dir ──────────────────────────────────
function buildSavePaths() {
    const base = currentDownloadDir
        ? currentDownloadDir.replace(/\/$/, '') + '/'
        : '~/Downloads/ytninza/';
    if (!currentChannelName) return { displayPath: base, folderPath: base };
    if (currentUrlType === 'channel_playlists') {
        return { displayPath: `${base}${currentChannelName}/`, folderPath: `${base}${currentChannelName}/` };
    }
    if (currentPlaylistName) {
        return { displayPath: `${base}${currentChannelName}/${currentPlaylistName}/`, folderPath: `${base}${currentChannelName}/${currentPlaylistName}/` };
    }
    return { displayPath: `${base}${currentChannelName}/All Videos/`, folderPath: `${base}${currentChannelName}/All Videos/` };
}

async function loadDownloadDir() {
    try {
        const resp = await fetch(`${API_BASE}/settings/download-dir`);
        const data = await resp.json();
        currentDownloadDir = data.download_dir || '';
        const el = document.getElementById('downloadDirPath');
        if (el) { el.textContent = currentDownloadDir; el.title = currentDownloadDir; }
    } catch (e) { console.error('Failed to load download dir:', e); }
}

async function browseFolder() {
    const msg = document.getElementById('downloadDirMessage');
    msg.textContent = '';
    try {
        const resp = await fetch(`${API_BASE}/settings/browse-folder`, { method: 'POST' });
        const data = await resp.json();
        if (!data.success) return;
        const saveResp = await fetch(`${API_BASE}/settings/download-dir`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ download_dir: data.path }),
        });
        const saveData = await saveResp.json();
        if (saveData.success) {
            currentDownloadDir = saveData.download_dir;
            document.getElementById('downloadDirPath').textContent = currentDownloadDir;
            document.getElementById('downloadDirPath').title = currentDownloadDir;
            msg.textContent = saveData.message;
            msg.className = 'settings-message success';
        }
    } catch (e) { msg.textContent = 'Failed'; msg.className = 'settings-message error'; }
}

async function resetDownloadDir() {
    const msg = document.getElementById('downloadDirMessage');
    try {
        const resp = await fetch(`${API_BASE}/settings/download-dir`, { method: 'DELETE' });
        const data = await resp.json();
        if (data.success) {
            currentDownloadDir = data.download_dir;
            document.getElementById('downloadDirPath').textContent = currentDownloadDir;
            document.getElementById('downloadDirPath').title = currentDownloadDir;
            msg.textContent = data.message;
            msg.className = 'settings-message success';
        }
    } catch (e) { msg.textContent = 'Failed'; msg.className = 'settings-message error'; }
}

async function openDownloadFolder(path) {
    try {
        await fetch(`${API_BASE}/open-folder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path }),
        });
    } catch (e) { console.error('Failed to open folder:', e); }
}

// ── Utilities ─────────────────────────────────────
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function fetchWithTimeout(url, options = {}, timeoutMs = 600000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    if (options.signal) options.signal.addEventListener('abort', () => controller.abort());
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// ── Bootstrap ─────────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
