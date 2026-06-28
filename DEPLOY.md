# 部署指南 — ROBOT HOT 部署到 Vercel（免费层）

## 前置条件
- GitHub 账号（用于推送代码）
- Vercel 账号（用 GitHub 登录即可，免费层足够）

## 步骤

### 1. 初始化 Git 仓库
```bash
cd robot-hot
git init
git add .
git commit -m "ROBOT HOT v3 - 机器人产业动态聚合"
```

### 2. 推送到 GitHub
- 在 GitHub 新建仓库 `robot-hot`（Private 即可）
- 推送代码：
```bash
git remote add origin https://github.com/<你的用户名>/robot-hot.git
git branch -M main
git push -u origin main
```

### 3. 在 Vercel 部署
- 访问 https://vercel.com → 用 GitHub 登录
- 点击 "New Project" → 选择 `robot-hot` 仓库
- Vercel 会自动识别 `vercel.json` 配置
- 点击 "Deploy" → 等待 1-2 分钟
- 部署完成后获得 `robot-hot-xxx.vercel.app` 域名

### 4. 更新数据
Vercel 免费层不支持后台定时任务，数据更新方式：
- **本地运行 `node fetcher.js`** → 重新 `git push` → Vercel 自动重新部署
- 或接入 GitHub Actions 定时抓取（免费层支持 cron）

## Vercel 免费层限制
| 项目 | 限制 | 本项目需求 |
|------|------|-----------|
| 带宽 | 100GB/月 | <1GB |
| Serverless 调用 | 100K/月 | <1K |
| 构建时长 | 6000分钟/月 | <2分钟 |
| 部署数量 | 无限 | 1 |

**完全免费，足够使用。**

## GitHub Actions 自动更新（可选）
在仓库根目录创建 `.github/workflows/fetch.yml`：
```yaml
name: Fetch RSS
on:
  schedule:
    - cron: '0 */6 * * *'  # 每6小时抓取一次
  workflow_dispatch:
jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: node fetcher.js
      - run: |
          git config user.name "Bot"
          git config user.email "bot@github.com"
          git add data/
          git diff --staged --quiet || git commit -m "Auto update data"
          git push
```
