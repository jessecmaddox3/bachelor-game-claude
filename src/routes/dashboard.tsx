import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBoardStore } from '@/store/boardStore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Shuffle, Copy, Trash2, Calendar, Users, ListChecks } from 'lucide-react';
import { toast } from 'sonner';

export function Dashboard() {
  const { boards, loaded, load, createBoard, createRandomBoard, duplicateBoard, deleteBoard } = useBoardStore();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const board = createBoard(newName.trim());
    setShowCreate(false);
    setNewName('');
    navigate(`/builder/${board.id}/roster`);
  };

  const handleRandom = () => {
    const board = createRandomBoard();
    toast.success(`Created "${board.name}" with random data`);
    navigate(`/builder/${board.id}/roster`);
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const board = duplicateBoard(id);
    if (board) toast.success(`Duplicated as "${board.name}"`);
  };

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteBoard(id);
      toast.success('Board deleted');
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">The Game Board Generator</h1>
          <p className="mt-1 text-muted-foreground">
            Create print-ready game board posters for any group event
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRandom}>
            <Shuffle className="mr-2 h-4 w-4" />
            Random Board
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Board
          </Button>
        </div>
      </div>

      {boards.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ListChecks className="mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">No boards yet</h2>
            <p className="mb-6 text-muted-foreground">
              Create your first game board or generate a random one.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRandom}>
                <Shuffle className="mr-2 h-4 w-4" />
                Random Board
              </Button>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Board
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <Card
              key={board.id}
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => navigate(`/builder/${board.id}/roster`)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{board.name}</CardTitle>
                <CardDescription>
                  {board.honorName ? `For ${board.honorName}` : 'No guest of honor set'}
                  {board.subtitle ? ` - ${board.subtitle}` : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {board.players.length} players
                  </span>
                  <span className="flex items-center gap-1">
                    <ListChecks className="h-3.5 w-3.5" />
                    {board.tasks.length} tasks
                  </span>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(board.updatedAt).toLocaleDateString()}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDuplicate(board.id, e)}
                    title="Duplicate"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDelete(board.id, board.name, e)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent onClose={() => setShowCreate(false)}>
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
            className="mt-4 space-y-4"
          >
            <Input
              placeholder="Board name (e.g. Jake's Weekend, Family Reunion 2026)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newName.trim()}>
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
