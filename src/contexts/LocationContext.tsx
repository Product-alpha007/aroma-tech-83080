import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useDeviceGroupsAll } from "@/hooks/useDeviceGroupsAll";
import { DeviceGroupWithDevices } from "@/lib/api";

interface LocationContextType {
  locations: string[];
  deviceGroupsWithDevices: DeviceGroupWithDevices[];
  isLoading: boolean;
  addLocation: (name: string) => void;
  updateLocation: (oldName: string, newName: string) => void;
  removeLocation: (name: string) => void;
  getDevicesByLocation: (location: string) => string[];
  getDevicesByLocationWithDetails: (location: string) => DeviceGroupWithDevices | undefined;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [customLocations, setCustomLocations] = useState<string[]>([]);
  const { data: deviceGroupsAll, isLoading } = useDeviceGroupsAll();
  
  console.log('🏗️ LocationProvider initialized', { 
    deviceGroupsAll, 
    isLoading 
  });

  // Extract location names from device groups using new API only
  const groupsWithDevices = deviceGroupsAll?.groups || [];
  const groupLocations = groupsWithDevices.map(group => group.name);
  
  // Combine group locations with custom locations and add "Unmapped"
  const allLocations = [...new Set([...groupLocations, ...customLocations, "Unmapped"])];

  // Load custom locations from localStorage on mount
  useEffect(() => {
    const savedLocations = localStorage.getItem('customLocations');
    if (savedLocations) {
      try {
        const parsed = JSON.parse(savedLocations);
        setCustomLocations(parsed);
      } catch (error) {
        console.error('Failed to parse saved locations:', error);
      }
    }
  }, []);

  // Save custom locations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('customLocations', JSON.stringify(customLocations));
  }, [customLocations]);

  const addLocation = (name: string) => {
    if (!allLocations.includes(name) && name !== "unmapped") {
      setCustomLocations(prev => [...prev, name]);
    }
  };

  const updateLocation = (oldName: string, newName: string) => {
    setCustomLocations(prev => prev.map(loc => loc === oldName ? newName : loc));
  };

  const removeLocation = (name: string) => {
    setCustomLocations(prev => prev.filter(loc => loc !== name));
    
    // Clean up device mappings that were pointing to this deleted location
    const savedOverrides = localStorage.getItem('deviceLocationOverrides');
    if (savedOverrides) {
      try {
        const overrides = JSON.parse(savedOverrides);
        const cleanedOverrides = Object.fromEntries(
          Object.entries(overrides).filter(([_, location]) => location !== name)
        );
        localStorage.setItem('deviceLocationOverrides', JSON.stringify(cleanedOverrides));
      } catch (error) {
        console.error('Failed to clean up device mappings:', error);
      }
    }
  };

  const getDevicesByLocation = (location: string): string[] => {
    if (location === "Unmapped") {
      // This will be handled by the device context
      return [];
    }
    
    // Use new comprehensive API only
    const group = groupsWithDevices.find(group => group.name === location);
    return group ? group.devices?.map(d => d.id) || [] : [];
  };

  const getDevicesByLocationWithDetails = (location: string): DeviceGroupWithDevices | undefined => {
    if (location === "Unmapped") {
      return undefined;
    }
    
    return groupsWithDevices.find(group => group.name === location);
  };

  return (
    <LocationContext.Provider value={{
      locations: allLocations,
      deviceGroupsWithDevices: groupsWithDevices,
      isLoading,
      addLocation,
      updateLocation,
      removeLocation,
      getDevicesByLocation,
      getDevicesByLocationWithDetails,
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocations() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    console.error('useLocations called outside of LocationProvider');
    // Return a fallback context to prevent crashes during hot reload
    return {
      locations: ["Unmapped"],
      deviceGroupsWithDevices: [],
      isLoading: false,
      addLocation: () => {},
      updateLocation: () => {},
      removeLocation: () => {},
      getDevicesByLocation: () => [],
      getDevicesByLocationWithDetails: () => undefined,
    };
  }
  return context;
}
