

const wallblocksize = 50
function isCollisionWithWalls(walls, x, y) {
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

function isCollisionWithBullet(walls, x, y) {
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

function adjustBulletDirection(bullet, wall, wallblocksize) {
  // Calculate the normal vector of the wall's surface
  let normalAngle = 0;

  // Determine which side of the wall the bullet hit
  if (bullet.x < wall.x - wallblocksize / 2) {
    normalAngle = 180; // Hit the left side
  } else if (bullet.x > wall.x + wallblocksize / 2) {
    normalAngle = 0; // Hit the right side
  }

  if (bullet.y < wall.y - wallblocksize / 2) {
    normalAngle = 90; // Hit the top side
  } else if (bullet.y > wall.y + wallblocksize / 2) {
    normalAngle = 270; // Hit the bottom side
  }

  // Convert the incoming angle to radians
  const incomingAngle = bullet.angle * (Math.PI / 180);

  // Convert the normal angle to radians
  const normalAngleRadians = normalAngle * (Math.PI / 180);

  // Calculate the reflection angle
  const reflectionAngle = 2 * normalAngleRadians - incomingAngle;

  // Convert the reflection angle back to degrees
  const reflectionAngleDegrees = reflectionAngle * (180 / Math.PI);

  // Adjust the bullet's direction angle
  bullet.direction = reflectionAngleDegrees % 360;
}






module.exports = {
  isCollisionWithWalls,
  isCollisionWithBullet,
  wallblocksize,
};
