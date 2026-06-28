/** Vercel — /api/daily (日报索引) */
const fs = require('fs');
const path = require('path');
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
        const p = path.join(process.cwd(), 'data', 'daily-index.json');
        const data = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : [];
        res.status(200).json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
};
