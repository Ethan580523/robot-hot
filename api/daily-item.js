/** Vercel — /api/daily/:date (单日日报) */
const fs = require('fs');
const path = require('path');
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
        // Vercel 动态路由：/api/daily/[date].js
        const date = req.query.date || (req.url.split('/').pop() || '').split('?')[0];
        const p = path.join(process.cwd(), 'data', 'daily', `${date}.json`);
        if (!fs.existsSync(p)) return res.status(404).json({ error: 'not found' });
        res.status(200).json(JSON.parse(fs.readFileSync(p, 'utf8')));
    } catch (err) { res.status(500).json({ error: err.message }); }
};
