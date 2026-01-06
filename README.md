# SSH Connection Manager

A modern, cross-platform CLI tool for managing SSH connections. Easily add, edit, remove, and connect to remote servers with an intuitive interactive interface. Works seamlessly on macOS, Linux, and other Unix-like systems.

## ✨ Features

- **🔌 Easy SSH Management**: Add, edit, and remove SSH servers from your configuration
- **⚡ Quick Connect**: Select from a list of configured SSH connections and connect instantly
- **🔑 Passwordless SSH Setup**: Automatically copy your SSH public key to new servers for secure, passwordless access
- **🎯 Advanced Configuration**: Support for custom SSH ports and key paths
- **🎨 Modern UI**: Beautiful, emoji-enhanced interface with colored output
- **🌍 Cross-Platform**: Works on macOS, Linux, and other Unix-like systems
- **🚀 No tmux Required**: Direct SSH connections without external dependencies

## 📋 Requirements

- Node.js >= 12.0.0
- SSH client installed (available by default on macOS and most Linux distributions)

## 🔧 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/BolosPaul/ssh-cli-tool.git
   cd ssh-cli-tool
   ```
   
2. **Install dependencies:**
   ```bash
   npm install
   ```
   OR
   ```bash
   yarn
   ```

3. **Make CLI Tool executable:**
   ```bash
   chmod +x ./cli.js
   ```

4. **Link the CLI tool globally:**
   ```bash
   npm link
   ```
   OR
   ```bash
   yarn link
   ```

## 🚀 Usage

1. **Run the CLI tool:**
   ```bash
   ssh-cli-tool
   ```

2. **Main menu options:**
   * **🔌 Connect to an SSH server**: Choose a server from your list to connect via SSH
   * **➕ Add a new SSH connection**: Add details of a new SSH server (name, IP/hostname, username, port, key path)
   * **⚙️ Manage existing connections**: Edit or remove existing connections
   * **👋 Exit**: Exit the tool

## 🎯 New Features in v2.0

- ✅ Removed tmux dependency - works natively on macOS and all Unix-like systems
- ✅ Support for custom SSH ports (not just 22)
- ✅ Support for custom SSH key paths
- ✅ Modern emoji-based UI with better visual feedback
- ✅ Improved error handling and user messages
- ✅ Better connection display showing all configuration details
- ✅ Input validation for all fields

## 💡 Example Workflow

1. Start the tool: `ssh-cli-tool`
2. Add a new server with custom port: Select "Add a new SSH connection"
   - Name: "Production Server"
   - IP: "prod.example.com"
   - User: "admin"
   - Port: "2222"
   - Key: (press Enter for default)
3. Copy SSH key for passwordless login (when prompted)
4. Connect to your server: Select "Connect to an SSH server" and choose your server

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues, feature requests, or pull requests to help improve this tool.

## 📝 Configuration

All SSH connections are stored in `ssh-config.json` in the installation directory. This file is created automatically on first run.

