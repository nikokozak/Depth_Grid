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

function drawTriggerGrid(triggers, posX, posY) {
  // Draw trigger row for each sample
  for (let i = 0; i < Object.keys(triggers).length; i++) {
    drawTriggerRow(triggers[Object.keys(triggers)[i]], posX, posY + i * GRID_ROW_SPACING);
  }
}

// Draw trigger row for each sample
function drawTriggerRow(triggerRow, posX, posY) {
  if (BARS * TIME_SIGNATURE !== triggerRow.length) { throw new Error('Trigger length mismatch'); }

  for (let i = 0; i < triggerRow.length; i++) {
    drawGridDot(posX + i * GRID_ROW_SPACING, posY, triggerRow[i]);
  }
}

// Draw a trigger grid dot
function drawGridDot(posX, posY, triggerVal) {
  if (triggerVal == 1) { // If trigger is on
    // Draw a black circle
    fill(GRID_DOT_COLOR);
    circle(posX, posY, GRID_DOT_RADIUS);
  } else { // If trigger is off
    // Draw a white circle with a black outline
    stroke(GRID_DOT_COLOR);
    fill('white');
    circle(posX, posY, GRID_DOT_RADIUS);
  }
}

// Toggle trigger on/off
function mousePressed() {
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


