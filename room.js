const { LZString, axios, Limiter } = require('./index.js');
const { matchmaking_timeout } = require('./config.js');
const { handleBulletFired } = require('./bullets.js');
const { handleMovement } = require('./player.js');
const { connectedUsernames } = require('./index.js');
const { startDecreasingHealth, startRegeneratingHealth } = require('./match-modifiers')
const { UseZone, printZone } = require('./zone')

const {
  server_tick_rate,
    WORLD_WIDTH,
    WORLD_HEIGHT,
    game_start_time,
    max_room_players,
    spawnPositions,
    batchedMessages,
    rooms,
    walls,
   // isValidDirection,
} = require('./config');




function closeRoom(roomId) {
  const room = rooms.get(roomId);
  if (room) {
    clearInterval(room.intervalId); // Clear the interval associated with the room
    clearInterval(room.shrinkInterval);
     clearInterval(room.zonefulldamage);
     Object.keys(room).forEach(key => delete room[key]);
    rooms.delete(roomId); // Remove the room from the rooms map
    console.log(`Room ${roomId} closed.`);
    
  } else {
    console.log(`Room ${roomId} not found.`);
  }
}

async function joinRoom(ws, token) {
  return new Promise(async (resolve, reject) => {
    try {
      const expectedOrigin = "tw-editor://.";
      const response = await axios.get(
        `https://liquemgames-api.netlify.app/verify-gameservertoken/${token}`,
        {
          headers: {
            Origin: expectedOrigin,
          },
        },
      );

      let roomId;
      let room;


      if (response.data.message) {
        for (const [id, currentRoom] of rooms) {
          if (currentRoom.players.size < 1) {
            roomId = id || "room_1";
            room = currentRoom;
            break;
          }
        }

        // Check if there's an existing room with available slots
        const availableRoom = Array.from(rooms.values()).find(
          (currentRoom) =>
            currentRoom.players.size < max_room_players &&
            currentRoom.state !== "playing" &&
            currentRoom.state !== "countdown",
        );

        if (availableRoom) {
          roomId = availableRoom.roomId || "room_1";
          room = availableRoom;
        } else {
          roomId = `room_${rooms.size + 1}`;
          room = createRoom(roomId, WORLD_HEIGHT, WORLD_WIDTH);
          }


        function createRateLimiter() {
          const rate = 50; // Allow one request every 50 milliseconds
          return new Limiter({
            tokensPerInterval: rate,
            interval: 1000, // milliseconds
          });
        }



        const playerId = response.data.message;
        const hat = response.data.hat;
        const top = response.data.top;
        const player_color = response.data.player_color;
        const hat_color = response.data.hat_color;
        const top_color = response.data.top_color;
        const playerRateLimiter = createRateLimiter();

        let spawnIndex;
       // const spawnIndex = room.players.size;
         // Synchronize access to players map to handle simultaneous joins
        const playerCount = room.players.size;
        spawnIndex = playerCount % spawnPositions.length;


        room.players.set(playerId, {
          ws,
          x: spawnPositions[spawnIndex].x,
          y: spawnPositions[spawnIndex].y,
          direction: null,
          prevX: 0,
          prevY: 0,
          lastProcessedPosition: { x: spawnPositions[spawnIndex].x, y: spawnPositions[spawnIndex].y },
          playerId: playerId,
          rateLimiter: playerRateLimiter,
          hat: hat,
          top: top,
          player_color: player_color,
          hat_color: hat_color,
          top_color: top_color,
          timeout: null, // Add timeout property to player
          health: 100,
          damage: 0,
          kills: 0,
          lastShootTime: 0,
          moving: false,
          moveInterval: null,
          visible: true,
          place: null,
          shooting: false,
          shoot_direction: 90,
          gun: 1,
        });

         console.log("Player added:", room.players.get(playerId));
        
        if (room.state === "waiting" && room.players.size > max_room_players - 1) {
            setTimeout(() => {
        room.state = "countdown";
        console.log("State changed to 'countdown'");

        // Set another timeout for game_start_time milliseconds after countdown
        setTimeout(() => {
            room.state = "playing";
            console.log("State changed to 'playing'");

            // Start game mechanics
            // startDecreasingHealth(room, 1);
            startRegeneratingHealth(room, 1);
            UseZone(room);
        }, game_start_time);
    }, 2000);
}

        /*   setTimeout(() => {
               room.state = "countdown";
          }, 2000);

          
          // Start the game
        

          setTimeout(() => {
            room.state = "playing";
            
          }, game_start_time);

          //startDecreasingHealth(room, 1);
          startRegeneratingHealth(room, 1);
          UseZone(room);
        }

        */

        // Set timeout to disconnect player after 5 minutes of inactivity
        const playerTimeout = setTimeout(
          () => {
            ws.close(4100, "matchmaking_timeout");
            room.players.delete(playerId);
          },
          matchmaking_timeout,
        ); // 5 minutes in milliseconds

        // Assign the timeout ID to the player
        room.players.get(playerId).timeout = playerTimeout;

        resolve({ roomId, playerId, room });
      } else {
        ws.close(4001, "Invalid token");
        reject("Invalid token");
      }
    } catch (error) {
      console.error("Error verifying token:", error);
      ws.close(4000, "Token verification error");
      reject("Token verification error");
    }
  });
}

