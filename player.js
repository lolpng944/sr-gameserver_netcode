
const { isRectIntersectingLine, isCollisionWithWalls, isCollisionWithTeleporters } = require('./collisions');
const { increasePlayerPlace, increasePlayerWins } = require('./dbrequests')
const { endGame } = require('./game')


const {
    WORLD_WIDTH,
    WORLD_HEIGHT,
    playerspeed,
    game_win_rest_time,
    guns_damage,
    teleporters,
    max_room_players,

} = require('./config');




function handleMovement(result, player) {
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
  // Collision resolution
  // Move the player back to their previous position
  player.x = player.lastProcessedPosition.x;
  player.y = player.lastProcessedPosition.y;
}

  if (isCollisionWithTeleporters(newX, newY)) {
     const collidedTeleporter = teleporters.find((teleporter) => {
       return (
         player.x + 60 > teleporter.x - teleporter.width / 2 &&
         player.x < teleporter.x + teleporter.width / 2 &&
         player.y + 300 > teleporter.y - teleporter.height / 2 &&
         player.y < teleporter.y + teleporter.height / 2
       );
     });

     // If a teleporter was found
     if (collidedTeleporter) {
       // Teleport the player to the destination of the collided teleporter
       player.x = collidedTeleporter.destination.x;
       player.y = collidedTeleporter.destination.y;
     }
    }
     
    
  

 

  // Additional movement logic can be added here

  const collectedCoins = [];
  result.room.coins.forEach((coin, index) => {
    const distance = Math.sqrt(
      Math.pow(player.x - coin.x, 2) + Math.pow(player.y - coin.y, 2),
    );

    if (distance <= 60) {
      collectedCoins.push(index);
    }
  });

  
  if (collectedCoins.length > 0) {
    collectedCoins.forEach((index) => {
      const { handleCoinCollected } = require('./room')
      handleCoinCollected(result, index);
    });
  }

  player.x = Math.max(-WORLD_WIDTH, Math.min(WORLD_WIDTH, player.x));
  player.y = Math.max(-WORLD_HEIGHT, Math.min(WORLD_HEIGHT, player.y));

  // Reset player timeout on activity
  clearTimeout(player.timeout);

  player.timeout = setTimeout(
    () => {
      player.ws.close(4200, "disconnected_inactivity");
      result.room.players.delete(result.playerId);
    },
    20 * 60 * 1000,
  ); // 5 minutes in milliseconds
}

function handleBulletCollision(room, bullet) {
  const eliminatedPlayers = [];

  room.players.forEach((otherPlayer) => {
    if (
      otherPlayer.playerId !== bullet.playerId &&
      otherPlayer.visible !== false
    ) {
      const playerHitboxWidth = 60; // Adjust as needed
      const playerHitboxHeight = 120; // Adjust as needed
      const shootingPlayer = room.players.get(bullet.playerId);



  // Check if the nearest player intersects with the bullet trajectory
  if (
    isRectIntersectingLine(
        otherPlayer.x - playerHitboxWidth / 2,
        otherPlayer.y - playerHitboxHeight / 2,
        otherPlayer.x + playerHitboxWidth / 2,
        otherPlayer.y + playerHitboxHeight / 2,
        bullet.startX,
        bullet.startY,
        bullet.endX,
        bullet.endY,
    )
  ) {
    const GUN_BULLET_DAMAGE = guns_damage[shootingPlayer.gun];
    // Player hit by bullet
    otherPlayer.health -= GUN_BULLET_DAMAGE;
    shootingPlayer.damage += GUN_BULLET_DAMAGE;
    otherPlayer.last_hit_time = new Date().getTime();

    const hitdata = {
      last_playerhit: {
        playerId: otherPlayer.playerId,
        datetime: new Date().getTime(),
        damage: GUN_BULLET_DAMAGE,
      },
    };

    shootingPlayer.hitdata = JSON.stringify(hitdata);

    setTimeout(() => {
      shootingPlayer.hitdata = null; // or set it to whatever default value you need
    }, 1000);

    if (otherPlayer.health <= 0) {
      // Player is eliminated
      otherPlayer.visible = false;
      // Update player's place
      if (
        Array.from(room.players.values()).filter(
          (player) => player.visible !== false,
        ).length === 1 &&
        room.winner === 0
      ) {
        // Only one player remains, the eliminated player gets 2nd place
        otherPlayer.place = 2;
      } else {
        // More than one player remains, assign place based on remaining players
        otherPlayer.place = room.players.size - eliminatedPlayers.length;
      }

      const existingPlace = eliminatedPlayers.find(
        (player) => player.place === otherPlayer.place,
      );

      if (existingPlace) {
        if (otherPlayer.place === max_room_players) {
          otherPlayer.place = otherPlayer.place - 1;
        } else {
          otherPlayer.place = otherPlayer.place + 1;
        }
      }
      room.eliminatedPlayers.push({
        username: otherPlayer.playerId,
        place: otherPlayer.place,
        eliminator: bullet.playerId,
      });

      increasePlayerPlace(otherPlayer.playerId, otherPlayer.place);

      otherPlayer.visible = false; // Hide the eliminated player

      shootingPlayer.kills += 1;

      shootingPlayer.elimlast = otherPlayer.playerId;

      setTimeout(() => {
        shootingPlayer.elimlast = null; // or set it to whatever default value you need
      }, 1000);

      // Check if there's only one remaining player and declare winner if applicable
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

        // Freeze all players for 5 seconds
        setTimeout(() => {
          // End the game and close the room
          endGame(room);
        }, game_win_rest_time);
        }
            }
          }
        
}

  //room.eliminatedPlayers = eliminatedPlayers;
});
  };


module.exports = {
  handleMovement,
  handleBulletCollision,
};