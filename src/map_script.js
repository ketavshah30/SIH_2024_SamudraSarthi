// Constants and Configuration
const MIN_LAT = 0;
const MAX_LAT = 30;
const MIN_LON = 60;
const MAX_LON = 100;
const CELL_LEN = 0.05; // Degrees
const LAND_WEIGHT = 10000;
const SHORE_WEIGHT = 500;
const WATER_WEIGHT = 100;
const LAND_TYPE = 3;
const SHORE_TYPE = 2;
const WATER_TYPE = 1;

const API_KEY = "9fe64a30a3a64e4397e112238240309";
const END_POINT = "http://api.weatherapi.com/v1/marine.json";

var grid_array = [];
var GRID = [];
var ROWS, COLS;
var temp_lat = MIN_LAT;
var temp_lon = MIN_LON;
var START_PORT, END_PORT;
var smoothedPolyline;

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

  distanceTo(other) {
    return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
  }
}

// Ports data
const ports = {
  Kochi: new Point(76.221264, 9.964257),
  Kandla: new Point(70.227938, 22.984048),
  Chennai: new Point(80.308208, 13.101647),
  Vishakhapatnam: new Point(83.306028, 17.690662),
  Porbandar: new Point(69.589944, 21.61886),
  Jnpt: new Point(72.946, 18.955),
  Mormugao: new Point(73.796431, 15.41517),
  Mangalore: new Point(74.820222, 12.929692),
  Tuticorin: new Point(78.191648, 8.747572),
  Ennore: new Point(80.308342, 13.109319),
  Paradip: new Point(86.66982, 20.266891),
  Haldia: new Point(88.08802, 22.024468),
  "Port Blair": new Point(92.73328, 11.675247),
  Hazira: new Point(72.618069, 21.087029),
  Dahej: new Point(72.542551, 21.656535),
  Mundra: new Point(69.719024, 22.740756),
  Pipavav: new Point(71.522883, 20.924004),
  Gangavaram: new Point(83.242971, 17.623147),
  Krishnapatnam: new Point(80.125993, 14.247191),
  Dhamra: new Point(86.898576, 20.79263),
};

// Fetch Grid Data and Initialize GRID
function fetchGrid() {
  fetch("/grid_data.json")
    .then((response) => response.json())
    .then((data) => {
      grid_array = data;
      ROWS = grid_array.length;
      COLS = grid_array[0].length;
      console.log("Started");
      initGRID();
    })
    .catch((error) => {
      console.error("Error fetching grid:", error);
    });
}

function initGRID() {
  for (var i = 0; i < ROWS; i++, temp_lat += CELL_LEN) {
    var row = [];
    var temp_lon = MIN_LON;
    for (var j = 0; j < COLS; j++, temp_lon += CELL_LEN) {
      var obj = {
        lat: temp_lat,
        lon: temp_lon,
        type: grid_array[i][j],
        weight: 0,
        weather_obj: {},
      };

      if (obj.type === WATER_TYPE) {
        obj.weight = WATER_WEIGHT;
      } else if (obj.type === SHORE_TYPE) {
        obj.weight = SHORE_WEIGHT;
      } else {
        obj.weight = LAND_WEIGHT;
      }
      row.push(obj);
    }
    GRID.push(row);
  }

  console.log("GRID initialized");
  console.log(GRID);
}

// Utility Functions
// Cost function yet to implement
function updateGRIDWeights() {
  GRID.forEach((row) =>
    row.forEach((cell) => {
      cell.weight = cell.weight; // Future updates for weight can go here
    })
  );

  console.log("Updated GRID Weights");
}

// Populate Dropdowns with Ports
function populateDropdown(dropdownId) {
  var dropdown = document.getElementById(dropdownId);
  for (const port in ports) {
    var option = document.createElement("option");
    option.value = port;
    option.text = port.charAt(0).toUpperCase() + port.slice(1);
    dropdown.appendChild(option);
  }
}

// Web Worker for Route Generation
function startGeneration() {
  var loadingScreen = document.createElement("div");
  loadingScreen.id = "loadingScreen";
  loadingScreen.innerHTML = '<div id="buffer-icon"></div>';
  document.body.appendChild(loadingScreen);

  var worker = new Worker(new URL('./generateRouteWorker.js', import.meta.url), { type: 'module' });
  var startPort = document.getElementById("startPort").value;
  var endPort = document.getElementById("endPort").value;
  START_PORT = ports[startPort];
  END_PORT = ports[endPort];

  worker.postMessage({ GRID, START_PORT, END_PORT });

  worker.onmessage = function (e) {
    loadingScreen.remove();
    console.log("Route generated: ", e.data);
    var smoothedLatLngs = e.data;

    if (smoothedPolyline) {
      map.removeLayer(smoothedPolyline);
    }
    smoothedPolyline = L.polyline(smoothedLatLngs, { color: "blue" }).addTo(
      map
    );
    map.fitBounds(smoothedPolyline.getBounds());
  };

  worker.onerror = function (error) {
    console.error("Error in Web Worker: ", error);
    loadingScreen.remove();
  };
}

window.startGeneration = startGeneration;

// Initialize Map
var map = L.map("map").setView([17.409582, 78.509479], 4);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

// Initialize dropdowns
populateDropdown("startPort");
populateDropdown("endPort");

// Fetch grid data to start the process
fetchGrid();
