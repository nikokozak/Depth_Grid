import { getState, subscribe } from './state/store.js';
import { initThreeEngine } from './visual/threeEngine.js';
import { initToneEngine } from './audio/toneEngine.js';
import { initInputHandler } from './input/inputHandler.js';

// Initialize engines
const visual = initThreeEngine(document.getElementById('container'));
const audio = initToneEngine();
const input = initInputHandler();

// Subscribe to state changes
subscribe(state => {
    // Update visual engine
    visual.render(state);
    
    // Update audio engine if needed
    if (state.arrangements.some(arr => arr.isActive)) {
        audio.updateFromState(state);
    }
});

// Start animation loop
const animate = () => {
    requestAnimationFrame(animate);
    visual.animate(getState());
};

animate(); 