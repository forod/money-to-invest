import { ArrowRight, ShieldCheck, Cpu } from 'lucide-react';

type Props = {
  onStart: () => void;
};

export default function Welcome({ onStart }: Props) {
  return (
    <div className="card animate-fade-in" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      minHeight: '60vh',
      marginTop: '40px',
      padding: '40px 30px'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ 
          fontSize: '48px', 
          fontWeight: '900', 
          lineHeight: '1.1', 
          letterSpacing: '3px',
          textTransform: 'uppercase',
          margin: 0
        }}>
          Money
        </h1>
        <h1 style={{ 
          fontSize: '48px', 
          fontWeight: '900', 
          lineHeight: '1.1', 
          letterSpacing: '3px',
          textTransform: 'uppercase',
          color: 'var(--accent-green)',
          margin: '0 0 10px 0'
        }}>
          To Invest
        </h1>
        <div style={{
          width: '50px',
          height: '4px',
          backgroundColor: 'var(--accent-green)',
          margin: '20px auto 0 auto',
          borderRadius: '2px'
        }} />
      </div>

      <p style={{ 
        color: 'var(--text-secondary)', 
        fontSize: '15px', 
        textAlign: 'center', 
        lineHeight: '1.6',
        maxWidth: '340px',
        margin: '0 auto 50px auto'
      }}>
        Optimiza tu excedente financiero, gestiona tus gastos fijos dinámicos y distribuye tu portafolio de inversión de manera 100% segura y privada en tu navegador.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <button 
          id="btn-entrar-invitado"
          className="btn-primary" 
          onClick={onStart}
          style={{ width: '100%' }}
        >
          Comenzar como Invitado
          <ArrowRight size={18} />
        </button>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '24px', 
          marginTop: '20px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
            <ShieldCheck size={14} className="text-green" style={{ color: 'var(--accent-green)' }} />
            <span style={{ fontSize: '11px', fontWeight: '500' }}>OWASP Top 10 Web</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
            <Cpu size={14} style={{ color: 'var(--accent-blue)' }} />
            <span style={{ fontSize: '11px', fontWeight: '500' }}>100% Local / Privado</span>
          </div>
        </div>
      </div>
    </div>
  );
}
