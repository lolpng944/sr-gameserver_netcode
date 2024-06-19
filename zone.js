const { WORLD_HEIGHT, WORLD_WIDTH, game_win_rest_time } = require('./config');

const { increasePlayerPlace, increasePlayerWins } = require('./dbrequests')
const { endGame } = require('./game')

// Function to check if player is within the zone
//function isWithinZone(room, playerX, playerY) {
//    return playerX >= room.zoneStartX && playerX <= room.zoneEndX &&
//           playerY >= room.zoneStartY && playerY <= room.zoneEndY;
//}

function isWithinZone(room, playerX, playerY) {
    return playerX - 40 >= room.zoneStartX && playerX + 40 <= room.zoneEndX &&
           playerY - 60  >= room.zoneStartY && playerY + 60 <= room.zoneEndY;
}
shrinkspeed = 1.5 / 1000
// Function to shrink the game zone
function shrinkZone(room) {
    dealDamage(room);
    if (room.zoneEndX > 2 && room.zoneEndY > 2) {
        
      room.zoneStartX += shrinkspeed * room.mapWidth
      room.zoneStartY += shrinkspeed * room.mapHeight
      room.zoneEndX -= shrinkspeed * room.mapWidth;
      room.zoneEndY -= shrinkspeed * room.mapHeight;

        room.zoneStartX = Math.round(room.zoneStartX);
        room.zoneStartY = Math.round(room.zoneStartY);
        room.zoneEndX = Math.round(room.zoneEndX);
        room.zoneEndY = Math.round(room.zoneEndY);

    room.zone = room.zoneStartX + "," + room.zoneStartY
      //  setTimeout(() => {
         //   room.zone = undefined;
         // }, 100);


      //  console.log(room.zoneEndX, room.zoneEndY);
    } else {
        console.log("Zone cannot shrink further.");
        clearInterval(room.shrinkInterval);
         room.zonefulldamage = setInterval(() => dealDamage(room), 250);
    }
}

function dealDamage(room) {
    room.players.forEach((player) => {
         if (player.visible !== false && !isWithinZone(room, player.x, player.y)) {
        if (!isWithinZone(room, player.x, player.y)) {
            if (1 > player.health) {
           handleElimination(room, player);
               
        } else {
                if (room.winner === 0) {
            player.health -= 3;
            player.last_hit_time = new Date().getTime();
                }
                 }
}
        } else {

            // Implement player health deduction logic here if needed
        }
    });
}

function pingPlayers(room) {
  // First setTimeout
  setTimeout(() => {
      room.sendping = 1;
      room.players.forEach((player) => {
          if (player.visible !== false) {
              player.lastping = new Date().getTime();
          }
      });
  }, 2000);

  // Second setTimeout
  setTimeout(() => {
      room.sendping = undefined;
  }, 3000);

  //pingPlayers(room);
}
   


function UseZone(room) {

  room.zoneStartX -= 400
  room.zoneStartY -= 400
  room.zoneEndX += 400
  room.zoneEndY += 400
 
    room.shrinkInterval = setInterval(() => shrinkZone(room), 250);
  /*  setInterval(() => {
      // Ensure sendping is undefined before calling pingPlayers again
      if (room.sendping === undefined) {
          pingPlayers(room);
      }
  }, 5000);
*/
    
};



function handleElimination(room, player) {
     const eliminatedPlayers = [];

       player.visible = false;

          if (
            Array.from(room.players.values()).filter(
              (player) => player.visible !== false,
            ).length === 1 &&
            room.winner === 0
          ) {
            // Only one player remains, the eliminated player gets 2nd place
            player.place = 2;
          } else {
            // More than one player remains, assign place based on remaining players
            player.place = room.players.size - eliminatedPlayers.length;
          }

          const existingPlace = eliminatedPlayers.find(
            (player) => player.place === player.place,
          );


          if (existingPlace) {
            if (player.place === room.maxplayers) {
              player.place--;
            } else {
              player.place++;
            }
          }

          room.eliminatedPlayers.push({
            username: player.playerId,
            place: player.place,
               });

          increasePlayerPlace(player.playerId, player.place);

          player.visible = false;


    if (
      Array.from(room.players.values()).filter(
        (player) => player.visible !== false
      ).length === 0
    ) {
      setTimeout(() => {
        endGame(room);
      }, game_win_rest_time);
    }
        

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

module.exports = {
    UseZone,
};


