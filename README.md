# 亮化股票监控系统

一个基于Vue 3和iTick API的实时股票监控和K线图分析系统。

## 🚀 功能特性

### 📊 股票排行榜
- 实时显示热门股票排行
- 支持涨跌幅排序
- 一键查看股票详情

### 📈 实时K线图
- 支持多种时间周期（1分钟、5分钟、日线、周线、月线）
- 实时价格更新
- 专业K线图表显示
- 成交量和成交额信息
- 涨跌幅可视化指示器

### 🔍 股票详情
- 实时股价信息
- 买卖盘数据
- 历史价格走势
- 技术指标分析

### 📱 股票追踪
- 自定义股票关注列表
- 实时价格监控
- 价格变动提醒

### 🔧 API测试工具
- 内置API连通性测试
- 实时数据验证
- 错误诊断功能

## 🛠️ 技术栈

- **前端框架**: Vue 3 + Composition API
- **构建工具**: Vite
- **HTTP客户端**: Axios
- **数据源**: iTick API
- **样式**: CSS3 + 响应式设计

## 📦 安装和运行

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖
```bash
npm install
```

### 开发模式运行
```bash
npm run dev
```

### 生产构建
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

## 🔑 API配置

本项目使用iTick API获取股票数据。请确保：

1. 在 `src/services/iTickService.js` 中配置正确的API Token
2. API Token需要有效的访问权限
3. 网络连接正常

## 📱 使用说明

### 查看股票排行榜
1. 打开应用，默认显示股票排行榜
2. 点击任意股票可查看详细信息
3. 支持实时数据刷新

### 查看K线图
1. 点击导航栏"K线图"按钮
2. 输入6位股票代码或选择热门股票
3. 选择时间周期查看不同级别的K线
4. 点击"刷新"获取最新数据

### 股票追踪
1. 点击"股票追踪"进入追踪页面
2. 添加关注的股票代码
3. 实时监控价格变动

### API测试
1. 点击"API测试"进入测试页面
2. 测试各项API功能
3. 查看详细的响应数据和错误信息

## 🎨 界面特色

- **现代化设计**: 渐变背景、毛玻璃效果
- **响应式布局**: 支持桌面和移动设备
- **直观的数据可视化**: 颜色编码的涨跌指示
- **流畅的交互体验**: 平滑动画和过渡效果

## 📂 项目结构

```
lianghua/
├── src/
│   ├── components/          # Vue组件
│   │   ├── StockRanking.vue # 股票排行榜
│   │   ├── StockDetail.vue  # 股票详情
│   │   ├── StockTracker.vue # 股票追踪
│   │   ├── StockChart.vue   # K线图表
│   │   └── ApiTest.vue      # API测试
│   ├── services/            # 服务层
│   │   └── iTickService.js  # iTick API服务
│   ├── App.vue             # 主应用组件
│   ├── main.js             # 应用入口
│   └── style.css           # 全局样式
├── public/                 # 静态资源
├── package.json           # 项目配置
├── vite.config.js         # Vite配置
├── LICENSE                # MIT开源协议
└── README.md              # 项目说明
```

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进项目！

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 [Issue](https://github.com/jiangjiang666666/xiaobailianghua/issues)
- 发送邮件至项目维护者

## 🙏 致谢

- 感谢 [iTick](https://api.itick.org) 提供的股票数据API
- 感谢Vue.js和Vite团队提供的优秀开发工具
- 感谢所有为开源社区做出贡献的开发者

---

⭐ 如果这个项目对您有帮助，请给个Star支持一下！