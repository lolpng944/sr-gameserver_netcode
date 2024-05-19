const { calculateBulletEndpoint, adjustBulletEndpoint } = require('./collisions');
const { handleBulletCollision } = require('./player');
const { weaponCooldowns, weaponShootRange } = require('./config');

function handleBulletFired(result, data, player) {
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
      endX: bulletEndpoint.x, // Corrected property name
      endY: bulletEndpoint.y, // Corrected property name
      direction: radiansfinal,
      playerId: result.playerId,
      gun: player.gun,
      // width: 50,
    };

    adjustBulletEndpoint(room, bullet);

    // Initial add to batch
    //addToBatch(room, [{ type: "bullet", bullet }]);
    //console.log("Bullet added to batch:", bullet);

    handleBulletCollision(room, bullet);

    // Start the update loop

    const shootCooldown = weaponCooldowns[bullet.gun];

    setTimeout(() => {
      player.shooting = false;
    }, shootCooldown); //
  }
}





module.exports = {
  handleBulletFired,
};
