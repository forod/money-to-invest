import React, { useState, useContext, useMemo } from 'react';
import { GastosContext, MONEDAS } from '../context/GastosContext';
import { Info, Camera, Plus, Trash2 } from 'lucide-react';
import html2canvas from 'html2canvas';

type Props = {
  onNavigateToGastos: () => void;
};

interface PortfolioItem {
  id: string;
  label: string;
  percentage: number;
  color: string;
  bg: string;
  border: string;
}

const DEFAULT_PORTFOLIO: PortfolioItem[] = [
  { id: 'etfs', label: "ETF's", percentage: 60, color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.1)' },
  { id: 'acciones', label: 'Acciones', percentage: 25, color: '#2563eb', bg: 'rgba(37, 99, 235, 0.15)', border: 'rgba(37, 99, 235, 0.1)' },
  { id: 'cripto', label: 'Cripto', percentage: 15, color: '#ffffff', bg: 'rgba(255, 255, 255, 0.1)', border: 'rgba(255, 255, 255, 0.05)' },
];

const PORTFOLIO_COLORS = [
  { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.1)' }, // Yellow/Gold
  { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.1)' }, // Emerald Green
  { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.1)' }, // Purple
  { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.1)' }, // Cyan
  { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.1)' }, // Pink
  { color: '#84cc16', bg: 'rgba(132, 204, 22, 0.15)', border: 'rgba(132, 204, 22, 0.1)' }, // Lime Green
  { color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.1)' }, // Rose
  { color: '#00ffaa', bg: 'rgba(0, 255, 170, 0.15)', border: 'rgba(0, 255, 170, 0.1)' }, // Mint Green
];

