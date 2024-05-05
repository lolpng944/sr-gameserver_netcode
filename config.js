const batchedMessages = new Map();
const rooms = new Map();

const server_tick_rate = 33;
const WORLD_WIDTH = 800;
const WORLD_HEIGHT = 800;
const playerspeed = 0.8;
const SHOOT_COOLDOWN = 100; 
const BULLET_DAMAGE = 5;
const game_start_time = 1000;
const game_win_rest_time = 10000;
const max_room_players = 3;
const maxClients = 100;

const playerHitboxWidth = 60; 
const playerHitboxHeight = 120;

const validDirections = [-90, 0, 180, -180, 90, 45, 135, -135, -45];

const isValidDirection = (direction) => {
const numericDirection = parseFloat(direction);
return !isNaN(numericDirection) && validDirections.includes(numericDirection);
  };


const walls = [
  { x: 200, y: 0 },
 { x: -200, y: 0 },
{ x: 0, y: 200 },
  { x: 50, y: 200 },
   { x: 100, y: 200 },
  { x: 150, y: 200 },
   { x: 200, y: 200 },
  { x: 250, y: 200 },
  { x: 300, y: 200 },
  { x: 350, y: 200 },
   { x: 500, y: 200 },
];


const wallsJSON = JSON.stringify(walls);

// Print the JSON representation
console.log(wallsJSON);

const teleporters = [
  { x: 700, y: 0, width: 50, height: 50, destination: { x: -700, y: 0 } },// Example teleporter
  // Add more teleporters as needed
];

const weaponShootRange = {
  1: 600, 
  2: 1000, 
};

const weaponCooldowns = {
  1: 300, 
  2: 1500,
};

const guns_damage = {
  1: 5,
  2: 10,
};

const spawnPositions = [
  { x: 0, y: 0 },
  { x: 0, y: -700 },
  { x: 300, y: 300 },
  { x: 400, y: 400 },
];

module.exports = {
  batchedMessages,
  rooms,
  server_tick_rate,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  playerspeed,
  SHOOT_COOLDOWN,
  BULLET_DAMAGE,
  game_start_time,
  game_win_rest_time,
  max_room_players,
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
  
};
