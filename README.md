# 🎯 Gomoku (五子棋)

一个功能丰富的五子棋游戏，支持多种游戏模式、AI 对战和多语言。

[![在线演示](https://img.shields.io/badge/在线演示-GitHub%20Pages-green)](https://algovate.github.io/Gomoku/)
![React](https://img.shields.io/badge/React-19.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Vite](https://img.shields.io/badge/Vite-7.2-purple)

## 🎮 核心体验

### 四种游戏模式

**🏆 比赛模式** - 计时对局，禁止悔棋，模拟正式比赛  
**📚 教学模式** - AI 实时提示最佳走法，支持悔棋学习  
**📖 打谱模式** - 复盘历史对局，逐步回放，自动播放  
**👀 旁观模式** - 观看 AI 对战 AI，学习策略

### 核心功能

- 🤖 **智能 AI** - Minimax + Alpha-Beta 剪枝算法
- ⏱️ **计时对局** - 可配置时长（闪电/快棋/标准/长考/正式赛）
- 💡 **实时提示** - 教学模式中 AI 建议最佳走法
- 📜 **走子历史** - 完整记录，支持复盘分析
- 🔄 **悔棋功能** - 除比赛模式外均支持
- 🌍 **多语言** - 中文 / English / 日本語
- 🎨 **现代 UI** - 流畅动画，响应式设计

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build
```

访问 `http://localhost:5173` 开始游戏。

## 📦 技术栈

React 19.2 + TypeScript 5.9 + Vite 7.2 + Tailwind CSS 4.1

## 🎯 游戏规则

15×15 棋盘，黑方先行，先在横、竖、斜任意方向连成五子的一方获胜。

**立即体验**: [algovate.github.io/Gomoku](https://algovate.github.io/Gomoku/)

