const { calculateBulletEndpoint, isCollisionWithBullet } = require('./collisions');
const { handleBulletCollision, handlePlayerCollision } = require('./player');
const { weaponCooldowns, weaponShootRange, server_tick_rate, wallblocksize, playerHitboxHeight, playerHitboxWidth, gunsconfig } = require('./config');
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


function moveBullet(room, player, playerspeed, direction, timestamp, maxDistance, bullet) {
  // Find the bullet with the specific rayid (assuming rayid is a timestamp or unique identifier)
  //const bullet = player.bullets.find(bullet => bullet.timestamp === timestamp);

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


  if (!isCollisionWithBullet(room.walls, newX, newY) && distanceTraveled <= maxDistance) {
    bullet.x = newX;
    bullet.y = newY;




   
try {

    for (const [id, otherPlayer] of room.players) {
      if (otherPlayer !== player && otherPlayer.visible && isCollisionWithPlayer(bullet, otherPlayer)) {
        const number = distanceTraveled / maxDistance + 0.5;
        const shootdistance =  number.toFixed(1)
        handlePlayerCollision(room, player, otherPlayer, 1, shootdistance, bullet.damage); // Handle bullet collision

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


function shootBulletsWithDelay(room, player, direction, speed, length, delay, yOffset, damage) {
  return new Promise((resolve) => {
    setTimeout(() => {
      shootBullet(room, player, direction, speed, length, yOffset, damage);
      resolve();
    }, delay);
  });
}

function shootBullet(room, player, direction, speed, maxDistance, yOffset, damage) {
  return new Promise(async (resolve) => {

    const radians = (direction * Math.PI) / 180;
    const xOffset = yOffset * Math.cos(radians);
    const yOffsetAdjusted = yOffset * Math.sin(radians);
    const randomPart = Math.random().toString(36).substring(2, 15);

    const bullet = {
      x: player.x + xOffset,
      y: player.y + yOffsetAdjusted,
      startX: player.x + xOffset,
      startY: player.y + yOffsetAdjusted,
      direction: direction,
      timestamp: randomPart,
      damage: damage,
    };

    player.bullets.push(bullet);

    while (true) {
      moveBullet(room, player, speed, direction, bullet.timestamp, maxDistance, bullet);
      const currentBullet = player.bullets.find(b => b.timestamp === bullet.timestamp);
      if (!currentBullet) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, server_tick_rate));
    }

    resolve();
  });
}


async function handleBulletFired(room, player, gunType) {
  const gun = gunsconfig[gunType];

  const currentTime = Date.now();
  const lastShootTime = player.lastShootTime || 0;
  const shootCooldown = gunsconfig[gunType].cooldown;

 if (player.shooting || currentTime - lastShootTime < shootCooldown) {
  return;
  }

  player.shooting = true;
  player.lastShootTime = currentTime;

  gun.bullets.forEach(bullet => {
    shootBulletsWithDelay(room, player, bullet.angle, bullet.speed, bullet.distance, bullet.delay, bullet.offset, gun.damage);
  });

  /*shootBullet(room, player, 90, 8, 300, 0);
  shootBullet(room, player, 0, 8, 300, 0);
  shootBullet(room, player, 180, 8, 300, 0);
  shootBullet(room, player, -90, 8, 300, 0);
  shootBullet(room, player, 45, 8, 300, 0);
  shootBullet(room, player, -45, 8, 300, 0);
  shootBullet(room, player, -135, 8, 300, 0);
  shootBullet(room, player, 135, 8, 300, 0);

  */
 //shootBulletsWithDelay(room, player, player.shoot_direction, 8, 300, 0, 10);
// shootBulletsWithDelay(room, player, player.shoot_direction, 8, 300, 100, -10);
 // shootBulletsWithDelay(room, player, player.shoot_direction, 8, 300, 200, 10);
  //shootBulletsWithDelay(room, player, player.shoot_direction, 8, 300, 300, -10);


    setTimeout(() => {
      player.shooting = false;
    }, shootCooldown);
  }


module.exports = {
  handleBulletFired,
};