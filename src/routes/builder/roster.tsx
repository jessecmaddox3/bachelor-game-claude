import { useState } from 'react';
import { useBuilderStore } from '@/store/builderStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, GripVertical } from 'lucide-react';
import { MIN_PLAYERS, MAX_PLAYERS } from '@/config/constraints';
import { getRandomNames } from '@/config/names';
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

const EVENT_PRESETS = [
  'THE BACHELOR WEEKEND OF',
  'THE BACHELORETTE WEEKEND OF',
  'THE BIRTHDAY CELEBRATION OF',
  'THE FAMILY REUNION OF',
  'THE FRIENDS WEEKEND WITH',
  'THE WEEKEND OF',
];

function SortablePlayer({
  id,
  name,
  onRemove,
  onRename,
}: {
  id: string;
  name: string;
  onRemove: () => void;
  onRename: (name: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-md border bg-card p-2 ${isDragging ? 'opacity-50' : ''}`}
    >
      <button
        className="cursor-grab text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Input
        className="h-8 flex-1"
        value={name}
        onChange={(e) => onRename(e.target.value)}
        maxLength={20}
      />
      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onRemove}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function RosterStep() {
  const {
    eventTitle,
    honorName,
    subtitle,
    players,
    setEventTitle,
    setHonorName,
    setSubtitle,
    setName,
    addPlayer,
    removePlayer,
    updatePlayerName,
    reorderPlayers,
  } = useBuilderStore();

  const [newPlayerName, setNewPlayerName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleAddPlayer = () => {
    const name = newPlayerName.trim();
    if (!name) return;
    if (players.length >= MAX_PLAYERS) return;
    addPlayer(name);
    setNewPlayerName('');
  };

  const handleAddRandom = () => {
    const remaining = MAX_PLAYERS - players.length;
    if (remaining <= 0) return;
    const count = Math.min(remaining, 5);
    const existingNames = new Set(players.map((p) => p.name.toLowerCase()));
    const names = getRandomNames(count + 10)
      .filter((n) => !existingNames.has(n.toLowerCase()))
      .slice(0, count);
    names.forEach((name) => addPlayer(name));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = players.findIndex((p) => p.id === active.id);
    const newIndex = players.findIndex((p) => p.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderPlayers(oldIndex, newIndex);
    }
  };

  const playerCount = players.length;
  const isValid = playerCount >= MIN_PLAYERS && playerCount <= MAX_PLAYERS;

  return (
    <div className="space-y-6">
      {/* Event Info */}
      <Card>
        <CardHeader>
          <CardTitle>Event Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eventTitle">Header Title</Label>
            <div className="flex gap-2">
              <Input
                id="eventTitle"
                placeholder="e.g. THE BACHELOR WEEKEND OF"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {EVENT_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  variant={eventTitle === preset ? 'secondary' : 'ghost'}
                  size="sm"
                  className="text-xs"
                  onClick={() => setEventTitle(preset)}
                >
                  {preset}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="honorName">Guest of Honor / Name</Label>
              <Input
                id="honorName"
                placeholder="e.g. Steven Victor Watts"
                value={honorName}
                onChange={(e) => {
                  setHonorName(e.target.value);
                  const currentName = useBuilderStore.getState().name;
                  if (!currentName || currentName.endsWith("'s Weekend")) {
                    setName(`${e.target.value}'s Weekend`);
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Date / Subtitle</Label>
              <Input
                id="subtitle"
                placeholder="e.g. January 12-15th, 2026"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Players */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle>
              Players{' '}
              <Badge variant={isValid ? 'secondary' : 'destructive'} className="ml-2">
                {playerCount}/{MIN_PLAYERS}-{MAX_PLAYERS}
              </Badge>
            </CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={handleAddRandom} disabled={playerCount >= MAX_PLAYERS}>
            Add Random
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddPlayer();
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="Player name"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              maxLength={20}
              disabled={playerCount >= MAX_PLAYERS}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newPlayerName.trim() || playerCount >= MAX_PLAYERS}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </form>

          {players.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={players.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {players.map((player) => (
                    <SortablePlayer
                      key={player.id}
                      id={player.id}
                      name={player.name}
                      onRemove={() => removePlayer(player.id)}
                      onRename={(name) => updatePlayerName(player.id, name)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No players added yet. Add at least {MIN_PLAYERS} players to continue.
            </p>
          )}

          {playerCount > 0 && playerCount < MIN_PLAYERS && (
            <p className="text-sm text-destructive">
              Add at least {MIN_PLAYERS - playerCount} more player{MIN_PLAYERS - playerCount !== 1 ? 's' : ''}.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
