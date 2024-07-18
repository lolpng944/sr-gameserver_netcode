const { calculateBulletEndpoint, isCollisionWithBullet } = require('./collisions');
const { handleBulletCollision, handlePlayerCollision } = require('./player');
const { weaponCooldowns, weaponShootRange, server_tick_rate, walls, wallblocksize, playerHitboxHeight, playerHitboxWidth } = require('./config');
const { json } = require('body-parser');




function isCollisionWithPlayer(bullet, player) {
  const playerLeft = player.x - playerHitboxWidth / 2.4;
  const playerRight = player.x + playerHitboxWidth / 2.4;
  const playerTop = player.y - playerHitboxHeight / 2.4;
  const playerBottom = player.y + playerHitboxHeight / 2.4;

  const bulletLeft = bullet.x - 5 / 2;
  const bulletRight = bullet.x + 5 / 2;
  const bulletTop = bullet.y - 5 / 2;
  const bulletBottom = bullet.y + 5 / 2;

  return (
    bulletRight >= playerLeft &&
    bulletLeft <= playerRight &&
    bulletBottom >= playerTop &&
    bulletTop <= playerBottom
  );
}


function moveBullet(room, player, playerspeed, direction, timestamp, maxDistance) {
  // Find the bullet with the specific rayid (assuming rayid is a timestamp or unique identifier)
  const bullet = player.bullets.find(bullet => bullet.timestamp === timestamp);

  if (!bullet) {
    console.log(`Bullet timestamp not found.`);

    return; // Exit function if bullet with rayid is not found
  }

  const finalDirection = direction - 90; // Adjust direction calculation as needed
  const radians = (finalDirection * Math.PI) / 180;
  const xDelta = playerspeed * Math.cos(radians);
  const yDelta = playerspeed * Math.sin(radians);

  const newX = Math.round(bullet.x + xDelta);
  const newY = Math.round(bullet.y + yDelta);

  const distanceTraveled = Math.sqrt(Math.pow(newX - bullet.startX, 2) + Math.pow(newY - bullet.startY, 2));

  //console.log(room.players);


  if (!isCollisionWithBullet(newX, newY, bullet.x, bullet.y) && distanceTraveled <= maxDistance) {
    bullet.x = newX;
    bullet.y = newY;




   
try {

    for (const [id, otherPlayer] of room.players) {
      if (otherPlayer !== player && otherPlayer.visible && isCollisionWithPlayer(bullet, otherPlayer)) {
        const number = distanceTraveled / maxDistance + 0.5;
        const shootdistance =  number.toFixed(1)
        handlePlayerCollision(room, player, otherPlayer, 1, shootdistance); // Handle bullet collision

    /*    console.log("intersection with")
        otherPlayer.health -= 5
        player.damage += 5;
        otherPlayer.last_hit_time = new Date().getTime();
      
        // Update hitdata for shooting player
        const hitdata = {
          last_playerhit: {
            playerId: otherPlayer.playerId,
            datetime: new Date().getTime(),
            damage: 7960,
          },
        };
        player.hitdata = JSON.stringify(hitdata);
      
        setTimeout(() => {
          player.hitdata = null;
        }, server_tick_rate * 2 + 2);*/
        player.bullets = player.bullets.filter(b => b.timestamp !== timestamp);
       
        return;
      }
    }

  } catch (error) {
  console.log("cannot read players")
  return;
  }
   
  } else {
    player.bullets = player.bullets.filter(b => b.timestamp !== timestamp);
 
}

}


function shootBulletsWithDelay(room, player, direction, speed, length, delay, yOffset) {
  return new Promise((resolve) => {
    setTimeout(() => {
      shootBullet(room, player, direction, speed, length, yOffset);
      resolve();
    }, delay);
  });
}

function shootBullet(room, player, direction, speed, maxDistance, yOffset) {
  return new Promise(async (resolve) => {

    const radians = (direction * Math.PI) / 180;
    const xOffset = yOffset * Math.cos(radians);
    const yOffsetAdjusted = yOffset * Math.sin(radians);

    const bullet = {
      x: player.x + xOffset,
      y: player.y + yOffsetAdjusted,
      startX: player.x + xOffset,
      startY: player.y + yOffsetAdjusted,
      direction: direction,
      timestamp: Date.now(),
    };

    player.bullets.push(bullet);

    while (true) {
      moveBullet(room, player, speed, direction, bullet.timestamp, maxDistance);
      const currentBullet = player.bullets.find(b => b.timestamp === bullet.timestamp);
      if (!currentBullet) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, server_tick_rate));
    }

    resolve();
  });
}

  


const playerspeed = 5; // Example speed


async function handleBulletFired(room, player) {
//  if (player.bullets.length > 0) {
  //  return;
  //}

  const currentTime = Date.now();
  const lastShootTime = player.lastShootTime || 0;
  const shootCooldown = weaponCooldowns[player.gun];

 if (player.shooting || currentTime - lastShootTime < shootCooldown) {
  return;
  }

  player.shooting = true;
  player.lastShootTime = currentTime;

  try {
   Promise.all([
      shootBulletsWithDelay(room, player, player.shoot_direction, 8, 300, 0, 10),
      shootBulletsWithDelay(room, player, player.shoot_direction, 8, 300, 100, -10),
      shootBulletsWithDelay(room, player, player.shoot_direction, 8, 300, 200, 10),
      shootBulletsWithDelay(room, player, player.shoot_direction, 8, 300, 300, -10),
     // shootBulletsWithDelay(room, player.shoot_direction, 8, 300, 200, -30),
    ]);

    //console.log("Bullets shot!");
  } catch (error) {
    console.error("Error shooting bullets:", error);
  } finally {
    setTimeout(() => {
      player.shooting = false;
    }, shootCooldown);
  }
}

module.exports = {
  handleBulletFired,
};