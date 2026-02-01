const IMDB_API_BASE = 'https://api.imdbapi.dev';
const CINEMAOS_BASE = 'https://cinemaos.tech/player';

// Specific Hardcoded Overrides
const HARDCODED_IDS = {
    "rick and morty": { "id": "60625", "type": "tv" },
    "mr. young": { "id": "37731", "type": "tv" }
};

// UI Elements
const videoPlayer = document.getElementById('videoPlayer');
const backButton = document.getElementById('backButton');
const titleName = document.getElementById('titleName');
const titleMeta = document.getElementById('titleMeta');
const mainTitle = document.getElementById('mainTitle');
const plotText = document.getElementById('plotText');
const playerPoster = document.getElementById('playerPoster');
const tmdbIdDisplay = document.getElementById('tmdbIdDisplay');
const metadataContainer = document.getElementById('metadataContainer');
const tvControls = document.getElementById('tvControls');
const seasonSelect = document.getElementById('seasonSelect');
const episodeSelect = document.getElementById('episodeSelect');
const mobileTvControls = document.getElementById('mobileTvControls');
const mobileSeasonSelect = document.getElementById('mobileSeasonSelect');
const mobileEpisodeSelect = document.getElementById('mobileEpisodeSelect');
const playerTypeSwap = document.getElementById('playerTypeSwap');
const swapText = document.getElementById('swapText');
const copyId = document.getElementById('copyId');

// --- REDIRECT TRACKER LOGIC ---
const tracker = document.getElementById('redirectTracker');
const trackerToggle = document.getElementById('trackerToggle');
const trackerList = document.getElementById('trackerList');
const clearTracker = document.getElementById('clearTracker');
const copyNotification = document.getElementById('copyNotification');

let blockedUrls = [];

if (trackerToggle) {
    trackerToggle.onclick = () => {
        tracker.classList.toggle('active');
    };
}

function addBlockedUrl(url) {
    if (!url || blockedUrls.includes(url)) return;
    blockedUrls.unshift(url);
    navigator.clipboard.writeText(url).then(() => {
        copyNotification.classList.add('show');
        setTimeout(() => copyNotification.classList.remove('show'), 2000);
    });
    trackerList.innerHTML = blockedUrls.map(u => `<div class="tracker-item" onclick="navigator.clipboard.writeText('${u}')">${u}</div>`).join('');
    tracker.classList.add('active');
}

if (clearTracker) {
    clearTracker.onclick = () => {
        blockedUrls = [];
        trackerList.innerHTML = '';
        tracker.classList.remove('active');
    };
}

// Intercept window.open
const originalWindowOpen = window.open;
window.open = function(url) {
    addBlockedUrl(url);
    return null;
};

// Intercept window.confirm (auto-cancel native popups like VPN warnings)
window.confirm = function(message) {
    console.log("Auto-cancelled confirmation dialog:", message);
    if (message && message.toLowerCase().includes('vpn')) {
        addBlockedUrl("Blocked VPN Prompt: " + message);
    }
    return false; // Automatically press "CANCEL"
};

// Sandbox the iframe to block top-level navigation (redirects)
videoPlayer.sandbox = "allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-presentation";

let currentTitleData = null;
let currentTmdbData = null;

// Initialization
async function initPlayer() {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    
    if (type === 'sport') {
        const sportUrl = params.get('url');
        const sportTitle = params.get('title');
        initSportPlayer(sportUrl, sportTitle);
        return;
    }

    const imdbId = params.get('id');
    const season = parseInt(params.get('s')) || 1;
    const episode = parseInt(params.get('e')) || 1;

    if (!imdbId) {
        window.location.href = 'index.html';
        return;
    }

    // Fetch IMDb Data
    try {
        const resp = await fetch(`${IMDB_API_BASE}/titles/${imdbId}`);
        currentTitleData = await resp.json();
        updateInitialUI(currentTitleData);
        
        // Match TMDb ID
        const searchType = currentTitleData.type?.toLowerCase().includes('series') || currentTitleData.type?.toLowerCase().includes('tv') ? 'tv' : 'movie';
        currentTmdbData = await getTmdbId(currentTitleData.primaryTitle, currentTitleData.startYear, searchType);
        
        if (currentTmdbData) {
            loadStream(currentTmdbData.id, currentTmdbData.type, season, episode);
            updateMetadataUI(currentTmdbData);
        } else {
            plotText.innerText = "Error: Stream not found for this title.";
        }
    } catch (e) {
        console.error('Player init error:', e);
    }
}

