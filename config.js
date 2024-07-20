const batchedMessages = new Map();
const rooms = new Map();

const server_tick_rate = 15.6;
//const matchmaking_timeout = 100000;
const matchmaking_timeout = 300000;
const player_idle_timeout = 60000;
const WORLD_WIDTH = 800;
const WORLD_HEIGHT = 800;
const playerspeed = 0.22;
const SHOOT_COOLDOWN = 100; 
const BULLET_DAMAGE = 5;
const game_start_time = 1000;
const game_win_rest_time = 10000;
//const max_room_players = 1;
const maxClients = 100;

const playerHitboxWidth = 60; 
const playerHitboxHeight = 120;

const validDirections = [-90, 0, 180, -180, 90, 45, 135, -135, -45];

const isValidDirection = (direction) => {
const numericDirection = parseFloat(direction);
return !isNaN(numericDirection) && validDirections.includes(numericDirection);
  };

const data = [{"x":-750,"y":800},{"x":700,"y":800},{"x":750,"y":800},{"x":-800,"y":750},{"x":-650,"y":750},{"x":-600,"y":750},{"x":-550,"y":750},{"x":-500,"y":750},{"x":-200,"y":750},{"x":400,"y":750},{"x":450,"y":750},{"x":500,"y":750},{"x":550,"y":750},{"x":600,"y":750},{"x":750,"y":750},{"x":-650,"y":700},{"x":-200,"y":700},{"x":-150,"y":700},{"x":600,"y":700},{"x":-650,"y":650},{"x":-150,"y":650},{"x":-100,"y":650},{"x":-50,"y":650},{"x":0,"y":650},{"x":50,"y":650},{"x":100,"y":650},{"x":150,"y":650},{"x":600,"y":650},{"x":-650,"y":600},{"x":650,"y":600},{"x":650,"y":550},{"x":-300,"y":450},{"x":-250,"y":450},{"x":-200,"y":450},{"x":-150,"y":450},{"x":150,"y":450},{"x":200,"y":450},{"x":250,"y":450},{"x":-550,"y":400},{"x":-250,"y":400},{"x":-200,"y":400},{"x":-150,"y":400},{"x":150,"y":400},{"x":200,"y":400},{"x":250,"y":400},{"x":-550,"y":350},{"x":200,"y":350},{"x":250,"y":350},{"x":-600,"y":300},{"x":-600,"y":250},{"x":100,"y":250},{"x":450,"y":250},{"x":-650,"y":200},{"x":-150,"y":200},{"x":100,"y":200},{"x":450,"y":200},{"x":-150,"y":150},{"x":100,"y":150},{"x":450,"y":150},{"x":500,"y":150},{"x":-450,"y":100},{"x":-150,"y":100},{"x":100,"y":100},{"x":450,"y":100},{"x":500,"y":100},{"x":-450,"y":50},{"x":-400,"y":50},{"x":-150,"y":50},{"x":100,"y":50},{"x":450,"y":50},{"x":500,"y":50},{"x":-500,"y":0},{"x":-450,"y":0},{"x":-150,"y":0},{"x":100,"y":0},{"x":400,"y":0},{"x":450,"y":0},{"x":500,"y":0},{"x":-500,"y":-50},{"x":500,"y":-50},{"x":-550,"y":-100},{"x":-500,"y":-100},{"x":500,"y":-100},{"x":550,"y":-100},{"x":-600,"y":-150},{"x":500,"y":-150},{"x":550,"y":-150},{"x":-600,"y":-200},{"x":-150,"y":-200},{"x":-100,"y":-200},{"x":-50,"y":-200},{"x":0,"y":-200},{"x":50,"y":-200},{"x":100,"y":-200},{"x":-400,"y":-400},{"x":250,"y":-400},{"x":600,"y":-400},{"x":-450,"y":-450},{"x":-400,"y":-450},{"x":-350,"y":-450},{"x":-100,"y":-450},{"x":200,"y":-450},{"x":250,"y":-450},{"x":550,"y":-450},{"x":600,"y":-450},{"x":-500,"y":-500},{"x":-450,"y":-500},{"x":-400,"y":-500},{"x":-150,"y":-500},{"x":-100,"y":-500},{"x":-50,"y":-500},{"x":200,"y":-500},{"x":250,"y":-500},{"x":550,"y":-500},{"x":600,"y":-500},{"x":-150,"y":-550},{"x":-100,"y":-550},{"x":-50,"y":-550},{"x":500,"y":-550},{"x":550,"y":-550},{"x":450,"y":-600},{"x":500,"y":-600},{"x":-750,"y":-650},{"x":-700,"y":-700},{"x":750,"y":-700},{"x":700,"y":-750},{"x":750,"y":-750}]

