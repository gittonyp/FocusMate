// settings.js
// Note: We don't need to require ipcRenderer again if it's already in global scope,
// but it's safer to require it in every file in Electron.
const { ipcRenderer } = require('electron');

// Elements
const settingsBtn = document.getElementById('settings-btn');
const settingsView = document.getElementById('settings-view');
const blacklistInput = document.getElementById('blacklist-input');
const saveBtn = document.getElementById('save-settings');
const cancelBtn = document.getElementById('cancel-settings');
const fqoute = document.getElementById('fqoute');


// 1. Ask for a quote when the app starts
ipcRenderer.send('send_qoute');

// Open Settings
settingsBtn.onclick = async () => {
    // Get data from Main Process
    const data = await ipcRenderer.invoke('get-settings');
    // Fill the text area
    blacklistInput.value = data.blacklist.join('\n');
    
    // Show the modal
    settingsView.classList.remove('hidden');
    settingsView.classList.add('active');
};

// Save & Close
saveBtn.onclick = () => {
    const rawText = blacklistInput.value;
    
    // Convert text back to array
    const newList = rawText.split('\n')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0);

    // Send to Main Process
    ipcRenderer.send('save-settings', { blacklist: newList });
    
    closeSettings();
};

// Cancel & Close
cancelBtn.onclick = closeSettings;

function closeSettings() {
    settingsView.classList.remove('active');
    settingsView.classList.add('hidden');
}

ipcRenderer.on('receive_qoute', (event, quote) => {
     // Make sure you have this ID in HTML
    if (fqoute) {
        fqoute.innerText = quote;
    }
});