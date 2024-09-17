import netCDF4 as nc
import numpy as np

# Path to the netCDF file
file_path = './src/gebco_2024_sub_ice_n30.0_s0.0_w60.0_e100.0.nc'

# Open the netCDF file
dataset = nc.Dataset(file_path)

# Extract latitude and longitude arrays from the dataset
latitudes = dataset.variables['lat'][:]  # Check actual variable name in your file
longitudes = dataset.variables['lon'][:]

# Extract the elevation data for the cropped region
elevation_data = dataset.variables['elevation'][:]  # Extract full cropped region elevation

# Desired step in degrees (0.05 degrees)
STEP = 0.05

# Calculate the downsampling factor based on the dataset's resolution vs. the desired step
lat_resolution = abs(latitudes[1] - latitudes[0])  # Resolution in degrees for latitude
lon_resolution = abs(longitudes[1] - longitudes[0])  # Resolution in degrees for longitude

lat_factor = int(STEP / lat_resolution)
lon_factor = int(STEP / lon_resolution)

# Downsample by averaging over blocks
elevation_downsampled = elevation_data.reshape(
    (elevation_data.shape[0] // lat_factor, lat_factor,
     elevation_data.shape[1] // lon_factor, lon_factor)
).mean(axis=(1, 3))

# Initialize a matrix to hold the classifications, same shape as the downsampled elevation
classification_matrix = np.zeros(elevation_downsampled.shape, dtype=int)

# Classify into 3 categories based on elevation values
classification_matrix[elevation_downsampled > 0] = 3       # Land
classification_matrix[(elevation_downsampled > -500) & (elevation_downsampled <= 0)] = 2  # Shore
classification_matrix[elevation_downsampled <= -500] = 1   # Ocean

print(classification_matrix.shape)

def invert_matrix(classification_matrix):
    return classification_matrix[::-1]

classification_matrix = invert_matrix(classification_matrix)

# import sys
# np.set_printoptions(threshold=sys.maxsize, linewidth=1000)
# for row in classification_matrix:
#   for col in row:
#     if col == 3:
#       print('O', end="")
#     elif col == 2:
#       print('!', end="")
#     else:
#       print('-', end="")
#   print(end="\n")