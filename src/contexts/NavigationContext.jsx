import { createContext, useContext } from 'react';

const NavigationContext = createContext({ navigate: () => {}, dismissAlert: () => {}, clearAllAlerts: () => {} });

export function NavigationProvider({ navigate, dismissAlert, clearAllAlerts, children }) {
  return (
    <NavigationContext.Provider value={{ navigate, dismissAlert, clearAllAlerts }}>
      {children}
    </NavigationContext.Provider>
  );
}

export const useNavigation = () => useContext(NavigationContext);
