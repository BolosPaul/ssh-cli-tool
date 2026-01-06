#!/usr/bin/env node

const { spawn } = require('child_process');
const inquirer = require('inquirer');
const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Emojis (with colors using chalk) for a friendly UI
const sshEmoji = chalk.blue('🔌');
const addEmoji = chalk.green('➕');
const removeEmoji = chalk.red('🗑️');
const manageEmoji = chalk.cyan('⚙️');
const editEmoji = chalk.yellow('✏️');
const exitEmoji = chalk.red('👋 Exit');

// Path to the JSON file where the SSH connections are stored
const sshConfigPath = path.join(__dirname, 'ssh-config.json');

// Default template SSH remotes
const defaultSSHRemotes = [
  { 
    name: 'Template Server 1', 
    ip: '192.168.1.100', 
    user: 'template_user',
    port: 22,
    keyPath: null
  },
];

// Function to initialize the JSON file with a template if it doesn't exist
function initializeSSHConfig() {
  if (!fs.existsSync(sshConfigPath)) {
    fs.writeFileSync(sshConfigPath, JSON.stringify(defaultSSHRemotes, null, 2), 'utf-8');
    console.log(chalk.green('No SSH config file found. A template config has been created.'));
  }
}

// Load SSH remotes from the JSON file
let sshRemotes = [];
initializeSSHConfig();
sshRemotes = JSON.parse(fs.readFileSync(sshConfigPath, 'utf-8'));

// Function to run the selected SSH command using key-based authentication
function connectToRemote(ip, user, name, port = 22, keyPath = null) {
  console.log(chalk.blue(`\n🔐 Connecting to ${chalk.bold(name)}...`));
  console.log(chalk.gray(`   ${user}@${ip}:${port}`));
  
  // Build SSH arguments
  const sshArgs = [];
  
  // Add port if not default
  if (port && port !== 22) {
    sshArgs.push('-p', port.toString());
  }
  
  // Add identity file if specified
  if (keyPath) {
    sshArgs.push('-i', keyPath);
  }
  
  // Add the connection string
  sshArgs.push(`${user}@${ip}`);
  
  console.log(chalk.gray(`   Command: ssh ${sshArgs.join(' ')}\n`));
  
  // Direct SSH connection that works on all platforms
  const sshConnect = spawn('ssh', sshArgs, { 
    stdio: 'inherit',
    env: { ...process.env, TERM: process.env.TERM || 'xterm-256color' }
  });

  sshConnect.on('close', (sshCode) => {
    if (sshCode === 0) {
      console.log(chalk.green(`\n✓ SSH session closed successfully`));
    } else {
      console.log(chalk.yellow(`\n⚠ SSH process exited with code ${sshCode}`));
    }
    
    // Pause briefly before returning to menu
    setTimeout(() => {
      clearScreen();
      mainMenu();
    }, 1000);
  });

  sshConnect.on('error', (err) => {
    console.error(chalk.red(`\n✗ Failed to start SSH connection: ${err.message}`));
    console.log(chalk.yellow('Please ensure SSH is installed and available in your PATH'));
    
    setTimeout(() => {
      clearScreen();
      mainMenu();
    }, 2000);
  });
}


// Function to clear the screen
function clearScreen() {
  console.clear(); // Clears the terminal screen
}

