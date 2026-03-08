import { useEffect } from 'react';
import { Outlet, useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useBoardStore } from '@/store/boardStore';
import { useBuilderStore } from '@/store/builderStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { ArrowLeft, Save, Users, ListChecks, Palette } from 'lucide-react';
import { toast } from 'sonner';

const STEPS = [
  { path: 'roster', label: 'Roster', icon: Users },
  { path: 'tasks', label: 'Tasks', icon: ListChecks },
  { path: 'design', label: 'Design', icon: Palette },
] as const;

export function BuilderLayout() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { boards, loaded, load, updateBoard, getBoard } = useBoardStore();
  const builder = useBuilderStore();

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  useEffect(() => {
    if (!loaded || !boardId) return;
    const board = getBoard(boardId);
    if (!board) {
      navigate('/');
      return;
    }
    if (builder.boardId !== boardId) {
      builder.loadBoard(board);
    }
  }, [loaded, boardId, boards, getBoard, navigate, builder]);

  const handleSave = () => {
    const board = builder.toBoard();
    if (!board) return;
    const existing = getBoard(board.id);
    if (!existing) return;
    updateBoard({
      ...board,
      createdAt: existing.createdAt,
    });
    toast.success('Board saved');
  };

  const currentStep = STEPS.findIndex((s) =>
    location.pathname.endsWith(s.path),
  );

  if (!loaded || !boardId || builder.boardId !== boardId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold">{builder.name || 'Untitled Board'}</span>
          </div>

          {/* Stepper */}
          <nav className="flex items-center gap-1">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isActive = i === currentStep;
              const isCompleted = i < currentStep;
              return (
                <Link
                  key={step.path}
                  to={`/builder/${boardId}/${step.path}`}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : isCompleted
                        ? 'text-foreground hover:bg-accent'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{step.label}</span>
                </Link>
              );
            })}
          </nav>

          <Button size="sm" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </div>
    </div>
  );
}
