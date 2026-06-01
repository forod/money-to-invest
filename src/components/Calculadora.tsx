import React, { useState, useContext, useMemo } from 'react';
import { GastosContext, MONEDAS } from '../context/GastosContext';
import { Info, Camera } from 'lucide-react';
import html2canvas from 'html2canvas';

type Props = {
  onNavigateToGastos: () => void;
};

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
  const [percentEtfs, setPercentEtfs] = useState(60);
  const [percentAcciones, setPercentAcciones] = useState(25);
  const [percentCripto, setPercentCripto] = useState(15);

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

  const etfs = montoInvertir * (percentEtfs / 100);
  const acciones = montoInvertir * (percentAcciones / 100);
  const cripto = montoInvertir * (percentCripto / 100);

  // Linked sliders logic: updates other sliders proportionally when one is adjusted
  const handlePercentChange = (asset: 'etfs' | 'acciones' | 'cripto', newValue: number) => {
    const current = { etfs: percentEtfs, acciones: percentAcciones, cripto: percentCripto };
    const otherAssets = (['etfs', 'acciones', 'cripto'] as const).filter(a => a !== asset);
    const other1 = otherAssets[0];
    const other2 = otherAssets[1];

    const valOther1 = current[other1];
    const valOther2 = current[other2];
    const sumOthers = valOther1 + valOther2;

    const remaining = 100 - newValue;

    let newValOther1, newValOther2;

    if (sumOthers === 0) {
      newValOther1 = Math.floor(remaining / 2);
      newValOther2 = remaining - newValOther1;
    } else {
      newValOther1 = Math.round((valOther1 / sumOthers) * remaining);
      newValOther2 = remaining - newValOther1;
    }

    if (asset === 'etfs') {
      setPercentEtfs(newValue);
      setPercentAcciones(newValOther1);
      setPercentCripto(newValOther2);
    } else if (asset === 'acciones') {
      setPercentAcciones(newValue);
      setPercentEtfs(newValOther1);
      setPercentCripto(newValOther2);
    } else if (asset === 'cripto') {
      setPercentCripto(newValue);
      setPercentEtfs(newValOther1);
      setPercentAcciones(newValOther2);
    }
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

            {/* ETF's */}
            <div style={{ 
              height: '76px', 
              backgroundColor: 'var(--color-etfs-bg)', 
              borderRadius: '16px', 
              overflow: 'hidden', 
              marginBottom: '16px',
              position: 'relative',
              border: '1px solid rgba(249, 115, 22, 0.1)'
            }}>
              <div style={{ 
                backgroundColor: 'var(--color-etfs)', 
                width: `${percentEtfs}%`, 
                height: '100%', 
                position: 'absolute', 
                left: 0, 
                top: 0,
                opacity: 0.85,
                transition: 'width 0.3s ease-out'
              }} />
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%', padding: '0 20px' }}>
                <div>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', display: 'block', fontFamily: 'var(--font-title)' }}>ETF's</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>{percentEtfs}%</span>
                </div>
                <span className="font-outfit" style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>
                  {moneda.symbol} {formatWithCommas(etfs.toFixed(0))}
                </span>
              </div>
              <input
                id="slider-etfs"
                type="range"
                min="0"
                max="100"
                value={percentEtfs}
                onChange={(e) => handlePercentChange('etfs', parseInt(e.target.value))}
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
            </div>

            {/* Acciones */}
            <div style={{ 
              height: '76px', 
              backgroundColor: 'var(--color-acciones-bg)', 
              borderRadius: '16px', 
              overflow: 'hidden', 
              marginBottom: '16px',
              position: 'relative',
              border: '1px solid rgba(37, 99, 235, 0.1)'
            }}>
              <div style={{ 
                backgroundColor: 'var(--color-acciones)', 
                width: `${percentAcciones}%`, 
                height: '100%', 
                position: 'absolute', 
                left: 0, 
                top: 0,
                opacity: 0.85,
                transition: 'width 0.3s ease-out'
              }} />
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%', padding: '0 20px' }}>
                <div>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', display: 'block', fontFamily: 'var(--font-title)' }}>Acciones</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>{percentAcciones}%</span>
                </div>
                <span className="font-outfit" style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>
                  {moneda.symbol} {formatWithCommas(acciones.toFixed(0))}
                </span>
              </div>
              <input
                id="slider-acciones"
                type="range"
                min="0"
                max="100"
                value={percentAcciones}
                onChange={(e) => handlePercentChange('acciones', parseInt(e.target.value))}
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
            </div>

            {/* Cripto */}
            <div style={{ 
              height: '76px', 
              backgroundColor: 'var(--color-cripto-bg)', 
              borderRadius: '16px', 
              overflow: 'hidden', 
              marginBottom: '20px',
              position: 'relative',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ 
                backgroundColor: 'var(--color-cripto)', 
                width: `${percentCripto}%`, 
                height: '100%', 
                position: 'absolute', 
                left: 0, 
                top: 0,
                opacity: 0.25,
                transition: 'width 0.3s ease-out'
              }} />
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%', padding: '0 20px' }}>
                <div>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', display: 'block', fontFamily: 'var(--font-title)' }}>Cripto</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>{percentCripto}%</span>
                </div>
                <span className="font-outfit" style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>
                  {moneda.symbol} {formatWithCommas(cripto.toFixed(0))}
                </span>
              </div>
              <input
                id="slider-cripto"
                type="range"
                min="0"
                max="100"
                value={percentCripto}
                onChange={(e) => handlePercentChange('cripto', parseInt(e.target.value))}
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
            </div>

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

      </div>
      </div>
    </div>
  );
}
