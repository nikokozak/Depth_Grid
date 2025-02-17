import * as THREE from 'three';

const BARS = 4;
const TIME_SIGNATURE = 4;
const BPM = 120;
let GLOBAL_COUNT = 0;

// Aesthetics
const GRID_DOT_COLOR = 'black';
const GRID_DOT_RADIUS = 5;
const GRID_ROW_SPACING = 20;

// Author: cboshuizen on Reddit
const SAMPLES = [
  'TR-505_Tape_Clap.wav',
  'TR-505_Tape_ClosedHH.wav',
  'TR-505_Tape_Kick.wav',
  'TR-505_Tape_Snare.wav'
]

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

function animate() {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

// ************************************************************************************************************************************************************************************
//                                                       METAGRID
// ************************************************************************************************************************************************************************************

// Create a data structure to represent the meta-grid, which will dictate where we can draw UI elements, and consequently where we can trigger samples.
// Think of this as a sub-sampling of the draw-space of the sketch; Given that we're only really interested in drawing elements at very specific and regular
// points in space, we don't need to worry about the entire canvas. The meta-grid therefore depends on the resolution of the sketch, and our preferred spacing,
// and extends in the z-axis so as to create a cube.
function createMetaGrid(sketchWidth, sketchHeight, spacing) {
  // There is also a "padding" equal to the spacing all around the grid.
  const padding = spacing;
  const gridWidth = sketchWidth - 2 * padding;
  const gridHeight = sketchHeight - 2 * padding;
  const gridDepth = sketchHeight - 2 * padding;
  const grid =
  {
    points: [], // The x-y coordinates of each point in the grid.
    width: Math.floor((gridWidth - padding) / spacing), // The width of the grid in terms of the number of points.
    height: Math.floor((gridHeight - padding) / spacing), // The height of the grid in terms of the number of points. 
    depth: Math.floor((gridDepth - padding) / spacing) // The depth of the grid in terms of the number of points.
  };

  // Fetch a point in a 1-dimensional array by its x, y, and z coordinates.
  function getPoint(x, y, z) {
    return grid.points[x + y * grid.width + z * grid.width * grid.height];
  }

  // Populate the metagrid
  for (let x = padding; x < gridWidth; x += spacing) {
    for (let y = padding; y < gridHeight; y += spacing) {
      for (let z = padding; z < gridDepth; z += spacing) {
        grid.points.push([x, y, z]);
      }
    }
  }
  return grid;
}

// Returns the x-y coordinates of a given x-y point in the grid.
function getMetaGridPointCoords(x, y, z, metagrid) {
  // return the coordinate using width, height, and depth in the metagrid object
  return metagrid.points[x + metagrid.width * (y + metagrid.depth * z)]
}

// Returns a plane of points in the metagrid that lie on a given axis and at a given origin point.
// Pass in 'xy' or 'xz' or 'yz' for the axis, and the origin point.
function getMetaGridPlane(axis, originPoint, metagrid) {
  const plane = [];
  axis = axis === 'xy' ? 2 : axis === 'xz' ? 1 : 0;
  for (let i = 0; i < metagrid.width; i++) {
    for (let j = 0; j < metagrid.height; j++) {
      const coords = getMetaGridPointCoords(i, j, metagrid);
      if (coords[axis] === originPoint[axis]) {
        plane.push(coords);
      }
    }
  }
  return plane;
}

// Returns a set of points representing a line in the metagrid space.
// Pass in 'x' or 'y' or 'z' for the axis, and the origin point.
function getMetaGridLine(axis, originPoint, metagrid) {
  const line = [];
  axis = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
  for (let i = 0; i < metagrid.width; i++) {
    for (let j = 0; j < metagrid.height; j++) {
      const coords = getMetaGridPointCoords(i, j, metagrid);
      switch (axis) {
        case 'x':
          if (coords[1] == originPoint[1] && coords[2] == originPoint[2]) { line.push(coords); }
          break;
        case 'y':
          if (coords[0] == originPoint[0] && coords[2] == originPoint[2]) { line.push(coords); }
          break;
        case 'z':
          if (coords[0] == originPoint[0] && coords[1] == originPoint[1]) { line.push(coords); }
          break;
      }
    }
  }
  return line;
}

// Draw the trigger grid using the metagrid as the drawspace
function drawTriggerGrid(triggers, posX, posY, posZ, metagrid) {
  // Draw trigger row for each sample
  for (let i = 0; i < Object.keys(triggers).length; i++) {
    drawTriggerRow(triggers[Object.keys(triggers)[i]], posX, posY, posZ, metagrid);
  }
}

// Draw trigger row for each sample
function drawTriggerRow(triggerRow, posX, posY, posZ, metagrid) {
  if (BARS * TIME_SIGNATURE !== triggerRow.length) { throw new Error('Trigger length mismatch'); }

  for (let i = 0; i < triggerRow.length; i++) {
    drawTriggerDot(posX + i, posY, posZ, metagrid, triggerRow[i]);
  }
}

// Draw a trigger grid dot
function drawTriggerDot(posX, posY, posZ, triggerVal, metagrid) {
  const metaGridPoint = getMetaGridPointCoords(posX, posY, posZ, metagrid);
  if (triggerVal == 1) { // If trigger is on
    // Draw a black circle
    fill(GRID_DOT_COLOR);
    circle(metaGridPoint[0], metaGridPoint[1], GRID_DOT_RADIUS);
  } else { // If trigger is off
    // Draw a white circle with a black outline
    stroke(GRID_DOT_COLOR);
    fill('white');
    circle(metaGridPoint[0], metaGridPoint[1], GRID_DOT_RADIUS);
  }
}

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

// If spacebar is pressed, start the transport and play
function keyPressed() {
  if (keyCode === 32) {
    transport.start();
    console.log('Transport started');
  }
}