function addToBatch(room, messages) {
  if (!batchedMessages.has(room)) {
    batchedMessages.set(room, []);
  }
  batchedMessages.get(room).push(...messages);
}


function sendBatchedMessages(room) {
  const playerData = Array.from(room.players.values()).reduce((acc, player) => {
    if (player.visible !== false) {
      acc[player.playerId] = {
        x: player.x,
        y: player.y,
        direction: player.direction,
        health: player.health,
        shooting: player.shooting,
        //damage: player.damage,
        hitdata: player.hitdata,
        elimlast: player.elimlast,
        gun: player.gun,
      };

      if (acc[player.playerId].elimlast === null) {
        delete acc[player.playerId].elimlast;
      }

      for (const prop in acc[player.playerId]) {
        if (acc[player.playerId][prop] === null) {
          delete acc[player.playerId][prop];
        }
      }

      // Include additional properties only when playing.state is not "playing"
      if (room.state !== "playing") {
        acc[player.playerId].hat = player.hat;
        acc[player.playerId].top = player.top;
        acc[player.playerId].player_color = player.player_color;
        acc[player.playerId].hat_color = player.hat_color;
        acc[player.playerId].top_color = player.top_color;
      }
    }

    return acc;
  }, {});

  //const bullets = batchedMessages
   // .get(room)
    //.filter((msg) => msg.type === "bullet");

  const newMessage = {
      ...playerData ? { playerData } : {},
      coins: room.coins,
      state: room.state,
      z: room.zone,
      ...(room.eliminatedPlayers && room.eliminatedPlayers.length > 0) ? { eliminatedPlayers: room.eliminatedPlayers } : {},
  };

  const jsonString = JSON.stringify(newMessage);
  const compressedString = LZString.compressToUint8Array(jsonString);

  if (room.lastSentMessage !== jsonString) {
    room.players.forEach((player) => {
      player.ws.send(compressedString, { binary: true });

    });

    room.lastSentMessage = jsonString;
  }

  batchedMessages.set(room, []); // Clear the batch after sending
}




function broadcastPlayerPositions(room) {
  const playerPositions = Array.from(room.players.entries()).reduce(
    (acc, [playerId, player]) => {
      acc[playerId] = { x: player.x, y: player.y, direction: player.direction };
      return acc;
    },
    {},
  );

  const message = {
    type: "update",
    playerData: playerPositions,
    coins: room.coins,
  };

  room.players.forEach((player) => {
    player.ws.send(JSON.stringify(message));
  });
}
const halfWorldHeight = WORLD_HEIGHT;
const halfWorldWidth = WORLD_WIDTH;

function createRoom(roomId, height, width) {
  const room = {
    players: new Map(),
    state: "waiting", // Possible values: "waiting", "playing"
    winner: 0,
    eliminatedPlayers: [],
    zoneStartX: -width, // Example start X coordinate (100 
    zoneStartY: -height, // Example start Y coordinate (100 
    zoneEndX: width,  // Example end X coordinate (100 units 
    zoneEndY: height,
    mapHeight: height,
    mapWidth: width,
  };

  rooms.set(roomId, room);
  //generateRandomCoins(room);

  const intervalId = setInterval(() => {
    sendBatchedMessages(room);   
  }, server_tick_rate);

  room.intervalId = intervalId;

  setTimeout(() => {
    closeRoom(roomId); 
    room.players.forEach((player) => {
    player.ws.close(4370, "server_runs_too_long");
    });

    console.log(`Room ${roomId} closed.`);
  }, 10 * 60 * 1000); // 10 minutes in milliseconds


  return room;
}

