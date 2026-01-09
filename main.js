const { app, BrowserWindow, ipcMain } = require('electron');
const Store = require('electron-store');
const { exec } = require('child_process'); // Fixed: Was missing
const fs = require('node:fs')
const path=require('path')

let meditationWindow;
let mainWindow;
let isSessionComplete = false; // Fixed: Was missing

// Initialize Store
const store = new Store({
    defaults: {
        blacklist: [
            'youtube', 'netflix', 'reddit', 'twitter', 
            'steam', 'asura scans', 'asuracomics', 
            'mgecko', 'www.mgeko.cc'
        ]
    }
});

function startWatchdog() {
  
  setInterval(() => {
    // Only check if window is hidden and exists
    if (meditationWindow && !meditationWindow.isVisible()) {
      checkActiveWindow();
    }
  }, 5000); 
}

function checkActiveWindow() {
  // Execute Linux command to get window title
  exec('xdotool getwindowfocus getwindowname', (err, stdout) => {
    if (err) return; // Ignore errors (e.g., no window focused)

    const title = stdout.toLowerCase().trim();
    const currentBlacklist = store.get('blacklist'); 
    
    // Debug: See what you are browsing in terminal
    // console.log("Current Window:", title); 

    const isDistracted = currentBlacklist.some(site => title.includes(site));

    if (isDistracted) {
       console.log(`Distraction Detected: ${title}`);
       triggerTrap();
    }
  });
}

function triggerTrap() {
  isSessionComplete = false; // Lock the door
  meditationWindow.show();
  meditationWindow.setFullScreen(true);
  meditationWindow.focus();
}

function createWindow() {
  meditationWindow = new BrowserWindow({
    fullscreen: false,
    frame: false,
    alwaysOnTop: true,
    show: false, // Start hidden
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  mainWindow = new BrowserWindow({
    title:"FocusMate",
    fullscreen: false,
    frame: true,
    alwaysOnTop: false,
    show: true, // Start hidden
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  meditationWindow.loadFile(__dirname+'/assets/session.html');
  mainWindow.loadFile(__dirname+'/assets/index.html');

  // Start the watchdog only after window is ready
  startWatchdog();

  // The "Jail Warden" Logic
  meditationWindow.on('close', (e) => {
    if (!isSessionComplete) {
      e.preventDefault(); // Deny exit
      console.log("🚫 Escape attempt blocked. Finish the breathing session.");
    } else {
      // Allow hide, but don't quit app
      e.preventDefault();
      meditationWindow.hide();
      meditationWindow.setFullScreen(false);
      console.log("✅ Window hidden, watchdog resuming...");
    }
  });
}

// IPC: Listen for the "Release" signal from renderer.js
ipcMain.on('session-completed', () => {
  console.log("🎉 Session Complete! Unlocking...");
  isSessionComplete = true; // Unlock door
  meditationWindow.close(); // Triggers the close event (which now allows hide)
});

ipcMain.on('send_qoute', (event) => {
  const filePath = path.join(__dirname, 'assets', 'fqoute.txt');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error("Error reading quotes file:", err);
      // Send a fallback quote so the UI isn't empty
      event.reply('receive_qoute', "Focus is the key to productivity."); 
      return;
    }

    // 1. Split file into lines
    // This handles Windows (\r\n) and Linux (\n) line endings
    const lines = data.split(/\r?\n/).filter(line => line.trim() !== '');
    const randomLine = lines[Math.floor(Math.random() * lines.length)];
    console.log('Sending quote:', randomLine);
    // 3. Send it back to the renderer
    // Note: We reply to the specific event sender (the window that asked)
    event.reply('receive_qoute', randomLine);
  });
});

ipcMain.handle('get-settings', () => {
    // Return whatever is currently in the store
    return {
        blacklist: store.get('blacklist')
        // We can add duration/interval settings here later
    };
});

// Handle request from renderer to save new blacklist
ipcMain.on('save-settings', (event, newSettings) => {
    // Save the updated list to config.json
    store.set('blacklist', newSettings.blacklist);
    console.log("Settings saved from renderer.");
    // Optional: trigger an immediate checkActiveWindow() here
});

app.whenReady().then(createWindow);

// Keep app alive on Linux
app.on('window-all-closed', () => {
   // Do nothing, keep running
});