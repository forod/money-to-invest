import { useContext, useState } from 'react';
import { GastosContext, GastoItem } from '../context/GastosContext';
import { Trash2, Plus, ArrowLeft } from 'lucide-react';

type Props = {
  onBack: () => void;
};

export default function Gastos({ onBack }: Props) {
  const context = useContext(GastosContext);

  const [nuevoLabel, setNuevoLabel] = useState('');
  const [nuevoDesc, setNuevoDesc] = useState('');
  const [nuevoMonto, setNuevoMonto] = useState('');

  if (!context) {
    return <div style={{ color: 'white', padding: '20px' }}>Error: GastosContext no provisto</div>;
  }

  const { gastos, setGastos, moneda } = context;

  const formatWithCommas = (num: number | string) => {
    if (num === undefined || num === null) return '';
    const parts = num.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  // OWASP A03:2021 Sanitization and length restriction to 9 digits for each inline expense item
  const handleChange = (id: string, value: string) => {
    let numericValue = value.replace(/[^0-9]/g, '');
    
    // OWASP Mitigación: Límite de 9 cifras enteras
    if (numericValue.length > 9) {
      numericValue = numericValue.slice(0, 9);
    }
    
    setGastos(prev => prev.map(item => item.id === id ? { ...item, value: numericValue } : item));
  };

  const calcularTotal = () => {
    return gastos.reduce((acc, item) => acc + (parseFloat(item.value) || 0), 0);
  };

  // OWASP A03:2021 Sanitization of text entries to prevent XSS/Injection
  const handleAddGasto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoLabel.trim()) return;

    // Remove any potential HTML tag syntax to prevent HTML injections
    const sanitizedLabel = nuevoLabel.replace(/<[^>]*>/g, '').trim();
    const sanitizedDesc = nuevoDesc.replace(/<[^>]*>/g, '').trim();
    
    let sanitizedMonto = nuevoMonto.replace(/[^0-9]/g, '');
    if (sanitizedMonto.length > 9) {
      sanitizedMonto = sanitizedMonto.slice(0, 9);
    }

    const nuevoGasto: GastoItem = {
      id: Date.now().toString(),
      label: sanitizedLabel,
      desc: sanitizedDesc || 'Gasto personalizado',
      value: sanitizedMonto || '0',
    };

    setGastos(prev => [...prev, nuevoGasto]);
    setNuevoLabel('');
    setNuevoDesc('');
    setNuevoMonto('');
  };

  const handleDeleteGasto = (id: string) => {
    setGastos(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="animate-fade-in">
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button 
          id="btn-volver-calculadora"
          className="btn-secondary" 
          onClick={onBack}
          style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={16} />
        </button>
        <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', fontWeight: '800', letterSpacing: '-0.01em' }}>
          Gestión de Gastos Fijos
        </h2>
      </div>

      <div className="dashboard-grid">
        
        {/* COLUMNA IZQUIERDA: Listado de gastos */}
        <div>
          <div className="card" style={{ padding: '20px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: '16px' }}>
              Gastos Mensuales Registrados
            </span>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
              {gastos.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px 20px', 
                  color: 'var(--text-secondary)', 
                  fontSize: '13px', 
                  border: '1px dashed rgba(255,255,255,0.06)', 
                  borderRadius: '16px',
                  background: 'rgba(255,255,255,0.01)'
                }}>
                  No hay gastos fijos registrados. Agrega uno nuevo en el formulario de la derecha.
                </div>
              ) : (
                gastos.map((campo) => (
                  <div 
                    key={campo.id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      background: 'rgba(255, 255, 255, 0.02)', 
                      padding: '14px 16px', 
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                  >
                    <div style={{ flex: 1, paddingRight: '12px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff', display: 'block' }}>{campo.label}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>{campo.desc}</span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '10px' }}>
                      <span style={{ color: 'var(--accent-blue)', fontWeight: '700', fontSize: '13px' }}>{moneda.symbol}</span>
                      <input
                        id={`input-gasto-${campo.id}`}
                        type="text"
                        value={formatWithCommas(campo.value)}
                        onChange={(e) => handleChange(campo.id, e.target.value)}
                        placeholder="0"
                        maxLength={13} // 9 digits + 2 commas + 2 decimals if any
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontWeight: '700',
                          textAlign: 'right',
                          width: '80px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <button
                      id={`btn-eliminar-gasto-${campo.id}`}
                      onClick={() => handleDeleteGasto(campo.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent-red)',
                        cursor: 'pointer',
                        padding: '4px',
                        marginLeft: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        opacity: 0.6,
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Total Indicator */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginTop: '20px', 
              paddingTop: '20px', 
              borderTop: '1px solid rgba(255,255,255,0.08)' 
            }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)' }}>TOTAL GASTOS:</span>
              <span className="font-outfit" style={{ fontSize: '22px', fontWeight: '800', color: 'var(--accent-blue)' }}>
                {moneda.symbol} {formatWithCommas(calcularTotal().toFixed(2))}
              </span>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Agregar gasto */}
        <div>
          <div className="card">
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: '20px' }}>
              Añadir Nuevo Gasto
            </span>

            <form onSubmit={handleAddGasto} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Concepto</label>
                <input
                  id="input-nuevo-gasto-concepto"
                  type="text"
                  className="input-text"
                  value={nuevoLabel}
                  onChange={(e) => setNuevoLabel(e.target.value)}
                  placeholder="ej. Seguro de auto"
                  maxLength={30}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Descripción</label>
                <input
                  id="input-nuevo-gasto-descripcion"
                  type="text"
                  className="input-text"
                  value={nuevoDesc}
                  onChange={(e) => setNuevoDesc(e.target.value)}
                  placeholder="ej. Pago trimestral fijo"
                  maxLength={40}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Monto Mensual</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0 16px' }}>
                  <span style={{ color: 'var(--accent-green)', fontWeight: '700', fontSize: '15px', marginRight: '8px' }}>{moneda.symbol}</span>
                  <input
                    id="input-nuevo-gasto-monto"
                    type="text"
                    value={formatWithCommas(nuevoMonto)}
                    onChange={(e) => setNuevoMonto(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0"
                    maxLength={11} // 9 digits + 2 commas max
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '15px',
                      padding: '12px 0',
                      width: '100%',
                      outline: 'none'
                    }}
                    required
                  />
                </div>
              </div>

              <button 
                id="btn-agregar-gasto"
                type="submit" 
                className="btn-primary" 
                style={{ 
                  marginTop: '10px', 
                  background: 'var(--accent-blue)', 
                  boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)',
                  color: '#ffffff'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent-blue)'}
              >
                <Plus size={16} />
                Agregar Gasto
              </button>
            </form>
          </div>
          
          <button 
            id="btn-guardar-gastos"
            className="btn-primary" 
            onClick={onBack}
            style={{ width: '100%' }}
          >
            Guardar y Volver
          </button>
        </div>

      </div>
    </div>
  );
}
