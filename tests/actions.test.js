import { 
    moveCursor, 
    setMode, 
    toggleTrigger, 
    adjustTriggerParameter,
    createArrangement,
    toggleArrangementActive,
    setArrangementVolume,
    addSample,
    updateGlobalSettings,
    saveState,
    loadState
} from '../src/state/actions.js';
import { getState, _resetState } from '../src/state/store.js';

if (window.location.search.includes('test')) {
    const test = window.zoraTest;
    console.log("What is going on")
    test('actions', t => {
        t.test('cursor movement', t => {
            _resetState();
            // Add a sample to test cursor bounds
            const testSample = { id: '1', name: 'test', url: 'test.wav', defaultVolume: 1 };
            addSample(testSample);
            
            // Ensure we have 16 beats (4 beats * 4 measures)
            updateGlobalSettings({ beatsPerMeasure: 4, measures: 4 });
            
            t.test('moves right within bounds', t => {
                _resetState(); // Reset for clean state
                addSample(testSample);
                moveCursor('right');
                t.equal(getState().cursor.x, 1, 'cursor moved right');
            });

            t.test('wraps around at right edge', t => {
                _resetState(); // Reset for clean state
                addSample(testSample);
                // Move to last position
                for (let i = 0; i < 15; i++) moveCursor('right');
                t.equal(getState().cursor.x, 15, 'cursor at last position');
                moveCursor('right');
                t.equal(getState().cursor.x, 0, 'cursor wrapped to start');
            });

            t.test('moves left within bounds', t => {
                _resetState(); // Reset for clean state
                addSample(testSample);
                moveCursor('right'); // x = 1
                moveCursor('left');
                t.equal(getState().cursor.x, 0, 'cursor moved left');
            });

            t.test('wraps around at left edge', t => {
                _resetState(); // Reset for clean state
                addSample(testSample);
                moveCursor('left');
                t.equal(getState().cursor.x, 15, 'cursor wrapped to end');
            });

            t.test('moves up/down with samples', t => {
                _resetState(); // Reset for clean state
                addSample(testSample);
                addSample({ id: '2', name: 'test2', url: 'test2.wav', defaultVolume: 1 });
                moveCursor('down');
                t.equal(getState().cursor.y, 1, 'cursor moved down');
                moveCursor('up');
                t.equal(getState().cursor.y, 0, 'cursor moved up');
            });
        });

        t.test('mode switching', t => {
            _resetState();
            
            t.test('sets valid modes', t => {
                setMode('volume');
                t.equal(getState().mode, 'volume', 'mode set to volume');
                setMode('pan');
                t.equal(getState().mode, 'pan', 'mode set to pan');
                setMode('pitch');
                t.equal(getState().mode, 'pitch', 'mode set to pitch');
                setMode('arrangement');
                t.equal(getState().mode, 'arrangement', 'mode set to arrangement');
                setMode('navigate');
                t.equal(getState().mode, 'navigate', 'mode set to navigate');
            });
        });

        t.test('trigger manipulation', t => {
            _resetState();
            const testSample = { id: '1', name: 'test', url: 'test.wav', defaultVolume: 1 };
            addSample(testSample);

            t.test('toggles trigger state', t => {
                toggleTrigger();
                t.ok(getState().arrangements[0].triggers[0][0].isActive, 'trigger activated');
                toggleTrigger();
                t.notOk(getState().arrangements[0].triggers[0][0].isActive, 'trigger deactivated');
            });

            t.test('adjusts trigger parameters', t => {
                adjustTriggerParameter('volume', 0.5);
                t.equal(getState().arrangements[0].triggers[0][0].volume, 0.5, 'volume adjusted');
                
                adjustTriggerParameter('pan', -1);
                t.equal(getState().arrangements[0].triggers[0][0].pan, -1, 'pan adjusted');
                
                adjustTriggerParameter('pitch', 12);
                t.equal(getState().arrangements[0].triggers[0][0].pitch, 12, 'pitch adjusted');
            });
        });

        t.test('arrangement management', t => {
            _resetState();
            const testSample = { id: '1', name: 'test', url: 'test.wav', defaultVolume: 1 };
            addSample(testSample);

            t.test('creates new arrangement', t => {
                createArrangement();
                const state = getState();
                t.equal(state.arrangements.length, 2, 'new arrangement added');
                t.equal(state.arrangements[1].triggers.length, 1, 'triggers created for sample');
                t.equal(state.arrangements[1].triggers[0].length, 16, 'correct number of triggers');
            });

            t.test('toggles arrangement active state', t => {
                toggleArrangementActive(0);
                t.notOk(getState().arrangements[0].isActive, 'arrangement deactivated');
                toggleArrangementActive(0);
                t.ok(getState().arrangements[0].isActive, 'arrangement activated');
            });

            t.test('sets arrangement volume', t => {
                setArrangementVolume(0, 0.5);
                t.equal(getState().arrangements[0].volume, 0.5, 'volume set to 0.5');
                setArrangementVolume(0, 1.5);
                t.equal(getState().arrangements[0].volume, 1, 'volume clamped to 1');
                setArrangementVolume(0, -0.5);
                t.equal(getState().arrangements[0].volume, 0, 'volume clamped to 0');
            });
        });

        t.test('sample management', t => {
            _resetState();
            const testSample = { id: '1', name: 'test', url: 'test.wav', defaultVolume: 1 };

            t.test('adds sample with triggers', t => {
                addSample(testSample);
                const state = getState();
                t.equal(state.samples.length, 1, 'sample added');
                t.equal(state.arrangements[0].triggers.length, 1, 'triggers created');
                t.equal(state.arrangements[0].triggers[0].length, 16, 'correct number of triggers');
            });
        });

        t.test('global settings', t => {
            _resetState();
            const testSample = { id: '1', name: 'test', url: 'test.wav', defaultVolume: 1 };
            addSample(testSample);

            t.test('updates settings and resizes triggers', t => {
                updateGlobalSettings({ beatsPerMeasure: 3, measures: 2 });
                const state = getState();
                t.equal(state.globalSettings.beatsPerMeasure, 3, 'beats per measure updated');
                t.equal(state.globalSettings.measures, 2, 'measures updated');
                t.equal(state.arrangements[0].triggers[0].length, 6, 'triggers resized');
            });
        });

        t.test('persistence', t => {
            _resetState();
            const testSample = { id: '1', name: 'test', url: 'test.wav', defaultVolume: 1 };
            addSample(testSample);
            
            t.test('saves and loads state', t => {
                const originalState = getState();
                saveState();
                _resetState();
                loadState();
                const loadedState = getState();
                t.equal(JSON.stringify(loadedState), JSON.stringify(originalState), 'state preserved through save/load');
            });
        });
    });
} 