const normalArray = data.map(({ x, y }) => ({ x, y }));

//console.log(normalArray);

const wall1s = [
  { x: 150, y: 50 },
   { x: 150, y: 50 },
   { x: -150, y: 50 },
   { x: -150, y: 50 },
  { x: 150, y: 0 },
{ x: -150, y: 0 },
{ x: 0, y: 250 },
  { x: 50, y: 250 },
   { x: -50, y: 250 },
];


const walls = normalArray
const wallsJSON = JSON.stringify(walls);
// Print the JSON representation
//console.log(wallsJSON);


const teleporters = [
  { x: 700, y: 0, width: 50, height: 50, destination: { x: -700, y: 0 } },// Example teleporter
  // Add more teleporters as needed
];

const maxmodeplayers = {
  1: 1, 
  2: 2, 
};

const all_gamemodes = [
  "1",
  "2"
];


const weaponShootRange = {
  1: 200, 
  2: 1000, 
};

const weaponCooldowns = {
  1: 400, 
  2: 1500,
};

const guns_damage = {
  1: 1,
  2: 10,
};

const spawnPositions = [
  { x: 0, y: 0 },
  { x: 0, y: -700 },
  { x: 300, y: 300 },
  { x: 400, y: 400 },
  { x: 400, y: 450 },
];







const gunsconfig = {
  1: {
    cooldown: 500, // in milliseconds
    damage: 10,
    bullets: [
      { angle: 90, speed: 8, distance: 300, delay: 0, offset: 0 },
      { angle: 0, speed: 8, distance: 300, delay: 0, offset: 0 },
      { angle: 180, speed: 8, distance: 300, delay: 0, offset: 0 },
      { angle: -90, speed: 8, distance: 300, delay: 0, offset: 0 },
      { angle: 45, speed: 8, distance: 300, delay: 0, offset: 0 },
      { angle: -45, speed: 8, distance: 300, delay: 0, offset: 0 },
      { angle: -135, speed: 8, distance: 300, delay: 0, offset: 0 },
      { angle: 135, speed: 8, distance: 300, delay: 0, offset: 0 }
    ]
  },
  2: {
    cooldown: 300,
    damage: 15,
    bullets: [
      { angle: 0, speed: 10, distance: 500, extra: 0 },
      { angle: 45, speed: 10, distance: 500, extra: 0 },
      { angle: 90, speed: 10, distance: 500, extra: 0 },
      { angle: 135, speed: 10, distance: 500, extra: 0 },
      { angle: 180, speed: 10, distance: 500, extra: 0 },
      { angle: -45, speed: 10, distance: 500, extra: 0 },
      { angle: -90, speed: 10, distance: 500, extra: 0 },
      { angle: -135, speed: 10, distance: 500, extra: 0 }
    ]
  },
  3: {
    cooldown: 700,
    damage: 20,
    bullets: [
      { angle: 0, speed: 12, distance: 400, extra: 1 },
      { angle: 120, speed: 12, distance: 400, extra: 1 },
      { angle: 240, speed: 12, distance: 400, extra: 1 }
    ]
  },
  4: {
    cooldown: 600,
    damage: 25,
    bullets: [
      { angle: 0, speed: 15, distance: 350, extra: 2 },
      { angle: 60, speed: 15, distance: 350, extra: 2 },
      { angle: 120, speed: 15, distance: 350, extra: 2 },
      { angle: 180, speed: 15, distance: 350, extra: 2 },
      { angle: -60, speed: 15, distance: 350, extra: 2 },
      { angle: -120, speed: 15, distance: 350, extra: 2 }
    ]
  },
  5: {
    cooldown: 1000,
    damage: 30,
    bullets: [
      { angle: 0, speed: 20, distance: 600, extra: 3 },
      { angle: 90, speed: 20, distance: 600, extra: 3 },
      { angle: 180, speed: 20, distance: 600, extra: 3 },
      { angle: 270, speed: 20, distance: 600, extra: 3 }
    ]
  }
};



module.exports = {
  batchedMessages,
  rooms,
  server_tick_rate,
  matchmaking_timeout,
  player_idle_timeout,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  playerspeed,
  SHOOT_COOLDOWN,
  BULLET_DAMAGE,
  game_start_time,
  game_win_rest_time,
  //max_room_players,
  maxClients,
  weaponShootRange,
  weaponCooldowns,
  guns_damage,
  spawnPositions,
  isValidDirection,
  walls,
  teleporters,
  playerHitboxWidth, 
  playerHitboxHeight,
  maxmodeplayers,
  all_gamemodes,
  gunsconfig,
};