function generateRandomCoins(room) {
  const coins = [];
  for (let i = 0; i < 1; i++) {
    const coin = {
      x: Math.floor(Math.random() * (WORLD_WIDTH * 2 + 1)) - WORLD_WIDTH,
      y: Math.floor(Math.random() * (WORLD_HEIGHT * 2 + 1)) - WORLD_HEIGHT,
    };
    coins.push(coin);
  }
  room.coins = coins;

  const coinsMessage = {
    type: "coins",
    coins: room.coins,
  };

  addToBatch(room, [coinsMessage]);
}

function handleCoinCollected(result, index) {
  const room = result.room;
  const playerId = result.playerId;
  const player = room.players.get(playerId);

  // Remove the collected coin
  room.coins.splice(index, 1);

  // Increase player's coins on the server
  const expectedOrigin = "tw-editor://.";
  axios
    .post(
      `https://liquemgames-api.netlify.app/increasecoins-lqemfindegiejgkdmdmvu/${playerId}`,
      null,
      {
        headers: {
          Origin: expectedOrigin,
        },
      },
    )
    .then(() => {
      console.log(`Coins increased for player ${playerId}`);
    })
    .catch((error) => {
      console.error("Error increasing coins:", error);
    });

  // Create the messages for coin_collected and coins
  const coinCollectedMessage = {
    type: "coin_collected",
    coinIndex: index,
    playerId: playerId,
  };

  const coinsMessage = {
    type: "coins",
    coins: room.coins,
  };

  // Add both messages to the batch
  addToBatch(room, [coinCollectedMessage, coinsMessage]);

  // Generate new random coins
  generateRandomCoins(room);
}


const validDirections = [-90, 0, 180, -180, 90, 45, 135, -135, -45];

const isValidDirection = (direction) => {
const numericDirection = parseFloat(direction);
return !isNaN(numericDirection) && validDirections.includes(numericDirection);
  };


function handleRequest(result, message) {
  const player = result.room.players.get(result.playerId);
  if (result.room.state === "playing" && player.visible !== false) {
    try {
      const data = JSON.parse(message);

      if (message.length > 300) {
        player.ws.close(4000, "ahhh whyyyyy");
        result.room.players.delete(result.playerId);
      }

      if (data.type === "shoot") {
        player.shoot_direction = parseFloat(data.shoot_direction);
        handleBulletFired(result, data, player);
      }

      if (data.type === "switch_gun") {
        const selectedGunNumber = parseFloat(data.gun);
        if (
          selectedGunNumber !== player.gun &&
          !player.shooting &&
          selectedGunNumber >= 1 &&
          selectedGunNumber <= 3
        ) {
          // Check if the gun number is between 1 and 3

          setTimeout(() => {
            player.shooting = false;
          }, 1000); //
          player.gun = selectedGunNumber;
        } else {
          // Notify the user that the gun number must be between 1 and 3
          console.log("Gun number must be between 1 and 3.");
        }
      }

      if (data.moving === "false") {
        clearInterval(player.moveInterval);
        player.moveInterval = null;
        player.moving = false;
      }

      if (
        data.type === "movement" &&
        typeof data.direction === "string" &&
        isValidDirection(data.direction)
      ) {
        const validDirection = parseFloat(data.direction);

        if (!isNaN(validDirection)) {
          if (player) {
            // Update the player direction based on input
            player.direction = validDirection;

            // Check if the player should move
            if (data.moving === "true") {
              // Set the shouldMove flag to true
               if (!player.moving === true) {
              player.moving = true;
                 }
            } else if (data.moving === "false") {
              // If not moving, set the shouldMove flag to false
              player.moving = false;
            } else {
              console.warn("Invalid 'moving' value:", data.moving);
            }

            // Clear the existing interval

            // Set up a new interval to move the player every 50 milliseconds
            if (!player.moveInterval) {

              player.moveInterval = setInterval(() => {
                // Check the shouldMove flag before moving
                if (player.moving) {
                  handleMovement(result, player);
                } else {
                  // If shouldMove is false, clear the interval
                  clearInterval(player.moveInterval);
                  player.moveInterval = null;
                }
              }, server_tick_rate);
            }
          }
        } else {
          console.warn("Invalid direction value:", data.direction);
        }
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  }
}


module.exports = {
  handleCoinCollected,
  joinRoom,
  addToBatch,
  sendBatchedMessages,
  createRoom,
  generateRandomCoins,
  handleRequest,
  closeRoom

};
