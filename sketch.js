// Add samples from '/samples' folder to list of players
const files = fs.readdirSync(path.join(__dirname, 'samples')).reduce((players, file) => {
  const [name, extension] = file.split('.');
  if (extension === 'wav') {
    return players.push({}[name] = file);
  }
}, []);
const players = new Tone.Players(files);

// Create transport
const transport = Tone.getTransport();

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
}


