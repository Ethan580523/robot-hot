/** Vercel — /api/stats */
const fs = require('fs');
const path = require('path');
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
        const cwd = process.cwd();
        const feed = fs.existsSync(path.join(cwd, 'data', 'feed.json'))
            ? JSON.parse(fs.readFileSync(path.join(cwd, 'data', 'feed.json'), 'utf8')) : [];
        const daily = fs.existsSync(path.join(cwd, 'data', 'daily-index.json'))
            ? JSON.parse(fs.readFileSync(path.join(cwd, 'data', 'daily-index.json'), 'utf8')) : [];
        const config = fs.existsSync(path.join(cwd, 'data', 'config.json'))
            ? JSON.parse(fs.readFileSync(path.join(cwd, 'data', 'config.json'), 'utf8')) : {};
        const today = new Date().toISOString().split('T')[0];
        const todayItems = feed.filter(i => i.date === today);
        const domainStats = {};
        for (const item of feed) { domainStats[item.domain] = (domainStats[item.domain] || 0) + 1; }
        res.status(200).json({
            total: feed.length, today: todayItems.length,
            dailyCount: daily.length,
            sources: config.sources || [],
            domainStats,
            lastUpdate: config.lastUpdate || new Date().toISOString()
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
};
