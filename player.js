
const { isRectIntersectingLine, isCollisionWithWalls, isCollisionWithTeleporters, wallblocksize } = require('./collisions');
const { increasePlayerPlace, increasePlayerWins } = require('./dbrequests')
const { endGame } = require('./game')
const { player_idle_timeout, walls } = require('./config')
  //const { handleCoinCollected } = require('./room')


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

/*  if (player.lastProcessedPosition === undefined || player.lastProcessedPosition === null) {
    player.lastProcessedPosition = { x: player.x, y: player.y };
 }

  const interpolatedPositions = interpolate(player, { x: newX, y: newY });

   interpolatedPositions.forEach(({ x, y }) => {
    if (!isCollisionWithWalls(x, y, player.x, player.y)) {
        player.x = x;
        player.y = y;

       player.lastProcessedPosition = { x, y };
    }
    });
    */

    if (!isCollisionWithWalls(newX, newY, player.x, player.y)) {
    player.x = newX;
    player.y = newY;

    player.lastProcessedPosition = { x: newX, y: newY };
  } else {
    // Collision resolution
    // Move the player back to their previous position
    player.x = player.lastProcessedPosition.x;
    player.y = player.lastProcessedPosition.y;
  }

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
  const steps = 30; // Adjust this value for smoother or faster movement

  for (let i = 1; i <= steps; i++) {
    const fraction = i / steps;
    const x = player.x + (nextPosition.x - player.x) * fraction;
    const y = player.y + (nextPosition.y - player.y) * fraction;
    interpolatedPositions.push({ x, y });
  }

  return interpolatedPositions;
}





function handleM34ovement(result, player) {
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
  let nearestObject = null;
  let minDistanceSquared = Infinity;
  let objectType = null; // 'player' or 'wall'

  function getDistanceSquared(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
  }

  function isRectIntersectingLine2(rx, ry, rw, rh, x1, y1, x2, y2) {
    // Line-segment to rectangle intersection algorithm
    function isIntersecting(x1, y1, x2, y2, x3, y3, x4, y4) {
      function ccw(A, B, C) {
        return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
      }
      const A = { x: x1, y: y1 }, B = { x: x2, y: y2 };
      const C = { x: x3, y: y3 }, D = { x: x4, y: y4 };
      return ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D);
    }

    const rectPoints = [
      { x: rx, y: ry }, { x: rx + rw, y: ry },
      { x: rx + rw, y: ry + rh }, { x: rx, y: ry + rh }
    ];

    for (let i = 0; i < 4; i++) {
      const next = (i + 1) % 4;
      if (isIntersecting(x1, y1, x2, y2, rectPoints[i].x, rectPoints[i].y, rectPoints[next].x, rectPoints[next].y)) {
        return true;
      }
    }

    return false;
  }

  // Find the nearest player
  room.players.forEach((otherPlayer) => {
    if (
      otherPlayer.playerId !== bullet.playerId &&
      otherPlayer.visible !== false
    ) {
      const distanceSquared = getDistanceSquared(bullet.startX, bullet.startY, otherPlayer.x, otherPlayer.y);
      if (distanceSquared < minDistanceSquared) {
        minDistanceSquared = distanceSquared;
        nearestObject = otherPlayer;
        objectType = 'player';
      }
    }
  });

  // Find the nearest wall
  room.walls.forEach((wall) => {
    const distanceSquared = getDistanceSquared(bullet.startX, bullet.startY, wall.x, wall.y);
    if (distanceSquared < minDistanceSquared) {
      minDistanceSquared = distanceSquared;
      nearestObject = wall;
      objectType = 'wall';
    }
  });

  // Check if a nearest object is found and within bullet trajectory
  if (nearestObject && objectType === 'player' && isRectIntersectingLine2(
    nearestObject.x - playerHitboxWidth / 2,
    nearestObject.y - playerHitboxHeight / 2,
    playerHitboxWidth,
    playerHitboxHeight,
    bullet.startX,
    bullet.startY,
    bullet.endX,
    bullet.endY
  )) {
    // Handle collision with the nearest player
    const shootingPlayer = room.players.get(bullet.playerId);
    const GUN_BULLET_DAMAGE = guns_damage[bullet.gun];

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
    }, 1000);

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
        nearestObject.place = room.players.size - eliminatedPlayers.length;
      }

      const existingPlace = eliminatedPlayers.find(
        (player) => player.place === nearestObject.place
      );

      if (existingPlace) {
        if (nearestObject.place === max_room_players) {
          nearestObject.place--;
        } else {
          nearestObject.place++;
        }
      }

      room.eliminatedPlayers.push({
        username: nearestObject.playerId,
        place: nearestObject.place,
        eliminator: bullet.playerId,
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
  } else if (nearestObject && objectType === 'wall' && isRectIntersectingLine2(
    nearestObject.x - wallblocksize / 2,
    nearestObject.y - wallblocksize / 2,
    wallWidth,
    wallHeight,
    bullet.startX,
    bullet.startY,
    bullet.endX,
    bullet.endY
  )) {
    // Handle collision with the nearest wall
    console.log('Bullet hit a wall!');
    // Implement logic for what happens when a bullet hits a wall, if any
  }

  return eliminatedPlayers;
}

function handleBulletCollision2(room, bullet) {
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
    const GUN_BULLET_DAMAGE = guns_damage[bullet.gun];

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
