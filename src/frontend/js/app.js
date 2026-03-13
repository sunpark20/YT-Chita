/**
 * YouTube ALL DOWNLOADER - Frontend Application
 *
 * Main JavaScript logic for the desktop application
 */

// API Base URL
const API_BASE = '/api';

// Loading messages — Korean/English alternating
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

// State
let currentVideos = [];
let currentChannelName = '';
let currentPlaylistName = '';
let currentUrlType = '';
let isAnalyzing = false;
let isDownloading = false;
let stopRequested = false;
let currentDownloadControllers = [];  // 2개 동시 abort 지원
let selectedVideos = new Set();

// DOM Elements
const elements = {
    channelUrl: document.getElementById('channelUrl'),
    quality: document.getElementById('quality'),
    includeShorts: document.getElementById('includeShorts'),
    analyzeBtn: document.getElementById('analyzeBtn'),
    resultsSection: document.getElementById('resultsSection'),
    downloadAllBtn: document.getElementById('downloadAllBtn'),
    videoList: document.getElementById('videoList'),

    // Stats
    totalVideos: document.getElementById('totalVideos'),
    alreadyDownloaded: document.getElementById('alreadyDownloaded'),
    videoCount: document.getElementById('videoCount'),

    // Progress
    progressWrap: document.getElementById('progressWrap'),
    stopDownloadBtn: document.getElementById('stopDownloadBtn'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),

    // Status
    statusText: document.getElementById('statusText'),
    ytdlpVersion: document.getElementById('ytdlpVersion'),

    // Settings
    settingsBtn: document.getElementById('settingsBtn'),
    settingsPanel: document.getElementById('settingsPanel'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
    deleteApiKeyBtn: document.getElementById('deleteApiKeyBtn'),
    apiKeyMessage: document.getElementById('apiKeyMessage'),
    apiKeyStatus: document.getElementById('apiKeyStatus'),

    // Select All
    selectAllCheckbox: document.getElementById('selectAllCheckbox'),

    // Help
    helpBtn: document.getElementById('helpBtn'),
    helpModal: document.getElementById('helpModal'),
    helpCloseBtn: document.getElementById('helpCloseBtn'),

    // Complete Modal
    completeModal: document.getElementById('completeModal'),
    completeTitle: document.getElementById('completeTitle'),
    completeSummary: document.getElementById('completeSummary'),
    completePath: document.getElementById('completePath'),
    openFolderBtn: document.getElementById('openFolderBtn'),
    completeCloseBtn: document.getElementById('completeCloseBtn'),
};

/**
 * Initialize application
 */
async function init() {
    console.log('Initializing YouTube ALL DOWNLOADER...');

    // Load saved API key from localStorage
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

    // Check health and settings
    await checkHealth();
    await checkApiKeyStatus();

    // Setup event listeners
    elements.analyzeBtn.addEventListener('click', analyzeUrl);

    // Enter 키 → 형식 select로 포커스 이동 & 펼침
    elements.channelUrl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const q = elements.quality;
            q.focus();
            q.size = q.options.length;
            q.classList.add('expanded');
        }
    });

    // Select 키보드 리스너: Enter → 분석 시작, Escape → 접기
    elements.quality.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            elements.quality.size = 0;
            elements.quality.classList.remove('expanded');
            elements.analyzeBtn.click();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            elements.quality.size = 0;
            elements.quality.classList.remove('expanded');
            elements.channelUrl.focus();
        }
    });

    // Select blur → 접기 (포커스 잃을 때만)
    elements.quality.addEventListener('blur', () => {
        elements.quality.size = 0;
        elements.quality.classList.remove('expanded');
    });
    elements.selectAllCheckbox.addEventListener('change', () => {
        const checked = elements.selectAllCheckbox.checked;
        document.querySelectorAll('.video-checkbox').forEach(cb => {
            cb.checked = checked;
        });
        if (checked) {
            currentVideos.forEach((_, i) => selectedVideos.add(i));
        } else {
            selectedVideos.clear();
        }
        updateSelectionCount();
        if (selectedVideos.size > 0) elements.downloadAllBtn.focus();
    });
    // Video list keyboard navigation: Arrow keys + Space + Enter
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
            if (focused) {
                const cb = focused.querySelector('.video-checkbox');
                if (cb) {
                    cb.checked = !cb.checked;
                    cb.dispatchEvent(new Event('change'));
                }
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedVideos.size > 0 && !isDownloading) {
                elements.downloadAllBtn.click();
            }
        }
    });
    elements.downloadAllBtn.addEventListener('click', downloadAll);
    elements.stopDownloadBtn.addEventListener('click', async () => {
        if (isDownloading) {
            stopRequested = true;
            elements.stopDownloadBtn.disabled = true;
            elements.stopDownloadBtn.style.opacity = '0.5';
            // 서버에 즉시 취소 요청
            try {
                await fetch(`${API_BASE}/download/cancel`, { method: 'POST' });
            } catch (_) {}
            // 진행 중인 fetch 요청 모두 abort
            currentDownloadControllers.forEach(c => c.abort());
            currentDownloadControllers = [];
        }
    });
    elements.settingsBtn.addEventListener('click', toggleSettings);
    elements.saveApiKeyBtn.addEventListener('click', saveApiKey);
    if (elements.deleteApiKeyBtn) {
        elements.deleteApiKeyBtn.addEventListener('click', deleteApiKey);
    }
    document.getElementById('openLogFolderBtn')?.addEventListener('click', async () => {
        try {
            await fetch(`${API_BASE}/open-log-folder`, { method: 'POST' });
        } catch (e) {
            alert('로그 폴더를 열 수 없습니다.');
        }
    });
    elements.helpBtn.addEventListener('click', () => elements.helpModal.style.display = 'flex');
    elements.helpCloseBtn.addEventListener('click', () => elements.helpModal.style.display = 'none');
    elements.helpModal.addEventListener('click', (e) => {
        if (e.target === elements.helpModal) elements.helpModal.style.display = 'none';
    });
    document.getElementById('openDownloadFolderBtn').addEventListener('click', () => {
        const { folderPath } = buildSavePaths();
        openDownloadFolder(folderPath);
    });
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

    // App icon click animation
    const appIcon = document.getElementById('appIcon');
    appIcon.addEventListener('click', () => {
        appIcon.classList.add('animating');
        const boilAudio = new Audio('/resource/BoilingPod.mp3');
        boilAudio.play().catch(() => {});
        setTimeout(() => {
            appIcon.classList.remove('animating');
            boilAudio.pause();
        }, 4000);
    });

    // Boombox easter egg — click to play/pause music with beat detection
    const boombox = document.getElementById('boombox');
    let boomboxAudio = null;
    let boomboxCtx = null;
    let boomboxAnalyser = null;
    let boomboxPlaying = false;
    let boomboxAnimId = null;
    let boomboxFreqData = null;

    function boomboxBeatLoop() {
        if (!boomboxPlaying) return;
        boomboxAnalyser.getByteFrequencyData(boomboxFreqData);
        // Average of low-frequency bins (0–10) for bass detection
        let bass = 0;
        for (let i = 0; i < 10; i++) bass += boomboxFreqData[i];
        bass /= 10;
        const scale = bass > 130 ? 1.06 : 1;
        boombox.style.transform = `scale(${scale})`;
        boomboxAnimId = requestAnimationFrame(boomboxBeatLoop);
    }

    boombox.addEventListener('click', () => {
        if (!boomboxAudio) {
            // First click — initialise audio pipeline
            boomboxAudio = new Audio('/resource/WhatYouGonnaBe.mp3');
            boomboxCtx = new (window.AudioContext || window.webkitAudioContext)();
            boomboxAnalyser = boomboxCtx.createAnalyser();
            boomboxAnalyser.fftSize = 256;
            boomboxFreqData = new Uint8Array(boomboxAnalyser.frequencyBinCount);
            const source = boomboxCtx.createMediaElementSource(boomboxAudio);
            source.connect(boomboxAnalyser);
            boomboxAnalyser.connect(boomboxCtx.destination);

            boomboxAudio.onended = () => {
                boomboxPlaying = false;
                boombox.classList.remove('shaking');
                boombox.style.transform = '';
            };

            boomboxAudio.play().catch(() => {});
            boomboxPlaying = true;
            boombox.classList.add('shaking');
            boomboxBeatLoop();
        } else if (boomboxPlaying) {
            // Pause
            boomboxAudio.pause();
            boomboxPlaying = false;
            boombox.classList.remove('shaking');
            boombox.style.transform = '';
            if (boomboxAnimId) cancelAnimationFrame(boomboxAnimId);
        } else {
            // Resume
            boomboxCtx.resume();
            boomboxAudio.play().catch(() => {});
            boomboxPlaying = true;
            boombox.classList.add('shaking');
            boomboxBeatLoop();
        }
    });

    // 시작 시 URL 입력창에 포커스
    elements.channelUrl.focus();

    console.log('Application initialized!');
}

