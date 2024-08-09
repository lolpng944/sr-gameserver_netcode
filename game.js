function hidePlayer(player) {

  player.health = 0; 
  player.visible = false;
}



function endGame(room) {

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
};