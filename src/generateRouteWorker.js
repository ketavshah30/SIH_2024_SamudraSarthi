self.onmessage = function (e) {
  var { GRID, START_PORT, END_PORT } = e.data; // Receive the data from the main thread

  // Perform the heavy route generation logic
  var result = generateRouteLogic(GRID, START_PORT, END_PORT);

  // Send the result back to the main thread
  postMessage(result);
};

function generateRouteLogic(GRID, START_PORT, END_PORT) {
  class MinPriorityQueue {
    constructor() {
      this.queue = [];
    }

    enqueue(item) {
      this.queue.push(item);
      this.queue.sort((a, b) => a[0] - b[0]); // Sort by priority (first element)
    }

    dequeue() {
      return this.queue.shift(); // Remove and return the item with the highest priority
    }

    isEmpty() {
      return this.queue.length === 0;
    }
  }

  class Point {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }

    equals(other) {
      return this.x === other.x && this.y === other.y;
    }

    toString() {
      return `(${this.x}, ${this.y})`;
    }

    // Calculate the Euclidean distance between this point and another point
    distanceTo(other) {
      return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
    }
  }

  // Heuristic function (Chebyshev distance for diagonal movement)
  function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }
  // return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

  function aStarMinSum(matrix, start, end) {
    const rows = matrix.length;
    const cols = matrix[0].length;

    // Directions for moving in the grid (right, down, left, up, and diagonals)
    const directions = [
      new Point(0, 1), // Right
      new Point(1, 0), // Down
      new Point(0, -1), // Left
      new Point(-1, 0), // Up
      new Point(1, 1), // Down-Right
      new Point(1, -1), // Down-Left
      new Point(-1, 1), // Up-Right
      new Point(-1, -1), // Up-Left
    ];

    // Priority queue for open set (min-heap)
    let openSet = new MinPriorityQueue();
    openSet.enqueue([
      matrix[start.x][start.y].weight + heuristic(start, end),
      0,
      start,
    ]);

    // Maps for cost and parent tracking
    let gCost = {};
    let minValue = {};
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        gCost[new Point(r, c)] = Infinity;
        minValue[new Point(r, c)] = Infinity;
      }
    }
    gCost[start] = 0;
    minValue[start] = matrix[start.x][start.y].weight;
    let cameFrom = {};

    let visited = new Set();

    while (!openSet.isEmpty()) {
      let [_, currentGCost, current] = openSet.dequeue();

      if (current.equals(end)) {
        let path = [];
        while (current in cameFrom) {
          path.push(current);
          current = cameFrom[current];
        }
        path.push(start);
        path.reverse();

        return path;
      }

      visited.add(current.toString());

      for (let d of directions) {
        let neighbor = new Point(current.x + d.x, current.y + d.y);

        if (
          neighbor.x < 0 ||
          neighbor.x >= rows ||
          neighbor.y < 0 ||
          neighbor.y >= cols
        )
          continue;

        if (
          // matrix[neighbor.x][neighbor.y].weight === LAND_WEIGHT ||
          visited.has(neighbor.toString())
        )
          continue;

        let tentativeGCost = currentGCost + 1;
        let tentativeSumValue =
          minValue[current] + matrix[neighbor.x][neighbor.y].weight;

        if (
          tentativeGCost < gCost[neighbor] ||
          tentativeSumValue < minValue[neighbor]
        ) {
          cameFrom[neighbor] = current;
          gCost[neighbor] = tentativeGCost;
          minValue[neighbor] = tentativeSumValue;
          openSet.enqueue([
            tentativeSumValue + heuristic(neighbor, end)*175,
            tentativeGCost,
            neighbor,
          ]);
        }
      }
    }
    return [];
  }

  // Conversion functions

  function convertToMatrixCoords(point, minx, miny, maxx, maxy, rows, cols) {
    let row = Math.round(
      rows - 1 - ((point.y - miny) * (rows - 1)) / (maxy - miny)
    );
    let col = Math.round(((point.x - minx) * (cols - 1)) / (maxx - minx));
    return new Point(row, col);
  }

  function convertToRealWorldCoords(
    row,
    col,
    minx,
    miny,
    maxx,
    maxy,
    rows,
    cols
  ) {
    let x = minx + (col * (maxx - minx)) / (cols - 1);
    let y = miny + ((rows - 1 - row) * (maxy - miny)) / (rows - 1);
    return new Point(x, y);
  }

  function getPerpendicularDistance(point, lineStart, lineEnd) {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;

    if (dx === 0 && dy === 0) {
      return Math.sqrt(
        (point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2
      );
    }

    const t =
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) /
      (dx * dx + dy * dy);
    const closestX = lineStart.x + t * dx;
    const closestY = lineStart.y + t * dy;

    return Math.sqrt((point.x - closestX) ** 2 + (point.y - closestY) ** 2);
  }

  // Recursive Ramer-Douglas-Peucker function
  function rdpSimplify(path, epsilon) {
    if (path.length < 3) {
      return path; // No simplification needed for paths with fewer than 3 points
    }

    let maxDistance = 0;
    let index = 0;

    // Find the point with the maximum distance from the line between the first and last points
    for (let i = 1; i < path.length - 1; i++) {
      const distance = getPerpendicularDistance(
        path[i],
        path[0],
        path[path.length - 1]
      );
      if (distance > maxDistance) {
        maxDistance = distance;
        index = i;
      }
    }

    // If the maximum distance is greater than epsilon, recursively simplify
    if (maxDistance > epsilon) {
      const leftPath = rdpSimplify(path.slice(0, index + 1), epsilon);
      const rightPath = rdpSimplify(path.slice(index), epsilon);

      // Combine the two halves, removing the duplicate point at the index
      return leftPath.slice(0, leftPath.length - 1).concat(rightPath);
    } else {
      // If the distance is less than epsilon, the entire segment is a straight line
      return [path[0], path[path.length - 1]];
    }
  }

  function findNearestWaterPoint(start) {
    let nearestWater = null;
    let minDistance = Infinity;

    // Iterate over the grid to find the nearest water point
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (GRID[r][c].weight != LAND_WEIGHT) {
          // Check if the cell contains water
          const waterPoint = new Point(r, c);
          const distance = start.distanceTo(waterPoint);

          if (distance < minDistance) {
            minDistance = distance;
            nearestWater = waterPoint;
          }
        }
      }
    }
    return nearestWater;
  }

  const MIN_LAT = 0;
  const MAX_LAT = 30;
  const MIN_LON = 60;
  const MAX_LON = 100;
  var ROWS = GRID.length;
  var COLS = GRID[0].length;
  const LAND_WEIGHT = 10000;
  const SHORE_WEIGHT = 500;

  var startIndex = convertToMatrixCoords(
    START_PORT,
    MIN_LON,
    MIN_LAT,
    MAX_LON,
    MAX_LAT,
    ROWS,
    COLS
  );
  var endIndex = convertToMatrixCoords(
    END_PORT,
    MIN_LON,
    MIN_LAT,
    MAX_LON,
    MAX_LAT,
    ROWS,
    COLS
  );

  startIndex = findNearestWaterPoint(startIndex);
  endIndex = findNearestWaterPoint(endIndex);

  let path = aStarMinSum(GRID, startIndex, endIndex);
  //   console.log(path);

  //
  // <TEST>
  //

  let sections = [];
  function optimizePath(path, n) {
    let finalPath = [];
    sections = splitPath(path, n);
    for (let section of sections) {
      let start = section[0];
      let end = section[section.length - 1];

      let originalSum = calculatePathSum(section);
      let straightLineSum = calculateStraightLineSum(start, end);

      // Check if the straight-line path sum is within 30% of the original path sum
      //   console.log(originalSum + ":" + straightLineSum);
      if (straightLineSum <= 1.1 * originalSum && straightLineSum != -1) {
        const straightLinePath = getStraightLinePath(start, end);
        // console.log("got a better path");
        // console.log(straightLinePath.length+":"+section.length);
        finalPath.push(...straightLinePath); // Append optimized path
        // updatePathToStraightLine(section, start, end);
      } else {
        finalPath.push(...section); // Append original path
      }
    }
    return finalPath;
  }
  // Gets the straight line path from start to end using Bresenham's Line Algorithm
  function getStraightLinePath(start, end) {
    const path = [];
    let x0 = start.x,
      y0 = start.y;
    const x1 = end.x,
      y1 = end.y;

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (x0 !== x1 || y0 !== y1) {
      path.push(new Point(x0, y0)); // Add current point to the path
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }

    path.push(end); // Add the end point to the path
    return path;
  }

  // Splits the path into n sections
  function splitPath(path, n) {
    const sectionSize = Math.floor(path.length / n);
    const sections_another = [];

    for (let i = 0; i < path.length; i += sectionSize) {
      sections_another.push(path.slice(i, i + sectionSize));
    }
    // console.log("Sections size:" + sections_another.length);
    return sections_another;
  }
  // Calculates the sum of the original path
  function calculatePathSum(section) {
    // console.log("HERE");
    let sum = 0;
    for (let point of section) {
      sum += GRID[point.x][point.y].weight;
      // console.log((GRID[point.x][point.y]).weight);
    }
    return sum;
  }
  // Calculates the sum of the straight line from start to end
  function calculateStraightLineSum(start, end) {
    let sum = 0;
    let current = start;

    while (!current.equals(end)) {
      let direction = getNextStraightDirection(current, end); // Function to find the next point on the straight line
      current = new Point(current.x + direction.x, current.y + direction.y);
      sum += GRID[current.x][current.y].weight;
      if (
        GRID[current.x][current.y].weight == LAND_WEIGHT ||
        GRID[current.x][current.y].weight == SHORE_WEIGHT
      ) {
        return -1;
      }
    }
    return sum;
  }
  // Get direction
  function getNextStraightDirection(start, end) {
    // Calculate the difference between start and end
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    // Normalize the direction to ensure it's a unit step in one direction
    let directionX = dx === 0 ? 0 : dx / Math.abs(dx); // +1, -1, or 0
    let directionY = dy === 0 ? 0 : dy / Math.abs(dy); // +1, -1, or 0

    // Return the direction as an object representing the step in x and y
    return new Point(directionX, directionY);
  }

  var pathlen = path.length;

  for (var j = 1; j < 5; j++) {
    for (var i = 2; i <= pathlen / 2; i++) {
      const numsec = i;
      path = optimizePath(path, numsec);
    }
  }
  // // var test = path.slice(Math.floor(path.length*0.4),path.length-1);
  // // test = optimizePath(test,1);
  // var test = getStraightLinePath(path[Math.floor(path.length*0.4)],path[path.length-1]);

  // // var final_path = path.slice(0,Math.floor(path.length*0.4));
  // var final_path = [];
  // final_path.push(...test);
  // path = final_path;

  //
  // </TEST>
  //

  const realWorldPath = path.map((point) =>
    convertToRealWorldCoords(
      point.x,
      point.y,
      MIN_LON,
      MIN_LAT,
      MAX_LON,
      MAX_LAT,
      ROWS,
      COLS
    )
  );

  var latlngs = [];

  realWorldPath.forEach((point) => {
    latlngs.push([point.y, point.x]);
    // var marker = L.circleMarker([point.y, point.x], { radius: 5 }).addTo(map);
  });

  // Example usage of smoothing the real-world path
  realWorldPath;
  var epsilon = 0.1;
  const smoothedRealWorldPath = rdpSimplify(realWorldPath, epsilon);
  // Convert smoothed path to lat-lng format for leaflet
  var smoothedLatLngs = smoothedRealWorldPath.map((point) => [
    point.y,
    point.x,
  ]);

  return smoothedLatLngs;
}
