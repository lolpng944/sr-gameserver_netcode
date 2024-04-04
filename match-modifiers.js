function decreaseHealth(player) {
  // Assuming there is a player object with a health property
  if (player.health > 0) {
    player.health -= 1;
  }
}

function decreaseHealthForAllPlayers(room) {
  if (room.state === "playing") {
    room.players.forEach((player) => {
      decreaseHealth(player);
    });
  }
}

// Example: Call this function periodically, e.g., using setInterval
function startDecreasingHealth(room, intervalInSeconds) {
  setInterval(() => {
    decreaseHealthForAllPlayers(room);
  }, intervalInSeconds * 1000); // Convert seconds to milliseconds
}

function waitForHealthBelow100(player) {
  return new Promise((resolve) => {
    const checkHealth = () => {
      if (player.health < 100) {
        resolve(); // Resolve the promise when health is below 100
      } else {
        setTimeout(checkHealth, 100); // Check again after a short delay
      }
    };
    checkHealth(); // Start checking player's health
  });
}

// Function to regenerate player's health
async function regenerateHealth(player) {
  await waitForHealthBelow100(player); // Wait until health is below 100
  const currentTime = new Date().getTime();
  const timeSinceLastHit = currentTime - player.last_hit_time;
  if (timeSinceLastHit >= 10000 && player.health < 100) {
    player.health += 6; // Adjust the regeneration rate as needed
    if (player.health > 100) {
      player.health = 100; // Ensure health doesn't exceed 100
    }
  }
}

// Function to regenerate health for all players in the room
async function regenerateHealthForAllPlayers(room) {
  if (room.state === "playing") {
    room.players.forEach((player) => {
      if (player.visible !== false) {
        regenerateHealth(player);
      }
    });
  }
}

// Example: Call this function periodically to regenerate health
function startRegeneratingHealth(room, intervalInSeconds) {
  setInterval(() => {
    regenerateHealthForAllPlayers(room);
  }, intervalInSeconds * 1000); // Convert seconds to milliseconds
}

module.exports = {
  startDecreasingHealth, 
  startRegeneratingHealth,
};