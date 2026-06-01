import { createContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';

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

const GASTOS_DEFAULT: Gastos = [
  { id: 'combustible', label: 'Combustible', desc: '100km/día x 26 días', value: '0' },
  { id: 'mantenimiento', label: 'Mantenimiento', desc: 'Cambio de aceite y ajustes', value: '0' },
  { id: 'repuestos', label: 'Fondo de Repuestos', desc: 'Frenos, llantas, etc.', value: '0' },
  { id: 'alimentacion', label: 'Alimentación', desc: 'Menú diario (S/ 12 x 26 días)', value: '0' },
  { id: 'estacionamiento', label: 'Estacionamiento', desc: 'Pago mensual fijo', value: '0' },
  { id: 'planDatos', label: 'Plan de Datos', desc: 'Recarga/Recibo mensual', value: '0' },
  { id: 'contador', label: 'Contador', desc: 'Servicios contables', value: '0' },
  { id: 'impuestos', label: 'Impuestos', desc: 'Declaración mensual', value: '0' },
];

const LOCAL_STORAGE_KEY = 'money_to_invest_gastos';

export function GastosProvider({ children }: { children: ReactNode }) {
  const [gastos, setGastos] = useState<Gastos>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error al leer de localStorage:', e);
    }
    return GASTOS_DEFAULT;
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gastos));
    } catch (e) {
      console.error('Error al guardar en localStorage:', e);
    }
  }, [gastos]);

  return (
    <GastosContext.Provider value={{ gastos, setGastos }}>
      {children}
    </GastosContext.Provider>
  );
}
