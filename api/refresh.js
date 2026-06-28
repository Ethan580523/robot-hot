/** Vercel — /api/refresh (手动触发抓取) */
const { execSync } = require('child_process');
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).json({ message: 'Vercel环境不支持后台抓取，请在本地运行 fetcher.js 更新数据后重新部署' });
};
