// renderer.js
const { ipcRenderer } = require('electron');

// DOM Elements
const circle = document.getElementById('circle');
const instruction = document.getElementById('instruction');
const remainTimeDisplay = document.getElementById('timeremain');
const phaseTimeDisplay = document.getElementById('phase-timer');
const button = document.getElementById('opt-button');
const audio = document.getElementById('bg-music');
audio.volume = 0.5; // 50% volume

// Configuration
const SESSION_DURATION = 60; // Total seconds
const PHASES = [
  { name: "Inhale", class: "grow" },
  { name: "Hold",   class: "grow" }, // Stay big
  { name: "Exhale", class: "shrink" },
  { name: "Hold",   class: "shrink" } // Stay small
];

// State Variables
let globalTimer = null;
let timeLeft = SESSION_DURATION;
let phaseIndex = 0;
let secondCounter = 0; // Tracks 0-3 seconds for current phase

function startSession() {
  // Reset State
  timeLeft = SESSION_DURATION;
  phaseIndex = 0;
  secondCounter = 0;
  
  updateVisuals(); // Apply initial state
  
  // Main Loop (1 second tick)
  globalTimer = setInterval(() => {
    tick();
  }, 1000);
}

function tick() {
  // 1. Update Global Timer
  timeLeft--;
  remainTimeDisplay.innerText = `Session Time: ${timeLeft}s`;

  if (timeLeft <= 0) {
    endSession();
    return;
  }

  // 2. Update Phase Logic
  secondCounter++;
  
  // Every 4 seconds, switch phase
  if (secondCounter >= 4) {
    secondCounter = 0;
    phaseIndex = (phaseIndex + 1) % 4; // Loop 0-3
    updateVisuals();
  }
  
  // Update the small countdown (4..3..2..1)
  phaseTimeDisplay.innerText = `${4 - secondCounter}`;
}

function updateVisuals() {
  const currentPhase = PHASES[phaseIndex];
  
  // Update Text
  instruction.innerText = currentPhase.name;
  phaseTimeDisplay.innerText = "4"; 
  
  // Update Circle Animation
  // We remove all possible classes then add the current one
  circle.classList.remove('grow', 'shrink');
  circle.classList.add(currentPhase.class);
}

function resetvalues(){
 globalTimer = null;
 timeLeft = SESSION_DURATION;
 phaseIndex = 0;
 secondCounter = 0; // Tracks 0-3 seconds for current phase
}

function endSession() {
  clearInterval(globalTimer);
  ipcRenderer.send('session-completed');
  resetvalues();
  audio.pause();
  
}

// Button Handler
button.onclick = () => {
  if (!globalTimer) {
    button.innerText = "Stop & Exit";
    audio.currentTime = 0; // Reset track to start
    audio.play();
    startSession();
  }
};