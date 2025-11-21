# 🎯 Gomoku (五子棋)

一个功能丰富的五子棋游戏，基于 React + TypeScript + Vite 构建，支持多种游戏模式、AI 对战、多语言和完整的游戏功能。

[![GitHub](https://img.shields.io/badge/GitHub-Algovate%2FGomoku-blue?logo=github)](https://github.com/Algovate/Gomoku)
[![GitHub Pages](https://img.shields.io/badge/在线演示-GitHub%20Pages-green)](https://algovate.github.io/Gomoku/)
![React](https://img.shields.io/badge/React-19.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Vite](https://img.shields.io/badge/Vite-7.2-purple)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8)

## ✨ 功能特性

### 🎮 游戏模式

- **🏆 比赛模式 (Competition)**
  - 计时对局，每人 10 分钟
  - 禁止悔棋，模拟正式比赛环境
  - 时间耗尽自动判负

- **📚 教学模式 (Teaching)**
  - AI 实时提示最佳走法
  - 支持悔棋，方便学习
  - 适合初学者提升棋艺

- **📖 打谱模式 (Review)**
  - 复盘历史对局
  - 逐步回放走子
  - 自动播放功能
  - 查看完整走子历史

- **👀 旁观模式 (Spectator)**
  - 观看 AI 对战 AI
  - 自动对弈演示
  - 学习 AI 策略

### 🤖 AI 对手

- 基于 **Minimax 算法** 和 **Alpha-Beta 剪枝**
- 深度搜索优化
- 智能评估函数
- 可配置难度等级

### 🌍 多语言支持

- 🇺🇸 English
- 🇨🇳 简体中文
- 🇯🇵 日本語

### 🎨 用户体验

- 现代化 UI 设计，采用 Tailwind CSS
- 15×15 标准棋盘
- 实时走子历史记录
- 悔棋功能（除比赛模式）
- 响应式设计，支持各种屏幕尺寸
- 流畅的动画和交互效果

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 开发模式

启动开发服务器，支持热模块替换 (HMR)：

```bash
npm run dev
```

访问 `http://localhost:5173` 查看应用。

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist` 目录。

### 预览生产构建

```bash
npm run preview
```

### 代码检查

```bash
npm run lint
```

## 📦 技术栈

- **前端框架**: React 19.2
- **开发语言**: TypeScript 5.9
- **构建工具**: Vite 7.2
- **样式方案**: Tailwind CSS 4.1
- **AI 算法**: Minimax with Alpha-Beta Pruning
- **状态管理**: React Hooks
- **国际化**: 自定义 i18n 实现

## 🏗️ 项目结构

```
src/
├── components/          # React 组件
│   ├── Board.tsx      # 棋盘组件
│   └── Game.tsx       # 游戏主逻辑
├── game/              # 游戏核心逻辑
│   ├── logic.ts       # 棋盘逻辑、胜负判断
│   └── ai.ts          # AI 算法实现
├── i18n/              # 国际化
│   ├── LanguageContext.tsx
│   └── translations.ts
├── App.tsx            # 应用入口
└── main.tsx           # 应用启动
```

## 🚢 部署到 GitHub Pages

项目已配置 GitHub Actions 自动部署。

### 首次部署步骤

1. **启用 GitHub Pages**
   - 进入仓库 Settings → Pages
   - 在 "Source" 中选择 **"GitHub Actions"**

2. **推送代码**

   ```bash
   git push origin main
   ```

   - GitHub Actions 会自动触发构建和部署
   - 部署完成后访问：`https://algovate.github.io/Gomoku/`

### 自动部署

- ✅ 每次推送到 `main` 分支自动触发部署
- ✅ 支持在 Actions 标签页手动触发
- ✅ 自动根据仓库名设置正确的 base path
- ✅ 部署状态可在 Actions 标签页实时查看
- ✅ 部署通常需要 2-5 分钟完成

## 🎯 游戏规则

五子棋（Gomoku）是一种两人对弈的纯策略型棋类游戏：

- 棋盘为 15×15 的网格
- 双方轮流在棋盘上放置棋子
- 黑方先行
- 先在横、竖、斜任意方向连成五子的一方获胜

## 📄 许可证

本项目采用 MIT 许可证。

## 🎮 开始游戏

**Enjoy playing Gomoku! 🎮**

