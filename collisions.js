

const { walls } = require('./config');



const wallblocksize = 50
function isCollisionWithWalls(x, y) {
  // Filter only the walls that are within the threshold distance from (x, y)
  const threshold = 100;
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

function isCollisionWithBullet(x, y) {
  // Filter only the walls that are within the threshold distance from (x, y)
  const threshold = 60;
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
      x > wallLeft &&
      x < wallRight &&
      y > wallTop &&
      y < wallBottom
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
  isCollisionWithBullet,
  //isCollisionWithTeleporters,
  calculateBulletEndpoint,
  lineRectIntersection,
  isRectIntersectingLine,
  wallblocksize,
};