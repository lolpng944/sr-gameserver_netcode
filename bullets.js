const { calculateBulletEndpoint } = require('./collisions');
const { handleBulletCollision } = require('./player');
const { weaponCooldowns, weaponShootRange } = require('./config');

function handleBulletFired(result, player) {
  const room = result.room;

  const currentTime = new Date().getTime();
  const lastShootTime = player.lastShootTime || 0;
  const shootCooldown = weaponCooldowns[player.gun];

  // Ensure the player can't switch weapons while shooting
  if (player.shooting || (currentTime - lastShootTime < shootCooldown)) {
    return;
  }

  player.shooting = true;
  player.lastShootTime = currentTime;

const timestamp = currentTime - player.ping || 0

 const closestState = result.room.snap.reduce((prev, curr) => {
 return (Math.abs(curr.timestamp - timestamp) < Math.abs(prev.timestamp - timestamp) ? curr : prev);
 });

  
const player2 = closestState.players.get(player.playerId);

  const finalshootdirection = player.shoot_direction - 90;
  const radiansfinal = (finalshootdirection * Math.PI) / 180;
  const bulletLength = weaponShootRange[player.gun];
  const bulletEndpoint = calculateBulletEndpoint(
    player2.x,
    player2.y,
    radiansfinal,
    bulletLength,
  );

  const bullet = {
    startX: player2.x,
    startY: player2.y,
    endX: bulletEndpoint.x,
    endY: bulletEndpoint.y, 
    direction: radiansfinal,
    playerId: result.playerId,
    gun: player.gun,
  };

  handleBulletCollision(room, bullet, currentTime - player.ping || 0);

  setTimeout(() => {
    player.shooting = false;
  }, shootCooldown);
}



module.exports = {
  handleBulletFired,
};
