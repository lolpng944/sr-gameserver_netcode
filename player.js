
const { isRectIntersectingLine, isCollisionWithWalls, isCollisionWithTeleporters } = require('./collisions');
const { increasePlayerPlace, increasePlayerWins } = require('./dbrequests')
const { endGame } = require('./game')
const { player_idle_timeout } = require('./config')
  const { handleCoinCollected } = require('./room')


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

function handleMovement(result, player) {
  const deltaTime = player.lastProcessedPosition !== undefined ? 20 : 0;

  const finalDirection = player.moving
    ? player.direction - 90
    : player.direction;

  const radians = (finalDirection * Math.PI) / 180;
  const xDelta = playerspeed * deltaTime * Math.cos(radians);
  const yDelta = playerspeed * deltaTime * Math.sin(radians);

  const newX = Math.round(player.x + xDelta);
  const newY = Math.round(player.y + yDelta);

  const interpolatedPositions = interpolate(player, { x: newX, y: newY });

  interpolatedPositions.forEach(({ x, y }) => {
    if (!isCollisionWithWalls(x, y, player.x, player.y)) {
      player.x = x;
      player.y = y;

      player.lastProcessedPosition = { x, y };
    }
  });

  player.x = Math.max(-WORLD_WIDTH, Math.min(WORLD_WIDTH, player.x));
  player.y = Math.max(-WORLD_HEIGHT, Math.min(WORLD_HEIGHT, player.y));

  clearTimeout(player.timeout);

  player.timeout = setTimeout(() => {
    player.ws.close(4200, "disconnected_inactivity");
    result.room.players.delete(result.playerId);
  }, player_idle_timeout);
}

function interpolate(player, nextPosition) {
  const interpolatedPositions = [];
  const steps = 10; // Adjust this value for smoother or faster movement

  for (let i = 1; i <= steps; i++) {
    const fraction = i / steps;
    const x = player.x + (nextPosition.x - player.x) * fraction;
    const y = player.y + (nextPosition.y - player.y) * fraction;
    interpolatedPositions.push({ x, y });
  }

  return interpolatedPositions;
}





function handleM4ovement(result, player) {
const deltaTime = player.lastProcessedPosition !== undefined ? 20 : 0;

const finalDirection = player.moving
  ? player.direction - 90
  : player.direction;

const radians = (finalDirection * Math.PI) / 180;
const xDelta = playerspeed * deltaTime * Math.cos(radians);
const yDelta = playerspeed * deltaTime * Math.sin(radians);

newX = Math.round(player.x + xDelta);
newY = Math.round(player.y + yDelta);

if (!isCollisionWithWalls(newX, newY, player.x, player.y)) {
  player.x = newX;
  player.y = newY;

  player.lastProcessedPosition = { x: newX, y: newY };
} else {
  player.x = player.lastProcessedPosition.x;
  player.y = player.lastProcessedPosition.y;
}

/*  const collectedCoins = [];
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
    
      handleCoinCollected(result, index);
    });
  }
  */

  player.x = Math.max(-WORLD_WIDTH, Math.min(WORLD_WIDTH, player.x));
  player.y = Math.max(-WORLD_HEIGHT, Math.min(WORLD_HEIGHT, player.y));

  // Reset player timeout on activity
  clearTimeout(player.timeout);

  player.timeout = setTimeout(
    () => {
      player.ws.close(4200, "disconnected_inactivity");
      result.room.players.delete(result.playerId);
    },
    player_idle_timeout,
  ); // 5 minutes in milliseconds
}

function handleBulletCollision(room, bullet) {
  const eliminatedPlayers = [];
  let nearestPlayer = null;
  let minDistanceSquared = Infinity;

  // Find the nearest player
  room.players.forEach((otherPlayer) => {
    if (
      otherPlayer.playerId !== bullet.playerId &&
      otherPlayer.visible !== false
    ) {
      const dx = otherPlayer.x - bullet.startX;
      const dy = otherPlayer.y - bullet.startY;
      const distanceSquared = dx * dx + dy * dy;

      if (distanceSquared < minDistanceSquared) {
        minDistanceSquared = distanceSquared;
        nearestPlayer = otherPlayer;
      }
    }
  });

  // Check if a nearest player is found and within bullet trajectory
  if (nearestPlayer && isRectIntersectingLine(
    nearestPlayer.x - playerHitboxWidth / 2,
    nearestPlayer.y - playerHitboxHeight / 2,
    nearestPlayer.x + playerHitboxWidth / 2,
    nearestPlayer.y + playerHitboxHeight / 2,
    bullet.startX,
    bullet.startY,
    bullet.endX,
    bullet.endY
  )) {
    // Handle collision with the nearest player
    const shootingPlayer = room.players.get(bullet.playerId);
    const GUN_BULLET_DAMAGE = guns_damage[shootingPlayer.gun];

    // Update player's health
    nearestPlayer.health -= GUN_BULLET_DAMAGE;
    shootingPlayer.damage += GUN_BULLET_DAMAGE;
    nearestPlayer.last_hit_time = new Date().getTime();

    // Update hitdata for shooting player
    const hitdata = {
      last_playerhit: {
        playerId: nearestPlayer.playerId,
        datetime: new Date().getTime(),
        damage: GUN_BULLET_DAMAGE,
      },
    };
    shootingPlayer.hitdata = JSON.stringify(hitdata);

    setTimeout(() => {
      shootingPlayer.hitdata = null;
    }, 1000);

    // Check if the player is eliminated
    if (nearestPlayer.health <= 0) {
      // Player is eliminated
      nearestPlayer.visible = false;

      // Update player's place
  /*    if (room.players.filter((player) => player.visible !== false).length === 1 && room.winner === 0) {
        nearestPlayer.place = 2;
      } else {
        nearestPlayer.place = room.players.size - eliminatedPlayers.length;
      }*/

      if (
        Array.from(room.players.values()).filter(
          (player) => player.visible !== false,
        ).length === 1 &&
        room.winner === 0
      ) {
        // Only one player remains, the eliminated player gets 2nd place
        nearestPlayer.place = 2;
      } else {
        // More than one player remains, assign place based on remaining players
        nearestPlayer.place = room.players.size - eliminatedPlayers.length;
      }

      const existingPlace = eliminatedPlayers.find(
        (player) => player.place === nearestPlayer.place,
      );


      if (existingPlace) {
        if (nearestPlayer.place === max_room_players) {
          nearestPlayer.place--;
        } else {
          nearestPlayer.place++;
        }
      }

      room.eliminatedPlayers.push({
        username: nearestPlayer.playerId,
        place: nearestPlayer.place,
        eliminator: bullet.playerId,
      });

      increasePlayerPlace(nearestPlayer.playerId, nearestPlayer.place);

      nearestPlayer.visible = false;

      // Update stats for shooting player
      shootingPlayer.kills++;
      shootingPlayer.elimlast = nearestPlayer.playerId;

      setTimeout(() => {
        shootingPlayer.elimlast = null;
      }, 1000);

      // Check for game end conditions
      if (
        Array.from(room.players.values()).filter(
          (player) => player.visible !== false,
        ).length === 1 &&
        room.winner === 0
      ) {
        const remainingPlayer = Array.from(room.players.values()).find(
          (player) => player.visible !== false,
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

  return eliminatedPlayers;
}
  


module.exports = {
  handleMovement,
  handleBulletCollision,
};