/**
 * Check API health and get version info
 */
async function checkHealth() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();

        if (data.status === 'healthy') {
            if (data.ytdlp_version) {
                // 년도를 2자리로 축약 (2026 → 26)
                const shortVer = data.ytdlp_version.replace(/^20/, '');
                elements.ytdlpVersion.innerHTML = `yt-dlp ${shortVer} <span class="update-link" onclick="location.reload()" title="업데이트 확인">🔄update</span>`;
            }
        }

        console.log('Health check:', data);
    } catch (error) {
        console.error('Health check failed:', error);
    }
}

/**
 * Detect URL type and call appropriate analyze endpoint
 */
function detectUrlType(url) {
    // Shorts URL → 개별 동영상으로 처리
    if (url.includes('/shorts/')) {
        return 'video';
    }
    if (url.includes('playlist?list=') || url.includes('&list=')) {
        return 'playlist';
    }
    if (url.endsWith('/playlists')) {
        return 'channel_playlists';
    }
    // 개별 동영상 URL (watch?v=, youtu.be/, 11자리 ID)
    if (url.includes('watch?v=') || url.includes('youtu.be/') || /^[\w-]{11}$/.test(url)) {
        return 'video';
    }
    return 'channel';
}

/**
 * Analyze URL (auto-detect channel or playlist)
 */
