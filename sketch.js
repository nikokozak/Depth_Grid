import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
const { produce } = immer; // Immer for immutability

const BARS = 4;
const TIME_SIGNATURE = 4;
const BPM = 120;
let GLOBAL_COUNT = 0;

// Aesthetics
const GRID_DOT_COLOR = 'black';
const GRID_DOT_RADIUS = 5;
const GRID_TRIGGER_SPACING = 20;
const GRID_DRAW_X_ORIGIN = 50;
const GRID_DRAW_Y_ORIGIN = 50;
const GRID_DRAW_Z_ORIGIN = 50;

// Author: cboshuizen on Reddit
const SAMPLES = [
  'TR-505_Tape_Clap.wav',
  'TR-505_Tape_ClosedHH.wav',
  'TR-505_Tape_Kick.wav',
  'TR-505_Tape_Snare.wav'
]

// ************************************************************************************************************************************************************************************
//                              STATE SETUP
// ************************************************************************************************************************************************************************************

let STATE = {
  cursor: {
    mode: 'arrangement',
    arrangement: 0,
    track: 0,
    trigger: 0
  },
  transport: {
    isPlaying: false,
    bpm: BPM,
    bars: BARS,
    timeSignature: TIME_SIGNATURE,
  },
  arrangements: [{
    isSelected: true,
    isActive: true,
    id: 0,
    tracks: makeTracks(SAMPLES)
  }],
  samples: SAMPLES
}

function makeTracks(samples) {
  return samples.reduce((tracks, sample) => {
    const [name, _ext] = sample.split('.');
    const track = {};
    track.name = name;
    track.triggers = makeTriggers();
    track.player = new Tone.Player(`samples/${sample}`).toDestination();
    tracks.push(track);
    return tracks;
  }, []);
}

function makeTriggers() {
  return new Array(BARS * TIME_SIGNATURE).fill({
    isSelected: false,
    isActive: false,
    id: 0,
    pitch: 0,
    pan: 0,
    volume: 0
  });
}

// ************************************************************************************************************************************************************************************
//                              ACTIONS
// ************************************************************************************************************************************************************************************

function moveCursor(direction, state) {
  return produce(state, draft => {
    switch (direction) {
      case 'down':
        if (draft.cursor.mode === 'arrangement') {
          draft.cursor.track = draft.cursor.track === 0 ? draft.arrangements[draft.cursor.arrangement].tracks.length - 1 : draft.cursor.track - 1;
        }
        break;
      case 'up':
        if (draft.cursor.mode === 'arrangement') {
          draft.cursor.track = (draft.cursor.track + 1) % draft.arrangements[draft.cursor.arrangement].tracks.length;
        }
        break;
      case 'left':
        if (draft.cursor.mode === 'arrangement') {
          draft.cursor.trigger = draft.cursor.trigger === 0 ? BARS * TIME_SIGNATURE - 1 : draft.cursor.trigger - 1;
        }
        break;
      case 'right':
        if (draft.cursor.mode === 'arrangement') {
          draft.cursor.trigger = (draft.cursor.trigger + 1) % (BARS * TIME_SIGNATURE);
        }
        break;
    }
  })
}

// Turns "on" the trigger at the current cursor position
function selectTrigger(state) {
  return produce(state, draft => {
    const isActive = draft.arrangements[draft.cursor.arrangement].tracks[draft.cursor.track].triggers[draft.cursor.trigger].isActive;
    draft.arrangements[draft.cursor.arrangement].tracks[draft.cursor.track].triggers[draft.cursor.trigger].isActive = !isActive;
  });
}

// ************************************************************************************************************************************************************************************
//                              THREE.JS SETUP
// ************************************************************************************************************************************************************************************

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(100, 100, 200);
camera.lookAt(
  GRID_DRAW_X_ORIGIN + (SAMPLES.length * GRID_TRIGGER_SPACING) / 2,
  GRID_DRAW_Y_ORIGIN,
  GRID_DRAW_Z_ORIGIN + (BARS * TIME_SIGNATURE * GRID_TRIGGER_SPACING) / 2
)
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;
controls.update();
controls.enableDamping = true;

function animate() {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  controls.update();
  drawState(STATE);
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);


// ************************************************************************************************************************************************************************************
//                              DRAWING FUNCTIONS
// ************************************************************************************************************************************************************************************


function drawState(state) {
  // Draw the transport
  // drawTransport(state.transport);
  // Draw the arrangements
  drawArrangements(state.arrangements);
}

function drawArrangements(arrangements) {
  arrangements.forEach((arrangement, arrangementIdx) => {
    if (arrangement.isSelected) {
      drawTracks(arrangement.tracks, arrangementIdx);
    }
  });
}

