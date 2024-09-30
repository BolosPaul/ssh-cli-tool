#!/usr/bin/env node

const { spawn } = require('child_process');
const inquirer = require('inquirer');
const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Emojis (with colors using chalk) for a friendly UI
const sshEmoji = chalk.blue('[*]');
const addEmoji = chalk.green('[+]');
const removeEmoji = chalk.red('[x]');
const manageEmoji = chalk.cyan('[@]');
const editEmoji = chalk.yellow('[=]');
const exitEmoji = chalk.red('[X] Exit');

// Path to the JSON file where the SSH connections are stored
const sshConfigPath = path.join(__dirname, 'ssh-config.json');

// Default template SSH remotes
const defaultSSHRemotes = [
    { name: 'Template Server 1', ip: '192.168.1.100', user: 'template_user' },
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
function connectToRemote(ip, user) {
    // Attempt to use tmux for SSH
    const ssh = spawn('tmux', ['new-window', '-n', 'ssh-connection', 'ssh', `${user}@${ip}`], {
        stdio: 'inherit',
    });

    ssh.on('error', (err) => {
        console.error(chalk.red(`Failed to start SSH with tmux: ${err.message}`));
        // Fallback to a direct SSH connection
        console.log(chalk.yellow('Falling back to direct SSH connection...'));
        const fallbackSSH = spawn('ssh', [`${user}@${ip}`], { stdio: 'inherit' });
    });

    ssh.on('close', (code) => {
        console.log(chalk.yellow(`SSH process exited with code ${code}`));
        clearScreen();
        mainMenu();
    });
}


// Function to clear the screen
function clearScreen() {
    console.clear(); // Clears the terminal screen
}

// Function to add a new SSH connection
// Function to add a new SSH connection
function addNewSSHConnection() {
    inquirer
        .prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Enter a name for this server:',
            },
            {
                type: 'input',
                name: 'ip',
                message: 'Enter the server IP address:',
            },
            {
                type: 'input',
                name: 'user',
                message: 'Enter the username for SSH connection:',
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
                });
                fs.writeFileSync(sshConfigPath, JSON.stringify(sshRemotes, null, 2), 'utf-8');
                console.log(chalk.green('New SSH connection saved!'));

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
                            copySSHKeyToRemote(answers.ip, answers.user);
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
function copySSHKeyToRemote(ip, user) {
    console.log(chalk.blue(`Copying SSH public key to ${user}@${ip}...`));

    // Use ssh-copy-id to copy the public key to the remote server
    const sshCopyId = spawn('ssh-copy-id', [`${user}@${ip}`], { stdio: 'inherit' });

    sshCopyId.on('error', (err) => {
        console.error(chalk.red(`Failed to copy SSH key: ${err.message}`));
    });

    sshCopyId.on('close', (code) => {
        if (code === 0) {
            console.log(chalk.green('SSH key copied successfully! You can now connect without a password.'));
        } else {
            console.error(chalk.red(`ssh-copy-id process exited with code ${code}`));
        }
        clearScreen();
        mainMenu(); // Return to the main menu after copying the key
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
                choices: [...sshRemotes.map((remote) => `${remote.name} (IP: ${remote.ip}, User: ${remote.user})`), 'Cancel'],
            },
        ])
        .then((answers) => {
            if (answers.selectedRemote === 'Cancel') {
                clearScreen();
                return mainMenu();
            }
            const selectedRemote = sshRemotes.find((remote) => `${remote.name} (IP: ${remote.ip}, User: ${remote.user})` === answers.selectedRemote);
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
                            message: 'Enter a new IP address for this server:',
                            default: selectedRemote.ip,
                        },
                        {
                            type: 'input',
                            name: 'user',
                            message: 'Enter a new username for this server:',
                            default: selectedRemote.user,
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

                            // Save changes to the file
                            fs.writeFileSync(sshConfigPath, JSON.stringify(sshRemotes, null, 2), 'utf-8');
                            console.log(chalk.green('SSH connection updated successfully!'));
                        }
                        clearScreen();
                        mainMenu(); // Bring back to the main menu after editing or canceling
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
                choices: [...sshRemotes.map((remote) => `${remote.name} (IP: ${remote.ip}, User: ${remote.user})`), 'Cancel'],
            },
        ])
        .then((answers) => {
            if (answers.selectedRemote === 'Cancel') {
                clearScreen();
                return mainMenu();
            }
            const indexToRemove = sshRemotes.findIndex((remote) => `${remote.name} (IP: ${remote.ip}, User: ${remote.user})` === answers.selectedRemote);
            if (indexToRemove !== -1) {
                sshRemotes.splice(indexToRemove, 1);
                fs.writeFileSync(sshConfigPath, JSON.stringify(sshRemotes, null, 2), 'utf-8');
                console.log(chalk.green(`${removeEmoji} ${answers.selectedRemote} has been removed.`));
                clearScreen();
                mainMenu(); // Bring back to the main menu after removal
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
    inquirer
        .prompt([
            {
                type: 'list',
                name: 'selectedAction',
                message: 'What would you like to do?',
                choices: [
                    `${sshEmoji} Select an SSH connection to connect to`,
                    `${addEmoji} Add a new SSH connection`,
                    `${manageEmoji} Manage existing SSH connections`,
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
                console.log(chalk.green('Goodbye! 👋'));
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
    inquirer
        .prompt([
            {
                type: 'list',
                name: 'selectedRemote',
                message: 'Select an SSH connection to connect to:',
                choices: [...sshRemotes.map((remote) => `${remote.name} ${chalk.gray(`IP: ${remote.ip} | User: ${remote.user}`)}`), 'Cancel'],
            },
        ])
        .then((answers) => {
            if (answers.selectedRemote === 'Cancel') {
                clearScreen();
                return mainMenu();
            }
            clearScreen(); // Clear the screen before showing connection message
            const selectedRemote = sshRemotes.find((remote) => `${remote.name} ${chalk.gray(`IP: ${remote.ip} | User: ${remote.user}`)}` === answers.selectedRemote);
            if (selectedRemote) {
                const { ip, user } = selectedRemote;
                console.log(chalk.blue(`Attempting to connect to: ${selectedRemote.name} (IP: ${ip}, User: ${user})`));
                connectToRemote(ip, user);
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
program.version('1.5.0').description('SSH CLI tool to connect to remote servers');

// Run the main menu on start
program.action(() => {
    clearScreen();
    mainMenu();
});

program.parse(process.argv);