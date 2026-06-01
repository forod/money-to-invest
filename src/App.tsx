import { useState } from 'react';
import { GastosProvider } from './context/GastosContext';
import Welcome from './components/Welcome';
import Calculadora from './components/Calculadora';
import Gastos from './components/Gastos';
import { Calculator, Landmark } from 'lucide-react';

type Screen = 'welcome' | 'calculadora' | 'gastos';

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');

  return (
    <GastosProvider>
      <div className="app-container">
        {/* Main Content Area */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {screen === 'welcome' && (
            <Welcome onStart={() => setScreen('calculadora')} />
          )}
          {screen === 'calculadora' && (
            <Calculadora onNavigateToGastos={() => setScreen('gastos')} />
          )}
          {screen === 'gastos' && (
            <Gastos onBack={() => setScreen('calculadora')} />
          )}
        </main>

        {/* Floating bottom navigation bar (only shown after entry) */}
        {screen !== 'welcome' && (
          <nav className="floating-nav" aria-label="Navegación principal">
            <button
              id="nav-btn-calculadora"
              className={`nav-item ${screen === 'calculadora' ? 'active' : ''}`}
              onClick={() => setScreen('calculadora')}
              title="Ir a Calculadora"
            >
              <Calculator size={18} />
              <span>Calculadora</span>
            </button>
            <button
              id="nav-btn-gastos"
              className={`nav-item ${screen === 'gastos' ? 'active' : ''}`}
              onClick={() => setScreen('gastos')}
              title="Ir a Gastos Fijos"
            >
              <Landmark size={18} />
              <span>Gastos Fijos</span>
            </button>
          </nav>
        )}
      </div>
    </GastosProvider>
  );
}
