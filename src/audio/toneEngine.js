// Core Tone.js functionality and state management
import { BARS, TIME_SIGNATURE, SAMPLES } from '../config.js';

let GLOBAL_COUNT = 0;

// Initialize players and triggers
const players = initializePlayers(SAMPLES);
const triggers = initializeTriggers(SAMPLES, BARS, TIME_SIGNATURE);
const transport = Tone.getTransport();

// Create master loop
const arrangementLoop = createArrangementLoop(triggers, players);

export { players, triggers, transport, arrangementLoop };

// Helper functions (implementation from original code)
function initializePlayers() { /* ... */ }
function initializeTriggers() { /* ... */ }
function createArrangementLoop() { /* ... */ } 