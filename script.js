const IMDB_API_BASE = 'https://api.imdbapi.dev';
const CINEMAOS_BASE = 'https://cinemaos.tech/player';

// Specific Hardcoded Overrides (Titles that scraper struggles with)
const HARDCODED_IDS = {
    "rick and morty": { "id": "60625", "type": "tv" },
    "mr. young": { "id": "37731", "type": "tv" }
};

function playTitle(title) {
    // Navigate to dedicated player page
    window.location.href = `player.html?id=${title.id}`;
}

const searchInput = document.getElementById('searchInput');
const searchGrid = document.getElementById('searchGrid');
const searchResultsSection = document.getElementById('searchResults');

const logoHome = document.getElementById('logoHome');
const showMovies = document.getElementById('showMovies');
const showShows = document.getElementById('showShows');
const showSports = document.getElementById('showSports');
const mobileHome = document.getElementById('mobileHome');
const mobileMovies = document.getElementById('mobileMovies');
const mobileShows = document.getElementById('mobileShows');
const mobileSports = document.getElementById('mobileSports');

// --- EVENT LISTENERS ---

function updateNavStyles(activeId) {
    const navItems = ['mobileHome', 'mobileMovies', 'mobileShows', 'mobileSports'];
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
    document.querySelectorAll('main > .space-y-20 > section').forEach(s => {
        if (s.id === 'sports') s.classList.add('hidden');
        else s.classList.remove('hidden');
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

showMovies.onclick = () => {
    updateNavStyles('mobileMovies');
    searchResultsSection.classList.add('hidden');
    document.querySelectorAll('main > .space-y-20 > section').forEach(s => {
        const isMovieCat = ['trending', 'popular', 'topRated', 'documentaries', 'horror'].includes(s.id);
        s.classList.toggle('hidden', !isMovieCat);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

showShows.onclick = () => {
    updateNavStyles('mobileShows');
    searchResultsSection.classList.add('hidden');
    document.querySelectorAll('main > .space-y-20 > section').forEach(s => {
        const isShowCat = ['cartoons', 'anime'].includes(s.id);
        s.classList.toggle('hidden', !isShowCat);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

showSports.onclick = () => {
    updateNavStyles('mobileSports');
    searchResultsSection.classList.add('hidden');
    document.querySelectorAll('main > .space-y-20 > section').forEach(s => {
        s.classList.toggle('hidden', s.id !== 'sports');
    });
    fetchSports('sportsGrid');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

if (mobileHome) mobileHome.onclick = logoHome.onclick;
if (mobileMovies) mobileMovies.onclick = showMovies.onclick;
if (mobileShows) mobileShows.onclick = showShows.onclick;
if (mobileSports) mobileSports.onclick = showSports.onclick;

searchInput.addEventListener('input', debounce((e) => {
    const query = e.target.value.trim();
    if (query.length > 2) {
        searchTitles(query);
    } else {
        searchResultsSection.classList.add('hidden');
    }
}, 500));

// --- CORE FUNCTIONS ---

async function searchTitles(query) {
    try {
        const response = await fetch(`${IMDB_API_BASE}/search/titles?query=${encodeURIComponent(query)}&limit=18`);
        const data = await response.json();
        if (data.titles) {
            searchResultsSection.classList.remove('hidden');
            displayGrid(data.titles, 'searchGrid', true); // true for grid layout
            searchResultsSection.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (e) {
        console.error('Search error:', e);
    }
}

async function fetchCategory(url, containerId) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.titles) {
            displayGrid(data.titles, containerId, false); // false for horizontal scroll
        }
    } catch (e) {
        console.error(`Error fetching ${containerId}:`, e);
    }
}

function displayGrid(titles, containerId, isGrid = false) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    titles.forEach((title, index) => {
        const div = document.createElement('div');
        div.className = `movie-card group animate-fade`;
        div.style.animationDelay = `${index * 50}ms`;
        
        // Use a lower quality/smaller image from IMDb if possible (append ._V1_UX300_.jpg)
        let posterUrl = title.primaryImage?.url || 'https://via.placeholder.com/300x450?text=No+Image';
        if (posterUrl.includes('amazon-adsystem.com') || posterUrl.includes('m.media-amazon.com')) {
            // Optimization: Request a smaller version from IMDb CDN
            posterUrl = posterUrl.replace(/\._V1_.*\.jpg$/, '._V1_UX300_.jpg');
        }

        div.innerHTML = `
            <div class="w-full aspect-[2/3] bg-white/5 flex items-center justify-center overflow-hidden">
                <img src="${posterUrl}" 
                     alt="${title.primaryTitle}" 
                     loading="lazy"
                     class="w-full h-full object-cover"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                <div class="absolute inset-0 flex flex-col items-center justify-center p-4 text-center hidden">
                    <svg class="w-8 h-8 text-white/10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/></svg>
                    <span class="text-[10px] font-bold uppercase tracking-widest text-white/20">${title.primaryTitle}</span>
                </div>
            </div>
            <div class="rating-badge">
                <svg class="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                ${title.rating?.aggregateRating || '7.0'}
            </div>
            <div class="card-overlay">
                <h4 class="card-title">${title.primaryTitle}</h4>
                <div class="card-meta">
                    <span class="text-red-500">${title.startYear || 'N/A'}</span>
                    <span class="opacity-50">•</span>
                    <span>${title.type?.replace('movie', 'Movie')?.replace('tvSeries', 'TV') || 'Movie'}</span>
                </div>
            </div>
        `;
        
        div.onclick = () => playTitle(title);
        container.appendChild(div);
    });
}

async function setupTVControls(title, currentSeason, currentEpisode) {
    const seasonSelect = document.getElementById('seasonSelect');
    const episodeSelect = document.getElementById('episodeSelect');
    try {
        const sResp = await fetch(`${IMDB_API_BASE}/titles/${title.id}/seasons`);
        const sData = await sResp.json();
        if (sData.seasons) {
            seasonSelect.innerHTML = sData.seasons.map(s => `<option value="${s.season}" ${s.season == currentSeason ? 'selected' : ''}>Season ${s.season}</option>`).join('');
            
            const loadEpisodes = async (sNum) => {
                const eResp = await fetch(`${IMDB_API_BASE}/titles/${title.id}/episodes?season=${sNum}`);
                const eData = await eResp.json();
                if (eData.episodes) {
                    episodeSelect.innerHTML = eData.episodes.map(e => `<option value="${e.episodeNumber}" ${e.episodeNumber == currentEpisode ? 'selected' : ''}>Episode ${e.episodeNumber}</option>`).join('');
                }
            };

            await loadEpisodes(currentSeason);
            
            seasonSelect.onchange = () => {
                loadEpisodes(seasonSelect.value);
                playTitle(title, seasonSelect.value, 1);
            };
            episodeSelect.onchange = () => playTitle(title, seasonSelect.value, episodeSelect.value);
        }
    } catch (e) {
        console.error('TV Control error:', e);
    }
}

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

function init() {
    const limit = 18;
    
    const categories = [
        { id: 'trendingGrid', url: `${IMDB_API_BASE}/titles?sortBy=SORT_BY_RELEASE_DATE&sortOrder=DESC&limit=${limit}` },
        { id: 'popularGrid', url: `${IMDB_API_BASE}/titles?sortBy=SORT_BY_POPULARITY&limit=${limit}` },
        { id: 'topRatedGrid', url: `${IMDB_API_BASE}/titles?sortBy=SORT_BY_USER_RATING&sortOrder=DESC&limit=${limit}` },
        { id: 'cartoonGrid', special: fetchIconicCartoons },
        { id: 'animeGrid', url: `${IMDB_API_BASE}/titles?genres=Animation&limit=${limit}` },
        { id: 'documentaryGrid', url: `${IMDB_API_BASE}/titles?genres=Documentary&limit=${limit}` },
        { id: 'horrorGrid', url: `${IMDB_API_BASE}/titles?genres=Horror&limit=${limit}` }
    ];

    let loadQueue = [];
    let isProcessingQueue = false;

    const processQueue = async () => {
        if (loadQueue.length === 0) {
            isProcessingQueue = false;
            return;
        }
        isProcessingQueue = true;
        const { cat, el } = loadQueue.shift();
        await new Promise(r => setTimeout(r, 100));
        if (cat.special) await cat.special(cat.id);
        else await fetchCategory(cat.url, cat.id);
        processQueue();
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                if (!el.dataset.loaded) {
                    el.dataset.loaded = "true";
                    const cat = categories.find(c => c.id === el.id);
                    if (cat) {
                        loadQueue.push({ cat, el });
                        if (!isProcessingQueue) processQueue();
                    }
                }
            }
        });
    }, { rootMargin: '100px' });

    categories.forEach(cat => {
        const el = document.getElementById(cat.id);
        if (el) {
            el.innerHTML = Array(6).fill(0).map(() => `<div class="movie-card bg-white/5 animate-pulse"><div class="w-full aspect-[2/3]"></div></div>`).join('');
            observer.observe(el);
        }
    });
}

async function fetchIconicCartoons(containerId) {
    const iconicShows = ['The Simpsons', 'Family Guy', 'South Park', 'Futurama', 'Rick and Morty', 'American Dad!'];
    try {
        const fetchPromises = iconicShows.map(name => fetch(`${IMDB_API_BASE}/search/titles?query=${encodeURIComponent(name)}&limit=1`).then(res => res.json()).catch(() => ({ titles: [] })));
        const results = await Promise.all(fetchPromises);
        const titles = results.filter(data => data.titles?.length > 0).map(data => data.titles[0]);
        if (titles.length > 0) displayGrid(titles, containerId, false);
    } catch (e) {}
}

async function fetchSports(containerId, filter = 'all', isRefresh = false) {
    const container = document.getElementById(containerId);
    const sportsNav = document.getElementById('sportsNav');
    
    if (!window.sportsRefreshInterval) {
        window.sportsRefreshInterval = setInterval(() => {
            if (!document.getElementById('sports').classList.contains('hidden')) {
                fetchSports(containerId, filter, true);
            }
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
        filteredMatches.forEach(match => {
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
    } catch (e) {}
}

async function playSport(match) {
    if (match.sources && match.sources.length > 0) {
        const source = match.sources[0];
        try {
            const resp = await fetch(`https://streamed.pk/api/stream/${source.source}/${source.id}`);
            const streams = await resp.json();
            if (streams.length > 0) window.location.href = `player.html?type=sport&url=${encodeURIComponent(streams[0].embedUrl)}&title=${encodeURIComponent(match.title)}`;
        } catch (e) {}
    }
}

// --- UTILS ---

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

init();
