

const { walls, teleporters } = require('./config');

function isCollisionWithWalls(x, y) {
  // Filter only the walls that are within the threshold distance from (x, y)
  const threshold = 1;
  const nearbyWalls = walls.filter((wall) => {
    // Calculate the distance between the point (x, y) and the closest point on the wall's perimeter
    const closestX = Math.max(
      wall.x - wall.width / 2,
      Math.min(x, wall.x + wall.width / 2),
    );
    const closestY = Math.max(
      wall.y - wall.height / 2,
      Math.min(y, wall.y + wall.height / 2),
    );
    const distanceX = x - closestX;
    const distanceY = y - closestY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    return distance < threshold;
  });

  // Check for collision with each nearby wall
  for (const wall of nearbyWalls) {
    const wallLeft = wall.x - wall.width / 2;
    const wallRight = wall.x + wall.width / 2;
    const wallTop = wall.y - wall.height / 2;
    const wallBottom = wall.y + wall.height / 2;
    if (
      x + 60 > wallLeft &&
      x < wallRight &&
      y + 300 > wallTop &&
      y < wallBottom
    ) {
      return true; // Collision detected
    }
  }
  return false; // No collision with nearby walls
}

function isCollisionWithTeleporters(x, y) {
  // Filter only the teleporters that are within the threshold distance from (x, y)
  const threshold = 200;
  const nearbyTeleporters = teleporters.filter((teleporter) => {
    // Calculate the distance between the point (x, y) and the closest point on the teleporter's perimeter
    const closestX = Math.max(
      teleporter.x - teleporter.width / 2,
      Math.min(x, teleporter.x + teleporter.width / 2),
    );
    const closestY = Math.max(
      teleporter.y - teleporter.height / 2,
      Math.min(y, teleporter.y + teleporter.height / 2),
    );
    const distanceX = x - closestX;
    const distanceY = y - closestY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    return distance < threshold;
  });

  // Check for collision with each nearby teleporter
  for (const teleporter of nearbyTeleporters) {
    const teleporterLeft = teleporter.x - teleporter.width / 2;
    const teleporterRight = teleporter.x + teleporter.width / 2;
    const teleporterTop = teleporter.y - teleporter.height / 2;
    const teleporterBottom = teleporter.y + teleporter.height / 2;
    if (
      x + 60 > teleporterLeft &&
      x < teleporterRight &&
      y + 300 > teleporterTop &&
      y < teleporterBottom
    ) {
     
      return true; // Collision detected
    }
  }
  return false; // No collision with nearby teleporters
}



function calculateBulletEndpoint(startX, startY, direction, length) {
  //const radians = (direction * Math.PI) / 180; // Convert degrees to radians
  const endX = startX + length * Math.cos(direction);
  const endY = startY + length * Math.sin(direction);

  return { x: endX, y: endY };
}


function adjustBulletEndpoint(room, bullet) {
  //const walls = room.walls; // Assuming room has a walls property containing wall data

  const threshold = 200;
  const nearbyWalls = walls.filter((wall) => {
    // Calculate the distance between the point (x, y) and the closest point on the wall's perimeter
    const closestX = Math.max(
      wall.x - wall.width / 2,
      Math.min(bullet.startX, wall.x + wall.width / 2),
    );
    const closestY = Math.max(
      wall.y - wall.height / 2,
      Math.min(bullet.startY, wall.y + wall.height / 2),
    );
    const distanceX = bullet.startX - closestX;
    const distanceY = bullet.startY - closestY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    return distance < threshold;
  });

  for (const wall of nearbyWalls) {
    const wallLeft = wall.x - wall.width / 2;
    const wallRight = wall.x + wall.width / 2;
    const wallTop = wall.y - wall.height / 2;
    const wallBottom = wall.y + wall.height / 2;

    // Calculate the intersection point between the bullet's path and the wall
    const intersection = lineRectIntersection(
      bullet.startX,
      bullet.startY,
      bullet.endX,
      bullet.endY,
      wallLeft,
      wallTop,
      wall.width,
      wall.height,
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
  isCollisionWithTeleporters,
  calculateBulletEndpoint,
  adjustBulletEndpoint,
  lineRectIntersection,
  isRectIntersectingLine,
};