// Function to add a new SSH connection
function addNewSSHConnection() {
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter a name for this server:',
        validate: (input) => input.trim() ? true : 'Name cannot be empty',
      },
      {
        type: 'input',
        name: 'ip',
        message: 'Enter the server IP address or hostname:',
        validate: (input) => input.trim() ? true : 'IP/hostname cannot be empty',
      },
      {
        type: 'input',
        name: 'user',
        message: 'Enter the username for SSH connection:',
        validate: (input) => input.trim() ? true : 'Username cannot be empty',
      },
      {
        type: 'input',
        name: 'port',
        message: 'Enter the SSH port (press Enter for default 22):',
        default: '22',
        validate: (input) => {
          const port = parseInt(input);
          return (port > 0 && port <= 65535) ? true : 'Port must be between 1 and 65535';
        },
      },
      {
        type: 'input',
        name: 'keyPath',
        message: 'Enter SSH key path (press Enter to use default):',
        default: '',
      },
      {
        type: 'list',
        name: 'action',
        message: 'Save this connection or cancel?',
        choices: ['Save', 'Cancel'],
      },
    ])
    .then((answers) => {
      if (answers.action === 'Save') {
        sshRemotes.push({
          name: answers.name,
          ip: answers.ip,
          user: answers.user,
          port: parseInt(answers.port),
          keyPath: answers.keyPath || null,
        });
        fs.writeFileSync(sshConfigPath, JSON.stringify(sshRemotes, null, 2), 'utf-8');
        console.log(chalk.green('\n✓ New SSH connection saved!'));

        // Ask if the user wants to copy their SSH key
        inquirer
          .prompt([
            {
              type: 'confirm',
              name: 'copyKey',
              message: 'Would you like to copy your SSH public key to this server for passwordless login?',
              default: true,
            },
          ])
          .then((copyKeyAnswer) => {
            if (copyKeyAnswer.copyKey) {
              copySSHKeyToRemote(answers.ip, answers.user, parseInt(answers.port));
            } else {
              clearScreen();
              mainMenu(); // Return to main menu if the user opts out of copying the key
            }
          });
      } else {
        clearScreen();
        mainMenu(); // Bring back to the main menu after saving or canceling
      }
    })
    .catch((error) => {
      console.error(chalk.red('Failed to add new connection:', error.message));
      clearScreen();
      mainMenu(); // Bring back to the main menu on failure
    });
}

// Function to copy the SSH public key to a remote server
function copySSHKeyToRemote(ip, user, port = 22) {
  console.log(chalk.blue(`\n🔑 Copying SSH public key to ${user}@${ip}:${port}...`));

  // Build ssh-copy-id arguments
  const args = [];
  if (port && port !== 22) {
    args.push('-p', port.toString());
  }
  args.push(`${user}@${ip}`);

  // Use ssh-copy-id to copy the public key to the remote server
  const sshCopyId = spawn('ssh-copy-id', args, { stdio: 'inherit' });

  sshCopyId.on('error', (err) => {
    console.error(chalk.red(`\n✗ Failed to copy SSH key: ${err.message}`));
    console.log(chalk.yellow('Note: ssh-copy-id may not be available on all systems'));
    console.log(chalk.gray('You can manually copy your key using: cat ~/.ssh/id_rsa.pub | ssh user@host "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"'));
  });

  sshCopyId.on('close', (code) => {
    if (code === 0) {
      console.log(chalk.green('\n✓ SSH key copied successfully! You can now connect without a password.'));
    } else {
      console.error(chalk.red(`\n✗ ssh-copy-id process exited with code ${code}`));
    }
    
    setTimeout(() => {
      clearScreen();
      mainMenu(); // Return to the main menu after copying the key
    }, 2000);
  });
}