async function analyzeUrl() {
    const url = elements.channelUrl.value.trim();

    if (!url) {
        alert('YouTube 채널 또는 재생목록 URL을 입력해주세요.');
        return;
    }

    if (isAnalyzing) return;

    const urlType = detectUrlType(url);

    // Update UI
    isAnalyzing = true;
    elements.analyzeBtn.disabled = true;
    elements.analyzeBtn.querySelector('.btn-text').style.display = 'none';
    const loaderEl = elements.analyzeBtn.querySelector('.btn-loader');
    loaderEl.style.display = 'inline-block';
    loaderEl.textContent = '분석 중...';
    elements.resultsSection.style.display = 'none';
    elements.downloadAllBtn.classList.remove('pop-in');
    elements.downloadAllBtn.style.display = 'none';

    // Show loading toast with rotating messages
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
    if (urlType === 'video') {
        endpoint = '/video/analyze';
    } else if (urlType === 'playlist') {
        endpoint = '/playlist/analyze';
    } else if (urlType === 'channel_playlists') {
        endpoint = '/channel/playlists/analyze';
    }

    try {
        const body = {
            url: url,
        };

        // 채널 분석일 때만 include_shorts 전송
        if (urlType === 'channel') {
            body.include_shorts = elements.includeShorts.checked;
        }

        const response = await fetchWithTimeout(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        }, 600000);  // 10분 타임아웃 (yt-dlp 분석은 오래 걸릴 수 있음)

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || '분석 실패');
        }

        if (data.success) {
            currentUrlType = urlType;
            displayResults(data);
        } else {
            throw new Error(data.message || '분석 실패');
        }

    } catch (error) {
        console.error('Error analyzing:', error);
        alert(`오류: ${error.message}`);
    } finally {
        clearInterval(msgInterval);
        toast.style.display = 'none';
        isAnalyzing = false;
        elements.analyzeBtn.disabled = false;
        elements.analyzeBtn.querySelector('.btn-text').style.display = 'inline';
        loaderEl.style.display = 'none';
    }
}

/**
 * Display analysis results
 */
function displayResults(data) {
    // Update stats
    elements.totalVideos.textContent = data.total_videos;
    elements.alreadyDownloaded.textContent = data.already_downloaded;
    elements.videoCount.textContent = data.videos.length;

    // Store videos and metadata
    currentVideos = data.videos;
    currentChannelName = data.channel_name || '';
    currentPlaylistName = data.playlist_name || '';

    // Display video list
    renderVideoList(data.videos);

    // Show results section
    elements.resultsSection.style.display = 'block';

    // Show download button with pop-in animation and focus
    elements.downloadAllBtn.classList.remove('pop-in');
    elements.downloadAllBtn.style.display = '';  // clear inline style so CSS class takes effect
    void elements.downloadAllBtn.offsetWidth; // force reflow to restart animation
    elements.downloadAllBtn.classList.add('pop-in');
    elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => elements.downloadAllBtn.focus(), 400);
}

