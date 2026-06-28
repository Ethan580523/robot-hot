/**
 * ROBOT HOT Server v2 — 支持领域+类型筛选
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};

const API = {
    '/api/feed': (req, res) => {
        const data = readJson('data/feed.json');
        if (!data) return sendJson(res, { total: 0, page: 1, perPage: 12, items: [] });
        const url = new URL(req.url, `http://localhost:${PORT}`);
        const domain = url.searchParams.get('domain');
        const type = url.searchParams.get('type');
        const page = parseInt(url.searchParams.get('page') || '1');
        const perPage = parseInt(url.searchParams.get('perPage') || '12');
        let items = data;
        if (domain && domain !== 'all') items = items.filter(i => i.domain === domain);
        if (type && type !== 'all') items = items.filter(i => i.type === type);
        const total = items.length;
        const start = (page - 1) * perPage;
        sendJson(res, { total, page, perPage, items: items.slice(start, start + perPage) });
    },
    '/api/daily': (req, res) => {
        sendJson(res, readJson('data/daily-index.json') || []);
    },
    '/api/daily/': (req, res) => {
        const url = new URL(req.url, `http://localhost:${PORT}`);
        const date = url.pathname.split('/').pop();
        const data = readJson(`data/daily/${date}.json`);
        if (!data) return sendJson(res, { error: 'not found' }, 404);
        sendJson(res, data);
    },
    '/api/refresh': (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ message: '正在后台抓取...' }));
        try { execSync('node fetcher.js', { cwd: ROOT, stdio: 'ignore', timeout: 60000 }); }
        catch (e) { console.error('[Refresh]', e.message); }
    },
    '/api/stats': (req, res) => {
        const feed = readJson('data/feed.json') || [];
        const daily = readJson('data/daily-index.json') || [];
        const config = readJson('data/config.json') || {};
        const today = new Date().toISOString().split('T')[0];
        const todayItems = feed.filter(i => i.date === today);
        const domainStats = {};
        for (const item of feed) { domainStats[item.domain] = (domainStats[item.domain] || 0) + 1; }
        sendJson(res, {
            total: feed.length, today: todayItems.length,
            dailyCount: daily.length,
            sources: config.sources || [],
            domainStats,
            lastUpdate: config.lastUpdate || new Date().toISOString()
        });
    }
};

function readJson(relPath) {
    try {
        const full = path.join(ROOT, relPath);
        if (!fs.existsSync(full)) return null;
        return JSON.parse(fs.readFileSync(full, 'utf8'));
    } catch { return null; }
}

function sendJson(res, data, status = 200) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(data));
}

function serveStatic(req, res) {
    let filePath = req.url.split('?')[0];
    if (filePath === '/') filePath = '/index.html';
    if (filePath.startsWith('/api/')) {
        for (const route of Object.keys(API)) {
            if (route === '/api/daily/' ? filePath.startsWith('/api/daily/') : filePath === route) return API[route](req, res);
        }
        return sendJson(res, { error: 'Not found' }, 404);
    }
    const fullPath = path.join(ROOT, filePath);
    if (!fullPath.startsWith(ROOT)) return sendJson(res, { error: 'Forbidden' }, 403);
    fs.readFile(fullPath, (err, data) => {
        if (err) { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); res.end('<h1>404</h1>'); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(fullPath)] || 'application/octet-stream' });
        res.end(data);
    });
}

const server = http.createServer(serveStatic);
server.listen(PORT, () => {
    console.log(`\n╔══════════════════════════════════╗\n║  🤖 ROBOT HOT 已启动             ║\n║  http://localhost:${PORT}           ║\n╚══════════════════════════════════╝\n`);
});

// 首次启动自动抓取
if (!fs.existsSync(path.join(ROOT, 'data', 'feed.json'))) {
    console.log('[RobotHot] 首次启动，抓取数据...');
    try { execSync('node fetcher.js', { cwd: ROOT, stdio: 'inherit', timeout: 60000 }); }
    catch (e) { console.error('[RobotHot] 首次抓取失败'); }
}
