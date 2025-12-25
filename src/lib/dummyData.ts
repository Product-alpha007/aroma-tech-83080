/**
 * Dummy data utilities for development
 * Provides mock location data for devices when location API is not available
 */

import { Device, DeviceGroupWithDevices } from './api';

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

// Mock devices for testing when API is unavailable
export const MOCK_DEVICES: Device[] = [
  {
    id: '1',
    name: 'Lobby Diffuser',
    sn: 'AT-001-2024',
    status: 'ONLINE',
    oilName: 'Lavender Essential Oil',
    location: 'Main Office',
    address: 'Main Office Lobby',
    city: 'New Delhi',
    remainInfoCurrent: 75,
    remainInfoTotal: 100,
  },
  {
    id: '2',
    name: 'Conference Room A',
    sn: 'AT-002-2024',
    status: 'ONLINE',
    oilName: 'Eucalyptus Blend',
    location: 'Main Office',
    address: 'Conference Room A',
    city: 'New Delhi',
    remainInfoCurrent: 50,
    remainInfoTotal: 100,
  },
  {
    id: '3',
    name: 'Reception Area',
    sn: 'AT-003-2024',
    status: 'OFFLINE',
    oilName: 'Citrus Fresh',
    location: 'Branch Office',
    address: 'Reception',
    city: 'Mumbai',
    remainInfoCurrent: 25,
    remainInfoTotal: 100,
  },
  {
    id: '4',
    name: 'Warehouse Entry',
    sn: 'AT-004-2024',
    status: 'ONLINE',
    oilName: 'Peppermint',
    location: 'Warehouse A',
    address: 'Main Entry',
    city: 'New Delhi',
    remainInfoCurrent: 90,
    remainInfoTotal: 100,
  },
  {
    id: '5',
    name: 'Retail Display',
    sn: 'AT-005-2024',
    status: 'ONLINE',
    oilName: 'Vanilla Dream',
    location: 'Retail Store 1',
    address: 'Display Area',
    city: 'Bangalore',
    remainInfoCurrent: 60,
    remainInfoTotal: 100,
  },
  {
    id: '6',
    name: 'Showroom Floor',
    sn: 'AT-006-2024',
    status: 'OFFLINE',
    oilName: 'Ocean Breeze',
    location: 'Showroom',
    address: 'Main Floor',
    city: 'Chennai',
    remainInfoCurrent: 10,
    remainInfoTotal: 100,
  },
];

// Mock device groups for testing
export const MOCK_DEVICE_GROUPS: DeviceGroupWithDevices[] = [
  {
    id: 'g1',
    name: 'Main Office Devices',
    type: 'main',
    device_count: 2,
    devices: MOCK_DEVICES.filter(d => d.location === 'Main Office'),
  },
  {
    id: 'g2',
    name: 'Warehouse Devices',
    type: 'main',
    device_count: 1,
    devices: MOCK_DEVICES.filter(d => d.location === 'Warehouse A'),
  },
  {
    id: 'g3',
    name: 'Retail Devices',
    type: 'sub',
    device_count: 1,
    devices: MOCK_DEVICES.filter(d => d.location === 'Retail Store 1'),
  },
];

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
