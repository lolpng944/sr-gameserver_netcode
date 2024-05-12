const { WORLD_HEIGHT, WORLD_WIDTH } = require('./config');



// Function to check if player is within the zone
//function isWithinZone(room, playerX, playerY) {
//    return playerX >= room.zoneStartX && playerX <= room.zoneEndX &&
//           playerY >= room.zoneStartY && playerY <= room.zoneEndY;
//}

function isWithinZone(room, playerX, playerY) {
    return playerX >= room.zoneStartX && playerX <= room.zoneEndX &&
           playerY >= room.zoneStartY && playerY <= room.zoneEndY;
}

// Function to shrink the game zone
function shrinkZone(room) {
    dealDamage(room);
    if (room.zoneEndX > 2 && room.zoneEndY > 2) {
    
      room.zoneStartX += 0.010 * room.mapWidth
      room.zoneStartY += 0.010 * room.mapHeight
      room.zoneEndX -= 0.010 * room.mapWidth;
      room.zoneEndY -= 0.010 * room.mapHeight;

        room.zoneStartX = Math.round(room.zoneStartX);
        room.zoneStartY = Math.round(room.zoneStartY);
        room.zoneEndX = Math.round(room.zoneEndX);
        room.zoneEndY = Math.round(room.zoneEndY);

        console.log(room.zoneEndX, room.zoneEndY);
    } else {
        console.log("Zone cannot shrink further.");
        clearInterval(room.shrinkInterval);
         room.zonefulldamage = setInterval(() => dealDamage(room), 1000);
    }
}

function dealDamage(room) {
    room.players.forEach((player) => {
        if (!isWithinZone(room, player.x, player.y)) {
            player.health -= 1;
            player.last_hit_time = new Date().getTime();
        } else {
            console.log("Player is within the zone");
            // Implement player health deduction logic here if needed
        }
    });
}

function UseZone(room) {
   room.shrinkInterval = setInterval(() => shrinkZone(room), 1000);
}

module.exports = {
    UseZone,
};
