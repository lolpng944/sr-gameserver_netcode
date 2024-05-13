

const { walls, teleporters, WORLD_HEIGHT, WORLD_WIDTH, playerHitboxHeight, playerHitboxWidth,  } = require('./config');


const gridSize = 50; // Size of each grid cellc
const wallblocksize = 50;
const halfGridWidth = Math.ceil(WORLD_WIDTH * 2 / gridSize  / 2 ); // Half of grid width
const halfGridHeight = Math.ceil(WORLD_HEIGHT * 2 / gridSize / 2 ); // Half of grid height

// Create a grid where each cell contains a list of walls in that cell
const grid = Array.from({ length: halfGridWidth * 2 }, () =>
  Array.from({ length: halfGridHeight * 2 }, () => [])
);

// Populate the grid with walls
for (const wall of walls) {
  // Calculate the grid coordinates of the wall (adjust for negative values)
  const gridX = Math.floor((wall.x + WORLD_WIDTH * 2 / 2) / gridSize);
  const gridY = Math.floor((wall.y + WORLD_HEIGHT * 2 / 2) / gridSize);

  if (gridX >= 0 && gridX < grid.length && gridY >= 0 && gridY < grid[0].length) {
    // If the wall is within the grid bounds, push it into the corresponding cell
    grid[gridX][gridY].push(wall);
  } else {
    // Wall is outside the grid bounds, log an error
    console.log("Invalid wall position:", wall.x, wall.y);
  }
}

console.log("Grid initialization completed");
//console.log(grid);

/*function isCollisionWithWalls(x, y) {
  // Calculate the grid coordinates of the point (x, y)
  const offsetX = -80; // Adjust this offset as needed
  const offsetY = -80; 
  const gridX = Math.floor((x + WORLD_WIDTH * 2 / 2 - offsetX) / gridSize);
  const gridY = Math.floor((y + WORLD_HEIGHT * 2 / 2 - offsetY) / gridSize);

  const playerLeft = x - 5;
  const playerRight = x + 5;
  const playerTop = y - 0;
  const playerBottom = y + 0;

  // Check adjacent grid cells for walls
  for (let dx = -1; dx <= 1; dx++) 
   
    for (let dy = -1; dy <= 1; dy++) {

      
      const adjacentX = gridX + dx;
      const adjacentY = gridY + dy;

      if (grid[adjacentX] && grid[adjacentX][adjacentY]) {
            for (const wall of grid[adjacentX][adjacentY]) {

              const wallLeft = wall.x - wallblocksize;
              const wallRight = wall.x + wallblocksize;
              const wallTop = wall.y - wallblocksize;
              const wallBottom = wall.y + wallblocksize;
              
              if (
                playerRight > wallLeft &&
                playerLeft < wallRight &&
                playerTop > wallTop &&
                playerBottom < wallBottom
              ) {
                return true; // Collision detected
              }
            }
          }
       

      }

  return false; // No collision with nearby walls
}
*/

function isCollisionWithWalls(x, y) {
  // Filter only the walls that are within the threshold distance from (x, y)
  const threshold = 40;
  let collisionDetected = false;
  const nearbyWalls = walls.filter((wall) => {
    // Calculate the distance between the point (x, y) and the closest point on the wall's perimeter
    const closestX = Math.max(
      wall.x - wallblocksize,
      Math.min(x, wall.x + wallblocksize),
    );
    const closestY = Math.max(
      wall.y - wallblocksize,
      Math.min(y, wall.y + wallblocksize),
    );
    const distanceX = x - closestX;
    const distanceY = y - closestY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    return distance < threshold;
  });

  // Check for collision with each nearby wall
  for (const wall of nearbyWalls) {
    // Consider adjusting the collision detection logic based on the shape of walls
    const wallLeft = wall.x - wallblocksize / 2;
    const wallRight = wall.x + wallblocksize / 2;
    const wallTop = wall.y - wallblocksize / 2;
    const wallBottom = wall.y + wallblocksize / 2;

    // Adjust the collision condition based on the specific requirements of your walls
    if (
      x + 20 > wallLeft &&
      x - 20 < wallRight &&
      y + 45 > wallTop &&
      y - 45 < wallBottom
    ) {
      collisionDetected = true; // Collision detected
      break; 
       // Collision detected
    }
  }

   return collisionDetected;// No collision with nearby walls
}




function calculateBulletEndpoint(startX, startY, direction, length) {
  //const radians = (direction * Math.PI) / 180; // Convert degrees to radians
  const endX = startX + length * Math.cos(direction);
  const endY = startY + length * Math.sin(direction);

  return { x: endX, y: endY };
}








