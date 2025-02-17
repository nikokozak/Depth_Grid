# Development Guide

## Core Architecture Decisions

1. **Vanilla Browser JS**
   - NO Node.js/npm dependencies
   - All external libraries loaded via script tags
   - Modules exposed through `window` object
   - ES modules used with `type="module"` in script tags

2. **Testing Setup**
   - Zora test framework loaded via CDN
   - Tests accessed through `window.test`
   - Test files must expose their tests on `window` object (e.g., `window.storeTest`)
   - Tests run through `runner.js` in browser
   - Run tests by adding `?test` to URL

3. **State Management**
   - Single source of truth in `store.js`
   - Immutable updates using Immer
   - State changes trigger renders
   - All state mutations through action creators
   - No triggers array without corresponding sample

4. **External Dependencies**
   - Three.js for 3D visualization
   - Tone.js for audio
   - Immer for immutable state updates
   - Zora for testing

5. **File Organization**
   ```
   src/
     state/      - State management
     audio/      - Audio engine
     grid/       - Grid management
     rendering/  - Three.js visualization
   tests/        - Test files
   ```

## Development Workflow

1. Write tests first
2. Ensure tests run in browser
3. Implement features
4. Test in browser with `?test` parameter

## Common Gotchas

1. NO npm-style imports - use `window` object
2. ALL tests must be exposed on `window`
3. State updates must be immutable
4. Always reset state in tests
5. Test files must be added to `runner.js` 