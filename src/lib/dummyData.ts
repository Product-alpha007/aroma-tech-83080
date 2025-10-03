/**
 * Dummy data utilities for development
 * Provides mock location data for devices when location API is not available
 */

// Dummy location data that matches the initial wireframes
export const DUMMY_LOCATIONS = [
  "Main Office",
  "Warehouse A", 
  "Warehouse B",
  "Retail Store 1",
  "Retail Store 2",
  "Distribution Center",
  "Branch Office",
  "Showroom",
  "Storage Facility",
  "Service Center"
];

// Additional location categories for variety
export const LOCATION_CATEGORIES = {
  offices: ["Main Office", "Branch Office", "Regional Office", "Headquarters"],
  warehouses: ["Warehouse A", "Warehouse B", "Distribution Center", "Storage Facility"],
  retail: ["Retail Store 1", "Retail Store 2", "Showroom", "Outlet Store"],
  service: ["Service Center", "Repair Shop", "Maintenance Hub"],
  other: ["Unmapped", "Unknown Location", "Temporary Location"]
};

/**
 * Assigns a dummy location to a device based on its properties
 * @param device - The device object
 * @param index - The index of the device in the list (for consistent assignment)
 * @returns A location string
 */
export function assignDummyLocation(device: any, index: number = 0): string {
  // Use existing location if available
  if (device.location && device.location !== "unmapped") {
    return device.location;
  }

  // Use address or city if available
  if (device.address) {
    return device.address;
  }
  
  if (device.city) {
    return device.city;
  }

  // Assign based on device properties or index for consistency
  const locations = [...DUMMY_LOCATIONS];
  
  // If device has a name, use it to determine location
  if (device.name) {
    const name = device.name.toLowerCase();
    
    // Office devices
    if (name.includes('office') || name.includes('admin')) {
      return LOCATION_CATEGORIES.offices[index % LOCATION_CATEGORIES.offices.length];
    }
    
    // Warehouse devices
    if (name.includes('warehouse') || name.includes('storage')) {
      return LOCATION_CATEGORIES.warehouses[index % LOCATION_CATEGORIES.warehouses.length];
    }
    
    // Retail devices
    if (name.includes('retail') || name.includes('store') || name.includes('shop')) {
      return LOCATION_CATEGORIES.retail[index % LOCATION_CATEGORIES.retail.length];
    }
    
    // Service devices
    if (name.includes('service') || name.includes('repair') || name.includes('maintenance')) {
      return LOCATION_CATEGORIES.service[index % LOCATION_CATEGORIES.service.length];
    }
  }

  // Default assignment based on index for consistency
  return locations[index % locations.length];
}

/**
 * Adds dummy location data to a list of devices
 * @param devices - Array of devices
 * @returns Array of devices with dummy location data
 */
export function addDummyLocationData(devices: any[]): any[] {
  return devices.map((device, index) => ({
    ...device,
    location: assignDummyLocation(device, index),
    // Add additional location-related fields for consistency
    address: device.address || assignDummyLocation(device, index),
    city: device.city || assignDummyLocation(device, index),
  }));
}

/**
 * Gets all unique locations from a list of devices
 * @param devices - Array of devices
 * @returns Array of unique location names
 */
export function getUniqueLocations(devices: any[]): string[] {
  const locations = devices.map(device => device.location).filter(Boolean);
  return [...new Set(locations)];
}