/*function adjustBulletEndpoint(room, bullet) {
  // Assuming room has a walls property containing wall data
  console.log("wall");

  const gridX = Math.floor((bullet.startX + WORLD_WIDTH / 2) / gridSize);
  const gridY = Math.floor((bullet.startY + WORLD_HEIGHT / 2) / gridSize);

  // Check adjacent grid cells for walls
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const adjacentX = gridX + dx;
      const adjacentY = gridY + dy;

      // Check if adjacent grid cell is within bounds
     if (
        adjacentX >= 0 &&
        adjacentX < grid.length &&
        adjacentY >= 0 &&
        adjacentY < grid[0].length
      ) {
      
        // Check if grid cell contains walls
        if (grid[adjacentX][adjacentY] && grid[adjacentX][adjacentY].length > 0) {
          for (const wall of grid[adjacentX][adjacentY]) {
            const wallLeft = wall.x - wallblocksize / 2;
            const wallRight = wall.x + wallblocksize / 2;
            const wallTop = wall.y - wallblocksize / 2;
            const wallBottom = wall.y + wallblocksize / 2;

            // Calculate the intersection point between the bullet's path and the wall
            const intersection = lineRectIntersection(
              bullet.startX,
              bullet.startY,
              bullet.endX,
              bullet.endY,
              wallLeft,
              wallTop,
              wallblocksize,
              wallblocksize,
            );


            // If there's an intersection, adjust the bullet's endpoint
            if (intersection) {
              bullet.endX = intersection.x;
              bullet.endY = intersection.y;
              return; // Exit the function since bullet can only hit one wall
            }
          }
        }
      }
    }
  }
}
*/

function adjustBulletEndpoint(room, bullet) {
  //const walls = room.walls; // Assuming room has a walls property containing wall data

  const threshold = 2000;
  const nearbyWalls = walls.filter((wall) => {
    // Calculate the distance between the point (x, y) and the closest point on the wall's perimeter
    const closestX = Math.max(
      wall.x - wallblocksize,
      Math.min(bullet.startX, wall.x + wallblocksize / 2),
    );
    const closestY = Math.max(
      wall.y - wallblocksize,
      Math.min(bullet.startY, wall.y + wallblocksize / 2),
    );
    const distanceX = bullet.startX - closestX;
    const distanceY = bullet.startY - closestY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    return distance < threshold;
  });

  for (const wall of nearbyWalls) {
    const wallLeft = wall.x - wallblocksize / 2;
    const wallRight = wall.x + wallblocksize / 2;
    const wallTop = wall.y - wallblocksize / 2;
    const wallBottom = wall.y + wallblocksize / 2;

    // Calculate the intersection point between the bullet's path and the wall
    const intersection = lineRectIntersection(
      bullet.startX,
      bullet.startY,
      bullet.endX,
      bullet.endY,
      wallLeft,
      wallTop,
      wallblocksize,
      wallblocksize,
    );

    // If there's an intersection, adjust the bullet's endpoint
    if (intersection) {
      bullet.endX = intersection.x;
      bullet.endY = intersection.y;
      break; // Exit loop since bullet can only hit one wall
    }
  }
}


// Function to calculate intersection point between a line and a rectangle
function lineRectIntersection(x1, y1, x2, y2, rx, ry, rw, rh) {
  
  const dx = x2 - x1;
  const dy = y2 - y1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - rx, rx + rw - x1, y1 - ry, ry + rh - y1];

  let tMin = -Infinity;
  let tMax = Infinity;

  for (let i = 0; i < 4; ++i) {
    const t = q[i] / p[i];
    if (p[i] < 0 && t > tMin) tMin = t;
    else if (p[i] > 0 && t < tMax) tMax = t;
  }

  if (tMin > tMax || tMax < 0) return null;

  const t = tMin > 0 ? tMin : tMax;
  const intersectionX = x1 + t * dx;
  const intersectionY = y1 + t * dy;

  return { x: intersectionX, y: intersectionY };
}





function isRectIntersectingLine(
  rectX1,
  rectY1,
  rectX2,
  rectY2,
  lineX1,
  lineY1,
  lineX2,
  lineY2,
) {
  // Check if the line intersects the rectangle
  // Implementation based on Liang-Barsky line clipping algorithm

  const dx = lineX2 - lineX1;
  const dy = lineY2 - lineY1;

  let tMin = 0;
  let tMax = 1;

  for (let i = 0; i < 4; i++) {
    let p, q;

    if (i === 0) {
      p = -dx;
      q = -(rectX1 - lineX1);
    } else if (i === 1) {
      p = dx;
      q = rectX2 - lineX1;
    } else if (i === 2) {
      p = -dy;
      q = -(rectY1 - lineY1);
    } else {
      p = dy;
      q = rectY2 - lineY1;
    }

    const r = q / p;

    if (p === 0 && q < 0) {
      // Line is parallel to the clipping boundary and outside the boundary
      return false;
    }

    if (p < 0) {
      tMin = Math.max(tMin, r);
    } else if (p > 0) {
      tMax = Math.min(tMax, r);
    }

    if (tMin > tMax) {
      // Line is outside the clipping boundary
      return false;
    }
  }

  // Line intersects the rectangle
  return true;
}

module.exports = {
  isCollisionWithWalls,
  //isCollisionWithTeleporters,
  calculateBulletEndpoint,
  adjustBulletEndpoint,
  lineRectIntersection,
  isRectIntersectingLine,
};