const ProgressRing = ({ radius, stroke, progress, color, backgroundColor = 'rgba(255, 255, 255, 0.05)' }: any) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const safeProgress = Math.min(Math.max(progress, 0), 100);
  const strokeDashoffset = circumference - (safeProgress / 100) * circumference;

  return (
    <div style={{ width: radius * 2, height: radius * 2, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg height={radius * 2} width={radius * 2} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
        <circle
          stroke={backgroundColor}
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-out-in, stroke 0.3s' }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <span style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'var(--font-title)' }}>
        {Math.round(safeProgress)}%
      </span>
    </div>
  );
};

export default function Calculadora({ onNavigateToGastos }: Props) {
  const context = useContext(GastosContext);

  if (!context) {
    return <div style={{ color: 'white', padding: '20px' }}>Error: GastosContext no provisto</div>;
  }

  const { gastos, moneda, setMoneda } = context;
  const [ingresoStr, setIngresoStr] = useState('');
  const [periodo, setPeriodo] = useState<'diario' | 'semanal' | 'mensual'>('mensual');
  const [porcentajeInversion, setPorcentajeInversion] = useState(31);
  const [menuVisible, setMenuVisible] = useState(false);
  const [monedaMenuVisible, setMonedaMenuVisible] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const handleDownloadScreenshot = async () => {
    const element = document.getElementById('resumen-financiero');
    if (!element) return;
    setCapturing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 150));
      const canvas = await html2canvas(element, {
        backgroundColor: '#05080c',
        scale: 2,
        useCORS: true,
        logging: false
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `resumen-inversion-${periodo}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error al generar la captura:', err);
    } finally {
      setCapturing(false);
    }
  };

  // Portfolio allocation state (adds up to 100%)
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(DEFAULT_PORTFOLIO);
  const [nuevoActivoLabel, setNuevoActivoLabel] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  const totalGastosMensuales = useMemo(() => {
    return gastos.reduce((acc, item) => acc + (parseFloat(item.value) || 0), 0);
  }, [gastos]);

  const gastosPorPeriodo = useMemo(() => {
    switch (periodo) {
      case 'diario':
        return totalGastosMensuales / 26;
      case 'semanal':
        return totalGastosMensuales / 4;
      case 'mensual':
      default:
        return totalGastosMensuales;
    }
  }, [totalGastosMensuales, periodo]);

  // OWASP A03:2021 Sanitization and clean value parsing
  const ingreso = useMemo(() => {
    return parseFloat(ingresoStr.replace(/,/g, '')) || 0;
  }, [ingresoStr]);

  const ingresoNeto = ingreso - gastosPorPeriodo;
  const excedente = ingresoNeto > 0 ? ingresoNeto : 0;

  const montoInvertir = excedente * (porcentajeInversion / 100);
  const restante = excedente - montoInvertir;

  // Dynamic portfolio items calculate their amounts inline during rendering.

  // Linked sliders logic: updates other sliders proportionally when one is adjusted (dynamic version)
  const handlePercentChange = (id: string, newPercentage: number) => {
    const newPct = Math.min(100, Math.max(0, newPercentage));

    if (portfolio.length <= 1) {
      setPortfolio(portfolio.map(item => ({ ...item, percentage: 100 })));
      return;
    }

    const otherItems = portfolio.filter(item => item.id !== id);
    const sumOthers = otherItems.reduce((sum, item) => sum + item.percentage, 0);
    const remaining = 100 - newPct;

    let updatedOthers = [];
    if (sumOthers > 0) {
      updatedOthers = otherItems.map(item => {
        const calculated = Math.round((item.percentage / sumOthers) * remaining);
        return { ...item, percentage: calculated };
      });
    } else {
      // Distribute equally
      const countOthers = otherItems.length;
      updatedOthers = otherItems.map((item, idx) => {
        const calculated = Math.floor(remaining / countOthers) + (idx < (remaining % countOthers) ? 1 : 0);
        return { ...item, percentage: calculated };
      });
    }

    // Calculate current total
    const total = newPct + updatedOthers.reduce((sum, item) => sum + item.percentage, 0);
    let diff = 100 - total;

    // Adjust the item to make it exactly 100
    if (diff !== 0 && updatedOthers.length > 0) {
      let largestIdx = 0;
      for (let k = 1; k < updatedOthers.length; k++) {
        if (updatedOthers[k].percentage > updatedOthers[largestIdx].percentage) {
          largestIdx = k;
        }
      }
      if (updatedOthers[largestIdx].percentage + diff >= 0) {
        updatedOthers[largestIdx].percentage += diff;
      } else {
        updatedOthers[0].percentage = Math.max(0, updatedOthers[0].percentage + diff);
      }
    }

    // Force sum safety
    const finalTotal = newPct + updatedOthers.reduce((sum, item) => sum + item.percentage, 0);
    if (finalTotal !== 100) {
      let currentDiff = 100 - finalTotal;
      for (let k = 0; k < updatedOthers.length; k++) {
        if (currentDiff === 0) break;
        if (currentDiff > 0) {
          updatedOthers[k].percentage += 1;
          currentDiff -= 1;
        } else if (currentDiff < 0 && updatedOthers[k].percentage > 0) {
          updatedOthers[k].percentage -= 1;
          currentDiff += 1;
        }
      }
    }

    setPortfolio(portfolio.map(item => {
      if (item.id === id) {
        return { ...item, percentage: newPct };
      }
      const found = updatedOthers.find(o => o.id === item.id);
      return found ? found : item;
    }));
  };

  const handleAmountChange = (id: string, text: string) => {
    // Permitir dígitos y punto decimal
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // OWASP Mitigación: Límite estricto de 9 cifras enteras
    const parts = cleaned.split('.');
    let intPart = parts[0];
    if (intPart.length > 9) {
      intPart = intPart.slice(0, 9);
    }
    const decPart = parts.length > 1 ? '.' + parts[1].slice(0, 2) : '';
    const finalCleaned = intPart + decPart;

    setEditingValue(finalCleaned);

    const val = parseFloat(finalCleaned) || 0;

    if (montoInvertir > 0) {
      const newPct = Math.min(100, Math.max(0, Math.round((val / montoInvertir) * 100)));
      handlePercentChange(id, newPct);
    }
  };

  const handleAgregarActivo = () => {
    const label = nuevoActivoLabel.trim();
    if (!label) return;
    if (portfolio.length >= 10) return;

    // Pick color
    const colorIndex = Math.max(0, portfolio.length - 3);
    const colorObj = PORTFOLIO_COLORS[colorIndex % PORTFOLIO_COLORS.length];

    const nuevoItem: PortfolioItem = {
      id: `activo-${Date.now()}`,
      label: label,
      percentage: 0,
      color: colorObj.color,
      bg: colorObj.bg,
      border: colorObj.border
    };

    setPortfolio([...portfolio, nuevoItem]);
    setNuevoActivoLabel('');
  };

  const handleEliminarActivo = (id: string) => {
    if (portfolio.length <= 1) return;

    const itemToDelete = portfolio.find(item => item.id === id);
    if (!itemToDelete) return;

    const remainingItems = portfolio.filter(item => item.id !== id);
    const sumRemaining = remainingItems.reduce((sum, item) => sum + item.percentage, 0);

    let updatedRemaining = [];
    if (sumRemaining > 0) {
      updatedRemaining = remainingItems.map(item => {
        const calculated = Math.round((item.percentage / sumRemaining) * 100);
        return { ...item, percentage: calculated };
      });
    } else {
      const countRemaining = remainingItems.length;
      updatedRemaining = remainingItems.map((item, idx) => {
        const calculated = Math.floor(100 / countRemaining) + (idx < (100 % countRemaining) ? 1 : 0);
        return { ...item, percentage: calculated };
      });
    }

    // Adjust sum to exactly 100
    const total = updatedRemaining.reduce((sum, item) => sum + item.percentage, 0);
    let diff = 100 - total;

    if (diff !== 0 && updatedRemaining.length > 0) {
      let largestIdx = 0;
      for (let k = 1; k < updatedRemaining.length; k++) {
        if (updatedRemaining[k].percentage > updatedRemaining[largestIdx].percentage) {
          largestIdx = k;
        }
      }
      updatedRemaining[largestIdx].percentage += diff;
    }

    // Force sum safety
    const finalTotal = updatedRemaining.reduce((sum, item) => sum + item.percentage, 0);
    if (finalTotal !== 100) {
      let currentDiff = 100 - finalTotal;
      for (let k = 0; k < updatedRemaining.length; k++) {
        if (currentDiff === 0) break;
        if (currentDiff > 0) {
          updatedRemaining[k].percentage += 1;
          currentDiff -= 1;
        } else if (currentDiff < 0 && updatedRemaining[k].percentage > 0) {
          updatedRemaining[k].percentage -= 1;
          currentDiff += 1;
        }
      }
    }

    setPortfolio(updatedRemaining);
  };

  // OWASP A03:2021 Sanitization and length restriction to 9 digits (9 integers max)
  const handleIngresoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    
    // Allow only numbers and a single optional decimal dot
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');

    if (parts.length > 2) return; // Ignore second decimal dot

    let intPart = parts[0];

    // OWASP Mitigación: Límite estricto de 9 cifras enteras
    if (intPart.length > 9) {
      intPart = intPart.slice(0, 9);
    }

    const decPart = parts.length > 1 ? '.' + parts[1].slice(0, 2) : '';

    // Format with thousands separator commas
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    setIngresoStr(formattedInt + decPart);
  };

  const formatWithCommas = (num: number | string) => {
    if (num === undefined || num === null) return '';
    const parts = num.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const percentGastos = ingreso > 0 ? (gastosPorPeriodo / ingreso) * 100 : 0;
  const percentExcedente = ingreso > 0 ? (excedente / ingreso) * 100 : 0;

  return (
    <div className="animate-fade-in">
      {/* Botón de Captura (fuera de la zona de captura) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button
          id="btn-descargar-captura"
          className="btn-secondary"
          onClick={handleDownloadScreenshot}
          disabled={capturing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            borderColor: 'var(--accent-green)',
            color: 'var(--accent-green)',
            background: 'rgba(0, 255, 170, 0.03)',
            cursor: 'pointer'
          }}
        >
          <Camera size={15} />
          {capturing ? 'Generando captura...' : 'Descargar Captura'}
        </button>
      </div>

      {/* Zona de Captura */}
      <div id="resumen-financiero" style={{ padding: '16px', background: 'var(--bg-color)', borderRadius: '24px' }}>
        {/* Header de la captura */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '20px', color: 'var(--accent-green)', fontWeight: '800', letterSpacing: '1px', margin: 0 }}>
              MONEY TO INVEST
            </h2>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Resumen de Inversión y Gastos</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Info size={12} /> Modo Invitado
          </span>
        </div>

        <div className="dashboard-grid">
        
        {/* COLUMNA IZQUIERDA: Entradas, Gastos y Margen de Inversión */}
        <div>
          {/* Ingreso Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Ingresa un monto
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {/* Selector de Moneda */}
                <div style={{ position: 'relative' }}>
                  <button 
                    id="btn-moneda"
                    className="btn-secondary" 
                    onClick={() => { setMonedaMenuVisible(!monedaMenuVisible); setMenuVisible(false); }}
                    style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {moneda.code}
                    <span style={{ fontSize: '8px' }}>▼</span>
                  </button>
                  {monedaMenuVisible && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '32px', 
                      right: 0, 
                      backgroundColor: '#0d141e', 
                      borderRadius: '12px', 
                      padding: '6px', 
                      zIndex: 100, 
                      border: '1px solid var(--card-border)', 
                      width: '130px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                    }}>
                      {MONEDAS.map((m) => (
                        <button
                          key={m.code}
                          id={`btn-moneda-${m.code}`}
                          onClick={() => { setMoneda(m); setMonedaMenuVisible(false); }}
                          style={{ 
                            width: '100%', 
                            background: 'transparent', 
                            border: 'none', 
                            color: moneda.code === m.code ? 'var(--accent-green)' : 'var(--text-primary)', 
                            padding: '8px', 
                            textAlign: 'left', 
                            cursor: 'pointer',
                            fontSize: '13px',
                            borderRadius: '6px',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selector de Periodo */}
                <div style={{ position: 'relative' }}>
                  <button 
                    id="btn-periodo"
                    className="btn-secondary" 
                    onClick={() => { setMenuVisible(!menuVisible); setMonedaMenuVisible(false); }}
                    style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {periodo.charAt(0).toUpperCase() + periodo.slice(1)}
                    <span style={{ fontSize: '8px' }}>▼</span>
                  </button>
                  {menuVisible && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '32px', 
                      right: 0, 
                      backgroundColor: '#0d141e', 
                      borderRadius: '12px', 
                      padding: '6px', 
                      zIndex: 100, 
                      border: '1px solid var(--card-border)', 
                      width: '110px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                    }}>
                      {['diario', 'semanal', 'mensual'].map((p) => (
                        <button
                          key={p}
                          id={`btn-periodo-${p}`}
                          onClick={() => { setPeriodo(p as any); setMenuVisible(false); }}
                          style={{ 
                            width: '100%', 
                            background: 'transparent', 
                            border: 'none', 
                            color: periodo === p ? 'var(--accent-green)' : 'var(--text-primary)', 
                            padding: '8px', 
                            textAlign: 'left', 
                            cursor: 'pointer',
                            fontSize: '13px',
                            borderRadius: '6px',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '10px' }}>
              <span style={{ fontSize: '32px', fontWeight: '300', color: 'var(--text-secondary)', marginRight: '8px', fontFamily: 'var(--font-title)' }}>{moneda.symbol}</span>
              {capturing ? (
                <div style={{ 
                  color: '#ffffff',
                  fontSize: ingresoStr.length > 8 ? '36px' : '48px',
                  fontWeight: '800',
                  fontFamily: 'var(--font-title)',
                  lineHeight: '1.2',
                  minHeight: '58px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {ingresoStr || '0'}
                </div>
              ) : (
                <input
                  id="input-ingresos"
                  className="font-outfit"
                  type="text"
                  value={ingresoStr}
                  onChange={handleIngresoChange}
                  placeholder="0"
                  maxLength={15} // Sufficient to fit 9 digits + commas + 2 decimals (9+2+2 = 13 total)
                  style={{ 
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: ingresoStr.length > 8 ? '36px' : '48px',
                    fontWeight: '800',
                    outline: 'none',
                    width: '100%',
                    padding: 0
                  }}
                />
              )}
            </div>
          </div>

          {/* Gastos Fijos y Excedentes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {/* Gastos Fijos (Clickable) */}
            <div className="card" onClick={onNavigateToGastos} style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: 0, padding: '16px', cursor: 'pointer' }}>
              <ProgressRing radius={26} stroke={4.5} progress={percentGastos} color="var(--accent-blue)" />
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Gastos Fijos</span>
                <span style={{ fontSize: '16px', fontWeight: '700', display: 'block', marginTop: '2px', fontFamily: 'var(--font-title)' }}>
                  {moneda.symbol} {formatWithCommas(gastosPorPeriodo.toFixed(0))}
                </span>
              </div>
            </div>

            {/* Excedente */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: 0, padding: '16px' }}>
              <ProgressRing radius={26} stroke={4.5} progress={percentExcedente} color="var(--accent-green)" />
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Excedente</span>
                <span style={{ fontSize: '16px', fontWeight: '700', display: 'block', marginTop: '2px', color: 'var(--accent-green)', fontFamily: 'var(--font-title)' }}>
                  {moneda.symbol} {formatWithCommas(excedente.toFixed(0))}
                </span>
              </div>
            </div>
          </div>

          {/* Porcentaje de inversión */}
          <div className="card" style={{ 
            background: 'linear-gradient(135deg, #ffffff 0%, #00ffaa 100%)', 
            color: '#05080c',
            border: 'none',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#05080c', letterSpacing: '-0.01em' }}>
                ¿Cuánto invertirás?
              </span>
              <span className="font-outfit" style={{ 
                background: '#05080c', 
                color: '#ffffff', 
                borderRadius: '30px', 
                padding: '4px 12px', 
                fontSize: '14px', 
                fontWeight: '700' 
              }}>
                {porcentajeInversion}%
              </span>
            </div>
            
            <h3 className="font-outfit" style={{ fontSize: '38px', fontWeight: '800', lineHeight: '1', color: '#05080c', margin: '10px 0 20px 0' }}>
              {moneda.symbol} {formatWithCommas(montoInvertir.toFixed(2))}
            </h3>
            
            {capturing ? (
              <div style={{ 
                width: '100%', 
                height: '6px', 
                background: 'rgba(5, 8, 12, 0.15)', 
                borderRadius: '3px',
                position: 'relative',
                margin: '22px 0 24px 0'
              }}>
                <div style={{
                  width: `${(porcentajeInversion - 10) / (75 - 10) * 100}%`,
                  height: '100%',
                  background: '#05080c',
                  borderRadius: '3px'
                }} />
                <div style={{
                  position: 'absolute',
                  left: `calc(${(porcentajeInversion - 10) / (75 - 10) * 100}% - 10px)`,
                  top: '-7px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#05080c',
                  boxShadow: '0 0 10px rgba(0,0,0,0.3)'
                }} />
              </div>
            ) : (
              <input 
                id="slider-porcentaje-inversion"
                type="range" 
                min="10" 
                max="75" 
                value={porcentajeInversion}
                onChange={(e) => setPorcentajeInversion(parseInt(e.target.value))}
                style={{ 
                  background: 'rgba(5, 8, 12, 0.15)',
                  width: '100%'
                }}
              />
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(5, 8, 12, 0.6)', marginTop: '8px', fontWeight: '600' }}>
              <span>Min (10%)</span>
              <span>Max (75%)</span>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Distribución de Portafolio y Restante */}
        <div>
          <div className="card">
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: '20px' }}>
              Distribución del Portafolio
            </span>

            {portfolio.map((item) => {
              const itemMonto = montoInvertir * (item.percentage / 100);
              const isEditing = editingItemId === item.id;
              const displayValue = isEditing ? editingValue : formatWithCommas(itemMonto.toFixed(0));

              return (
                <div 
                  key={item.id}
                  style={{ 
                    height: '76px', 
                    backgroundColor: item.bg, 
                    borderRadius: '16px', 
                    overflow: 'hidden', 
                    marginBottom: '16px',
                    position: 'relative',
                    border: `1px solid ${item.border}`
                  }}
                >
                  <div style={{ 
                    backgroundColor: item.color, 
                    width: `${item.percentage}%`, 
                    height: '100%', 
                    position: 'absolute', 
                    left: 0, 
                    top: 0,
                    opacity: item.id === 'cripto' ? 0.25 : 0.85,
                    transition: 'width 0.3s ease-out'
                  }} />
                  <div style={{ 
                    position: 'relative', 
                    zIndex: 4, 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    height: '100%', 
                    padding: '0 16px' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {!capturing && portfolio.length > 1 && (
                        <button
                          onClick={() => handleEliminarActivo(item.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(255, 255, 255, 0.4)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-red)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'}
                          title="Eliminar activo"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      <div>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', display: 'block', fontFamily: 'var(--font-title)' }}>
                          {item.label}
                        </span>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>
                          {item.percentage}%
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', fontFamily: 'var(--font-title)' }}>
                        {moneda.symbol}
                      </span>
                      {capturing ? (
                        <span className="font-outfit" style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>
                          {displayValue}
                        </span>
                      ) : (
                        <input
                          type="text"
                          value={displayValue}
                          onChange={(e) => handleAmountChange(item.id, e.target.value)}
                          onFocus={() => {
                            setEditingItemId(item.id);
                            setEditingValue(itemMonto > 0 ? itemMonto.toFixed(0) : '');
                          }}
                          onBlur={() => {
                            setEditingItemId(null);
                            setEditingValue('');
                          }}
                          disabled={montoInvertir === 0}
                          placeholder="0"
                          maxLength={12}
                          style={{
                            background: 'rgba(0, 0, 0, 0.25)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: '#ffffff',
                            fontSize: '18px',
                            fontWeight: '800',
                            fontFamily: 'var(--font-title)',
                            width: '100px',
                            textAlign: 'right',
                            padding: '4px 8px',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                          }}
                          onFocusCapture={(e) => e.target.style.borderColor = 'var(--accent-green)'}
                          onBlurCapture={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                        />
                      )}
                    </div>
                  </div>
                  {!capturing && (
                    <input
                      id={`slider-${item.id}`}
                      type="range"
                      min="0"
                      max="100"
                      value={item.percentage}
                      onChange={(e) => handlePercentChange(item.id, parseInt(e.target.value))}
                      style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%', 
                        opacity: 0, 
                        cursor: 'ew-resize',
                        zIndex: 3
                      }}
                    />
                  )}
                </div>
              );
            })}

            {/* Agregar nuevo activo */}
            {!capturing && portfolio.length < 10 && (
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                marginTop: '20px', 
                padding: '12px', 
                borderRadius: '12px', 
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.04)' 
              }}>
                <input
                  type="text"
                  placeholder="Ej: Oro, Bienes Raíces..."
                  value={nuevoActivoLabel}
                  onChange={(e) => setNuevoActivoLabel(e.target.value)}
                  maxLength={25}
                  style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '13px',
                    padding: '8px 12px',
                    flex: 1,
                    outline: 'none'
                  }}
                />
                <button
                  onClick={handleAgregarActivo}
                  className="btn-secondary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(0, 255, 170, 0.1)',
                    borderColor: 'rgba(0, 255, 170, 0.2)',
                    color: 'var(--accent-green)'
                  }}
                >
                  <Plus size={14} />
                  Agregar
                </button>
              </div>
            )}

            {/* Bloque Restante */}
            <div style={{ 
              border: '1px dashed var(--accent-green)', 
              borderRadius: '16px', 
              padding: '16px', 
              textAlign: 'center', 
              backgroundColor: 'rgba(0, 255, 170, 0.02)' 
            }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Disfruta de tus <strong style={{ color: 'var(--accent-green)', fontWeight: '700', fontFamily: 'var(--font-title)', fontSize: '15px' }}>{moneda.symbol} {formatWithCommas(restante.toFixed(2))}</strong> restantes
              </span>
            </div>
          </div>
        </div>

        {/* Desglose de Gastos Fijos (Visible en la captura y en la interfaz) */}
        {gastos.length > 0 && (
          <div className="card full-width-col" style={{ marginTop: '20px', padding: '24px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: '16px' }}>
              Detalle de Gastos ({periodo === 'mensual' ? 'Mensuales' : periodo === 'semanal' ? 'Semanales' : 'Diarios'})
            </span>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
              gap: '16px 24px' 
            }}>
              {gastos.map((item) => {
                const itemVal = parseFloat(item.value) || 0;
                if (itemVal === 0) return null;
                
                let valueForPeriod = itemVal;
                if (periodo === 'diario') {
                  valueForPeriod = itemVal / 26;
                } else if (periodo === 'semanal') {
                  valueForPeriod = itemVal / 4;
                }
                
                return (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>{item.label}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{item.desc}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-blue)', fontFamily: 'var(--font-title)' }}>
                      {moneda.symbol} {formatWithCommas(valueForPeriod.toFixed(0))}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
      </div>
    </div>
  );
}
