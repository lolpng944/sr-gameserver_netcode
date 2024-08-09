function hidePlayer(player) {

  player.health = 0; 
  player.visible = false;
}

function endGameleft(room) {

  console.log("Game ended! Closing the room.");

  room.players.forEach((player) => {
    player.ws.close(4000, "players_left_room_before_start");
  });

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
}

module.exports = {
  hidePlayer,
  endGame,
  endGameleft,
};