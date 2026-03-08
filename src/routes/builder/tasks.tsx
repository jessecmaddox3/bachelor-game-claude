import { useState } from 'react';
import { useBuilderStore } from '@/store/builderStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, GripVertical, Sparkles, Package, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CategoryIds, CategoryLabels, type CategoryId } from '@/models/board';
import { PRESET_TASKS, type PresetTask } from '@/config/presets';
import { CATEGORIES } from '@/config/categories';
import { MIN_TASKS, MAX_TASKS } from '@/config/constraints';
import { brainstormTasks, isGeminiConfigured, type AiTaskSuggestion } from '@/services/gemini';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableTask({
  id,
  title,
  category,
  pointValue,
  maxCompletions,
  pointsDisplay,
  onRemove,
}: {
  id: string;
  title: string;
  category: CategoryId;
  pointValue: number;
  maxCompletions: number;
  pointsDisplay?: string;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const cat = CATEGORIES.find((c) => c.id === category);
  const ptsLabel = pointsDisplay || String(pointValue);
  const maxLabel = maxCompletions > 1 && maxCompletions < 999 ? `max ${pointValue * maxCompletions}` : '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-md border bg-card p-2 ${isDragging ? 'opacity-50' : ''}`}
    >
      <button className="cursor-grab text-muted-foreground hover:text-foreground" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>
      <Badge
        variant="outline"
        className="shrink-0 text-xs"
        style={{ borderColor: cat?.color, color: cat?.color }}
      >
        {cat?.label}
      </Badge>
      <span className="flex-1 truncate text-sm">{title}</span>
      <span className="shrink-0 text-sm font-medium text-green-400">{ptsLabel}pts</span>
      {maxLabel && <span className="shrink-0 text-xs text-muted-foreground">{maxLabel}</span>}
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onRemove}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function TasksStep() {
  const { tasks, addTask, removeTask, reorderTasks, addPresetTasks, eventTitle, honorName, subtitle, players } = useBuilderStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showAiBrainstorm, setShowAiBrainstorm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<CategoryId | 'all'>('all');

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<CategoryId>('wildcard');
  const [newPoints, setNewPoints] = useState('2');
  const [newMaxComp, setNewMaxComp] = useState('1');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleAddTask = () => {
    if (!newTitle.trim()) return;
    addTask({
      title: newTitle.trim(),
      category: newCategory,
      pointValue: parseInt(newPoints) || 0,
      maxCompletions: parseInt(newMaxComp) || 1,
      source: 'manual',
    });
    setNewTitle('');
    setNewPoints('2');
    setNewMaxComp('1');
    setShowAddForm(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) reorderTasks(oldIndex, newIndex);
  };

  const filteredTasks = filterCategory === 'all'
    ? tasks
    : tasks.filter((t) => t.category === filterCategory);

  const taskCount = tasks.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>
            Tasks{' '}
            <Badge variant={taskCount >= MIN_TASKS ? 'secondary' : 'destructive'} className="ml-2">
              {taskCount}
            </Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAiBrainstorm(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              AI Brainstorm
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowPresets(true)}>
              <Package className="mr-2 h-4 w-4" />
              Presets
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAddForm(true)}
              disabled={taskCount >= MAX_TASKS}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1">
            <Button
              variant={filterCategory === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilterCategory('all')}
            >
              All ({tasks.length})
            </Button>
            {CATEGORIES.map((cat) => {
              const count = tasks.filter((t) => t.category === cat.id).length;
              if (count === 0) return null;
              return (
                <Button
                  key={cat.id}
                  variant={filterCategory === cat.id ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterCategory(cat.id)}
                >
                  {cat.label} ({count})
                </Button>
              );
            })}
          </div>

          {filteredTasks.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={filteredTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {filteredTasks.map((task) => (
                    <SortableTask
                      key={task.id}
                      id={task.id}
                      title={task.title}
                      category={task.category}
                      pointValue={task.pointValue}
                      maxCompletions={task.maxCompletions}
                      pointsDisplay={task.pointsDisplay}
                      onRemove={() => removeTask(task.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No tasks yet. Add tasks manually or load from presets.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add Task Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent onClose={() => setShowAddForm(false)}>
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleAddTask(); }} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Task Title</Label>
              <Input
                placeholder="e.g. Win a game of flip cup"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                maxLength={80}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as CategoryId)}
                  options={CategoryIds.map((id) => ({ value: id, label: CategoryLabels[id] }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Points</Label>
                <Input
                  type="number"
                  value={newPoints}
                  onChange={(e) => setNewPoints(e.target.value)}
                  min={-100}
                  max={100}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Times</Label>
                <Input
                  type="number"
                  value={newMaxComp}
                  onChange={(e) => setNewMaxComp(e.target.value)}
                  min={1}
                  max={999}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button type="submit" disabled={!newTitle.trim()}>Add Task</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Presets Dialog */}
      <PresetDialog open={showPresets} onOpenChange={setShowPresets} onAdd={addPresetTasks} existingTitles={tasks.map((t) => t.title.toLowerCase())} />

      {/* AI Brainstorm Dialog */}
      <AiBrainstormDialog
        open={showAiBrainstorm}
        onOpenChange={setShowAiBrainstorm}
        onAdd={addPresetTasks}
        existingTitles={tasks.map((t) => t.title.toLowerCase())}
        eventTitle={eventTitle}
        honorName={honorName}
        subtitle={subtitle}
        playerCount={players.length}
      />
    </div>
  );
}

function PresetDialog({
  open,
  onOpenChange,
  onAdd,
  existingTitles,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (tasks: PresetTask[]) => void;
  existingTitles: string[];
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<CategoryId | 'all'>('all');

  const filtered = filter === 'all'
    ? PRESET_TASKS
    : PRESET_TASKS.filter((t) => t.category === filter);

  const toggle = (idx: number) => {
    const next = new Set(selected);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelected(next);
  };

  const handleAdd = () => {
    const tasks = Array.from(selected).map((i) => PRESET_TASKS[i]!);
    onAdd(tasks);
    setSelected(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-hidden" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Add Preset Tasks ({selected.size} selected)</DialogTitle>
        </DialogHeader>
        <div className="mt-2 flex flex-wrap gap-1">
          <Button variant={filter === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter('all')}>All</Button>
          {CATEGORIES.map((cat) => {
            const count = PRESET_TASKS.filter((t) => t.category === cat.id).length;
            if (count === 0) return null;
            return (
              <Button
                key={cat.id}
                variant={filter === cat.id ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setFilter(cat.id)}
              >
                {cat.label} ({count})
              </Button>
            );
          })}
        </div>
        <div className="mt-2 max-h-[50vh] overflow-y-auto space-y-1">
          {filtered.map((preset, i) => {
            const globalIdx = PRESET_TASKS.indexOf(preset);
            const alreadyExists = existingTitles.includes(preset.title.toLowerCase());
            const isSelected = selected.has(globalIdx);
            const cat = CATEGORIES.find((c) => c.id === preset.category);
            return (
              <button
                key={i}
                onClick={() => !alreadyExists && toggle(globalIdx)}
                disabled={alreadyExists}
                className={`flex w-full items-center gap-2 rounded-md border p-2 text-left text-sm transition-colors cursor-pointer ${
                  alreadyExists
                    ? 'opacity-40'
                    : isSelected
                      ? 'border-primary bg-primary/10'
                      : 'hover:bg-accent'
                }`}
              >
                <Badge variant="outline" className="shrink-0 text-xs" style={{ borderColor: cat?.color, color: cat?.color }}>
                  {cat?.label}
                </Badge>
                <span className="flex-1 truncate">{preset.title}</span>
                <span className="shrink-0 text-green-400">{preset.pointsDisplay || preset.pointValue}pts</span>
                {alreadyExists && <span className="text-xs text-muted-foreground">Added</span>}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const all = new Set<number>();
              filtered.forEach((p) => {
                const idx = PRESET_TASKS.indexOf(p);
                if (!existingTitles.includes(p.title.toLowerCase())) all.add(idx);
              });
              setSelected(all);
            }}
          >
            Select All
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={selected.size === 0}>
              Add {selected.size} Tasks
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AiBrainstormDialog({
  open,
  onOpenChange,
  onAdd,
  existingTitles,
  eventTitle,
  honorName,
  subtitle,
  playerCount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (tasks: Array<{ title: string; category: CategoryId; pointValue: number; maxCompletions: number; pointsDisplay?: string }>) => void;
  existingTitles: string[];
  eventTitle: string;
  honorName: string;
  subtitle: string;
  playerCount: number;
}) {
  const [tone, setTone] = useState<'mild' | 'moderate' | 'wild'>('moderate');
  const [suggestions, setSuggestions] = useState<AiTaskSuggestion[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isGeminiConfigured();

  const generate = async () => {
    setLoading(true);
    setError(null);
    setSuggestions([]);
    setSelected(new Set());
    try {
      const results = await brainstormTasks({
        eventTitle,
        honorName,
        subtitle,
        existingTasks: existingTitles,
        tone,
        playerCount,
      });
      setSuggestions(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const toggle = (idx: number) => {
    const next = new Set(selected);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelected(next);
  };

  const handleAdd = () => {
    const tasks = Array.from(selected).map((i) => suggestions[i]!);
    onAdd(tasks);
    setSuggestions([]);
    setSelected(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-hidden" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Brainstorm
          </DialogTitle>
        </DialogHeader>

        {!configured ? (
          <p className="py-4 text-sm text-muted-foreground">
            Gemini API key not configured. Add <code>VITE_GEMINI_API_KEY</code> to your .env file.
          </p>
        ) : (
          <>
            <div className="mt-2 flex items-end gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Tone</Label>
                <div className="flex gap-1">
                  {(['mild', 'moderate', 'wild'] as const).map((t) => (
                    <Button
                      key={t}
                      variant={tone === t ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setTone(t)}
                    >
                      {t === 'mild' ? 'Family Friendly' : t === 'moderate' ? 'Moderate' : 'Wild'}
                    </Button>
                  ))}
                </div>
              </div>
              <Button onClick={generate} disabled={loading} size="sm">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : suggestions.length > 0 ? (
                  'Regenerate'
                ) : (
                  'Generate Ideas'
                )}
              </Button>
            </div>

            {error && (
              <p className="mt-2 text-sm text-destructive">{error}</p>
            )}

            {suggestions.length > 0 && (
              <>
                <div className="mt-3 max-h-[45vh] overflow-y-auto space-y-1">
                  {suggestions.map((s, i) => {
                    const alreadyExists = existingTitles.includes(s.title.toLowerCase());
                    const isSelected = selected.has(i);
                    const cat = CATEGORIES.find((c) => c.id === s.category);
                    return (
                      <button
                        key={i}
                        onClick={() => !alreadyExists && toggle(i)}
                        disabled={alreadyExists}
                        className={`flex w-full items-center gap-2 rounded-md border p-2 text-left text-sm transition-colors cursor-pointer ${
                          alreadyExists
                            ? 'opacity-40'
                            : isSelected
                              ? 'border-primary bg-primary/10'
                              : 'hover:bg-accent'
                        }`}
                      >
                        <Badge variant="outline" className="shrink-0 text-xs" style={{ borderColor: cat?.color, color: cat?.color }}>
                          {cat?.label}
                        </Badge>
                        <span className="flex-1 truncate">{s.title}</span>
                        <span className="shrink-0 text-green-400">{s.pointsDisplay || s.pointValue}pts</span>
                        {alreadyExists && <span className="text-xs text-muted-foreground">Already added</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const all = new Set<number>();
                      suggestions.forEach((s, i) => {
                        if (!existingTitles.includes(s.title.toLowerCase())) all.add(i);
                      });
                      setSelected(all);
                    }}
                  >
                    Select All
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleAdd} disabled={selected.size === 0}>
                      Add {selected.size} Tasks
                    </Button>
                  </div>
                </div>
              </>
            )}

            {!loading && suggestions.length === 0 && !error && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Pick a tone and hit Generate to get AI-powered task suggestions.
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
