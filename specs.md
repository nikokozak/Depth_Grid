# Drum Machine

## Basics

This is a drum machine that allows you to create your own drum patterns.

You are provided with a given set of samples (can be drums, synths, etc.).

As a default, every sample is drawn as a series of empty circles along a horizontal line, beginning at the first circle and ending at the last circle.

Each circle in this line represents a beat.

By default, 16 circles are drawn, evenly spaced and along a line, for each sample. This is because we draw, by default 4 beats per measure and 4 measures.

You can change the number of beats per measure and the number of measures. This affects every sample, as they all share the same number of beats per measure and number of measures.

You can also change the tempo of the drum machine. This affects the speed at which the drum machine plays.

Each sample's line and circles (or triggers) is drawn in 3d space, with the line being drawn along
the x-axis. Each line, corresponding to subsequent samples, is drawn above the previous line (upwards along the y-axis).

While in "Navigate" mode:

You can navigate along the circles (or triggers) of each sample by using the left and right arrow keys. You can move up and down the lines of samples by using the up and down arrow keys.

You can activate or deactivate a trigger using the space bar.

## Pitch, Pan, and Volume

You can change the pitch, pan, and volume of each sample.

You can change the volume of a particular trigger by moving to it with the cursor, and holding "v" while using the up and down arrow keys to adjust the volume of the sample. You will see a smaller circle appear above or below the trigger as you move the volume up or down.

You can change the pan of a particular trigger by moving to it with the cursor, and holding "b" while using the left and right arrow keys to adjust the pan of the sample. You will see a smaller circle appear to the left or to the right (-z or +z) the trigger as you move the pan left or right.

You can change the pitch of a particular trigger by moving to it with the cursor, and holding "p" while typing the up and down arrow keys to adjust the pitch of the sample. You will see a smaller circle appear above or below the trigger as you move the pitch up or down.

## Multiple Arrangements

You can create multiple arrangements of the drum machine.

An arrangement corresponds to a set of samples with their triggers arranged in a certain manner.

All arrangements share the same set of samples, but each arrangement can have its own unique set of triggers.

All arrangements share the same number of beats per measure, number of measures, and tempo.

You can switch between arrangements by pressing the "u" and "d" keys. If an arrangement does not exist in that "direction", a new arrangement is created with empty triggers. Navigating away from an arrangement with empty triggers will delete it.

Arrangements are drawn as another set of horizontal lines, just like the initial arrangement, just that above or below the original arrangement (on the y-axis).

You can turn "on" or "off" an arrangement by pressing the "o" key. When an arrangement is turned "off", it is not played when the drum machine is played.

You can also adjust the volume of the whole arrangement by pressing "a" to enter the arrangement settings mode, and then using the up and down arrow keys to adjust the volume of the arrangement. The volume of the arrangement is shown as a small bar next to the name of the arrangement, to the left of the grid.

## Architectural Notes & Module Breakdown

### Core State Shape
```typescript
type DrumMachineState = {
  arrangements: Array<Arrangement>
  currentArrangementIndex: number
  globalSettings: {
    beatsPerMeasure: number
    measures: number
    tempo: number
  }
  samples: Array<Sample>
  mode: 'navigate' | 'volume' | 'pan' | 'pitch' | 'arrangement'
  cursor: {
    x: number // beat position
    y: number // sample index
    z: number // arrangement level
  }
}

type Arrangement = {
  id: string
  name: string
  isActive: boolean
  volume: number
  triggers: Array<Array<Trigger>> // [sampleIndex][beatIndex]
}

type Trigger = {
  isActive: boolean
  volume: number
  pan: number
  pitch: number
}

type Sample = {
  id: string
  name: string
  url: string
  defaultVolume: number
}
```

### Module Breakdown (Volatility-Based)

1. **Core State Management** (Low Volatility)
   - Pure functions for state updates
   - Immutable state transitions
   - State validation
   - State persistence/loading

2. **Audio Engine** (Medium Volatility)
   - Sample loading and management
   - Tone.js integration
   - Playback scheduling
   - Audio parameter control

3. **Visual Engine** (High Volatility)
   - Three.js scene management
   - Grid rendering
   - Cursor visualization
   - Parameter visualization
   - Animation management

4. **Input Management** (Medium Volatility)
   - Keyboard event handling
   - Mode switching
   - Cursor movement
   - Parameter adjustments

5. **UI Components** (High Volatility)
   - Transport controls
   - Global settings controls
   - Arrangement management
   - Sample management

### Key Architectural Principles

1. **State Management**
   - Single source of truth
   - State is immutable
   - State updates through pure functions
   - State changes trigger renders

2. **Event Flow**
   ```
   Input -> State Update -> [Audio Update, Visual Update]
   ```

3. **Pure Function Examples**
   ```javascript
   // Instead of methods, we use pure functions:
   const updateTrigger = (state, sampleIdx, beatIdx, arrangementIdx, updates) => 
     produce(state, draft => {
       const trigger = draft.arrangements[arrangementIdx]
                           .triggers[sampleIdx][beatIdx]
       Object.assign(trigger, updates)
     })

   const moveCursor = (state, direction) => 
     produce(state, draft => {
       // Return new state with updated cursor
     })
   ```

4. **Side Effect Handling**
   - All side effects (audio, graphics) are handled in effect functions
   - Effects are triggered by state changes
   - Effects are pure with respect to their inputs

### Implementation Strategy

1. Start with core state management
2. Add basic Three.js visualization
3. Implement Tone.js integration
4. Add input handling
5. Implement UI components
6. Add persistence
7. Optimize performance

### Performance Considerations

1. Use WebGL instancing for grid rendering
2. Batch audio parameter updates
3. Debounce state updates
4. Use requestAnimationFrame for visual updates
5. Implement audio scheduling ahead of time