/**
 * Render video list
 */
function renderVideoList(videos) {
    elements.videoList.innerHTML = '';
    selectedVideos.clear();

    if (videos.length === 0) {
        elements.videoList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">다운로드할 영상이 없습니다.</div>';
        return;
    }

    videos.forEach((video, index) => {
        selectedVideos.add(index);
        const videoItem = document.createElement('div');
        videoItem.className = 'video-item';
        videoItem.tabIndex = 0;
        videoItem.id = `video-row-${index}`;
        videoItem.innerHTML = `
            <input type="checkbox" class="video-checkbox" data-index="${index}" checked>
            <img class="video-thumb" src="https://i.ytimg.com/vi/${video.id}/default.jpg" alt="" loading="lazy">
            <div class="video-info">
                <div class="video-title">${index + 1}. ${escapeHtml(video.title)}</div>
            </div>
            <div class="video-status" id="video-status-${index}"></div>
        `;
        elements.videoList.appendChild(videoItem);
    });

    // Bind individual checkbox events
    document.querySelectorAll('.video-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const idx = parseInt(e.target.dataset.index);
            if (e.target.checked) {
                selectedVideos.add(idx);
            } else {
                selectedVideos.delete(idx);
            }
            syncSelectAll();
            updateSelectionCount();
            const row = e.target.closest('.video-item');
            if (row) row.focus();
        });
    });

    // Sync select-all checkbox
    elements.selectAllCheckbox.checked = true;
    elements.selectAllCheckbox.indeterminate = false;
    updateSelectionCount();
}

/**
 * Sync select-all checkbox state with individual checkboxes
 */
function syncSelectAll() {
    const total = currentVideos.length;
    const selected = selectedVideos.size;
    if (selected === 0) {
        elements.selectAllCheckbox.checked = false;
        elements.selectAllCheckbox.indeterminate = false;
    } else if (selected === total) {
        elements.selectAllCheckbox.checked = true;
        elements.selectAllCheckbox.indeterminate = false;
    } else {
        elements.selectAllCheckbox.checked = false;
        elements.selectAllCheckbox.indeterminate = true;
    }
}

/**
 * Update selection count on button and videoCount span
 */
function updateSelectionCount() {
    const count = selectedVideos.size;
    elements.videoCount.textContent = count;
    const btnText = elements.downloadAllBtn.querySelector('.btn-text');
    btnText.innerHTML = `<svg width="18" height="18" viewBox="0 0 29.978 29.978" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M25.462,19.105v6.848H4.515v-6.848H0.489v8.861c0,1.111,0.9,2.012,2.016,2.012h24.967c1.115,0,2.016-0.9,2.016-2.012v-8.861H25.462z"/><path d="M14.62,18.426l-5.764-6.965c0,0-0.877-0.828,0.074-0.828s3.248,0,3.248,0s0-0.557,0-1.416c0-2.449,0-6.906,0-8.723c0,0-0.129-0.494,0.615-0.494c0.75,0,4.035,0,4.572,0c0.536,0,0.524,0.416,0.524,0.416c0,1.762,0,6.373,0,8.742c0,0.768,0,1.266,0,1.266s1.842,0,2.998,0c1.154,0,0.285,0.867,0.285,0.867s-4.904,6.51-5.588,7.193C15.092,18.979,14.62,18.426,14.62,18.426z"/></svg> (${count})`;
    elements.downloadAllBtn.disabled = count === 0;
}

/**
 * Download all videos
 */
