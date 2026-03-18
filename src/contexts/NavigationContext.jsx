import { createContext, useContext } from 'react';

const NavigationContext = createContext({ navigate: () => {} });

export function NavigationProvider({ navigate, children }) {
  return (
    <NavigationContext.Provider value={{ navigate }}>
      {children}
    </NavigationContext.Provider>
  );
}

export const useNavigation = () => useContext(NavigationContext);
