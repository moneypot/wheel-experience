import { makeAutoObservable } from "mobx";
import { createContext, useContext } from "react";

export class Store {
  loggedIn: LoggedIn | null = null;

  constructor() {
    makeAutoObservable(this);
  }
}

interface LoggedIn {
  // Session info
  sessionId: string;
  experienceId: string;
  userId: string;
  uname: string;

  // Utility
  selectedCurrencyKey: null | string;

  // Currency info
  balances: {
    amount: number;
    currencyKey: string;
    displayUnitName: string;
    displayUnitScale: number;
  }[];
}

const StoreContext = createContext<Store | null>(null);

export const StoreProvider = ({
  store,
  children,
}: {
  store: Store;
  children: React.ReactNode;
}) => {
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
};

export const useStore = () => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error("useStore must be used within StoreProvider");
  }
  return store;
};
