
const { isRectIntersectingLine, isCollisionWithWalls, wallblocksize } = require('./collisions');
const { increasePlayerPlace, increasePlayerWins } = require('./dbrequests')
const { endGame } = require('./game')
const { player_idle_timeout } = require('./config')  
//const { handleCoinCollected2 } = require('./room')


const {
    WORLD_WIDTH,
    WORLD_HEIGHT,
    playerspeed,
    game_win_rest_time,
    guns_damage,
    max_room_players,
    playerHitboxWidth,
    playerHitboxHeight,
} = require('./config');

function getDistance(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
}





function handleMovement(result, player) {

  //const { handleCoinCollected2 } = require('./room')
  const deltaTime = player.lastProcessedPosition !== undefined ? 20 : 0; // Adjust delta time calculation as needed

  const finalDirection = player.moving ? player.direction - 90 : player.direction;

  const radians = (finalDirection * Math.PI) / 180;
  const xDelta = playerspeed * deltaTime * Math.cos(radians);
  const yDelta = playerspeed * deltaTime * Math.sin(radians);

  const newX = Math.round(player.x + xDelta);
  const newY = Math.round(player.y + yDelta);

  // Check collision with walls before updating player position
  if (!isCollisionWithWalls(result.room.walls, newX, newY)) {
    player.x = newX;
    player.y = newY;
    player.lastProcessedPosition = { x: newX, y: newY };
  } else {
    // Collision resolution: revert to last valid position
    player.x = player.lastProcessedPosition.x;
    player.y = player.lastProcessedPosition.y;
  }

  // Clamp player position within world bounds
  player.x = Math.max(-WORLD_WIDTH, Math.min(WORLD_WIDTH, player.x));
  player.y = Math.max(-WORLD_HEIGHT, Math.min(WORLD_HEIGHT, player.y));


 /* const collectedCoins = [];
  if (result.room.coins) {
  result.room.coins.forEach((coin, index) => {
    const distance = Math.sqrt(
      Math.pow(player.x - coin.x, 2) + Math.pow(player.y - coin.y, 2),
    );

    if (distance <= 60) {
      collectedCoins.push(index);
    }
  });
    }

  
  if (collectedCoins.length > 0) {
    collectedCoins.forEach((index) => {
    
      handleCoinCollected2(result, index);
    });
  }

  */


  // Clear any previous timeout and set a new one
  clearTimeout(player.timeout);
  player.timeout = setTimeout(() => {
    player.ws.close(4200, "disconnected_inactivity");
    result.room.players.delete(result.playerId);
  }, player_idle_timeout);
}



  
  // const closestState = room.snap.reduce((prev, curr) => {
   // return (Math.abs(curr.timestamp - timestamp) < Math.abs(prev.timestamp - timestamp) ? curr : prev);
  //});

  



function handlePlayerCollision(room, shootingPlayer, nearestObject, bullet_type, shootdamagereduce, damage) {

  const GUN_BULLET_DAMAGE = Math.round(damage / shootdamagereduce );

  // Update player's health
  nearestObject.health -= GUN_BULLET_DAMAGE;
  shootingPlayer.damage += GUN_BULLET_DAMAGE;
  nearestObject.last_hit_time = new Date().getTime();

  // Update hitdata for shooting player
  const hitdata = {
    last_playerhit: {
      playerId: nearestObject.playerId,
      datetime: new Date().getTime(),
      damage: GUN_BULLET_DAMAGE,
    },
  };
  shootingPlayer.hitdata = JSON.stringify(hitdata);

  setTimeout(() => {
    shootingPlayer.hitdata = null;
  }, 40);

  // Check if the player is eliminated
  if (nearestObject.health <= 0) {
    // Player is eliminated
    nearestObject.visible = false;

    // Update player's place
    if (
      Array.from(room.players.values()).filter(
        (player) => player.visible !== false
      ).length === 1 && room.winner === 0
    ) {
      nearestObject.place = 2;
    } else {
      nearestObject.place = room.players.size - room.eliminatedPlayers.length;
    }

    const existingPlace = room.eliminatedPlayers.find(
      (player) => player.place === nearestObject.place
    );

    if (existingPlace) {
      if (nearestObject.place === room.maxplayers) {
        nearestObject.place--;
      } else {
        nearestObject.place++;
      }
    }

    room.eliminatedPlayers.push({
      username: nearestObject.playerId,
      place: nearestObject.place,
      eliminator: shootingPlayer.playerId,
    });

    increasePlayerPlace(nearestObject.playerId, nearestObject.place);

    nearestObject.visible = false;

    // Update stats for shooting player
    shootingPlayer.kills++;
    shootingPlayer.elimlast = nearestObject.playerId;

    setTimeout(() => {
      shootingPlayer.elimlast = null;
    }, 1000);

    // Check for game end conditions
    if (
      Array.from(room.players.values()).filter(
        (player) => player.visible !== false
      ).length === 1 && room.winner === 0
    ) {
      const remainingPlayer = Array.from(room.players.values()).find(
        (player) => player.visible !== false
      );

      room.winner = remainingPlayer.playerId;
      console.log(`Last player standing! ${room.winner} wins!`);

      increasePlayerWins(room.winner, 1);
      increasePlayerPlace(room.winner, 1);

      room.eliminatedPlayers.push({
        username: room.winner,
        place: 1,
      });

      setTimeout(() => {
        endGame(room);
      }, game_win_rest_time);
    }
}
}

module.exports = {
  handleMovement,
  handlePlayerCollision,
}