function drawTracks(tracks, arrangementIdx) {
  tracks.forEach((track, trackIdx) => {
    drawTrack(track, trackIdx, arrangementIdx);
  });
}

function drawTrack(track, trackIdx, arrangementIdx) {
  drawTrackLine(track.triggers, trackIdx, arrangementIdx);
  // Draw the triggers
  drawTriggers(track.triggers, trackIdx, arrangementIdx);
}

function drawTrackLine(triggers, trackIdx, arrangementIdx) {
  const points = [];
  for (let i = 0; i < triggers.length; i++) {
    points.push(new THREE.Vector3(
      GRID_DRAW_X_ORIGIN + trackIdx * GRID_TRIGGER_SPACING,
      GRID_DRAW_Y_ORIGIN,
      GRID_DRAW_Z_ORIGIN + i * GRID_TRIGGER_SPACING));
  }
  const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, material);
  scene.add(line);
}

function drawTriggers(triggers, trackIdx, arrangementIdx) {
  const onMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const offMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const selectedMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  const geometry = new THREE.SphereGeometry(5, 32, 32);
  for (let i = 0; i < triggers.length; i++) {
    const isSelected = STATE.cursor.mode === 'arrangement' && STATE.cursor.arrangement === arrangementIdx && STATE.cursor.track === trackIdx && STATE.cursor.trigger === i;
    const sphere = new THREE.Mesh(geometry, triggers[i].isActive ? onMaterial : isSelected ? selectedMaterial : offMaterial);
    sphere.position.set(GRID_DRAW_X_ORIGIN + trackIdx * GRID_TRIGGER_SPACING, GRID_DRAW_Y_ORIGIN, GRID_DRAW_Z_ORIGIN + i * GRID_TRIGGER_SPACING);
    scene.add(sphere);
  }
}

drawState(STATE);

// ************************************************************************************************************************************************************************************
//                                                      TONE.JS 
// ************************************************************************************************************************************************************************************

// Tone Players
const players = new Tone.Players(SAMPLES.reduce((players, sample) => {
  const [name, _ext] = sample.split('.');
  players[name] = `samples/${sample}`;
  return players;
}, {}));
players.toDestination();

// {'filename': [0, 0, 0, 0, 0, 0, 0, 0], ...}
const triggers = SAMPLES.reduce((triggers, fileName) => {
  const [name, _ext] = fileName.split('.');
  triggers[name] = new Array(BARS * TIME_SIGNATURE).fill(0);
  return triggers;
}, {});

// Create transport
const transport = Tone.getTransport();

// Create our master loop
const arrangementLoop = new Tone.Loop(time => {
  const count = GLOBAL_COUNT % (BARS * TIME_SIGNATURE); // This will likely run over the end of the array.
  Object.keys(triggers).forEach(sampleName => {
    if (triggers[sampleName][count] === 1) {
      console.log("Playing sample", sampleName);
      players.player(sampleName).start('0');
    }
  });
  GLOBAL_COUNT++;
}, '4n');
arrangementLoop.start(0);

// Toggle trigger on/off
async function mousePressed() {
  const sampleIndex = Math.floor((mouseY - 50) / GRID_ROW_SPACING);
  const triggerIndex = Math.floor((mouseX - 50) / GRID_ROW_SPACING);
  console.log(sampleIndex, triggerIndex);
  const sampleName = Object.keys(triggers)[sampleIndex];
  triggers[sampleName][triggerIndex] = 1 - triggers[sampleName][triggerIndex];
}

function setup() {
  createCanvas(400, 400);
  Tone.start();
}

function draw() {
  background(220);
  drawTriggerGrid(triggers, 50, 50);

}

// Replace keyPressed function with event listener
document.addEventListener('keydown', (event) => {

  if (event.code === 'Space') {
    transport.start();
    console.log('Transport started');
  }

  if (event.code == "KeyA") {
    event.preventDefault();
    STATE = selectTrigger(STATE);
  }

  switch (event.code) {
    case 'ArrowLeft':
      event.preventDefault();
      STATE = moveCursor('left', STATE);
      console.log('Cursor moved left:', STATE.cursor);
      break;
    case 'ArrowUp':
      event.preventDefault();
      STATE = moveCursor('up', STATE);
      console.log('Cursor moved up:', STATE.cursor);
      break;
    case 'ArrowRight':
      event.preventDefault();
      STATE = moveCursor('right', STATE);
      console.log('Cursor moved right:', STATE.cursor);
      break;
    case 'ArrowDown':
      event.preventDefault();
      STATE = moveCursor('down', STATE);
      console.log('Cursor moved down:', STATE.cursor);
      break;
  }

  // Clear and redraw scene after cursor moves
  scene.clear();
  drawState(STATE);
});


