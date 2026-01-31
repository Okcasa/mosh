export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const APIFY_TOKEN = process.env.APIFY_TOKEN;
    
    if (!APIFY_TOKEN) {
        return res.status(500).json({ error: 'APIFY_TOKEN not configured on Vercel' });
    }

    try {
        const { titleName, contentType } = req.body;
        
        const url = `https://api.apify.com/v2/acts/shahidirfan~themoviedb-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;
        const payload = { 
            "searchQueries": titleName, 
            "resultsWanted": 20, 
            "contentType": contentType || "movie",
            "useApiFirst": true, 
            "proxyConfiguration": { "useApifyProxy": true } 
        };

        const response = await fetch(url, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });

        const data = await response.json();
        
        // Return the scraper results to the frontend
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch from Apify' });
    }
}
