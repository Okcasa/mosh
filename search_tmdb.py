import json
import requests
import sys

import os

# Use environment variable for security
APIFY_TOKEN = os.getenv("APIFY_TOKEN")

def find_tmdb_id(title_name, year=None, content_type="movie"):
    """
    Use Apify TMDb Scraper to find the correct TMDb ID by matching title and year.
    """
    print(f"Searching TMDb for: {title_name} ({year if year else 'Any Year'})...")
    
    url = f"https://api.apify.com/v2/acts/shahidirfan~themoviedb-scraper/run-sync-get-dataset-items?token={APIFY_TOKEN}"
    
    payload = {
        "useApiFirst": True,
        "contentType": content_type,
        "searchQueries": title_name,
        "resultsWanted": 10,
        "maxPages": 2,
        "sortBy": "popularity.desc",
        "proxyConfiguration": { "useApifyProxy": True }
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        items = response.json()
        
        if not items:
            print("No results found on TMDb.")
            return None

        print(f"Found {len(items)} potential matches. Matching title and year...")
        
        best_match = None
        for item in items:
            item_title = (item.get("title") or item.get("name") or "").lower()
            item_date = item.get("releaseDate") or item.get("firstAirDate") or item.get("release_date") or item.get("first_air_date") or ""
            item_year = item_date[:4] if item_date else ""
            
            # Precise matching logic
            title_matches = item_title == title_name.lower()
            year_matches = str(year) == item_year if year else True
            
            if title_matches and year_matches:
                best_match = item
                break
        
        # Fallback to first result if no precise match found but titles are similar
        if not best_match and items:
            best_match = items[0]
            print("Warning: No exact year/title match found. Defaulting to most popular result.")

        if best_match:
            tmdb_id = best_match.get("id") or best_match.get("tmdb_id")
            media_type = "tv" if (best_match.get("name") or best_match.get("firstAirDate")) else "movie"
            
            print("\nMatch Found!")
            print("-" * 30)
            print(f"Title: {best_match.get('title') or best_match.get('name')}")
            print(f"Year: {item_year}")
            print(f"TMDb ID: {tmdb_id}")
            print(f"Media Type: {media_type}")
            print(f"Overview: {best_match.get('overview', 'N/A')[:100]}...")
            print("-" * 30)
            return {"id": tmdb_id, "type": media_type}
            
        return None
            
    except Exception as e:
        print(f"An error occurred: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 search_tmdb.py <title> [year] [movie/tv]")
        sys.exit(1)
        
    title = sys.argv[1]
    year = sys.argv[2] if len(sys.argv) > 2 else None
    ctype = sys.argv[3] if len(sys.argv) > 3 else "movie"
    
    find_tmdb_id(title, year, ctype)
