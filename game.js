function hidePlayer(player) {

  player.health = 0; 
  player.visible = false;
}

function respawnPlayer(room, player) {

  player.health = 100; 
  player.x = Math.random() * 100; 
  player.y = Math.random() * 100;
  player.visible = true;


}

function endGameleft(room) {

  console.log("Game ended! Closing the room.");

  room.players.forEach((player) => {
    player.ws.close(4000, "players_left_room_before_start");
  });

  // Remove the room
  rooms.delete(room.roomId);
}


function endGame(room) {

  console.log("Game ended! Closing the room.");

  room.players.forEach((player) => {
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