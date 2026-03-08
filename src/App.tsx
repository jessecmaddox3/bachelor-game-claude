import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Dashboard } from './routes/dashboard';
import { BuilderLayout } from './routes/builder/layout';
import { RosterStep } from './routes/builder/roster';
import { TasksStep } from './routes/builder/tasks';
import { DesignStep } from './routes/builder/design';

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/builder/:boardId" element={<BuilderLayout />}>
            <Route index element={<Navigate to="roster" replace />} />
            <Route path="roster" element={<RosterStep />} />
            <Route path="tasks" element={<TasksStep />} />
            <Route path="design" element={<DesignStep />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="bottom-right" theme="dark" />
      </div>
    </BrowserRouter>
  );
}
