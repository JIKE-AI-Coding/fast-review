# 艾宾浩斯复习系统

基于艾宾浩斯遗忘曲线的智能复习系统，帮助你高效学习和记忆markdown文档。

## 功能特性

- 📁 **目录加载**：加载本地markdown目录，自动构建文件树
- 📖 **沉浸式阅读**：支持markdown渲染、代码高亮、数学公式
- 🧠 **艾宾浩斯算法**：科学的复习间隔（5分钟到15天）
- 📝 **笔记功能**：为文件添加文本笔记
- 📊 **统计追踪**：记忆保持率、复习历史等数据可视化
- 🎨 **自定义设置**：字体大小、主题切换等

## 技术栈

- React 18 + TypeScript
- Vite
- Ant Design
- IndexedDB (Dexie.js)
- React Router
- react-markdown

## 开始使用

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 运行测试

```bash
npm test
```

## Docker 部署

### 开发环境使用 Docker

1. **使用 Docker Compose 启动开发环境**

```bash
docker-compose up --build
```

2. **后台运行**

```bash
docker-compose up -d --build
```

3. **停止服务**

```bash
docker-compose down
```

4. **查看日志**

```bash
docker-compose logs -f
```

### Docker 配置说明

- `Dockerfile`: 基于 Node.js 18 Alpine 的开发环境配置
- `docker-compose.yml`: 开发环境编排配置，包含卷挂载支持热重载
- `.dockerignore`: 优化构建上下文，排除不必要文件

应用将在 http://localhost:5173 上运行。

## 使用说明

1. 点击"加载学习目录"按钮，选择包含markdown文件的文件夹
2. 点击文件开始阅读，系统会自动开始计时
3. 根据艾宾浩斯遗忘曲线，系统会提醒你复习
4. 点击"记住"或"忘记"来反馈复习结果
5. 查看统计数据了解学习进度

## 艾宾浩斯遗忘曲线

复习间隔序列：
- 5分钟
- 30分钟
- 12小时
- 1天
- 2天
- 4天
- 7天
- 15天

## License

MIT
