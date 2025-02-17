import { updateState, getState } from './store.js';

// Cursor Actions
export const moveCursor = (direction) => {
    updateState(draft => {
        const { cursor, globalSettings, samples } = draft;
        const totalBeats = globalSettings.beatsPerMeasure * globalSettings.measures;
        
        switch(direction) {
            case 'right':
                cursor.x = (cursor.x + 1) % totalBeats;
                break;
            case 'left':
                cursor.x = cursor.x === 0 ? totalBeats - 1 : cursor.x - 1;
                break;
            case 'up':
                if (samples.length > 0) {
                    cursor.y = cursor.y === 0 ? samples.length - 1 : cursor.y - 1;
                }
                break;
            case 'down':
                if (samples.length > 0) {
                    cursor.y = (cursor.y + 1) % samples.length;
                }
                break;
        }
    });
};

// Mode Actions
export const setMode = (mode) => {
    updateState(draft => {
        draft.mode = mode;
    });
};

// Trigger Actions
export const toggleTrigger = () => {
    updateState(draft => {
        const { cursor, arrangements, currentArrangementIndex } = draft;
        const trigger = arrangements[currentArrangementIndex].triggers[cursor.y][cursor.x];
        trigger.isActive = !trigger.isActive;
    });
};

export const adjustTriggerParameter = (parameter, value) => {
    updateState(draft => {
        const { cursor, arrangements, currentArrangementIndex } = draft;
        const trigger = arrangements[currentArrangementIndex].triggers[cursor.y][cursor.x];
        trigger[parameter] = value;
    });
};

// Arrangement Actions
export const createArrangement = () => {
    updateState(draft => {
        const { globalSettings, samples } = draft;
        const totalBeats = globalSettings.beatsPerMeasure * globalSettings.measures;
        
        const emptyTriggers = samples.map(() => 
            Array(totalBeats).fill().map(() => ({
                isActive: false,
                volume: 1,
                pan: 0,
                pitch: 0
            }))
        );

        draft.arrangements.push({
            id: crypto.randomUUID(),
            name: `Arrangement ${draft.arrangements.length + 1}`,
            isActive: true,
            volume: 1,
            triggers: emptyTriggers
        });
    });
};

export const toggleArrangementActive = (index) => {
    updateState(draft => {
        draft.arrangements[index].isActive = !draft.arrangements[index].isActive;
    });
};

export const setArrangementVolume = (index, volume) => {
    updateState(draft => {
        draft.arrangements[index].volume = Math.max(0, Math.min(1, volume));
    });
};

// Sample Actions
export const addSample = (sample) => {
    updateState(draft => {
        draft.samples.push(sample);
        // Add empty triggers for this sample in all arrangements
        const totalBeats = draft.globalSettings.beatsPerMeasure * draft.globalSettings.measures;
        draft.arrangements.forEach(arr => {
            arr.triggers.push(Array(totalBeats).fill().map(() => ({
                isActive: false,
                volume: 1,
                pan: 0,
                pitch: 0
            })));
        });
    });
};

// Global Settings Actions
export const updateGlobalSettings = (settings) => {
    updateState(draft => {
        Object.assign(draft.globalSettings, settings);
        // Resize triggers if beats changed
        const totalBeats = draft.globalSettings.beatsPerMeasure * draft.globalSettings.measures;
        draft.arrangements.forEach(arr => {
            arr.triggers.forEach(sampleTriggers => {
                // If increasing, add new triggers
                while (sampleTriggers.length < totalBeats) {
                    sampleTriggers.push({
                        isActive: false,
                        volume: 1,
                        pan: 0,
                        pitch: 0
                    });
                }
                // If decreasing, remove excess triggers
                if (sampleTriggers.length > totalBeats) {
                    sampleTriggers.length = totalBeats;
                }
            });
        });
    });
};

// Persistence Actions
export const saveState = () => {
    const state = getState();
    localStorage.setItem('drumMachineState', JSON.stringify(state));
};

export const loadState = () => {
    const savedState = localStorage.getItem('drumMachineState');
    if (savedState) {
        updateState(() => JSON.parse(savedState));
    }
}; 