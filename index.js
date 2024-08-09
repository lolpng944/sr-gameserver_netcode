//"use strict";
const WebSocket = require("ws");
const http = require("http");
const cors = require("cors");
const axios = require("axios");
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwt = require("jsonwebtoken");
const { sanitize } = require("validator");
const rateLimit = require("express-rate-limit");
const LZString = require("lz-string");
const { RateLimiterMemory } = require("rate-limiter-flexible");

const ConnectionOptionsRateLimit = {
  points: 1, // Number of points
  duration: 5, // Per second
};

const express = require("express");
const app = express();

const rateLimiterConnection = new RateLimiterMemory(ConnectionOptionsRateLimit);

const server = http.createServer();

const wss = new WebSocket.Server({
  noServer: true,
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3,
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024,
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 10,
    threshold: 1024,
  },
  //perMessageDeflate: true,
  proxy: true,
  maxPayload: 104,
});

app.set("trust proxy", true);

let connectedClientsCount = 0;
let connectedUsernames = [];

const Limiter = require("limiter").RateLimiter;

process.on("SIGINT", function () {
  mongoose.connection.close(function () {
    console.log("Mongoose disconnected on app termination");
    process.exit(0);
  });
});

const password = process.env.DB_KEY || "8RLj5Vr3F6DRBAYc"
const encodedPassword = encodeURIComponent(password);

const uri = `mongodb+srv://Liquem:${encodedPassword}@cluster0.ed4zami.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
    socketTimeoutMS: 30000,
 //   maxConnecting: 2,
   // maxIdleTimeMS: 300000,
   // maxPoolSize: 100,
    //minPoolSize: 0,
  },
});

async function startServer() {
  try {
  
    await client.connect();
    console.log("Connected to MongoDB");

  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
}

startServer();

const db = client.db("Cluster0");
const userCollection = db.collection("users");
const battlePassCollection = db.collection("battlepass_users");

module.exports = {
  LZString,
  axios,
  Limiter,
  WebSocket,
  http,
  connectedUsernames,
  MongoClient, 
  ServerApiVersion,
  db,
  userCollection,
  battlePassCollection,
  jwt,
};

const bodyParser = require("body-parser");
const {
  joinRoom,
  closeRoom,
  handleRequest,
} = require("./room");
const {
  increasePlayerDamage,
  increasePlayerKills,
  increasePlayerPlace,
  increasePlayerWins,
} = require("./dbrequests");

const { game_win_rest_time, maxClients, all_gamemodes, gamemodeconfig } = require("./config");

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1,
  message: "lg_server_limit_reached",
});

app.use(limiter);

app.use(cors());
app.use(bodyParser.json());

function endGame(room) {
  console.log("Game ended! Closing the room.");

  room.players.forEach((player) => {
    const placelist = JSON.stringify(room.eliminatedPlayers);

    if (room.eliminatedPlayers) {
      player.ws.close(4300, "places");
    } else {
      player.ws.close(4301, "game_ended");
    }
  });
}

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
  "https://uploads.ungrounded.net",
  "https://prod-dpgames.crazygames.com",
  "https://crazygames.com",
  "https://crazygames.com/game/skilled-royale",
];

function isValidOrigin(origin) {
  const trimmedOrigin = origin.trim().replace(/(^,)|(,$)/g, "");
  return allowedOrigins.includes(trimmedOrigin);
}

function isvalidmode(gmd) {
  return all_gamemodes.includes(gmd);
}

wss.on("connection", (ws, req) => {

 const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    try {
        rateLimiterConnection.consume(ip);
    } catch (err) {
        ws.close(4003, "Rate limit exceeded");
        return;
    }

    if (connectedClientsCount > maxClients) {
      ws.close(4004, "code:full");
      return;
    }

  const urlParts = req.url.split('/');
  const token = (urlParts[1]);
  const gamemode = (urlParts[2]);

    const origin = req.headers["sec-websocket-origin"] || req.headers.origin;

    if (req.length > 2000 || origin.length > 50 || !isValidOrigin(origin)) {
      ws.close(4004, "Unauthorized");
      return;
    }

    console.log(gamemode, token)
     

    if (!(token && token.length < 300 && gamemode in gamemodeconfig)) {
      ws.close(4004, "Unauthorized");
      console.log("not correct")
      return;
    }

    joinRoom(ws, token, gamemode)
      .then((result) => {
        if (!result) {
          ws.close(4001, "Invalid token");
          return;
        }
        console.log("before closed", connectedUsernames);
        // if (connectedUsernames.includes(result.playerId)) {
        //  ws.close(4006, "code:double");
        //  return;
        //  }
        connectedClientsCount++;
        connectedUsernames.push(result.playerId);
        console.log(connectedUsernames);

        // console.log("Joined room:", result);

        ws.on("message", (message) => {
         // const sanitizedMessage = sanitize(message);
         const player = result.room.players.get(result.playerId);
          if (result.room.players.has(result.playerId) && message.length < 200 && player.rateLimiter.tryRemoveTokens(1)) {    
              handleRequest(result, message);
            
          } else {
            console.log("Player not found in the room.");
          }
        });

        ws.on("close", () => {
          const player = result.room.players.get(result.playerId);
          connectedClientsCount--;
          if (player && player.playerId) {
            const index = connectedUsernames.indexOf(result.playerId);
            if (index !== -1) {
              connectedUsernames.splice(index, 1);
            }
          }

          console.log(connectedUsernames);

          if (player) {
            clearInterval(player.moveInterval);
          }

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

          if (result.room.players.size < 1) {
            closeRoom(result.roomId);
            console.log(`Room closed`);
            return; // Exit early if the room is empty
          }

          if (result.room.state === "playing" && result.room.winner === 0) {
            let remainingPlayers1 = Array.from(
              result.room.players.values(),
            ).filter((player) => player.visible !== false);

            if (remainingPlayers1.length === 1 && result.room.winner === 0) {
              const winner = remainingPlayers1[0];
              result.room.winner = winner.playerId;

              increasePlayerWins(winner.playerId, 1);
              increasePlayerPlace(winner.playerId, 1);
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
  const ip = request.headers["x-forwarded-for"] || request.socket.remoteAddress;

  rateLimiterConnection.consume(ip).then(() => {
  // Consume the rate limiter


  const origin =
    request.headers["sec-websocket-origin"] || request.headers.origin;

  if (!isValidOrigin(origin)) {
    socket.destroy();
    return;
  }

  if (connectedClientsCount < maxClients) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    // Reject the connection if the max number of clients is reached
    socket.destroy();

  
  }
}).catch(() => {
  socket.write('HTTP/1.1 429 Too Many Requests\r\n\r\n');
  socket.destroy();
});
});

process.on("uncaughtException", (error) => {
console.error("Uncaught Exception:", error);
});

// Global error handler for unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
console.error("Unhandled Rejection:", reason, promise);
});

module.exports = {
  handleGlobalErrors: () => {},
};


const PORT = process.env.PORT || 8040;

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
