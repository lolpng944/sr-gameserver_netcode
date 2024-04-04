const batchedMessages = new Map();
const rooms = new Map();

const server_tick_rate = 33;
const WORLD_WIDTH = 800;
const WORLD_HEIGHT = 600;
const playerspeed = 0.8;
const SHOOT_COOLDOWN = 100; // 1 second cooldown for shooting
const BULLET_DAMAGE = 5;
const game_start_time = 4000;
const game_win_rest_time = 10000;
const max_room_players = 1;
const maxClients = 100;

const validDirections = [-90, 0, 180, -180, 90, 45, 135, -135, -45];

const isValidDirection = (direction) => {
const numericDirection = parseFloat(direction);
return !isNaN(numericDirection) && validDirections.includes(numericDirection);
  };


const walls = [
  { x: 0, y: 150, width: 300, height: 200 },
  { x: 0, y: -150, width: 300, height: 200 },
  { x: 400, y: 0, width: 200, height: 400 },
  { x: -400, y: 0, width: 200, height: 400 },
  //{ x: -300, y: 0, width: 200, height: 200 },
  // { x: 150, y: 30, width: 200, height: 100 },
  // Add more walls as needed
];

const teleporters = [
  { x: 700, y: 0, width: 50, height: 50, destination: { x: -700, y: 0 } },// Example teleporter
  // Add more teleporters as needed
];

const weaponShootRange = {
  1: 600, // Cooldown for weapon 1
  2: 1000, // Cooldown for weapon 2
  // Add more cooldowns for other weapons as needed
};

const weaponCooldowns = {
  1: 200, // Cooldown for weapon 1
  2: 1500, // Cooldown for weapon 2
  // Add more cooldowns for other weapons as needed
};

const guns_damage = {
  1: 5, // Cooldown for weapon 1
  2: 10, // Cooldown for weapon 2
  // Add more cooldowns for other weapons as needed
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
};