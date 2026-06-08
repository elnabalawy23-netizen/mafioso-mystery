import { createContext, useContext } from 'react';

export interface AppModeValue {
  goOnline: () => void;
}

export const AppModeContext = createContext<AppModeValue>({ goOnline: () => {} });
export const useAppMode = () => useContext(AppModeContext);