// Function to edit an SSH connection
function editSSHConnection() {
  inquirer
    .prompt([
      {
        type: 'list',
        name: 'selectedRemote',
        message: chalk.yellow('Which server do you want to edit?'),
        choices: [...sshRemotes.map((remote) => `${remote.name} (${remote.user}@${remote.ip}:${remote.port || 22})`), 'Cancel'],
      },
    ])
    .then((answers) => {
      if (answers.selectedRemote === 'Cancel') {
        clearScreen();
        return mainMenu();
      }
      const selectedRemote = sshRemotes.find((remote) => `${remote.name} (${remote.user}@${remote.ip}:${remote.port || 22})` === answers.selectedRemote);
      if (selectedRemote) {
        inquirer
          .prompt([
            {
              type: 'input',
              name: 'name',
              message: 'Enter a new name for this server:',
              default: selectedRemote.name,
            },
            {
              type: 'input',
              name: 'ip',
              message: 'Enter a new IP address or hostname for this server:',
              default: selectedRemote.ip,
            },
            {
              type: 'input',
              name: 'user',
              message: 'Enter a new username for this server:',
              default: selectedRemote.user,
            },
            {
              type: 'input',
              name: 'port',
              message: 'Enter the SSH port:',
              default: (selectedRemote.port || 22).toString(),
              validate: (input) => {
                const port = parseInt(input);
                return (port > 0 && port <= 65535) ? true : 'Port must be between 1 and 65535';
              },
            },
            {
              type: 'input',
              name: 'keyPath',
              message: 'Enter SSH key path (press Enter for default):',
              default: selectedRemote.keyPath || '',
            },
            {
              type: 'list',
              name: 'action',
              message: 'Save changes or cancel?',
              choices: ['Save', 'Cancel'],
            },
          ])
          .then((updatedDetails) => {
            if (updatedDetails.action === 'Save') {
              selectedRemote.name = updatedDetails.name;
              selectedRemote.ip = updatedDetails.ip;
              selectedRemote.user = updatedDetails.user;
              selectedRemote.port = parseInt(updatedDetails.port);
              selectedRemote.keyPath = updatedDetails.keyPath || null;

              // Save changes to the file
              fs.writeFileSync(sshConfigPath, JSON.stringify(sshRemotes, null, 2), 'utf-8');
              console.log(chalk.green('\n✓ SSH connection updated successfully!'));
            }
            
            setTimeout(() => {
              clearScreen();
              mainMenu(); // Bring back to the main menu after editing or canceling
            }, 1000);
          })
          .catch((error) => {
            console.error(chalk.red('Failed to update connection:', error.message));
            clearScreen();
            mainMenu(); // Bring back to the main menu on failure
          });
      }
    });
}

// Function to remove an SSH connection
function removeSSHConnection() {
  inquirer
    .prompt([
      {
        type: 'list',
        name: 'selectedRemote',
        message: chalk.red('Which server do you want to remove?'),
        choices: [...sshRemotes.map((remote) => `${remote.name} (${remote.user}@${remote.ip}:${remote.port || 22})`), 'Cancel'],
      },
    ])
    .then((answers) => {
      if (answers.selectedRemote === 'Cancel') {
        clearScreen();
        return mainMenu();
      }
      const indexToRemove = sshRemotes.findIndex((remote) => `${remote.name} (${remote.user}@${remote.ip}:${remote.port || 22})` === answers.selectedRemote);
      if (indexToRemove !== -1) {
        const removedServer = sshRemotes[indexToRemove];
        sshRemotes.splice(indexToRemove, 1);
        fs.writeFileSync(sshConfigPath, JSON.stringify(sshRemotes, null, 2), 'utf-8');
        console.log(chalk.green(`\n✓ ${removedServer.name} has been removed.`));
        
        setTimeout(() => {
          clearScreen();
          mainMenu(); // Bring back to the main menu after removal
        }, 1000);
      } else {
        console.error(chalk.red('Server not found.'));
        clearScreen();
        mainMenu(); // Bring back to the main menu if the server is not found
      }
    })
    .catch((error) => {
      console.error(chalk.red('Failed to remove the connection:', error.message));
      clearScreen();
      mainMenu(); // Bring back to the main menu on failure
    });
}

// Main menu for selecting actions
function mainMenu() {
  // Display a modern welcome banner
  console.log(chalk.bold.cyan('\n╔═══════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║') + chalk.bold.white('      SSH Connection Manager v2.0      ') + chalk.bold.cyan('║'));
  console.log(chalk.bold.cyan('╚═══════════════════════════════════════╝'));
  console.log(chalk.gray(`  Configured servers: ${sshRemotes.length}\n`));
  
  inquirer
    .prompt([
      {
        type: 'list',
        name: 'selectedAction',
        message: 'What would you like to do?',
        choices: [
          `${sshEmoji} Connect to an SSH server`,
          `${addEmoji} Add a new SSH connection`,
          `${manageEmoji} Manage existing connections`,
          exitEmoji,
        ],
      },
    ])
    .then((answers) => {
      clearScreen(); // Clear the screen before proceeding to the next step
      if (answers.selectedAction.startsWith(addEmoji)) {
        // Call the function to add a new SSH connection
        addNewSSHConnection();
      } else if (answers.selectedAction.startsWith(manageEmoji)) {
        manageConnectionsMenu();
      } else if (answers.selectedAction === exitEmoji) {
        console.log(chalk.green('\n✓ Thanks for using SSH Connection Manager! 👋\n'));
        process.exit(0);
      } else {
        // Connect to an SSH connection
        selectSSHConnectionToConnect();
      }
    })
    .catch((error) => {
      console.error(chalk.red('An error occurred:', error.message));
      clearScreen();
    });
}

