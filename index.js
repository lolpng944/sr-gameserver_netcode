const WebSocket = require("ws");
const http = require("http");
const cors = require("cors");
const axios = require("axios");
const rateLimit = require("express-rate-limit");
const LZString = require("lz-string");

const server = http.createServer();
const wss = new WebSocket.Server({ noServer: true, perMessageDeflate: true, proxy: true });

let connectedClientsCount = 0;


const Limiter = require("limiter").RateLimiter;
module.exports = { LZString, axios, Limiter, WebSocket, http };
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const { sendBatchedMessages, joinRoom, closeRoom, handleRequest } = require('./room');
const { increasePlayerDamage, increasePlayerKills, increasePlayerPlace, increasePlayerWins } = require('./dbrequests');


const {
  server_tick_rate,
  game_win_rest_time,
  maxClients,
  rooms,
} = require('./config');


const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: "lg_server_limit_reached",
});

app.use(cors());
app.use(bodyParser.json());
app.set("trust proxy", ["loopback", "linklocal", "uniquelocal"]);

const MAX_REQUEST_SIZE = 1700;
const MAX_PARAM_BODY_LENGTH = 100;

const checkRequestSize = (req, res, next) => {
  // Calculate the size of the request body
  const requestBodySize =
    JSON.stringify(req.body).length +
    JSON.stringify(req.params).length +
    // Add the estimated size of headers (adjust as needed)
    JSON.stringify(req.headers).length;

  //console.log("Request Body Size:", JSON.stringify(req.body).length);
  //console.log("Request Params Size:", JSON.stringify(req.params).length);
  //console.log("Request Headers Size:", JSON.stringify(req.headers).length);

  // Check if the total size exceeds the limit
  if (requestBodySize > MAX_REQUEST_SIZE) {
    return res.status(400).json({
      message: "Request exceeds the character limit.",
    });
  }

  // Check if the length of req.params exceeds the limit
  if (JSON.stringify(req.params).length > MAX_PARAM_BODY_LENGTH) {
    return res.status(400).json({
      message: "Length of req.params exceeds the character limit.",
    });
  }

  // Check if the length of req.body exceeds the limit
  if (JSON.stringify(req.body).length > MAX_PARAM_BODY_LENGTH) {
    return res.status(400).json({
      message: "Length of req.body exceeds the character limit.",
    });
  }

  // If all checks pass, proceed to the next middleware
  next();
};

app.use(checkRequestSize);




let nextPlayerId = 1;




function endGame(room) {


  //   const player = room.players.get(playerId);
  // Additional logic to end the game and close the room
  console.log("Game ended! Closing the room.");
  // You can implement the logic to perform any cleanup or notify players about the end of the game.

  // Close the WebSocket connections for all players in the room
  room.players.forEach((player) => {
    // if (player.damage > 0)
    //  IncreasePlayerDamage(player.playerId, player.damage);
    //   }

    // if (player.kills > 0)
    // IncreasePlayerKills(player.playerId, player.kills);
    //  }
    const placelist = JSON.stringify(room.eliminatedPlayers);

    if (room.eliminatedPlayers) {
      player.ws.close(4300, "places");
    } else {
      player.ws.close(4301, "game_ended");
    }
  });

  // Remove the room
  // rooms.delete(room.roomId);
}

// Remove the room
// rooms.delete(room.roomId);



const allowedOrigins = [
  "https://slcount.netlify.app",
  "https://slgame.netlify.app",
  "https://serve.gamejolt.net",
  "http://serve.gamejolt.net",
  "tw-editor://.",
  "https://html-classic.itch.zone",
  "null",
  "https://turbowarp.org",
  "https://s-r.netlify.app",
];

function isValidOrigin(origin) {
  const trimmedOrigin = origin.trim().replace(/(^,)|(,$)/g, "");
  return allowedOrigins.includes(trimmedOrigin);
}




wss.on("connection", (ws, req) => {
  const token = req.url.slice(1);

  const origin = req.headers["sec-websocket-origin"] || req.headers.origin;
  console.log(origin);

  if (!isValidOrigin(origin)) {
    ws.close(4004, "Unauthorized");
    return;
  }

  joinRoom(ws, token)
    .then((result) => {
      if (!result) {
        ws.close(4001, "Invalid token");
        return;
      }

      connectedClientsCount++;

      console.log("Joined room:", result);

      ws.on("message", (message) => {
        if (result.room.players.has(result.playerId)) {
          const player = result.room.players.get(result.playerId);
          if (player.rateLimiter.tryRemoveTokens(1)) {
            handleRequest(result, message);
          }
        } else {
          console.log("Player not found in the room.");
        }
      });

      ws.on("close", () => {
        connectedClientsCount--;
        const player = result.room.players.get(result.playerId);
        clearInterval(player.moveInterval);






        if (player && player.timeout) {
          clearTimeout(player.timeout);
        }

        if (player) {
          if (player.damage > 0) {
            increasePlayerDamage(player.playerId, player.damage);
          }

          if (player.kills > 0) {
            increasePlayerKills(player.playerId, player.kills);
          }
        }

        result.room.players.delete(result.playerId);

        if (result.room.players.size === 0) {
          closeRoom(result.roomId);
          console.log(`Room closed`);
          return; // Exit early if the room is empty
        }

        if (result.room.state === "playing" && result.room.winner === 0) {
          console.log(result.room.winner);
          let remainingPlayers1 = Array.from(
            result.room.players.values(),
          ).filter((player) => player.visible !== false);
          console.log("yes im the problem" + result.room.winner);
          if (remainingPlayers1.length === 1 && result.room.winner === 0) {
            const winner = remainingPlayers1[0];
            result.room.winner = winner.playerId;
            console.log(
              `Last player standing! ${winner.playerId} wins! comes from closing`,
            );
            increasePlayerWins(winner.playerId, 1);
            increasePlayerPlace(winner.playerId, 1);
            console.log("no this plz not");
            result.room.eliminatedPlayers.push({
              username: winner.playerId,
              place: 1,
            });
            // }

            setTimeout(() => {
              endGame(result.room);
            }, game_win_rest_time);


            return;
          }
        }
      });
    })
    .catch((error) => {
      console.error("Error during joinRoom:", error);
      ws.close(4001, "Token verification error");
    });
});


server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    if (connectedClientsCount < maxClients) {
      wss.emit("connection", ws, request);
    } else {
      // Reject the connection if the max number of clients is reached
      ws.close(1000, "limit_reached");
    }
  });
});



process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // You can handle the error or perform cleanup here
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason, promise);
  // You can handle the rejection or perform cleanup here
});

module.exports = {
  handleGlobalErrors: () => {
    // No need for anything here since the error handlers are already registered
  }
};





const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});


