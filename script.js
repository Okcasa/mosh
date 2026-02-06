
// Navigation Elements
const logoHome = document.getElementById('logoHome');
const showSports = document.getElementById('showSports');
const mobileHome = document.getElementById('mobileHome');
const mobileSports = document.getElementById('mobileSports');
const searchInput = document.getElementById('searchInput');
const searchGrid = document.getElementById('searchGrid');
const searchResultsSection = document.getElementById('searchResults');

// --- EVENT LISTENERS ---

function updateNavStyles(activeId) {
    const navItems = ['mobileHome', 'mobileSports'];
    navItems.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (id === activeId) {
            el.classList.remove('text-white/30');
            el.classList.add('text-red-500');
        } else {
            el.classList.remove('text-red-500');
            el.classList.add('text-white/30');
        }
    });
}

logoHome.onclick = () => {
    updateNavStyles('mobileHome');
    searchResultsSection.classList.add('hidden');
    searchInput.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

showSports.onclick = () => {
    updateNavStyles('mobileSports');
    searchResultsSection.classList.add('hidden');
    fetchSports('sportsGrid');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

if (mobileHome) mobileHome.onclick = logoHome.onclick;
if (mobileSports) mobileSports.onclick = showSports.onclick;

searchInput.addEventListener('input', debounce((e) => {
    const query = e.target.value.trim().toLowerCase();
    if (query.length > 2) {
        searchSports(query);
    } else {
        searchResultsSection.classList.add('hidden');
    }
}, 500));

// --- CORE FUNCTIONS ---

async function searchSports(query) {
    try {
        const resp = await fetch('https://streamed.pk/api/matches/live');
        const matches = await resp.json();
        const filteredMatches = matches.filter(m => 
            m.title.toLowerCase().includes(query) || 
            (m.teams?.home?.name && m.teams.home.name.toLowerCase().includes(query)) ||
            (m.teams?.away?.name && m.teams.away.name.toLowerCase().includes(query)) ||
            (m.category && m.category.toLowerCase().includes(query))
        );

        if (filteredMatches.length > 0) {
            searchResultsSection.classList.remove('hidden');
            displaySportsGrid(filteredMatches, 'searchGrid');
            searchResultsSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            searchResultsSection.classList.add('hidden');
        }
    } catch (e) {
        console.error('Search error:', e);
    }
}

function displaySportsGrid(matches, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    matches.forEach(match => {
        const card = document.createElement('div');
        card.className = 'glass rounded-3xl p-1 group cursor-pointer hover:scale-[1.02] transition-all duration-500 overflow-hidden';
        
        const homeBadge = match.teams?.home?.badge ? `https://streamed.pk/api/images/badge/${match.teams.home.badge}.webp` : '';
        const awayBadge = match.teams?.away?.badge ? `https://streamed.pk/api/images/badge/${match.teams.away.badge}.webp` : '';
        
        const homeScore = (match.scores && match.scores.home !== undefined) ? match.scores.home : null;
        const awayScore = (match.scores && match.scores.away !== undefined) ? match.scores.away : null;
        const hasScores = homeScore !== null && awayScore !== null;

        card.innerHTML = `
            <div class="bg-zinc-950/50 rounded-[22px] p-6 border border-white/5 group-hover:border-red-600/30 transition-colors">
                <div class="flex items-center justify-between mb-8">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center gap-2 px-3 py-1 bg-red-600/10 rounded-full border border-red-600/20">
                            <span class="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping"></span>
                            <span class="text-[10px] font-black text-red-500 uppercase tracking-widest">Live Now</span>
                        </div>
                        ${match.status ? `<span class="text-[10px] font-black text-white/40 uppercase tracking-widest">${match.status}</span>` : ''}
                    </div>
                    <span class="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] group-hover:text-white/40 transition-colors">${match.category}</span>
                </div>
                <div class="flex items-center justify-between gap-4 ${hasScores ? 'mb-8' : 'mb-12'}">
                    <div class="flex flex-col items-center gap-4 flex-1">
                        <div class="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center p-3 border border-white/5 group-hover:bg-white/10 transition-all">
                            <img src="${homeBadge}" class="w-full h-full object-contain" onerror="this.src='https://via.placeholder.com/64?text=?'">
                        </div>
                        <span class="text-xs font-black text-center line-clamp-1 h-4 uppercase tracking-tighter">${match.teams?.home?.name || 'TBA'}</span>
                        ${hasScores ? `<span class="text-5xl font-black text-white tracking-tighter">${homeScore}</span>` : ''}
                    </div>
                    <div class="flex flex-col items-center justify-center pb-4">
                        ${hasScores ? `<div class="text-[10px] font-black italic text-white/10 mb-2 uppercase">Score</div><div class="w-px h-12 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>` : `<div class="text-2xl font-black italic text-white/5 uppercase tracking-widest">VS</div>`}
                    </div>
                    <div class="flex flex-col items-center gap-4 flex-1">
                        <div class="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center p-3 border border-white/5 group-hover:bg-white/10 transition-all">
                            <img src="${awayBadge}" class="w-full h-full object-contain" onerror="this.src='https://via.placeholder.com/64?text=?'">
                        </div>
                        <span class="text-xs font-black text-center line-clamp-1 h-4 uppercase tracking-tighter">${match.teams?.away?.name || 'TBA'}</span>
                        ${hasScores ? `<span class="text-5xl font-black text-white tracking-tighter">${awayScore}</span>` : ''}
                    </div>
                </div>
                <div class="pt-6 border-t border-white/5">
                    <h4 class="text-[11px] font-black uppercase tracking-tight text-center line-clamp-1 text-white/40 group-hover:text-white transition-colors mb-2">${match.title}</h4>
                    <div class="flex items-center justify-center gap-2 opacity-30">
                         <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                         <p class="text-[9px] font-bold uppercase tracking-widest">${new Date(match.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                </div>
            </div>
        `;
        card.onclick = () => playSport(match);
        container.appendChild(card);
    });
}

async function fetchSports(containerId, filter = 'all', isRefresh = false) {
    const container = document.getElementById(containerId);
    const sportsNav = document.getElementById('sportsNav');
    
    if (!window.sportsRefreshInterval) {
        window.sportsRefreshInterval = setInterval(() => {
            fetchSports(containerId, filter, true);
        }, 30000);
    }

    if (!isRefresh) container.innerHTML = `<div class="col-span-full p-12 text-center animate-pulse uppercase tracking-[0.4em] text-xs opacity-50">Syncing Live Satellites...</div>`;
    
    try {
        const resp = await fetch('https://streamed.pk/api/matches/live');
        const matches = await resp.json();
        const categories = ['all', ...new Set(matches.map(m => m.category).filter(Boolean))];
        sportsNav.innerHTML = categories.map(cat => `<button onclick="fetchSports('sportsGrid', '${cat}')" class="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filter === cat ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}">${cat}</button>`).join('');
        container.innerHTML = '';
        const filteredMatches = filter === 'all' ? matches : matches.filter(m => m.category === filter);
        if (filteredMatches.length === 0) {
            container.innerHTML = `<div class="col-span-full p-12 text-center text-white/20 uppercase tracking-widest text-xs">No ${filter} events found at this time.</div>`;
            return;
        }
        displaySportsGrid(filteredMatches, containerId);
    } catch (e) {
        console.error('Fetch sports error:', e);
    }
}

async function playSport(match) {
    if (match.sources && match.sources.length > 0) {
        const source = match.sources[0];
        try {
            const resp = await fetch(`https://streamed.pk/api/stream/${source.source}/${source.id}`);
            const streams = await resp.json();
            if (streams.length > 0) window.location.href = `player.html?type=sport&url=${encodeURIComponent(streams[0].embedUrl)}&title=${encodeURIComponent(match.title)}`;
        } catch (e) {
            console.error('Play sport error:', e);
        }
    }
}

// --- REDIRECT TRACKER & SHIELD LOGIC ---

const redirectTracker = document.getElementById('redirectTracker');
const trackerToggle = document.getElementById('trackerToggle');
const shieldToggle = document.getElementById('shieldToggle');
const trackerList = document.getElementById('trackerList');
const clearTracker = document.getElementById('clearTracker');
const copyNotification = document.getElementById('copyNotification');

let blockedUrls = [];
let shieldActive = true;

if (trackerToggle) {
    trackerToggle.onclick = () => {
        redirectTracker.classList.toggle('active');
    };
}

if (shieldToggle) {
    shieldToggle.onclick = () => {
        shieldActive = !shieldActive;
        updateShieldUI();
    };
}

function updateShieldUI() {
    const videoPlayer = document.getElementById('videoPlayer');
    if (shieldToggle) {
        if (shieldActive) {
            shieldToggle.classList.remove('bg-red-600', 'border-red-400');
            shieldToggle.classList.add('bg-green-600', 'border-green-400');
            shieldToggle.title = "Redirect Shield: ON";
            if (videoPlayer) videoPlayer.sandbox = "allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-presentation allow-top-navigation-by-user-activation";
        } else {
            shieldToggle.classList.remove('bg-green-600', 'border-green-400');
            shieldToggle.classList.add('bg-red-600', 'border-red-400');
            shieldToggle.title = "Redirect Shield: OFF";
            if (videoPlayer) videoPlayer.removeAttribute('sandbox');
        }
    }
}

if (clearTracker) {
    clearTracker.onclick = () => {
        blockedUrls = [];
        trackerList.innerHTML = '<div class="text-center text-[10px] text-white/20 py-4 italic">No redirects blocked yet</div>';
    };
}

function addBlockedUrl(url) {
    if (blockedUrls.includes(url)) return;
    blockedUrls.unshift(url);
    
    // Copy to clipboard
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            if (copyNotification) {
                copyNotification.classList.add('show');
                setTimeout(() => copyNotification.classList.remove('show'), 2000);
            }
        });
    }

    updateTrackerUI();
}

function updateTrackerUI() {
    if (!trackerList) return;
    if (blockedUrls.length === 0) {
        trackerList.innerHTML = '<div class="text-center text-[10px] text-white/20 py-4 italic">No redirects blocked yet</div>';
        return;
    }
    
    trackerList.innerHTML = blockedUrls.map(url => `
        <div class="tracker-item" onclick="navigator.clipboard.writeText('${url}')">
            ${url}
        </div>
    `).join('');
    
    if (redirectTracker && !redirectTracker.classList.contains('active')) {
        redirectTracker.classList.add('active');
    }
}

// Intercept window.open
window.open = function(url) {
    console.log('Blocked popup/redirect attempt to:', url);
    addBlockedUrl(url);
    return null;
};

// Intercept clicks on links that might redirect
document.addEventListener('click', (e) => {
    const target = e.target.closest('a');
    if (target && target.href) {
        const url = new URL(target.href);
        if (url.origin !== window.location.origin) {
            if (target.id === 'backToBrowse') return;
            e.preventDefault();
            addBlockedUrl(target.href);
        }
    }
}, true);

// --- HELPERS ---

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Initialize Shield
updateShieldUI();

// Start
fetchSports('sportsGrid');