// Manage connections menu for editing or removing
function manageConnectionsMenu() {
  inquirer
    .prompt([
      {
        type: 'list',
        name: 'manageAction',
        message: 'What would you like to do with your connections?',
        choices: [`${editEmoji} Edit an SSH connection`, `${removeEmoji} Remove an SSH connection`, 'Cancel'],
      },
    ])
    .then((answers) => {
      clearScreen(); // Clear the screen before proceeding
      if (answers.manageAction === 'Cancel') {
        return mainMenu();
      }
      if (answers.manageAction.startsWith(editEmoji)) {
        editSSHConnection();
      } else if (answers.manageAction.startsWith(removeEmoji)) {
        removeSSHConnection();
      }
    })
    .catch((error) => {
      console.error(chalk.red('An error occurred:', error.message));
      clearScreen();
      mainMenu();
    });
}

// Function to select and connect to an SSH connection
function selectSSHConnectionToConnect() {
  if (sshRemotes.length === 0) {
    console.log(chalk.yellow('\n⚠ No SSH connections configured yet.'));
    console.log(chalk.gray('Please add a connection first.\n'));
    setTimeout(() => {
      clearScreen();
      mainMenu();
    }, 2000);
    return;
  }

  inquirer
    .prompt([
      {
        type: 'list',
        name: 'selectedRemote',
        message: 'Select an SSH connection to connect to:',
        choices: [
          ...sshRemotes.map((remote) => {
            const portStr = (remote.port && remote.port !== 22) ? `:${remote.port}` : '';
            const keyStr = remote.keyPath ? chalk.gray(` [key: ${path.basename(remote.keyPath)}]`) : '';
            return `${remote.name} ${chalk.gray(`(${remote.user}@${remote.ip}${portStr})`)}${keyStr}`;
          }), 
          'Cancel'
        ],
        pageSize: Math.min(sshRemotes.length + 2, 15)
      },
    ])
    .then((answers) => {
      if (answers.selectedRemote === 'Cancel') {
        clearScreen();
        return mainMenu();
      }
      
      // Find the selected remote by matching the formatted string
      const selectedIndex = sshRemotes.findIndex((remote, index) => {
        const portStr = (remote.port && remote.port !== 22) ? `:${remote.port}` : '';
        const keyStr = remote.keyPath ? chalk.gray(` [key: ${path.basename(remote.keyPath)}]`) : '';
        const formatted = `${remote.name} ${chalk.gray(`(${remote.user}@${remote.ip}${portStr})`)}${keyStr}`;
        return formatted === answers.selectedRemote;
      });
      
      if (selectedIndex !== -1) {
        const selectedRemote = sshRemotes[selectedIndex];
        const { ip, user, name, port, keyPath } = selectedRemote;
        clearScreen(); // Clear the screen before showing connection message
        connectToRemote(ip, user, name, port, keyPath);
      } else {
        console.error(chalk.red('Server not found.'));
        clearScreen();
        mainMenu(); // Return to the main menu if the server is not found
      }
    })
    .catch((error) => {
      console.error(chalk.red('An error occurred:', error.message));
      clearScreen();
      mainMenu();
    });
}

// Commander setup
program.version('2.0.0').description('Modern, cross-platform SSH connection manager');

// Run the main menu on start
program.action(() => {
  clearScreen();
  mainMenu();
});

program.parse(process.argv);
