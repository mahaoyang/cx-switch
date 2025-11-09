# Codex Config Switcher

一个用于管理和快速切换 Codex 配置文件（`~/.codex/auth.json` 和 `~/.codex/config.toml`）的 Web 应用。

## 功能特点

- 📦 **多配置管理**：存储多套配置，支持不同的 API 密钥和模型设置
- ✏️ **可视化编辑**：通过友好的界面编辑 JSON 和 TOML 配置
- 🔄 **一键切换**：快速在不同配置之间切换
- 💾 **本地存储**：所有配置保存在浏览器本地存储中
- 📤 **灵活导出**：
  - 导出到指定目录（选择 `~/.codex` 目录）
  - 复制到剪贴板
- 🎨 **现代界面**：响应式设计，支持深色模式

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:3000 启动

### 3. 构建生产版本

```bash
npm run build
```

## 使用方法

### 添加配置

1. 点击左侧 "新增配置" 按钮
2. 填写配置名称和描述
3. 输入 `auth.json` 内容（JSON 格式）
4. 输入 `config.toml` 内容（TOML 格式）
5. 点击保存

### 编辑配置

1. 在配置列表中点击配置项
2. 点击 "编辑" 按钮
3. 修改配置内容
4. 保存更改

### 切换配置

1. 选择要使用的配置
2. 点击 "切换到此配置" 按钮
3. 当前激活的配置会显示 "当前" 标记

### 导出配置

有三种导出方式：

1. **导出到目录**：点击 "导出到目录"，选择 `~/.codex` 目录，将自动创建/覆盖 `auth.json` 和 `config.toml`
2. **复制 auth.json**：将 auth.json 内容复制到剪贴板，然后手动粘贴到文件中
3. **复制 config.toml**：将 config.toml 内容复制到剪贴板，然后手动粘贴到文件中

## 配置示例

### auth.json

```json
{
  "OPENAI_API_KEY": "sk-your-api-key-here"
}
```

### config.toml

```toml
model = "gpt-4-turbo"
model_reasoning_effort = "high"

# 自定义提供商配置
model_provider = "azure"

[model_providers.azure]
base_url = "https://your-resource.openai.azure.com/v1"
wire_api = "responses"
requires_openai_auth = true

# 项目信任级别
[projects."/home/user/workspace/my-project"]
trust_level = "trusted"
```

## 技术栈

- **Vue 3**：渐进式 JavaScript 框架
- **Vite**：下一代前端构建工具
- **LocalStorage API**：配置持久化存储
- **File System Access API**：文件导出功能

## 浏览器要求

- Chrome/Edge 86+
- 需要支持 File System Access API（用于导出到目录功能）
- 剪贴板 API（用于复制功能）

## 注意事项

- 所有配置数据存储在浏览器的 LocalStorage 中，清除浏览器数据会丢失配置
- 建议定期备份重要配置
- API 密钥等敏感信息仅存储在本地，不会上传到任何服务器

## License

MIT