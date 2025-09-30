import { createContext, useContext, useState, ReactNode } from "react";

interface LocationContextType {
  locations: string[];
  addLocation: (name: string) => void;
  updateLocation: (oldName: string, newName: string) => void;
  removeLocation: (name: string) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const initialLocations = ["Location A", "Location B"];

export function LocationProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<string[]>(initialLocations);

  const addLocation = (name: string) => {
    if (!locations.includes(name) && name !== "unmapped") {
      setLocations(prev => [...prev, name]);
    }
  };

  const updateLocation = (oldName: string, newName: string) => {
    setLocations(prev => prev.map(loc => loc === oldName ? newName : loc));
  };

  const removeLocation = (name: string) => {
    setLocations(prev => prev.filter(loc => loc !== name));
  };

  return (
    <LocationContext.Provider value={{
      locations,
      addLocation,
      updateLocation,
      removeLocation
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocations() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocations must be used within a LocationProvider');
  }
  return context;
}
