# Samudra Sarthi

## Overview

Samudra Sarthi is a project that provides a web-based application for determining optimal shipping routes based on various inputs like start and end ports, ship type, and cargo. The system integrates real-time weather data to enhance route efficiency, considering factors such as fuel usage, passenger comfort, and safety.

## Live Demo

You can access the deployed application [here](https://samudra-sarthi.vercel.app/).

NOTE: This website is just a prototype as the project is still under development.

## Features

- **Optimal Route Calculation**: Calculates the shortest and most efficient path between two ports using the A* algorithm.
- **Weather Integration**: Fetches real-time weather data to adjust route weights dynamically.
- **Efficient Pathfinding**: Utilizes a grid-based approach for efficient and accurate routing.
- **Smoothing Algorithms**: Applies Bezier curve smoothening for realistic and fuel-efficient routes.

## How to Use

1. **Access the Application:**
   - Visit the deployed URL: [samudra-sarthi.app](https://samudra-sarthi.vercel.app/).

2. **Input Parameters:**
   - Enter the start and end ports, ship type, and cargo type in the provided fields.

3. **Generate Routes:**
   - Submit your inputs to generate the optimal route, which will be displayed on the map.

4. **Weather Data:**
   - The application will automatically fetch weather data for cells along the route to adjust the path as needed.


### Code Structure

- **`index.html`**: Main HTML file linking to `style.css` and `map_script.js`.
- **`map_script.js`**: Manages map visualization and route generation.
- **`generateRouteWorker.js`**: Web Worker script for route generation.
- **`grid_data.json`**: Contains geographical data used for route calculations.
- **`config.js`**: Configuration file for API keys and other settings.

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.
