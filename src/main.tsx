import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { loadAppFonts } from './app/fonts';
import './index.css';

const root = createRoot(document.getElementById('root')!);
root.render(<div className="boot">Loading fonts…</div>);

loadAppFonts()
  .then(({ metrics, buffers }) => root.render(<App metrics={metrics} buffers={buffers} />))
  .catch((err) => root.render(<div className="boot">Failed to load fonts: {String(err)}</div>));
