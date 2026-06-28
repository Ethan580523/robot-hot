/**
 * Vercel Serverless Function — /api/feed
 * 读取 data/feed.json，支持 domain + type 筛选 + 分页
 */
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    try {
        const dataPath = path.join(process.cwd(), 'data', 'feed.json');
        if (!fs.existsSync(dataPath)) return res.status(200).json({ total: 0, page: 1, perPage: 12, items: [] });

        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        const { domain = 'all', type = 'all', page = '1', perPage = '12' } = req.query;
        let items = data;
        if (domain !== 'all') items = items.filter(i => i.domain === domain);
        if (type !== 'all') items = items.filter(i => i.type === type);
        const total = items.length;
        const p = parseInt(page), pp = parseInt(perPage);
        const start = (p - 1) * pp;
        res.status(200).json({ total, page: p, perPage: pp, items: items.slice(start, start + pp) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
