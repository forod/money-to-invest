import { createContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

export type GastoItem = {
  id: string;
  label: string;
  desc: string;
  value: string;
};

export type Gastos = GastoItem[];

export type Moneda = {
  code: string;
  symbol: string;
  name: string;
};

export const MONEDAS: Moneda[] = [
  { code: 'PEN', symbol: 'S/', name: 'PEN (Soles)' },
  { code: 'USD', symbol: '$', name: 'USD (Dólares)' },
  { code: 'EUR', symbol: '€', name: 'EUR (Euros)' },
];

export type GastosContextType = {
  gastos: Gastos;
  setGastos: Dispatch<SetStateAction<Gastos>>;
  moneda: Moneda;
  setMoneda: Dispatch<SetStateAction<Moneda>>;
};

export const GastosContext = createContext<GastosContextType | undefined>(undefined);

const GASTOS_DEFAULT: Gastos = [];

export function GastosProvider({ children }: { children: ReactNode }) {
  const [gastos, setGastos] = useState<Gastos>(GASTOS_DEFAULT);
  const [moneda, setMoneda] = useState<Moneda>(MONEDAS[0]);

  return (
    <GastosContext.Provider value={{ gastos, setGastos, moneda, setMoneda }}>
      {children}
    </GastosContext.Provider>
  );
}