async function downloadAll() {
    if (selectedVideos.size === 0) {
        alert('다운로드할 영상을 선택해주세요.');
        return;
    }

    if (isDownloading) return;

    isDownloading = true;
    stopRequested = false;
    elements.downloadAllBtn.disabled = true;
    elements.downloadAllBtn.classList.remove('pop-in');
    elements.analyzeBtn.disabled = true;

    // 체크박스 비활성화
    document.querySelectorAll('.video-checkbox').forEach(cb => cb.disabled = true);
    elements.selectAllCheckbox.disabled = true;

    // Build ordered list of selected indices
    const downloadIndices = [];
    for (let i = 0; i < currentVideos.length; i++) {
        if (selectedVideos.has(i)) downloadIndices.push(i);
    }

    // 이전 '중단됨' 상태 초기화
    downloadIndices.forEach(i => {
        const row = document.getElementById(`video-row-${i}`);
        if (row && row.getAttribute('data-state') === 'stopped') {
            updateVideoRow(i, 'pending', '');
        }
    });
    const totalSelected = downloadIndices.length;

    // Show mini progress bar + stop button (right next to download button)
    elements.progressWrap.style.display = 'flex';
    elements.stopDownloadBtn.disabled = false;
    elements.stopDownloadBtn.style.opacity = '1';
    elements.progressFill.style.width = '0%';
    elements.progressText.textContent = `0/${totalSelected}`;

    // Focus stop button so Enter key can stop download
    setTimeout(() => elements.stopDownloadBtn.focus(), 100);

    const quality = elements.quality.value;
    let completed = 0;
    let skipped = 0;
    let failed = 0;
    let stopped = false;
    let doneCount = 0;

    // 배치 시작 전 취소 플래그 초기화
    try {
        await fetch(`${API_BASE}/download/reset-cancel`, { method: 'POST' });
    } catch (_) {}

    // 2-워커 풀: 큐에서 하나씩 꺼내서 병렬 처리
    const queue = [...downloadIndices];
    let queueIndex = 0;

    function updateProgress() {
        elements.progressFill.style.width = `${Math.round((doneCount / totalSelected) * 100)}%`;
        elements.progressText.textContent = `${doneCount}/${totalSelected}`;
    }

    async function worker() {
        while (queueIndex < queue.length && !stopRequested) {
            const i = queue[queueIndex++];
            const video = currentVideos[i];

            updateProgress();
            updateVideoRow(i, 'downloading', 'Downloading');

            // video_id별 진행률 폴링
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
                // controller 제거
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
                        updateVideoRow(i, 'success', prog.total ? `✔ ${prog.total}` : '✔');
                    }
                    doneCount++;
                    updateProgress();
                } else {
                    throw new Error(data.detail || '다운로드 실패');
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

    // 2개 워커 동시 실행
    await Promise.all([worker(), worker()]);

    // 중지 시 남은 큐 항목 '중지됨' 표시
    if (stopped || stopRequested) {
        for (let qi = queueIndex; qi < queue.length; qi++) {
            updateVideoRow(queue[qi], 'stopped', 'Stopped');
        }
        stopped = true;
    }

    // Summary via modal
    const parts = [];
    if (completed > 0) parts.push(`Done: ${completed}`);
    if (skipped > 0) parts.push(`Skip: ${skipped}`);
    if (failed > 0) parts.push(`Failed: ${failed}`);
    if (stopped) parts.push(`Stopped: ${totalSelected - completed - skipped - failed}`);
    const { displayPath, folderPath } = buildSavePaths();

    elements.completeTitle.textContent = stopped ? 'Download Stopped' : 'Download Complete';
    elements.completeSummary.textContent = parts.join(' · ');
    elements.completePath.textContent = displayPath;
    elements.openFolderBtn.onclick = () => { openDownloadFolder(folderPath); elements.completeModal.style.display = 'none'; };
    elements.completeModal.style.display = 'flex';
    new Audio('/resource/PeonJobDone.wav').play().catch(() => {});
    setTimeout(() => elements.openFolderBtn.focus(), 100);

    isDownloading = false;
    stopRequested = false;
    currentDownloadControllers = [];
    elements.downloadAllBtn.disabled = false;
    elements.analyzeBtn.disabled = false;
    elements.progressWrap.style.display = 'none';

    // 체크박스 다시 활성화
    document.querySelectorAll('.video-checkbox').forEach(cb => cb.disabled = false);
    elements.selectAllCheckbox.disabled = false;
}

/**
 * Update a video row's download status in-place
 */
function updateVideoRow(index, type, statusText) {
    const row = document.getElementById(`video-row-${index}`);
    if (!row) return;

    const statusEl = document.getElementById(`video-status-${index}`);
    if (!statusEl) return;

    // Update row state
    row.setAttribute('data-state', type);
    statusEl.className = `video-status video-status-${type}`;
    statusEl.textContent = statusText;

    // 다운로드 시작·완료 상태에서만 스크롤 (진행률 갱신 중에는 스크롤 안 함)
    if (type !== 'downloading' || statusText === 'Downloading') {
        row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/**
 * Toggle settings panel
 */
function toggleSettings() {
    const panel = elements.settingsPanel;
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

/**
 * Check API key status from server
 */
async function checkApiKeyStatus() {
    try {
        const response = await fetch(`${API_BASE}/settings`);
        const data = await response.json();

        if (data.has_api_key) {
            elements.apiKeyStatus.textContent = 'API Key OK';
            elements.apiKeyStatus.className = 'api-key-badge badge-active';
            const savedApiKey = localStorage.getItem('youtube_api_key');
            if (savedApiKey) {
                elements.apiKeyInput.value = savedApiKey;
            }
            elements.apiKeyInput.placeholder = '•••••••••••••••••••••••••••••••• (설정됨)';
            elements.apiKeyMessage.textContent = '현재 API 키가 등록되어 있습니다. 변경하려면 새 키를 입력하세요.';
            elements.apiKeyMessage.className = 'settings-message success';
        } else {
            elements.apiKeyStatus.textContent = 'No API Key';
            elements.apiKeyStatus.className = 'api-key-badge badge-fallback';
            elements.apiKeyInput.placeholder = 'YouTube Data API v3 키 입력';
            elements.apiKeyMessage.textContent = '';
        }
    } catch (error) {
        console.error('Failed to check API key status:', error);
    }
}

/**
 * Save API key
 */
async function saveApiKey() {
    const apiKey = elements.apiKeyInput.value.trim();

    if (!apiKey) {
        elements.apiKeyMessage.textContent = 'API 키를 입력해주세요.';
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
            throw new Error(data.detail || data.message || 'API 키 설정 실패');
        }
    } catch (error) {
        elements.apiKeyMessage.textContent = error.message;
        elements.apiKeyMessage.className = 'settings-message error';
    } finally {
        elements.saveApiKeyBtn.disabled = false;
    }
}

/**
 * Delete API key
 */
async function deleteApiKey() {
    if (!confirm('저장된 API 키를 삭제하시겠습니까?')) return;

    elements.deleteApiKeyBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/settings/api-key`, {
            method: 'DELETE',
        });

        const data = await response.json();

        if (response.ok && data.success) {
            localStorage.removeItem('youtube_api_key');
            elements.apiKeyInput.value = '';
            elements.apiKeyMessage.textContent = data.message;
            elements.apiKeyMessage.className = 'settings-message success';
            await checkApiKeyStatus();
        } else {
            throw new Error(data.message || 'API 키 삭제 실패');
        }
    } catch (error) {
        elements.apiKeyMessage.textContent = error.message;
        elements.apiKeyMessage.className = 'settings-message error';
    } finally {
        elements.deleteApiKeyBtn.disabled = false;
    }
}

/**
 * Build save path display string and folder path for opening
 * Returns { displayPath, folderPath }
 */
function buildSavePaths() {
    const base = '~/Downloads/YT-Chita/';
    if (!currentChannelName) {
        return { displayPath: base, folderPath: base };
    }

    if (currentUrlType === 'channel_playlists') {
        // 채널/playlists: 각 재생목록별 폴더에 저장됨
        return {
            displayPath: `${base}${currentChannelName}/ (각 재생목록별 폴더)`,
            folderPath: `${base}${currentChannelName}/`,
        };
    }

    if (currentPlaylistName) {
        // 단일 재생목록
        return {
            displayPath: `${base}${currentChannelName}/${currentPlaylistName}/`,
            folderPath: `${base}${currentChannelName}/${currentPlaylistName}/`,
        };
    }

    // 개별 동영상 또는 @채널 → All Videos
    return {
        displayPath: `${base}${currentChannelName}/All Videos/`,
        folderPath: `${base}${currentChannelName}/All Videos/`,
    };
}

/**
 * Open download folder in system file manager
 */
async function openDownloadFolder(path) {
    try {
        await fetch(`${API_BASE}/open-folder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: path }),
        });
    } catch (e) {
        console.error('Failed to open folder:', e);
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Fetch with extended timeout (default 10 minutes)
 * Prevents WebKit "Load failed" error for long-running requests
 */
function fetchWithTimeout(url, options = {}, timeoutMs = 600000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    // 외부에서 전달된 signal이 있으면 내부 controller와 연동
    if (options.signal) {
        options.signal.addEventListener('abort', () => controller.abort());
    }

    return fetch(url, {
        ...options,
        signal: controller.signal,
    }).finally(() => clearTimeout(timeout));
}

/**
 * Delay helper
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
