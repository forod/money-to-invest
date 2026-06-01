import { createContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

export type GastoItem = {
  id: string;
  label: string;
  desc: string;
  value: string;
};

export type Gastos = GastoItem[];

export type GastosContextType = {
  gastos: Gastos;
  setGastos: Dispatch<SetStateAction<Gastos>>;
};

export const GastosContext = createContext<GastosContextType | undefined>(undefined);

const GASTOS_DEFAULT: Gastos = [];

export function GastosProvider({ children }: { children: ReactNode }) {
  const [gastos, setGastos] = useState<Gastos>(GASTOS_DEFAULT);

  return (
    <GastosContext.Provider value={{ gastos, setGastos }}>
      {children}
    </GastosContext.Provider>
  );
}
