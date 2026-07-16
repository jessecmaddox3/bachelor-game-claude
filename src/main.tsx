import { createRoot } from 'react-dom/client';

function App() {
  return (
    <div style={{ padding: 32, fontFamily: 'sans-serif' }}>
      <h1>Bachelor Game Board v5</h1>
      <p>Engine rebuild in progress. UI arrives in Plan 3.</p>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
