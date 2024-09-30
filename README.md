# SSH Manager CLI

A friendly and interactive CLI tool for managing SSH connections, allowing you to add, edit, remove, and connect to remote servers seamlessly. Set up SSH connections with passwordless access using your public key, organized within a simple configuration file.

## Features

- **Easily manage SSH connections**: Add, edit, and remove SSH servers from your configuration.
- **Quickly connect**: Select from a list of configured SSH connections and open them in a new terminal window.
- **Passwordless SSH setup**: Automatically copy your SSH public key to a new server for secure, passwordless access.
- **Fallback mechanism**: If `tmux` is not installed or fails, connect via a direct SSH session.

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/ssh-manager-cli.git
   cd ssh-manager-cli```
   
2. **Install dependecies**
```bash
   npm install
```
OR
```bash
   yarn
```

3. **Make CLI Tool executable**
```bash
   chmod +x ./cli.js
```

4. **Link the CLI tool globally**
```bash
   yarn link
```

## Usage

1. Run CLI tool
```bash
   ssh-cli-tool
```

2. Main menu options
* ``[*] Add a new SSH Connection``: Add details of a new SSH server.
* ``[@] Manage existing SSH connections``: Edit or remove existing connections.
* ``[*] Select an SSH connection to connect to``: Choose a server from your list to connect via SSH.
* ``[X] Exit``: Exit the tool.

Contributions are welcome! Feel free to submit issues, feature requests, or pull requests to help improve this tool.