function updateInitialUI(data) {
    titleName.innerText = data.primaryTitle;
    mainTitle.innerText = data.primaryTitle;
    plotText.innerText = data.plot || "The cinematic data for this title is currently being decrypted.";
    
    if (data.primaryImage?.url) {
        playerPoster.src = data.primaryImage.url;
        playerPoster.classList.remove('hidden');
    }

    metadataContainer.innerHTML = `
        <span class="px-3 py-1 bg-red-600/10 text-red-500 rounded-lg border border-red-600/20">${data.rating?.aggregateRating || 'N/A'} IMDB</span>
        <span class="px-3 py-1 bg-white/5 text-white/50 rounded-lg border border-white/10 uppercase tracking-widest">${data.startYear || 'N/A'}</span>
        <span class="text-white/30 uppercase tracking-widest">${data.type?.replace('tvSeries', 'SERIES')?.replace('movie', 'MOVIE')}</span>
    `;
}

function updateMetadataUI(tmdbData) {
    titleMeta.innerText = `${tmdbData.type.toUpperCase()} • ${currentTitleData.startYear || ''}`;
    tmdbIdDisplay.innerText = tmdbData.id;
    swapText.innerText = `Switch to ${tmdbData.type === 'movie' ? 'TV' : 'Movie'}`;
    
    if (tmdbData.type === 'tv') {
        tvControls.classList.remove('hidden');
        if (mobileTvControls) mobileTvControls.classList.remove('hidden');
        setupTVControls(currentTitleData.id, tmdbData.id);
    } else {
        tvControls.classList.add('hidden');
        if (mobileTvControls) mobileTvControls.classList.add('hidden');
    }
}

function initSportPlayer(url, title) {
    titleName.innerText = "Live Sport";
    mainTitle.innerText = title;
    titleMeta.innerText = "LIVE EVENT";
    plotText.innerText = "You are watching a live sports event broadcast via satellite link. Enjoy the game!";
    videoPlayer.src = url;
    
    // Hide movie-specific UI components
    playerPoster.classList.add('hidden');
    metadataContainer.innerHTML = `<span class="px-3 py-1 bg-red-600 text-white rounded-lg font-black animate-pulse uppercase tracking-widest text-[10px]">Live Stream</span>`;
    
    // Hide TMDb reference and format swap for sports
    if (playerTypeSwap) playerTypeSwap.classList.add('hidden');
    
    // Find and hide the TMDb reference container (bg-white/[0.03])
    const tmdbRefContainer = document.getElementById('tmdbIdDisplay')?.closest('.bg-white\/\\[0\\.03\\]');
    if (tmdbRefContainer) tmdbRefContainer.classList.add('hidden');
}

async function getTmdbId(titleName, year, contentType = 'movie') {
    const cleanTitle = titleName.toLowerCase().trim();
    if (HARDCODED_IDS[cleanTitle]) return HARDCODED_IDS[cleanTitle];

    try {
        // Proxy call to Vercel Serverless Function to keep API Token hidden
        const response = await fetch('/api/tmdb-scraper', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ titleName, contentType }) 
        });
        const items = await response.json();
        
        if (items?.length > 0) {
            const bestMatch = items.find(item => {
                const rawTitle = (item.title || item.name || '').toLowerCase();
                const cleanItemTitle = rawTitle.replace(/\(\d{4}\)/g, '').trim();
                const itemDate = item.releaseDate || item.firstAirDate || item.release_date || item.first_air_date || '';
                const itemYear = itemDate.substring(0, 4);
                return cleanItemTitle === titleName.toLowerCase() && (year ? (itemYear === String(year) || rawTitle.includes(`(${year})`)) : true);
            }) || items[0];
            
            // Ensure we use the numeric TMDB ID, not the IMDB ID (tt...)
            let tmdbId = bestMatch.id || bestMatch.tmdb_id;
            if (typeof tmdbId === 'string' && tmdbId.startsWith('tt')) {
                // If the primary id is an IMDB ID, look for a numeric one in other fields
                tmdbId = bestMatch.tmdb_id || bestMatch.tmdbId || bestMatch.id;
            }

            return { id: tmdbId, type: (bestMatch.name || bestMatch.firstAirDate || contentType === 'tv') ? 'tv' : 'movie' };
        }
    } catch (e) {}
    return null;
}

