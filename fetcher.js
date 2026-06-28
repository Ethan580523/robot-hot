/**
 * RSS 抓取器 v3 — 本地翻译 + 行业细分 + 零外部依赖
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { translateLocal } = require('./translator');

const SOURCES = [
    { name: 'IEEE Spectrum Robotics', nameCn: 'IEEE Spectrum', url: 'https://spectrum.ieee.org/feeds/topic/robotics.rss' },
    { name: 'robot.tv', nameCn: 'robot.tv', url: 'https://news.robot.tv/feed.xml' },
    { name: 'The Robot Report', nameCn: 'The Robot Report', url: 'https://therobotreport.com/feed/' }
];

const DOMAIN_KEYWORDS = {
    humanoid:    ['humanoid', 'bipedal', 'optimus', 'atlas', 'figure', 'g1', 'walker', 'apollo', 'humanoid robot', '人形机器人', '双足', 'tesla bot'],
    industrial:  ['factory', 'manufacturing', 'production line', 'welding', 'assembly', 'industrial robot', 'cobot', 'collaborative robot', '工业机器人', '产线', '制造', '焊接', '装配', '协作', 'smart factory', 'smart manufacturing'],
    embodied:    ['embodied', 'physical ai', 'foundation model', 'vla', 'vision-language-action', '具身智能', 'rt-3', 'gr00t', 'rt-2', 'embodiment', 'large model'],
    service:     ['service robot', 'delivery robot', 'cleaning', 'medical', 'surgical', 'hospital', 'restaurant', 'retail', '服务机器人', '配送', '清洁', '医疗', '手术'],
    drone:       ['drone', 'uav', 'aerial', 'flying', 'quadrotor', '无人机', '飞行', 'matrice'],
    components:  ['actuator', 'sensor', 'gripper', 'end effector', 'reducer', 'harmonic', 'servo', 'motor', 'battery', 'lidar', '执行器', '传感器', '夹爪', '减速器', '谐波', '伺服', '电机'],
    policy:      ['policy', 'regulation', 'funding', 'investment', 'ipo', 'market', 'government', '政策', '法规', '融资', '投资', '上市', '政府', '工信部'],
    research:    ['paper', 'study', 'research', 'open source', 'dataset', 'benchmark', 'arxiv', 'icra', 'iros', '论文', '研究', '开源', '数据集']
};

const TYPE_KEYWORDS = {
    product:  ['launch', 'release', 'announce', 'unveil', 'debut', 'introduce', 'ship', '发布', '推出', '上市', '新品', '量产'],
    industry: ['factory', 'deploy', 'production', 'partnership', 'funding', 'investment', 'market', 'collaboration', '工厂', '部署', '融资', '投资', '合作', '政策'],
    research: ['paper', 'study', 'research', 'open source', 'dataset', 'benchmark', '论文', '研究', '开源', '数据集', 'arxiv'],
    opinion:  ['opinion', 'analysis', 'perspective', 'view', 'trend', 'forecast', '观点', '分析', '评论', '趋势']
};

const DOMAIN_CN = {
    humanoid:   { label: '人形机器人', emoji: '🤖' },
    industrial: { label: '工业机器人', emoji: '🏭' },
    embodied:   { label: '具身智能', emoji: '🧠' },
    service:    { label: '服务机器人', emoji: '🛎️' },
    drone:      { label: '无人机/移动', emoji: '🚁' },
    components: { label: '核心零部件', emoji: '⚙️' },
    policy:     { label: '政策/投资', emoji: '📋' },
    research:   { label: '学术研究', emoji: '📄' }
};

const TYPE_CN = {
    product:  { label: '产品发布', class: 'cat-product' },
    industry: { label: '行业动态', class: 'cat-industry' },
    research: { label: '论文研究', class: 'cat-research' },
    opinion:  { label: '观点技巧', class: 'cat-opinion' }
};

function classify(text, keywordMap) {
    const lower = text.toLowerCase();
    let best = 'industry';
    let bestScore = 0;
    for (const [key, words] of Object.entries(keywordMap)) {
        let score = 0;
        for (const w of words) {
            if (lower.includes(w.toLowerCase())) score++;
        }
        if (score > bestScore) { bestScore = score; best = key; }
    }
    return best;
}

function fetch(url) {
    return new Promise((resolve, reject) => {
        const mod = url.startsWith('https') ? https : http;
        const req = mod.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 RobotHot/3.0',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*'
            },
            timeout: 15000
        }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return resolve(fetch(res.headers.location));
            if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

function parseRSS(xml, sourceCn) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
        const block = match[1];
        const title = extractTag(block, 'title');
        const link = extractTag(block, 'link');
        const desc = stripHtml(extractTag(block, 'description'));
        const pubDate = extractTag(block, 'pubDate');
        if (!title) continue;
        const date = pubDate ? new Date(pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        const fullText = title + ' ' + desc;
        items.push({
            id: Buffer.from(link || title).toString('base64').slice(0, 12),
            title: title.trim(),
            titleCn: translateLocal(title.trim()),
            summary: desc.slice(0, 200) + (desc.length > 200 ? '...' : ''),
            summaryCn: translateLocal(desc.slice(0, 200)),
            source: sourceCn,
            date: date,
            link: link || '#',
            type: classify(fullText, TYPE_KEYWORDS),
            domain: classify(fullText, DOMAIN_KEYWORDS)
        });
    }
    return items;
}

function extractTag(xml, tag) {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = xml.match(regex);
    if (match) return match[1].trim();
    const regex2 = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)(?=<|$)`, 'i');
    const match2 = xml.match(regex2);
    return match2 ? match2[1].trim() : '';
}

function stripHtml(str) {
    return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}

async function main() {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const allItems = [];
    console.log(`[RobotHot v3] 开始抓取 — ${new Date().toISOString()}`);

    for (const source of SOURCES) {
        try {
            console.log(`  抓取: ${source.name} ...`);
            const xml = await fetch(source.url);
            const items = parseRSS(xml, source.nameCn);
            console.log(`  ✓ ${source.name}: ${items.length} 条`);
            allItems.push(...items);
        } catch (err) {
            console.error(`  ✗ ${source.name}: ${err.message}`);
        }
    }

    // 去重
    const seen = new Set();
    const deduped = allItems.filter(item => {
        if (seen.has(item.title)) return false;
        seen.add(item.title);
        return true;
    });

    // 本地翻译（同步，瞬间完成）
    console.log(`[RobotHot] 本地翻译 ${deduped.length} 条...`);

    deduped.sort((a, b) => b.date.localeCompare(a.date));

    // 统计领域分布
    const domainStats = {};
    for (const item of deduped) {
        domainStats[item.domain] = (domainStats[item.domain] || 0) + 1;
    }
    console.log(`[RobotHot] 领域分布:`, domainStats);

    fs.writeFileSync(path.join(dataDir, 'feed.json'), JSON.stringify(deduped, null, 2), 'utf8');
    console.log(`[RobotHot] 全部动态: ${deduped.length} 条 → data/feed.json`);

    // 日报 — 按领域分组
    const dailyMap = {};
    for (const item of deduped) {
        if (!dailyMap[item.date]) dailyMap[item.date] = [];
        dailyMap[item.date].push(item);
    }
    const dailyDir = path.join(dataDir, 'daily');
    if (!fs.existsSync(dailyDir)) fs.mkdirSync(dailyDir, { recursive: true });
    for (const [date, items] of Object.entries(dailyMap)) {
        fs.writeFileSync(path.join(dailyDir, `${date}.json`), JSON.stringify(organizeDaily(date, items), null, 2), 'utf8');
    }
    const dailyIndex = Object.keys(dailyMap).sort().reverse().map(date => ({ date, count: dailyMap[date].length }));
    fs.writeFileSync(path.join(dataDir, 'daily-index.json'), JSON.stringify(dailyIndex, null, 2), 'utf8');

    fs.writeFileSync(path.join(dataDir, 'config.json'), JSON.stringify({
        domains: DOMAIN_CN, types: TYPE_CN,
        sources: SOURCES.map(s => ({ name: s.nameCn })),
        domainStats,
        lastUpdate: new Date().toISOString()
    }, null, 2), 'utf8');

    console.log(`[RobotHot] 日报: ${dailyIndex.length} 天`);
    console.log(`[RobotHot] 完成!`);
}

function organizeDaily(date, items) {
    const byDomain = {};
    for (const item of items) {
        const d = item.domain || 'industry';
        if (!byDomain[d]) byDomain[d] = [];
        byDomain[d].push({
            title: item.title, titleCn: item.titleCn,
            summary: item.summary, summaryCn: item.summaryCn,
            source: item.source, link: item.link, type: item.type
        });
    }
    return {
        date,
        title: `ROBOT HOT 日报 — ${date}`,
        totalItems: items.length,
        sections: Object.entries(byDomain).map(([key, val]) => ({
            key,
            label: DOMAIN_CN[key]?.label || key,
            emoji: DOMAIN_CN[key]?.emoji || '📌',
            count: val.length,
            items: val
        })).sort((a, b) => b.items.length - a.items.length)
    };
}

main().catch(err => { console.error('[RobotHot] 致命错误:', err); process.exit(1); });
