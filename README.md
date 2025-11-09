# CX Switch

A beautiful web UI for managing and switching Codex API provider configurations.

![CX Switch Screenshot](https://raw.githubusercontent.com/mahaoyang/cx-switch/main/docs/screenshot.png)

## Features

- 🎨 **Modern Interface**: Beautiful, intuitive web UI with glass-morphism design
- 🔐 **Secure Storage**: Keys stored safely in `~/.cx-switch/` (not affected by npm updates)
- 🔑 **Key Masking**: Sensitive information hidden by default with toggle visibility
- 🌍 **Multi-language**: Support for English, 中文, and Español
- ⚡ **Fast Switching**: One-click switching between providers
- 🪟 **Windows/WSL Sync**: Optional toggle keeps Windows and WSL configs in sync when switching
- 📦 **Easy Management**: Add, edit, and delete configurations effortlessly
- 🔄 **Export**: Export to `~/.codex` directory or clipboard
- 🎯 **Project Trust**: Manage project-specific trust levels
- 🚀 **Quick Start**: Simple CLI command to launch

## Installation

### Global Installation (Recommended)

```bash
npm install -g cx-switch
```

### Run Directly with npx

```bash
npx cx-switch
```

### Local Development

```bash
git clone https://github.com/mahaoyang/cx-switch.git
cd cx-switch
npm install
npm run dev
```

## Usage

After installation, simply run:

```bash
cx-switch
# or use the shorter command
cx
```

This will:
1. Start the local server on port 3000
2. Automatically open your browser
3. You can start managing your Codex configurations!

### Adding a Provider

1. Click "Add New" button
2. Fill in your API details:
   - **API Base URL**: e.g., `https://api.openai.com/v1`
   - **API Key**: Your OpenAI API key (sk-...)
   - **Model**: e.g., `gpt-4-turbo`, `claude-3-opus`
   - **Reasoning Effort**: low, medium, or high (optional)
3. Configure advanced options (optional):
   - Custom provider settings
   - Additional auth fields
   - Project trust levels
4. Click "Save"

### Switching Providers

1. Select a provider from the left sidebar
2. Click "Switch to this provider" button
3. The active provider will be marked with "Current"

Switching automatically writes `auth.json` and `config.toml` into your `~/.codex` directory under the current user. When running on Windows or inside WSL, a tooltip-enabled toggle appears next to the button so you can also sync the other side (Windows ↔ WSL) in one go.

### Exporting Configuration

Go to the "Export Configuration" tab and choose:

1. **Export to ~/.codex directory**: Directly writes files to your Codex directory
2. **Copy auth.json**: Copies auth.json content to clipboard
3. **Copy config.toml**: Copies config.toml content to clipboard

## Data Storage

Your configurations are stored in `~/.cx-switch/`:

```
~/.cx-switch/
├── providers.json         # Your provider configurations
├── active-provider.json   # Currently active provider
└── global-config.json     # Global settings
```

**Important Notes:**
- ✅ This directory is separate from the npm package
- ✅ Your data is **safe during npm updates**
- ✅ API keys stored locally, never sent to any server
- 📦 You can backup this directory to preserve your configurations

## Configuration Examples

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

# Custom provider configuration
model_provider = "azure"

[model_providers.azure]
base_url = "https://your-resource.openai.azure.com/v1"
wire_api = "responses"
requires_openai_auth = true

# Project trust levels
[projects."/home/user/workspace/my-project"]
trust_level = "trusted"
```

## Tech Stack

- **Vue 3**: Progressive JavaScript framework
- **Vite**: Next generation frontend tooling
- **Tailwind CSS 4**: Utility-first CSS framework
- **Lucide Icons**: Beautiful icon set
- **vue-i18n**: Internationalization

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run CLI locally
npm start
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- File System Access API support (for directory export)
- Clipboard API support (for copy functions)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License

## Author

[hy](https://github.com/mahaoyang)