function loadStream(id, type, season = 1, episode = 1) {
    const url = type === 'tv' ? `${CINEMAOS_BASE}/${id}/${season}/${episode}` : `${CINEMAOS_BASE}/${id}`;
    videoPlayer.src = url;
    
    // Update URL without reloading
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('s', season);
    newUrl.searchParams.set('e', episode);
    window.history.pushState({}, '', newUrl);
}

async function setupTVControls(imdbId, tmdbId) {
    try {
        const sResp = await fetch(`${IMDB_API_BASE}/titles/${imdbId}/seasons`);
        const sData = await sResp.json();
        if (sData.seasons) {
            const params = new URLSearchParams(window.location.search);
            const currentS = parseInt(params.get('s')) || 1;
            const currentE = parseInt(params.get('e')) || 1;

            const seasonOptions = sData.seasons.map(s => `<option value="${s.season}" ${s.season == currentS ? 'selected' : ''}>Season ${s.season}</option>`).join('');
            seasonSelect.innerHTML = seasonOptions;
            if (mobileSeasonSelect) mobileSeasonSelect.innerHTML = seasonOptions;
            
            const loadEpisodes = async (sNum, selectE = 1) => {
                const eResp = await fetch(`${IMDB_API_BASE}/titles/${imdbId}/episodes?season=${sNum}`);
                const eData = await eResp.json();
                if (eData.episodes) {
                    const episodeOptions = eData.episodes.map(e => `<option value="${e.episodeNumber}" ${e.episodeNumber == selectE ? 'selected' : ''}>Episode ${e.episodeNumber}</option>`).join('');
                    episodeSelect.innerHTML = episodeOptions;
                    if (mobileEpisodeSelect) mobileEpisodeSelect.innerHTML = episodeOptions;
                }
            };

            await loadEpisodes(currentS, currentE);
            
            const handleSeasonChange = (val) => {
                loadEpisodes(val, 1);
                loadStream(tmdbId, 'tv', val, 1);
                // Sync mobile/desktop selects
                if (seasonSelect.value !== val) seasonSelect.value = val;
                if (mobileSeasonSelect && mobileSeasonSelect.value !== val) mobileSeasonSelect.value = val;
            };

            const handleEpisodeChange = (val) => {
                loadStream(tmdbId, 'tv', seasonSelect.value, val);
                // Sync mobile/desktop selects
                if (episodeSelect.value !== val) episodeSelect.value = val;
                if (mobileEpisodeSelect && mobileEpisodeSelect.value !== val) mobileEpisodeSelect.value = val;
            };

            seasonSelect.onchange = (e) => handleSeasonChange(e.target.value);
            episodeSelect.onchange = (e) => handleEpisodeChange(e.target.value);
            if (mobileSeasonSelect) mobileSeasonSelect.onchange = (e) => handleSeasonChange(e.target.value);
            if (mobileEpisodeSelect) mobileEpisodeSelect.onchange = (e) => handleEpisodeChange(e.target.value);
        }
    } catch (e) {}
}

// Event Handlers
backButton.onclick = () => window.location.href = 'index.html';
copyId.onclick = () => navigator.clipboard.writeText(tmdbIdDisplay.innerText);

playerTypeSwap.onclick = () => {
    if (!currentTmdbData) return;
    currentTmdbData.type = currentTmdbData.type === 'movie' ? 'tv' : 'movie';
    updateMetadataUI(currentTmdbData);
    loadStream(currentTmdbData.id, currentTmdbData.type, 1, 1);
};

// Global Autoplay listener (Message from Cinemaos player)
window.addEventListener('message', (event) => {
    // Cinemaos usually sends messages when video ends or progresses
    // This is a placeholder for actual autoplay logic if the player supports postMessage signals
    if (event.data && event.data.type === 'video_ended' && currentTmdbData?.type === 'tv') {
        const nextE = parseInt(episodeSelect.value) + 1;
        if (nextE <= episodeSelect.options.length) {
            episodeSelect.value = nextE;
            loadStream(currentTmdbData.id, 'tv', seasonSelect.value, nextE);
        }
    }
});

initPlayer();
