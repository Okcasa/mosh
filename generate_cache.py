import json
import requests
import sys
import time

import os

# Use environment variable for security
APIFY_TOKEN = os.getenv("APIFY_TOKEN")

def fetch_category_titles(url):
    """Fetch titles from IMDb API"""
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        return data.get("titles", [])
    except Exception as e:
        print(f"Error fetching IMDb data: {e}")
        return []

def get_tmdb_data(title_name, year=None):
    """Use Apify TMDb Scraper to find the correct TMDb ID"""
    print(f"Scraping TMDb for: {title_name} ({year if year else 'Any Year'})...")
    
    url = f"https://api.apify.com/v2/acts/shahidirfan~themoviedb-scraper/run-sync-get-dataset-items?token={APIFY_TOKEN}"
    
    payload = {
        "useApiFirst": True,
        "contentType": "movie", # Scraper handles both usually if search is broad
        "searchQueries": title_name,
        "resultsWanted": 5,
        "proxyConfiguration": { "useApifyProxy": True }
    }
    
    try:
        response = requests.post(url, json=payload, timeout=60)
        response.raise_for_status()
        items = response.json()
        
        if items:
            best_match = None
            for item in items:
                item_title = (item.get("title") or item.get("name") or "").lower()
                item_date = item.get("releaseDate") or item.get("firstAirDate") or item.get("release_date") or item.get("first_air_date") or ""
                item_year = item_date[:4] if item_date else ""
                
                if item_title == title_name.lower() and (not year or str(year) == item_year):
                    best_match = item
                    break
            
            if not best_match:
                best_match = items[0]

            tmdb_id = best_match.get("id") or best_match.get("tmdb_id")
            media_type = "tv" if (best_match.get("name") or best_match.get("firstAirDate")) else "movie"
            return {"id": str(tmdb_id), "type": media_type}
    except Exception as e:
        print(f"Error scraping {title_name}: {e}")
    return None

def generate_cache():
    IMDB_API_BASE = 'https://api.imdbapi.dev'
    categories = [
        f"{IMDB_API_BASE}/titles?sortBy=SORT_BY_RELEASE_DATE&sortOrder=DESC&limit=20",
        f"{IMDB_API_BASE}/titles?sortBy=SORT_BY_POPULARITY&limit=20",
        f"{IMDB_API_BASE}/titles?sortBy=SORT_BY_USER_RATING&sortOrder=DESC&limit=20"
    ]
    
    iconic_shows = ['The Simpsons', 'Family Guy', 'South Park', 'Futurama', 'Rick and Morty', 'American Dad!']
    
    cache = {}
    
    print("Step 1: Gathering titles from IMDb...")
    all_titles = []
    for url in categories:
        all_titles.extend(fetch_category_titles(url))
    
    # Add iconic shows to the list to scrape
    for show_name in iconic_shows:
        all_titles.append({"primaryTitle": show_name, "startYear": None})

    # Deduplicate by title
    seen = set()
    unique_titles = []
    for t in all_titles:
        if t["primaryTitle"] not in seen:
            unique_titles.append(t)
            seen.add(t["primaryTitle"])

    print(f"Step 2: Scraping TMDb IDs for {len(unique_titles)} unique titles...")
    for i, title in enumerate(unique_titles):
        name = title["primaryTitle"]
        year = title.get("startYear")
        
        # Rick and Morty hardcode
        if name.lower() == "rick and morty":
            cache[name.lower()] = {"id": "60625", "type": "tv"}
            continue

        data = get_tmdb_data(name, year)
        if data:
            cache[name.lower()] = data
            print(f"[{i+1}/{len(unique_titles)}] Saved: {name} -> {data['id']}")
        
        # Small sleep to avoid hitting Apify limits too fast in sync mode
        time.sleep(0.5)

    print("\nStep 3: Saving to tmdb_cache.json...")
    with open("mosh/tmdb_cache.json", "w") as f:
        json.dump(cache, f, indent=4)
    print("Done! Cache generated successfully.")

if __name__ == "__main__":
    generate_cache()
