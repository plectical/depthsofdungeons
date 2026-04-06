import { Game } from './game/Game';
import './style.css';

function App() {
  return (
    <>
      {/* Landscape Warning */}
      <div className="landscape-warning">
        <div className="landscape-warning-icon">📱</div>
        <h2>Portrait Mode Only</h2>
        <p>Please rotate your device to portrait orientation</p>
      </div>

      {/* Main App */}
      <div className="app-container">
        <Game />
      </div>
    </>
  );
}

export default App;
