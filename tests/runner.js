// Basic test to verify our setup
console.log('Test runner loaded');

import { getState, updateState, subscribe, _resetState } from '../src/state/store.js';

if (window.location.search.includes('test')) {
    console.log('Running in test mode');
    
    const test = window.zoraTest;
    
    if (!test) {
        console.error('Zora test function not found!');
        throw new Error('Zora test function not found!');
    }
    
    test('store initialization', t => {
        _resetState();
        const state = getState();
        
        t.ok(state.arrangements.length === 1, 'starts with one arrangement');
        t.ok(state.arrangements[0].isActive, 'first arrangement is active');
        t.eq(state.cursor, { x: 0, y: 0, z: 0 }, 'cursor starts at origin');
        t.eq(state.mode, 'navigate', 'starts in navigate mode');
    });
    
    test('state immutability', t => {
        _resetState();
        const state1 = getState();
        const state2 = getState();
        
        t.ok(state1 !== state2, 'getState returns new object each time');
        
        // Try to mutate state1
        state1.mode = 'volume';
        const state3 = getState();
        t.eq(state3.mode, 'navigate', 'original state was not mutated');
    });
    
    test('state updates', t => {
        _resetState();
        
        // Test simple update
        updateState(draft => {
            draft.mode = 'volume';
        });
        t.eq(getState().mode, 'volume', 'mode was updated');
        
        // Test nested update
        updateState(draft => {
            draft.globalSettings.tempo = 140;
        });
        t.eq(getState().globalSettings.tempo, 140, 'nested state was updated');
        
        // Test array update
        updateState(draft => {
            draft.arrangements[0].triggers = [[{ isActive: true, volume: 1, pan: 0, pitch: 0 }]];
        });
        t.ok(getState().arrangements[0].triggers[0][0].isActive, 'array state was updated');
    });
    
    test('subscription system', t => {
        _resetState();
        let callCount = 0;
        let lastState = null;
        
        const unsubscribe = subscribe(state => {
            callCount++;
            lastState = state;
        });
        
        t.eq(callCount, 0, 'subscriber not called immediately');
        
        updateState(draft => {
            draft.mode = 'volume';
        });
        
        t.eq(callCount, 1, 'subscriber called after update');
        t.eq(lastState.mode, 'volume', 'subscriber received current state');
        
        unsubscribe();
        updateState(draft => {
            draft.mode = 'pan';
        });
        
        t.eq(callCount, 1, 'subscriber not called after unsubscribe');
    });
    
    test('arrangement management', t => {
        _resetState();
        
        // Test adding arrangement
        updateState(draft => {
            draft.arrangements.push({
                id: '2',
                name: 'New Arrangement',
                isActive: true,
                volume: 1,
                triggers: []
            });
        });
        
        t.eq(getState().arrangements.length, 2, 'arrangement was added');
        
        // Test modifying arrangement
        updateState(draft => {
            draft.arrangements[1].volume = 0.5;
        });
        
        t.eq(getState().arrangements[1].volume, 0.5, 'arrangement was modified');
        
        // Test removing arrangement
        updateState(draft => {
            draft.arrangements.pop();
        });
        
        t.eq(getState().arrangements.length, 1, 'arrangement was removed');
    });
    
    test('cursor movement', t => {
        _resetState();
        
        updateState(draft => {
            draft.cursor.x = 1;
            draft.cursor.y = 2;
            draft.cursor.z = 1;
        });
        
        const cursor = getState().cursor;
        t.eq(cursor, { x: 1, y: 2, z: 1 }, 'cursor position updated correctly');
    });
    
    test('global settings', t => {
        _resetState();
        
        const newSettings = {
            beatsPerMeasure: 3,
            measures: 2,
            tempo: 90
        };
        
        updateState(draft => {
            Object.assign(draft.globalSettings, newSettings);
        });
        
        t.eq(getState().globalSettings, newSettings, 'global settings updated correctly');
    });
} 