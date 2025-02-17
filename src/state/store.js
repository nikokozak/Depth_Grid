/**
 * @typedef {Object} Cursor
 * @property {number} x - Beat position
 * @property {number} y - Sample index
 * @property {number} z - Arrangement level
 */

/**
 * @typedef {Object} Trigger
 * @property {boolean} isActive
 * @property {number} volume
 * @property {number} pan
 * @property {number} pitch
 */

/**
 * @typedef {Object} Sample
 * @property {string} id
 * @property {string} name
 * @property {string} url
 * @property {number} defaultVolume
 */

/**
 * @typedef {Object} Arrangement
 * @property {string} id
 * @property {string} name
 * @property {boolean} isActive
 * @property {number} volume
 * @property {Array<Array<Trigger>>} triggers
 */

/**
 * @typedef {Object} DrumMachineState
 * @property {Array<Arrangement>} arrangements
 * @property {number} currentArrangementIndex
 * @property {Object} globalSettings
 * @property {number} globalSettings.beatsPerMeasure
 * @property {number} globalSettings.measures
 * @property {number} globalSettings.tempo
 * @property {Array<Sample>} samples
 * @property {('navigate'|'volume'|'pan'|'pitch'|'arrangement')} mode
 * @property {Cursor} cursor
 */

const { produce } = window.immer;

/** @type {DrumMachineState} */
const initialState = {
    arrangements: [{
        id: '1',
        name: 'Default',
        isActive: true,
        volume: 1,
        triggers: []
    }],
    currentArrangementIndex: 0,
    globalSettings: {
        beatsPerMeasure: 4,
        measures: 4,
        tempo: 120
    },
    samples: [],
    mode: 'navigate',
    cursor: { x: 0, y: 0, z: 0 }
};

let state = initialState;
const listeners = new Set();

/**
 * Updates the state immutably using Immer's produce
 * @param {function(DrumMachineState): void} updater 
 */
export const updateState = (updater) => {
    state = produce(state, updater);
    notifyListeners();
};

/**
 * Subscribes to state changes
 * @param {function(DrumMachineState): void} listener 
 * @returns {function(): void} Unsubscribe function
 */
export const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

/**
 * Gets current state (immutably)
 * @returns {DrumMachineState}
 */
export const getState = () => ({...state});

const notifyListeners = () => {
    listeners.forEach(listener => listener(state));
};

// Export for testing
export const _resetState = () => {
    state = initialState;
    listeners.clear();
}; 