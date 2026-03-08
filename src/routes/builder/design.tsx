import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useBuilderStore } from '@/store/builderStore';
import { useBoardStore } from '@/store/boardStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { POSTER_SIZES, getPosterSize } from '@/config/posterSizes';
import { getTheme } from '@/config/themes';
import { computeLayout } from '@/engine/layout/computeLayout';
import { renderBoard } from '@/engine/render/renderBoard';
import { Download, Plus, X, Eye, BookOpen, Trophy } from 'lucide-react';
import { toast } from 'sonner';

const ACCENT_COLORS = [
  { value: '#00A6B6', label: 'Teal' },
  { value: '#2563EB', label: 'Blue' },
  { value: '#DC2626', label: 'Red' },
  { value: '#16A34A', label: 'Green' },
  { value: '#9333EA', label: 'Purple' },
  { value: '#EA580C', label: 'Orange' },
  { value: '#CA8A04', label: 'Gold' },
  { value: '#333333', label: 'Black' },
];

export function DesignStep() {
  const builder = useBuilderStore();
  const { updateBoard, getBoard } = useBoardStore();
  const { design, players, tasks } = builder;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewScale, setPreviewScale] = useState(0.08);
  const [exporting, setExporting] = useState(false);
  const [newRuleTerm, setNewRuleTerm] = useState('');
  const [newRuleDef, setNewRuleDef] = useState('');

  const theme = getTheme('minimalist');
  const posterSize = getPosterSize(design.posterSize);

  const layout = useMemo(() => {
    if (players.length === 0 || tasks.length === 0) return null;
    return computeLayout({ players, tasks, design }, posterSize, theme);
  }, [players, tasks, design, posterSize, theme]);

  // Draw preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layout) return;

    const scale = previewScale;
    canvas.width = posterSize.widthPx * scale;
    canvas.height = posterSize.heightPx * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(scale, scale);
    renderBoard(ctx, layout, {
      eventTitle: builder.eventTitle,
      honorName: builder.honorName,
      subtitle: builder.subtitle,
      players,
      tasks,
      design,
    });
    ctx.restore();
  }, [layout, posterSize, previewScale, players, tasks, design, builder.eventTitle, builder.honorName, builder.subtitle]);

  const handleExport = useCallback(async () => {
    if (!layout) return;
    setExporting(true);

    try {
      const board = builder.toBoard();
      if (board) {
        const existing = getBoard(board.id);
        if (existing) {
          updateBoard({ ...board, createdAt: existing.createdAt });
        }
      }

      const { widthPx, heightPx } = posterSize;
      const maxDim = 16384;

      if (widthPx <= maxDim && heightPx <= maxDim) {
        const canvas = document.createElement('canvas');
        canvas.width = widthPx;
        canvas.height = heightPx;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to create canvas context');

        renderBoard(ctx, layout, {
          eventTitle: builder.eventTitle,
          honorName: builder.honorName,
          subtitle: builder.subtitle,
          players,
          tasks,
          design,
        });

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              toast.error('Failed to generate image');
              setExporting(false);
              return;
            }
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${builder.name || 'board'}-${posterSize.id}-300dpi.png`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Poster exported!');
            setExporting(false);
          },
          'image/png',
        );
      } else {
        // Tiled export for very large canvases
        const tileSize = 4096;
        const cols = Math.ceil(widthPx / tileSize);
        const rows = Math.ceil(heightPx / tileSize);

        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = widthPx;
        finalCanvas.height = heightPx;
        const finalCtx = finalCanvas.getContext('2d');
        if (!finalCtx) throw new Error('Failed to create canvas');

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const tileW = Math.min(tileSize, widthPx - col * tileSize);
            const tileH = Math.min(tileSize, heightPx - row * tileSize);

            const tile = document.createElement('canvas');
            tile.width = tileW;
            tile.height = tileH;
            const tileCtx = tile.getContext('2d');
            if (!tileCtx) continue;

            tileCtx.save();
            tileCtx.translate(-col * tileSize, -row * tileSize);
            renderBoard(tileCtx, layout, {
              eventTitle: builder.eventTitle,
              honorName: builder.honorName,
              subtitle: builder.subtitle,
              players,
              tasks,
              design,
            });
            tileCtx.restore();

            finalCtx.drawImage(tile, col * tileSize, row * tileSize);
          }
        }

        finalCanvas.toBlob(
          (blob) => {
            if (!blob) {
              toast.error('Failed to generate image');
              setExporting(false);
              return;
            }
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${builder.name || 'board'}-${posterSize.id}-300dpi.png`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Poster exported!');
            setExporting(false);
          },
          'image/png',
        );
      }
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Export failed. Try a smaller poster size.');
      setExporting(false);
    }
  }, [layout, posterSize, players, tasks, design, builder, getBoard, updateBoard]);

  const addRuleEntry = () => {
    const term = newRuleTerm.trim();
    const def = newRuleDef.trim();
    if (!term || !def) return;
    builder.addRuleEntry(term, def);
    setNewRuleTerm('');
    setNewRuleDef('');
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
        {/* Left column - Settings */}
        <div className="space-y-6">
          {/* Poster Size */}
          <Card>
            <CardHeader>
              <CardTitle>Poster Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {POSTER_SIZES.map((size) => {
                  const sizeLayout = players.length > 0 && tasks.length > 0
                    ? computeLayout({ players, tasks, design: { ...design, posterSize: size.id } }, size, theme)
                    : null;
                  const feasible = !sizeLayout || sizeLayout.feasible;
                  return (
                    <button
                      key={size.id}
                      onClick={() => builder.setPosterSize(size.id)}
                      disabled={!feasible}
                      className={`rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                        design.posterSize === size.id
                          ? 'border-primary bg-primary/10'
                          : feasible
                            ? 'hover:bg-accent'
                            : 'cursor-not-allowed opacity-40'
                      }`}
                    >
                      <span className="text-sm font-medium">{size.label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {size.widthPx} x {size.heightPx} px
                      </span>
                      {!feasible && (
                        <Badge variant="destructive" className="mt-1 text-xs">Too small</Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Accent Color */}
          <Card>
            <CardHeader>
              <CardTitle>Accent Color</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => builder.setAccentColor(color.value)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors cursor-pointer ${
                      design.accentColor === color.value ? 'border-primary bg-primary/10' : 'hover:bg-accent'
                    }`}
                  >
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: color.value }} />
                    {color.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Board Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={design.showChampionLoser}
                  onChange={(e) => builder.setShowChampionLoser(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Show Grand Champion / Loser boxes</span>
              </label>

              <div className="space-y-2">
                <Label>Empty Rows (for write-in tasks)</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={design.emptyRows}
                    onChange={(e) => builder.setEmptyRows(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-8 text-center text-sm font-medium">{design.emptyRows}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rules Section */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Rules Section
              </CardTitle>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={design.showRules}
                  onChange={(e) => builder.setShowRules(e.target.checked)}
                  className="rounded"
                />
                Show on poster
              </label>
            </CardHeader>
            {design.showRules && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Footer Note</Label>
                  <Input
                    value={design.footerNote}
                    onChange={(e) => builder.setFooterNote(e.target.value)}
                    placeholder="e.g. Speaking a banned word means you must finish your drink."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Game Rules (term + definition)</Label>
                  <div className="space-y-2">
                    {design.rulesEntries.map((entry, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-md border p-2">
                        <div className="flex-1">
                          <span className="text-sm font-bold">{entry.term}:</span>{' '}
                          <span className="text-sm text-muted-foreground">{entry.definition}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => builder.removeRuleEntry(i)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 rounded-md border p-3">
                    <Input
                      placeholder="Term (e.g. BUFFALO)"
                      value={newRuleTerm}
                      onChange={(e) => setNewRuleTerm(e.target.value)}
                    />
                    <Textarea
                      placeholder="Definition..."
                      value={newRuleDef}
                      onChange={(e) => setNewRuleDef(e.target.value)}
                      rows={2}
                    />
                    <Button size="sm" onClick={addRuleEntry} disabled={!newRuleTerm.trim() || !newRuleDef.trim()}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Rule
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Right column - Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </CardTitle>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Zoom</Label>
                <input
                  type="range"
                  min={0.04}
                  max={0.2}
                  step={0.01}
                  value={previewScale}
                  onChange={(e) => setPreviewScale(parseFloat(e.target.value))}
                  className="w-24"
                />
              </div>
            </CardHeader>
            <CardContent>
              {players.length === 0 || tasks.length === 0 ? (
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">
                    Add players and tasks to see a preview
                  </p>
                </div>
              ) : layout && !layout.feasible ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
                  <p className="text-sm text-destructive font-medium">Layout doesn't fit</p>
                  {layout.errors.map((err, i) => (
                    <p key={i} className="text-xs text-muted-foreground">{err}</p>
                  ))}
                </div>
              ) : (
                <div className="overflow-auto rounded-lg border bg-neutral-900 p-2">
                  <canvas
                    ref={canvasRef}
                    style={{
                      width: posterSize.widthPx * previewScale,
                      height: posterSize.heightPx * previewScale,
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            onClick={handleExport}
            disabled={exporting || !layout?.feasible}
          >
            <Download className="mr-2 h-4 w-4" />
            {exporting ? 'Exporting...' : `Export ${posterSize.label} PNG (300 DPI)`}
          </Button>

          {layout && (
            <div className="text-xs text-muted-foreground text-center">
              {posterSize.widthPx} x {posterSize.heightPx} pixels | {players.length} players | {tasks.length} tasks
              {design.emptyRows > 0 && ` | ${design.emptyRows} empty rows`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
