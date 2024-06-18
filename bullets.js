const { calculateBulletEndpoint } = require('./collisions');
const { handleBulletCollision } = require('./player');
const { weaponCooldowns, weaponShootRange } = require('./config');

function handleBulletFired(result, player) {
  const room = result.room;
  //const player = room.players.get(result.playerId);

  // const currentTime = new Date().getTime();
  // const lastShootTime = player.lastShootTime || 0;

  if (player.shooting === false) {
    player.shooting = true;

    const finalshootdirection = player.shoot_direction - 90;
    const radiansfinal = (finalshootdirection * Math.PI) / 180;
    const bulletLength = weaponShootRange[player.gun];
    const bulletEndpoint = calculateBulletEndpoint(
      player.x,
      player.y,
      radiansfinal,
      bulletLength,
    );
 
    const bullet = {
      startX: player.x,
      startY: player.y,
      endX: bulletEndpoint.x,
      endY: bulletEndpoint.y, 
      direction: radiansfinal,
      playerId: result.playerId,
      gun: player.gun,
      // width: 50,
    };

    handleBulletCollision(room, bullet);

    const shootCooldown = weaponCooldowns[player.gun];

    setTimeout(() => {
      player.shooting = false;
    }, shootCooldown); //
  }
}


module.exports = {
  handleBulletFired,
};
