const { respawnplayer } = require('./player')
const { handleElimination } = require('./zone')


// Helper function to apply the health decrease
function applyHealthDecrease(player, room) {
  player.last_hit_time = new Date().getTime();
  player.health -= 5;

  if (player.health <= 0) {
    if (player.respawns > 0) {
      respawnplayer(room, player);
    } else {
      handleElimination(room, player);
    }
  }
}

// Async function to decrease health
async function decreaseHealth(player, room) {
  if (player.health > 1 && player.visible) {
    applyHealthDecrease(player, room);
  }
}

// Apply health decrease for all players
async function decreaseHealthForAllPlayers(room) {
  if (room.state === "playing") {
    room.players.forEach(async (player) => {
      await decreaseHealth(player, room);
    });
  }
}

// Start decreasing health at intervals
function startDecreasingHealth(room, intervalInSeconds) {
  room.decreasehealth = setInterval(() => {

    decreaseHealthForAllPlayers(room);
    console.log("fixer")
  }, intervalInSeconds * 1000);
}


function waitForHealthBelow100(player) {
  return new Promise((resolve) => {
    const checkHealth = () => {
      if (player.health < 100) {
        resolve(); 
      } else {
        setTimeout(checkHealth, 100);
      }
    };
    checkHealth(); 
  });
}

async function regenerateHealth(player) {
  await waitForHealthBelow100(player); 
  const currentTime = new Date().getTime();
  const timeSinceLastHit = currentTime - player.last_hit_time;
  if (timeSinceLastHit >= 10000 && player.health < 100) {
    player.health += 6;
    if (player.health > 100) {
      player.health = 100; 
    }
  }
}

async function regenerateHealthForAllPlayers(room) {
  if (room.state === "playing") {
    room.players.forEach((player) => {
      if (player.visible !== false) {
        regenerateHealth(player);
      }
    });
  }
}

function startRegeneratingHealth(room, intervalInSeconds) {
  room.regeneratehealth = setInterval(() => {
    console.log("fixer2")
    regenerateHealthForAllPlayers(room);
  }, intervalInSeconds * 1000); 
}

module.exports = {
  startDecreasingHealth, 
  startRegeneratingHealth,
};