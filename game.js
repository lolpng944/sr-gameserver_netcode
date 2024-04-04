function hidePlayer(player) {
  // Update player properties to make them not visible and not hittable
  player.health = 0; // Set health to 0 to indicate elimination
  player.visible = false;
}
// Function to respawn player after a delay
function respawnPlayer(room, player) {
  // Implement your logic to respawn the player and add them back to the room
  // For example, reset player health and coordinates, then add them back to the room
  player.health = 100; // Set initial health
  player.x = Math.random() * 100; // Set respawn coordinates
  player.y = Math.random() * 100;
  player.visible = true;

  // room.players.set(player.playerId, player);
}

function endGameleft(room) {
  // Additional logic to end the game and close the room
  console.log("Game ended! Closing the room.");
  // You can implement the logic to perform any cleanup or notify players about the end of the game.

  // Close the WebSocket connections for all players in the room
  room.players.forEach((player) => {
    player.ws.close(4000, "players_left_room_before_start");
  });

  // Remove the room
  rooms.delete(room.roomId);
}


function endGame(room) {
  //   const player = room.players.get(playerId);
  // Additional logic to end the game and close the room
  console.log("Game ended! Closing the room.");
  // You can implement the logic to perform any cleanup or notify players about the end of the game.

  // Close the WebSocket connections for all players in the room
  room.players.forEach((player) => {
    // if (player.damage > 0)
    //  IncreasePlayerDamage(player.playerId, player.damage);
    //   }

    // if (player.kills > 0)
    // IncreasePlayerKills(player.playerId, player.kills);
    //  }
    const placelist = JSON.stringify(room.eliminatedPlayers);

    if (room.eliminatedPlayers) {
      player.ws.close(4300, "places");
    } else {
      player.ws.close(4301, "game_ended");
    }
  });

  // Remove the room
  // rooms.delete(room.roomId);
}

module.exports = {
  hidePlayer,
  respawnPlayer,
  endGame,
  endGameleft,
};