const { spawn } = require('child_process');
const readline = require('readline');

// Configuration for your services
const services = {
    frontend: { path: './frontend', command: 'pnpm', args: ['dev'], process: null, logs: [], newLine: true },
    backend: { path: './backend', command: 'pnpm', args: ['dev'], process: null, logs: [], newLine: true }
};

const MAX_LOGS = 250; // Increased buffer for better history
let currentView = 'menu'; // 'menu', 'frontend', 'backend'

// Setup standard input for keyboard interactions
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);

function renderUI() {
    console.clear();
    if (currentView === 'menu') {
        console.log('\x1b[36m=================================================\x1b[0m');
        console.log('\x1b[1m\x1b[36m             DEV ENVIRONMENT MANAGER             \x1b[0m');
        console.log('\x1b[36m=================================================\x1b[0m');
        console.log(' \x1b[1m\x1b[33m[f]\x1b[0m View Frontend Logs');
        console.log(' \x1b[1m\x1b[33m[b]\x1b[0m View Backend Logs');
        console.log(' \x1b[1m\x1b[33m[r]\x1b[0m Restart All Services');
        console.log(' \x1b[1m\x1b[33m[q]\x1b[0m Quit All & Exit');
        console.log('\x1b[36m=================================================\x1b[0m');
        console.log('\x1b[1mStatus:\x1b[0m');
        console.log(` \x1b[1mFrontend:\x1b[0m ${services.frontend.process ? '\x1b[32mRunning ●\x1b[0m' : '\x1b[31mStopped ○\x1b[0m'}`);
        console.log(` \x1b[1mBackend:\x1b[0m  ${services.backend.process ? '\x1b[32mRunning ●\x1b[0m' : '\x1b[31mStopped ○\x1b[0m'}`);
        console.log('\x1b[36m=================================================\x1b[0m');
    } else {
        // Render specific service logs
        const color = currentView === 'frontend' ? '\x1b[36m' : '\x1b[35m'; // Cyan for frontend, Magenta for backend
        console.log(`\n${color}=== Viewing ${currentView.toUpperCase()} Logs ===\x1b[0m`);
        console.log(' \x1b[1m\x1b[33m[m]\x1b[0m Back to Menu | \x1b[1m\x1b[33m[c]\x1b[0m Clear Logs | \x1b[1m\x1b[33m[r]\x1b[0m Restart this service | \x1b[1m\x1b[33m[q]\x1b[0m Quit');
        console.log(`${color}-------------------------------------------------\x1b[0m\n`);

        // Print all stored logs
        services[currentView].logs.forEach(log => process.stdout.write(log));
    }
}

function handleLog(serviceName, data, isError = false) {
    const service = services[serviceName];
    let text = data.toString();

    const lines = text.split('\n');
    let output = '';

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        if (service.newLine && line.length > 0) {
            const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
            const prefixColor = serviceName === 'frontend' ? '\x1b[1m\x1b[36m' : '\x1b[1m\x1b[35m';
            const prefix = `${prefixColor}[${serviceName.toUpperCase()}]\x1b[0m \x1b[90m${timestamp}\x1b[0m | `;

            // If the line has no ANSI colors, we apply our own formatting based on keywords
            let cleanLine = line;
            if (!/\x1b\[/.test(line)) {
                const lower = line.toLowerCase();
                if (isError || lower.includes('error') || lower.includes('fail') || lower.includes('exception')) {
                    cleanLine = `\x1b[31m${line}\x1b[0m`; // Red
                } else if (lower.includes('warn')) {
                    cleanLine = `\x1b[33m${line}\x1b[0m`; // Yellow
                } else if (lower.includes('success') || lower.includes('ready') || lower.includes('compiled') || lower.includes('listening on')) {
                    cleanLine = `\x1b[32m${line}\x1b[0m`; // Green
                } else if (lower.includes('info')) {
                    cleanLine = `\x1b[36m${line}\x1b[0m`; // Cyan
                }
            }

            output += prefix + cleanLine;
        } else {
            // For lines that are continuation of a previous chunk without newline, just append them
            // or if it is an empty line, just output it.
            output += line;
        }

        if (i < lines.length - 1) {
            output += '\n';
            service.newLine = true;
        } else {
            service.newLine = (line === '');
        }
    }

    service.logs.push(output);
    if (service.logs.length > MAX_LOGS) service.logs.shift();

    if (currentView === serviceName) {
        process.stdout.write(output);
    }
}

function startService(name) {
    const svc = services[name];
    if (svc.process) return;

    svc.process = spawn(svc.command, svc.args, {
        cwd: svc.path,
        shell: true,
        stdio: 'pipe'
    });

    svc.process.stdout.on('data', (data) => handleLog(name, data, false));
    svc.process.stderr.on('data', (data) => handleLog(name, data, true));

    svc.process.on('close', () => {
        svc.process = null;
        handleLog(name, `\n\x1b[1m\x1b[31m[SYSTEM] Service ${name} exited.\x1b[0m\n`, true);
        if (currentView === name || currentView === 'menu') renderUI();
    });
}

function restartService(name) {
    const svc = services[name];
    if (svc.process) {
        svc.process.kill();
        setTimeout(() => {
            handleLog(name, `\n\x1b[1m\x1b[33m[SYSTEM] Restarting ${name}...\x1b[0m\n`);
            startService(name);
            if (currentView === name) renderUI();
        }, 1000);
    } else {
        startService(name);
    }
}

function killAll() {
    Object.values(services).forEach(svc => {
        if (svc.process) svc.process.kill();
    });
    console.clear();
    console.log('\x1b[1m\x1b[32mShutting down services gracefully...\x1b[0m');
    process.exit(0);
}

// Input routing logic
process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') killAll();

    if (currentView === 'menu') {
        switch (key.name) {
            case 'f': currentView = 'frontend'; renderUI(); break;
            case 'b': currentView = 'backend'; renderUI(); break;
            case 'r': restartService('frontend'); restartService('backend'); renderUI(); break;
            case 'q': killAll(); break;
        }
    } else {
        switch (key.name) {
            case 'm': currentView = 'menu'; renderUI(); break;
            case 'c':
                services[currentView].logs = [];
                services[currentView].newLine = true;
                renderUI();
                break;
            case 'r': restartService(currentView); break;
            case 'q': killAll(); break;
        }
    }
});

// Boot sequence
startService('frontend');
startService('backend');
renderUI();