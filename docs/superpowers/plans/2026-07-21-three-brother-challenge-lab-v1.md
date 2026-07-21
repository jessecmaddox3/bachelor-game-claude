# Three-Brother Challenge Lab V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a mobile-first weekly challenge game for Jesse, Brett, and Hunter with full-catalog discovery, personal point calibration, self-selected or delegated assignments, linked partnership scoring, completion stories, and a round debrief.

**Architecture:** Create a new React and TypeScript source project at `/Users/jesse/claude/challenge-game`. Generate a validated runtime catalog from the 360-item editorial atlas, keep all game transitions in a pure event reducer shared by browser and server, and bundle a Vercel function that persists append-only events to Google Sheets. Deploy static output and the bundled API through the existing `/Users/jesse/claude/jessemaddox.com` repository.

**Tech Stack:** React 19, TypeScript 5.7, Vite 6, Zustand 5, Zod 3, Vitest 4, Testing Library, esbuild, Vercel Node functions, Google Sheets API, plain mobile-first CSS.

> **TL;DR:** Implement the approved mechanics lab as ten testable tasks. Use the working title **Challenge Lab**, neutral placeholder styling, `1/2/3/5` calibrated points, double points for delegated choice, three linked partnership tracks, and a seven-day round. Do not add a preference survey, native application, permanent brand identity, bidding, notifications, or general registration.

## Global Constraints

- The only player IDs are `jesse`, `brett`, and `hunter`.
- Identity selection is local convenience, not authentication.
- The full catalog contains exactly 360 challenges, 20 categories, and 18 challenges per category.
- Each player chooses exactly five categories and one seed challenge from each category.
- Personal calibration moves default points at most one rung on `1 → 2 → 3 → 5` before partner selection.
- Each player chooses either self-selection at calibrated points or delegation at twice calibrated points.
- Every player receives two distinct weekly assignments, one on each partnership track.
- The group completes the round only when all six assignments are completed within seven days.
- A player's linked score is the lower of his two partnership scores.
- The initial interface uses system fonts, neutral replaceable CSS tokens, accessible contrast, and no permanent logo or brand palette.
- The app path is unlisted and includes `<meta name="robots" content="noindex,nofollow">`.
- Google credentials remain server-side. No sensitive data belongs in challenge stories or client configuration.
- Every state-changing request is idempotent and revision-checked.
- Use test-driven development and stage files by explicit path for every commit.

---

### Task 1: Create the Source Project and Tested Mobile Shell

**Files:**
- Create: `/Users/jesse/claude/challenge-game/package.json`
- Create: `/Users/jesse/claude/challenge-game/tsconfig.json`
- Create: `/Users/jesse/claude/challenge-game/tsconfig.app.json`
- Create: `/Users/jesse/claude/challenge-game/tsconfig.node.json`
- Create: `/Users/jesse/claude/challenge-game/vite.config.ts`
- Create: `/Users/jesse/claude/challenge-game/index.html`
- Create: `/Users/jesse/claude/challenge-game/CLAUDE.md`
- Create symlink: `/Users/jesse/claude/challenge-game/AGENTS.md` to `CLAUDE.md`
- Create: `/Users/jesse/claude/challenge-game/src/main.tsx`
- Create: `/Users/jesse/claude/challenge-game/src/app/App.tsx`
- Create: `/Users/jesse/claude/challenge-game/src/app/App.test.tsx`
- Create: `/Users/jesse/claude/challenge-game/src/styles/tokens.css`
- Create: `/Users/jesse/claude/challenge-game/src/styles/app.css`
- Create: `/Users/jesse/claude/challenge-game/tests/setup.ts`
- Copy: approved spec to `/Users/jesse/claude/challenge-game/docs/superpowers/specs/2026-07-21-three-brother-challenge-lab-v1-design.md`
- Copy: this plan to `/Users/jesse/claude/challenge-game/docs/superpowers/plans/2026-07-21-three-brother-challenge-lab-v1.md`
- Copy: scoring audit, mechanics library, and naming prompts to `/Users/jesse/claude/challenge-game/docs/product/`

**Interfaces:**
- Consumes: The approved V1 design in the sibling `bachelor-game-claude` repository.
- Produces: A buildable React application, Vitest environment, neutral mobile shell, and new Git repository.

- [ ] **Step 1: Create the directory, initialize Git, and add project instructions**

Run:

```bash
mkdir -p /Users/jesse/claude/challenge-game
cd /Users/jesse/claude/challenge-game
git init -b main
```

Create `CLAUDE.md` with these exact project rules:

```markdown
# Challenge Game

Mobile-first challenge mechanics lab for Jesse, Brett, and Hunter.

## Product constraints

- Preserve the approved V1 spec in `docs/superpowers/specs/`.
- Keep game rules in pure domain modules shared by client and server.
- Keep visual styling neutral until Jesse approves a brand direction.
- Do not add accounts, surveys, bidding, notifications, or public features to V1.
- Use `1/2/3/5` default points, one-rung personal calibration, and a 2x delegation multiplier.
- Validate exactly 360 challenges across 20 categories.

## Delivery

- Run `npm test`, `npm run typecheck`, and `npm run build` before every release.
- Stage explicit paths. Never stage credentials, generated local environment files, or unrelated website changes.
```

Create `AGENTS.md` as a symlink:

```bash
ln -s CLAUDE.md AGENTS.md
```

Expected: `git status --short` lists `AGENTS.md` and `CLAUDE.md` as untracked.

Copy the approved documentation from the source research repository:

```bash
mkdir -p docs/superpowers/specs docs/superpowers/plans docs/product
cp /Users/jesse/claude/bachelor-game-claude/docs/superpowers/specs/2026-07-21-three-brother-challenge-lab-v1-design.md docs/superpowers/specs/
cp /Users/jesse/claude/bachelor-game-claude/docs/superpowers/plans/2026-07-21-three-brother-challenge-lab-v1.md docs/superpowers/plans/
cp /Users/jesse/claude/bachelor-game-claude/docs/product/2026-07-21-challenge-difficulty-scoring-audit.md docs/product/
cp /Users/jesse/claude/bachelor-game-claude/docs/product/2026-07-21-cooperative-rivalry-mechanics-library.md docs/product/
cp /Users/jesse/claude/bachelor-game-claude/docs/product/2026-07-21-challenge-game-naming-and-design-prompts.md docs/product/
```

Expected: the approved documents are now inside the Git-writable product repository and will be included in the first commit.

- [ ] **Step 2: Add exact package and TypeScript configuration**

Create `package.json`:

```json
{
  "name": "challenge-game",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "typecheck": "tsc -b",
    "build": "tsc -b && vite build",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.24.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "@types/node": "^26.1.1",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "esbuild": "^0.25.0",
    "jsdom": "^29.1.1",
    "typescript": "~5.7.0",
    "vite": "^6.0.0",
    "vitest": "^4.1.10"
  }
}
```

Create `tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

Create `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src", "tests"]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "types": ["node"],
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts", "server"]
}
```

Create `vite.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/projects/challenge-game/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"]
  }
});
```

Create `tests/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(cleanup);
```

Run:

```bash
npm install
```

Expected: installation exits 0 and creates `package-lock.json` without audit errors that prevent installation.

- [ ] **Step 3: Write the failing application-shell test**

Create `src/app/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders the neutral Challenge Lab entry shell", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Challenge Lab" })).toBeInTheDocument();
    expect(screen.getByText("Jesse, Brett, and Hunter")).toBeInTheDocument();
  });
});
```

Run:

```bash
npm test -- src/app/App.test.tsx
```

Expected: FAIL because `App.tsx` does not exist.

- [ ] **Step 4: Implement the neutral application shell**

Create `src/app/App.tsx`:

```tsx
import "../styles/tokens.css";
import "../styles/app.css";

export function App() {
  return (
    <main className="app-shell">
      <section className="panel" aria-labelledby="app-title">
        <p className="eyebrow">Jesse, Brett, and Hunter</p>
        <h1 id="app-title">Challenge Lab</h1>
        <p>Pick what interests you, then play one real week together.</p>
      </section>
    </main>
  );
}
```

Create `src/styles/tokens.css` with replaceable neutral tokens:

```css
:root {
  color-scheme: light;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --surface: #ffffff;
  --surface-muted: #f3f4f6;
  --ink: #111827;
  --ink-muted: #4b5563;
  --line: #d1d5db;
  --accent: #1f2937;
  --focus: #2563eb;
  --radius: 16px;
  --space-1: 0.5rem;
  --space-2: 1rem;
  --space-3: 1.5rem;
}
```

Create `src/styles/app.css` with a 44-pixel minimum touch target, a centered 42rem content column, visible `:focus-visible` styles, and responsive padding. Create `src/main.tsx` with `createRoot(document.getElementById("root")!).render(<App />)`.

Add `<meta name="robots" content="noindex,nofollow">` and a responsive viewport to `index.html`.

- [ ] **Step 5: Verify and commit the scaffold**

Run:

```bash
npm test -- src/app/App.test.tsx
npm run typecheck
npm run build
```

Expected: one passing test, TypeScript exit 0, and Vite output in `dist/`.

Commit:

```bash
git add AGENTS.md CLAUDE.md package.json package-lock.json tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html src tests docs
git commit -m "chore: scaffold challenge lab web app"
```

---

### Task 2: Generate and Validate the 360-Item Runtime Catalog

**Files:**
- Create: `/Users/jesse/claude/challenge-game/scripts/importAtlas.mjs`
- Create: `/Users/jesse/claude/challenge-game/src/catalog/types.ts`
- Create: `/Users/jesse/claude/challenge-game/src/catalog/pointOverrides.json`
- Create: `/Users/jesse/claude/challenge-game/src/catalog/pointOverrides.ts`
- Generate: `/Users/jesse/claude/challenge-game/src/catalog/challenges.json`
- Create: `/Users/jesse/claude/challenge-game/src/catalog/catalog.ts`
- Create: `/Users/jesse/claude/challenge-game/src/catalog/catalog.test.ts`
- Copy: `/Users/jesse/claude/challenge-game/docs/product/2026-07-21-challenge-atlas-360.md`

**Interfaces:**
- Consumes: Atlas entry syntax `N. **Title** [S|M|L|XL | Motivation] Instruction` and IDs `category.item`.
- Produces: `categories: ChallengeCategory[]`, `challenges: Challenge[]`, `challengeById(id): Challenge`, and generated JSON used by browser and bundled API.

- [ ] **Step 1: Write catalog invariant tests**

Create `src/catalog/catalog.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { categories, challenges } from "./catalog";

describe("runtime challenge catalog", () => {
  it("contains exactly 360 challenges in 20 equal categories", () => {
    expect(categories).toHaveLength(20);
    expect(challenges).toHaveLength(360);
    for (const category of categories) {
      expect(challenges.filter((challenge) => challenge.categoryId === category.id)).toHaveLength(18);
    }
  });

  it("uses unique IDs and approved point values", () => {
    expect(new Set(challenges.map(({ id }) => id)).size).toBe(360);
    expect(new Set(challenges.map(({ defaultPoints }) => defaultPoints))).toEqual(new Set([1, 2, 3, 5]));
  });

  it("marks the four overlong challenges as future-round items", () => {
    const future = challenges.filter(({ oneWeekStatus }) => oneWeekStatus === "future").map(({ id }) => id);
    expect(future).toEqual(["19.11", "19.13", "19.15", "20.18"]);
  });
});
```

Run:

```bash
npm test -- src/catalog/catalog.test.ts
```

Expected: FAIL because the catalog modules do not exist.

- [ ] **Step 2: Define focused catalog types and overrides**

Create `src/catalog/types.ts`:

```ts
export type ChallengeSize = "S" | "M" | "L" | "XL";
export type ChallengePoints = 1 | 2 | 3 | 5;
export type OneWeekStatus = "eligible" | "future";

export interface ChallengeCategory {
  id: string;
  ordinal: number;
  name: string;
  description: string;
}

export interface Challenge {
  id: string;
  ordinal: number;
  categoryId: string;
  title: string;
  instruction: string;
  finishLine: string;
  size: ChallengeSize;
  defaultPoints: ChallengePoints;
  motivation: string;
  oneWeekStatus: OneWeekStatus;
  reviewFlags: string[];
}
```

Create `src/catalog/pointOverrides.json` with the 13 approved IDs and values:

```json
{
  "08.14": 2,
  "09.08": 2,
  "09.14": 2,
  "09.16": 2,
  "09.18": 3,
  "11.01": 2,
  "11.03": 3,
  "11.04": 2,
  "11.13": 3,
  "12.13": 2,
  "14.08": 2,
  "16.18": 3,
  "17.11": 3
}
```

Create `src/catalog/pointOverrides.ts` as the typed facade:

```ts
import values from "./pointOverrides.json";
import type { ChallengePoints } from "./types";

export const pointOverrides = values as Readonly<Record<string, ChallengePoints>>;
```

- [ ] **Step 3: Implement the deterministic atlas importer**

Create `scripts/importAtlas.mjs`. It must:

```js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const atlasPath = path.resolve(projectRoot, "docs/product/2026-07-21-challenge-atlas-360.md");
const outputPath = path.resolve(projectRoot, "src/catalog/challenges.json");
const sizePoints = { S: 1, M: 2, L: 3, XL: 5 };
const pointOverrides = JSON.parse(fs.readFileSync(path.resolve(projectRoot, "src/catalog/pointOverrides.json"), "utf8"));
const futureIds = new Set(["19.11", "19.13", "19.15", "20.18"]);

const markdown = fs.readFileSync(atlasPath, "utf8");
const lines = markdown.split(/\r?\n/);
const categories = [];
const challenges = [];
let currentCategory = null;
let description = [];

for (const line of lines) {
  const heading = line.match(/^## (\d+)\. (.+)$/);
  if (heading) {
    currentCategory = {
      id: heading[1].padStart(2, "0"),
      ordinal: Number(heading[1]),
      name: heading[2],
      description: ""
    };
    categories.push(currentCategory);
    description = [];
    continue;
  }
  if (!currentCategory) continue;
  const entry = line.match(/^(\d+)\. \*\*(.+?)\*\* \[(S|M|L|XL) \| (.+?)\] (.+)$/);
  if (!entry) {
    if (line.trim() && challenges.filter((item) => item.categoryId === currentCategory.id).length === 0) {
      description.push(line.trim());
      currentCategory.description = description.join(" ");
    }
    continue;
  }
  const itemOrdinal = Number(entry[1]);
  const id = `${currentCategory.id}.${String(itemOrdinal).padStart(2, "0")}`;
  const size = entry[3];
  challenges.push({
    id,
    ordinal: itemOrdinal,
    categoryId: currentCategory.id,
    title: entry[2],
    instruction: entry[5],
    finishLine: entry[5],
    size,
    defaultPoints: pointOverrides[id] ?? sizePoints[size],
    motivation: entry[4],
    oneWeekStatus: futureIds.has(id) ? "future" : "eligible",
    reviewFlags: currentCategory.id === "05" ? ["relationship"]
      : currentCategory.id === "06" ? ["family"]
      : currentCategory.id === "11" ? ["health-or-substance"]
      : currentCategory.id === "13" ? ["workplace"]
      : []
  });
}

if (categories.length !== 20 || challenges.length !== 360) {
  throw new Error(`Atlas import mismatch: ${categories.length} categories, ${challenges.length} challenges`);
}
for (const category of categories) {
  const count = challenges.filter((challenge) => challenge.categoryId === category.id).length;
  if (count !== 18) throw new Error(`Category ${category.id} has ${count} challenges`);
}

fs.writeFileSync(outputPath, `${JSON.stringify({ categories, challenges }, null, 2)}\n`);
console.log(`Generated ${challenges.length} challenges across ${categories.length} categories`);
```

Copy the editorial source into the product repository:

```bash
cp /Users/jesse/claude/bachelor-game-claude/docs/product/2026-07-21-challenge-atlas-360.md docs/product/
```

Add the importer to `package.json` and make every web build regenerate the catalog:

```json
{
  "scripts": {
    "catalog:build": "node scripts/importAtlas.mjs",
    "build": "npm run catalog:build && tsc -b && vite build"
  }
}
```

Run:

```bash
npm run catalog:build
```

Expected: `Generated 360 challenges across 20 categories`.

- [ ] **Step 4: Add the typed catalog facade and pass validation**

Create `src/catalog/catalog.ts`:

```ts
import rawCatalog from "./challenges.json";
import type { Challenge, ChallengeCategory } from "./types";

export const categories = rawCatalog.categories as ChallengeCategory[];
export const challenges = rawCatalog.challenges as Challenge[];
const byId = new Map(challenges.map((challenge) => [challenge.id, challenge]));

export function challengeById(id: string): Challenge {
  const challenge = byId.get(id);
  if (!challenge) throw new Error(`Unknown challenge: ${id}`);
  return challenge;
}
```

Run:

```bash
npm test -- src/catalog/catalog.test.ts
npm run typecheck
```

Expected: three passing catalog tests and TypeScript exit 0.

- [ ] **Step 5: Commit the structured catalog**

```bash
git add scripts/importAtlas.mjs src/catalog docs/product/2026-07-21-challenge-atlas-360.md package.json
git commit -m "feat: add validated 360 challenge catalog"
```

---

### Task 3: Implement the Event Model, Calibration, Assignment Resolution, and Scoring

**Files:**
- Create: `/Users/jesse/claude/challenge-game/src/domain/types.ts`
- Create: `/Users/jesse/claude/challenge-game/src/domain/players.ts`
- Create: `/Users/jesse/claude/challenge-game/src/domain/calibration.ts`
- Create: `/Users/jesse/claude/challenge-game/src/domain/reducer.ts`
- Create: `/Users/jesse/claude/challenge-game/src/domain/assignments.ts`
- Create: `/Users/jesse/claude/challenge-game/src/domain/scoring.ts`
- Create: `/Users/jesse/claude/challenge-game/src/domain/domain.test.ts`

**Interfaces:**
- Consumes: `Challenge`, `ChallengePoints`, and challenge lookup from Task 2.
- Produces: `GameEvent`, `GameSnapshot`, `reduceEvents(events)`, `calibratePoints(defaultPoints, direction)`, `resolveAssignments(snapshot, priorityByRecipient, lockedAt)`, and `calculateScores(assignments, completions)`.

- [ ] **Step 1: Write failing domain tests for every V1 invariant**

Create `src/domain/domain.test.ts` with tests that assert:

```ts
import { describe, expect, it } from "vitest";
import { calibratePoints } from "./calibration";
import { pairFor } from "./players";
import { calculateScores } from "./scoring";

describe("personal point calibration", () => {
  it("moves at most one approved rung", () => {
    expect(calibratePoints(1, "down")).toBe(1);
    expect(calibratePoints(2, "down")).toBe(1);
    expect(calibratePoints(3, "same")).toBe(3);
    expect(calibratePoints(3, "up")).toBe(5);
    expect(calibratePoints(5, "up")).toBe(5);
  });
});

describe("linked partnerships", () => {
  it("normalizes pair IDs regardless of player order", () => {
    expect(pairFor("jesse", "brett")).toBe("jesse-brett");
    expect(pairFor("brett", "jesse")).toBe("jesse-brett");
    expect(pairFor("hunter", "brett")).toBe("brett-hunter");
  });

  it("uses the lower partnership total as each player's linked score", () => {
    const result = calculateScores(
      [
        { id: "a", pairId: "jesse-brett", selectorId: "brett", recipientId: "jesse", challengeId: "01.01", points: 4, multiplier: 2 },
        { id: "b", pairId: "jesse-hunter", selectorId: "jesse", recipientId: "jesse", challengeId: "01.02", points: 2, multiplier: 1 },
        { id: "c", pairId: "brett-hunter", selectorId: "hunter", recipientId: "brett", challengeId: "01.03", points: 6, multiplier: 2 }
      ],
      new Set(["a", "b", "c"])
    );
    expect(result.partnerships).toEqual({ "jesse-brett": 4, "jesse-hunter": 2, "brett-hunter": 6 });
    expect(result.players).toEqual({ jesse: 2, brett: 4, hunter: 2 });
  });
});
```

Add tests for exactly five categories, one challenge per selected category, two distinct self-selections, two distinct delegated results, the 2x multiplier, seed privacy before all three submit, and all six completions for group victory.

Run:

```bash
npm test -- src/domain/domain.test.ts
```

Expected: FAIL because domain modules do not exist.

- [ ] **Step 2: Define player, pair, event, and snapshot types**

Create `src/domain/types.ts` with these exact discriminated unions:

```ts
import type { ChallengePoints } from "../catalog/types";

export type PlayerId = "jesse" | "brett" | "hunter";
export type PairId = "jesse-brett" | "jesse-hunter" | "brett-hunter";
export type ControlMode = "self" | "delegate";
export type RoundPhase = "seeding" | "control" | "selection" | "locked" | "active" | "debrief" | "complete";

export interface SeedChallenge {
  challengeId: string;
  defaultPoints: ChallengePoints;
  personalPoints: ChallengePoints;
  weeklyEligible: boolean;
}

export interface Assignment {
  id: string;
  pairId: PairId;
  selectorId: PlayerId;
  recipientId: PlayerId;
  challengeId: string;
  points: number;
  multiplier: 1 | 2;
}

export type GameEvent =
  | { eventId: string; type: "seed.submitted"; actor: PlayerId; payload: { categoryIds: string[]; challenges: SeedChallenge[] }; createdAt: string }
  | { eventId: string; type: "control.chosen"; actor: PlayerId; payload: { mode: ControlMode; selfChoices?: Array<{ pairId: PairId; challengeId: string }> }; createdAt: string }
  | { eventId: string; type: "partner.ranked"; actor: PlayerId; payload: { recipientId: PlayerId; rankedChallengeIds: [string, string] }; createdAt: string }
  | { eventId: string; type: "round.locked"; actor: "system"; payload: { assignments: Assignment[]; priorityByRecipient: Record<PlayerId, PlayerId> }; createdAt: string }
  | { eventId: string; type: "assignment.swap-requested"; actor: PlayerId; payload: { assignmentId: string }; createdAt: string }
  | { eventId: string; type: "assignment.swap-resolved"; actor: PlayerId; payload: { assignmentId: string; replacementChallengeId: string; replacementPoints: number }; createdAt: string }
  | { eventId: string; type: "round.confirmed"; actor: PlayerId; payload: Record<string, never>; createdAt: string }
  | { eventId: string; type: "round.started"; actor: "system"; payload: { startsAt: string; dueAt: string }; createdAt: string }
  | { eventId: string; type: "round.ended"; actor: "system"; payload: { endedAt: string }; createdAt: string }
  | { eventId: string; type: "assignment.completed"; actor: PlayerId; payload: { assignmentId: string; story: string; feltDifficulty: 1 | 2 | 3 | 4 | 5 }; createdAt: string }
  | { eventId: string; type: "feedback.submitted"; actor: PlayerId; payload: { matched: boolean; motivating: boolean; pointsFair: boolean; caredAboutPartner: boolean; showAgain: boolean; changeNextWeek: string }; createdAt: string };

export interface GameSnapshot {
  revision: number;
  phase: RoundPhase;
  seeds: Partial<Record<PlayerId, GameEvent & { type: "seed.submitted" }>>;
  controls: Partial<Record<PlayerId, GameEvent & { type: "control.chosen" }>>;
  rankings: Array<GameEvent & { type: "partner.ranked" }>;
  assignments: Assignment[];
  confirmations: Partial<Record<PlayerId, true>>;
  openSwapAssignmentIds: string[];
  completions: Array<GameEvent & { type: "assignment.completed" }>;
  feedback: Partial<Record<PlayerId, GameEvent & { type: "feedback.submitted" }>>;
  startsAt: string | null;
  dueAt: string | null;
  endedAt: string | null;
}
```

- [ ] **Step 3: Implement calibration and partnership helpers**

Create `src/domain/calibration.ts`:

```ts
import type { ChallengePoints } from "../catalog/types";

const ladder: ChallengePoints[] = [1, 2, 3, 5];

export function calibratePoints(value: ChallengePoints, direction: "down" | "same" | "up"): ChallengePoints {
  const index = ladder.indexOf(value);
  const offset = direction === "down" ? -1 : direction === "up" ? 1 : 0;
  return ladder[Math.max(0, Math.min(ladder.length - 1, index + offset))];
}
```

Create `src/domain/players.ts` with `players`, `partnersFor(playerId)`, and `pairFor(a, b)`. Throw when the same player is passed twice.

- [ ] **Step 4: Implement reducer, assignment resolution, and score calculation**

`reduceEvents(events)` starts from an empty seeding snapshot, rejects duplicate event IDs, folds events in order, and derives phases using these rules:

```ts
if (snapshot.assignments.length === 6 && !snapshot.startsAt) return "locked";
if (snapshot.startsAt && !snapshot.endedAt && snapshot.completions.length < 6) return "active";
if ((snapshot.endedAt || snapshot.completions.length === 6) && Object.keys(snapshot.feedback).length < 3) return "debrief";
if (Object.keys(snapshot.feedback).length === 3) return "complete";
if (Object.keys(snapshot.seeds).length < 3) return "seeding";
if (Object.keys(snapshot.controls).length < 3) return "control";
return "selection";
```

`resolveAssignments` must create two assignments per recipient. For self mode, use the two explicit pair choices at multiplier 1. For delegate mode, use each partner's ranked list at multiplier 2. When both partners rank the same first choice, give that challenge to the stored priority selector and give the other selector the first distinct challenge in his ranking. Derive `pairId` from selector and recipient and reject any challenge outside the recipient's eligible seed set.

After `round.locked`, each recipient either confirms both assignments or requests one swap. A swap request can target only an uncompleted assignment for that recipient. Its original selector resolves it with a different eligible seed challenge at the already locked personal score and multiplier. The round starts only after all three recipients confirm and no swap remains open. `round.started` records the seven-day deadline. `round.ended` moves the game to debrief when the deadline passes even if fewer than six assignments are complete.

`calculateScores` adds only completed assignment points to pair totals, then returns each player's lower adjacent pair total. `groupComplete` is true only when six distinct assignment IDs are complete.

- [ ] **Step 5: Verify and commit the domain**

Run:

```bash
npm test -- src/domain/domain.test.ts
npm run typecheck
```

Expected: all domain tests pass and TypeScript exits 0.

Commit:

```bash
git add src/domain
git commit -m "feat: add linked challenge game domain"
```

---

### Task 4: Build the Revision-Safe Vercel Event API

**Files:**
- Create: `/Users/jesse/claude/challenge-game/server/eventStore.ts`
- Create: `/Users/jesse/claude/challenge-game/server/googleSheetsStore.ts`
- Create: `/Users/jesse/claude/challenge-game/server/validation.ts`
- Create: `/Users/jesse/claude/challenge-game/server/handler.ts`
- Create: `/Users/jesse/claude/challenge-game/server/handler.test.ts`

**Interfaces:**
- Consumes: `GameEvent`, `reduceEvents`, `resolveAssignments`, known player IDs, and runtime catalog.
- Produces: Vercel handler supporting `GET /api/challenge-game` and idempotent `POST /api/challenge-game`, plus `dist-api/challenge-game.mjs`.

- [ ] **Step 1: Write failing API tests with an injected memory store**

Create tests that call `createHandler({ store, now, choosePriority })` and assert:

```ts
it("returns the empty canonical snapshot", async () => {
  const response = await request(handler, { method: "GET" });
  expect(response.status).toBe(200);
  expect(response.json.snapshot.phase).toBe("seeding");
  expect(response.json.revision).toBe(0);
});

it("deduplicates an event ID", async () => {
  const first = await postSeed("seed-jesse-1", 0);
  const retry = await postSeed("seed-jesse-1", 1);
  expect(first.status).toBe(200);
  expect(retry.status).toBe(200);
  expect(retry.json.duplicate).toBe(true);
  expect(store.events).toHaveLength(1);
});

it("rejects a stale revision", async () => {
  await postSeed("seed-jesse-1", 0);
  const stale = await postSeed("seed-brett-1", 0);
  expect(stale.status).toBe(409);
  expect(stale.json.error).toBe("State changed. Refresh and try again.");
});
```

Run:

```bash
npm test -- server/handler.test.ts
```

Expected: FAIL because the server handler does not exist.

- [ ] **Step 2: Define the event-store boundary**

Create `server/eventStore.ts`:

```ts
import type { GameEvent } from "../src/domain/types";

export interface EventStore {
  list(roomId: string): Promise<GameEvent[]>;
  append(roomId: string, event: GameEvent): Promise<"created" | "duplicate">;
}

export class MemoryEventStore implements EventStore {
  readonly events: GameEvent[] = [];
  async list() { return [...this.events]; }
  async append(_roomId: string, event: GameEvent) {
    if (this.events.some(({ eventId }) => eventId === event.eventId)) return "duplicate" as const;
    this.events.push(event);
    return "created" as const;
  }
}
```

- [ ] **Step 3: Implement Zod request validation and phase validation**

`server/validation.ts` defines schemas for all client-authored event types. It must reject `actor: "system"`, unknown players, arrays of the wrong length, personal point values outside `1/2/3/5`, stories over 2,000 characters, and feedback text over 1,000 characters.

Add `validateEventAgainstSnapshot(event, snapshot, catalog)` that enforces:

- `seed.submitted` only during `seeding`, with five categories, five challenges, one challenge per category, and at least two weekly-eligible choices.
- `control.chosen` only during `control`; self mode requires two distinct choices on the actor's two pairs; delegate mode contains no self choices.
- `partner.ranked` only during `selection`, only for a delegated recipient, and only with two distinct weekly-eligible seed IDs.
- `assignment.swap-requested` only during `locked`, only by the assignment recipient, and at most once per recipient.
- `assignment.swap-resolved` only during `locked`, only by the original selector, and only with a different eligible seed challenge for that recipient.
- `round.confirmed` only during `locked` and only when the actor has no open swap.
- Completion only by the assignment recipient during `active`.
- Feedback only by the actor during `debrief`.

- [ ] **Step 4: Implement the handler and automatic round lock**

`createHandler` must:

```ts
export function createHandler(dependencies: Dependencies) {
  return async function handler(req: RequestLike, res: ResponseLike) {
    if (req.method === "GET") {
      await appendSystemEventsWhenReady(dependencies);
      return sendSnapshot(res, await loadState(dependencies.store));
    }
    if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });

    const submitted = clientEventSchema.parse(await readJson(req));
    const events = await dependencies.store.list(ROOM_ID);
    const snapshot = reduceEvents(events);
    if (events.some(({ eventId }) => eventId === submitted.event.eventId)) {
      return sendJson(res, 200, { duplicate: true, revision: snapshot.revision, snapshot });
    }
    if (submitted.expectedRevision !== snapshot.revision) {
      return sendJson(res, 409, { error: "State changed. Refresh and try again.", snapshot });
    }
    validateEventAgainstSnapshot(submitted.event, snapshot, challenges);
    await dependencies.store.append(ROOM_ID, submitted.event);

    await appendSystemEventsWhenReady(dependencies);
    return sendJson(res, 200, { duplicate: false, ...await loadState(dependencies.store) });
  };
}
```

When the final required control or ranking event arrives, generate a `round.locked` system event and store the conflict priorities and six resolved assignments. When all three recipients confirm and no swap is open, generate `round.started`, set `startsAt` to `now()`, and set `dueAt` to exactly seven days later. On every GET or POST, if the deadline has passed and fewer than six completions exist, append one idempotent `round.ended` event. System events use deterministic idempotency keys derived from the triggering revision and event type.

- [ ] **Step 5: Implement the Google Sheets adapter**

Use a tab named `Challenge Game Events` with columns:

```text
Timestamp | Room ID | Event ID | Actor | Type | Created At | Payload JSON
```

Follow the existing OAuth refresh and origin-validation pattern from `/Users/jesse/claude/jessemaddox.com/api/menu-submit.mjs`. `GoogleSheetsEventStore.list` reads rows for `brothers-v1`, parses payloads, and returns events in timestamp order. `append` checks the Event ID column before adding one row. Use environment variables `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, and `CHALLENGE_GAME_SHEET_ID`.

- [ ] **Step 6: Verify, bundle, and commit the API**

Add the API bundle to `package.json` without removing the existing scripts:

```json
{
  "scripts": {
    "build:api": "esbuild server/handler.ts --bundle --platform=node --format=esm --target=node20 --outfile=dist-api/challenge-game.mjs",
    "build": "npm run catalog:build && tsc -b && vite build && npm run build:api"
  }
}
```

Run:

```bash
npm test -- server/handler.test.ts src/domain/domain.test.ts
npm run build:api
node --check dist-api/challenge-game.mjs
```

Expected: API and domain tests pass, esbuild creates one ESM function bundle, and Node syntax check exits 0.

Commit:

```bash
git add server package.json package-lock.json
git commit -m "feat: add shared challenge event API"
```

---

### Task 5: Add Identity, Synchronization, and Recoverable Client State

**Files:**
- Create: `/Users/jesse/claude/challenge-game/src/app/api/gameApi.ts`
- Create: `/Users/jesse/claude/challenge-game/src/app/store/gameStore.ts`
- Create: `/Users/jesse/claude/challenge-game/src/app/store/gameStore.test.ts`
- Create: `/Users/jesse/claude/challenge-game/src/app/components/IdentityGate.tsx`
- Create: `/Users/jesse/claude/challenge-game/src/app/components/StatusBanner.tsx`
- Modify: `/Users/jesse/claude/challenge-game/src/app/App.tsx`

**Interfaces:**
- Consumes: `GameSnapshot`, `GameEvent`, and `/api/challenge-game` responses.
- Produces: `useGameStore`, `selectPlayer`, `switchPlayer`, `loadSnapshot`, and `submitEvent` for every screen.

- [ ] **Step 1: Write failing store and identity tests**

Test that selecting Brett writes `challenge-game.player=brett`, reload restores Brett, switching clears only identity, snapshot load does not overwrite identity, a 409 response replaces stale snapshot, and a network failure preserves the current form and exposes retry copy.

Run:

```bash
npm test -- src/app/store/gameStore.test.ts
```

Expected: FAIL because the client store does not exist.

- [ ] **Step 2: Implement the API client**

Create `gameApi.ts`:

```ts
import type { GameEvent, GameSnapshot } from "../../domain/types";

export interface GameResponse {
  revision: number;
  snapshot: GameSnapshot;
  duplicate?: boolean;
}

export async function fetchGame(): Promise<GameResponse> {
  const response = await fetch("/api/challenge-game", { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error("Could not load the shared game.");
  return response.json();
}

export async function postEvent(event: GameEvent, expectedRevision: number): Promise<GameResponse> {
  const response = await fetch("/api/challenge-game", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ event, expectedRevision })
  });
  const data = await response.json();
  if (response.status === 409) return data;
  if (!response.ok) throw new Error(data.error || "Could not save the change.");
  return data;
}
```

- [ ] **Step 3: Implement the Zustand store and identity gate**

The store retains `playerId`, `snapshot`, `loading`, `saving`, `error`, and `retry`. `submitEvent` keeps the visible form state outside the store until the server confirms success. Generate event IDs with `crypto.randomUUID()`.

`IdentityGate` renders three explicit buttons and the copy `Choose your name on this device`. `StatusBanner` renders loading, saving, offline error, retry, and stale-state refresh messages in an `aria-live="polite"` region.

- [ ] **Step 4: Verify and commit identity and synchronization**

Run:

```bash
npm test -- src/app/store/gameStore.test.ts src/app/App.test.tsx
npm run typecheck
```

Expected: store and app tests pass.

Commit:

```bash
git add src/app
git commit -m "feat: add shared identity and sync state"
```

---

### Task 6: Build the Five-Category and Five-Challenge Seeding Flow

**Files:**
- Create: `/Users/jesse/claude/challenge-game/src/app/steps/CategoryPicker.tsx`
- Create: `/Users/jesse/claude/challenge-game/src/app/steps/ChallengePicker.tsx`
- Create: `/Users/jesse/claude/challenge-game/src/app/steps/SeedReview.tsx`
- Create: `/Users/jesse/claude/challenge-game/src/app/steps/WaitingRoom.tsx`
- Create: `/Users/jesse/claude/challenge-game/src/app/components/ChallengeCard.tsx`
- Create: `/Users/jesse/claude/challenge-game/src/app/steps/seeding.test.tsx`
- Modify: `/Users/jesse/claude/challenge-game/src/app/App.tsx`
- Modify: `/Users/jesse/claude/challenge-game/src/styles/app.css`

**Interfaces:**
- Consumes: Catalog facade, `calibratePoints`, player identity, snapshot, and `submitEvent`.
- Produces: A valid `seed.submitted` event with five category IDs and five locked personal scores.

- [ ] **Step 1: Write failing seeding interaction tests**

Tests must prove that the UI:

```tsx
expect(screen.getAllByRole("checkbox")).toHaveLength(20);
await user.click(screen.getByLabelText("Quick Absurdity and Harmless Weirdness"));
expect(screen.getByText("1 of 5 categories selected")).toBeInTheDocument();
expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
```

Add tests that the fifth category enables Continue, each chosen category exposes all 18 challenge cards, one challenge is required per category, the non-commitment copy remains visible, calibration moves one rung, future-round items remain browsable, and submission is disabled until at least two weekly-eligible seeds exist.

Run:

```bash
npm test -- src/app/steps/seeding.test.tsx
```

Expected: FAIL because seeding components do not exist.

- [ ] **Step 2: Implement category selection and challenge browsing**

`CategoryPicker` receives `selectedIds`, `onToggle`, and `onContinue`. It displays all 20 categories without recommendation order. `ChallengePicker` processes one category at a time and displays 18 `ChallengeCard` components.

`ChallengeCard` must show title, instruction, finish line, motivation, default points, one-week label, review flags, and the three calibration choices. Use native radio inputs and retain the exact copy:

```tsx
<p className="notice">You are not agreeing to do these. You are showing us what catches your attention.</p>
```

- [ ] **Step 3: Implement seed review, submission, and private waiting state**

`SeedReview` shows the five chosen challenges, personal points, and one-week status. It permits editing before submit. On confirmation, submit `seed.submitted`.

`WaitingRoom` shows only completion status:

```text
Jesse: Ready
Brett: Choosing
Hunter: Ready
```

It must not reveal any player's categories or challenges until all three seed events exist.

- [ ] **Step 4: Verify and commit the complete seeding flow**

Run:

```bash
npm test -- src/app/steps/seeding.test.tsx
npm test
npm run typecheck
```

Expected: seeding tests pass, the full suite passes, and TypeScript exits 0.

Commit:

```bash
git add src/app src/styles
git commit -m "feat: add full-catalog challenge seeding"
```

---

### Task 7: Build Control, Delegation, Conflict Resolution, and Week Lock

**Files:**
- Create: `/Users/jesse/claude/challenge-game/src/app/steps/ControlChoice.tsx`
- Create: `/Users/jesse/claude/challenge-game/src/app/steps/SelfSelection.tsx`
- Create: `/Users/jesse/claude/challenge-game/src/app/steps/PartnerRanking.tsx`
- Create: `/Users/jesse/claude/challenge-game/src/app/steps/RoundLock.tsx`
- Create: `/Users/jesse/claude/challenge-game/src/app/steps/AssignmentConfirmation.tsx`
- Create: `/Users/jesse/claude/challenge-game/src/app/steps/selection.test.tsx`
- Modify: `/Users/jesse/claude/challenge-game/src/app/App.tsx`

**Interfaces:**
- Consumes: Revealed seed sets, weekly-eligible personal points, partner helpers, and control or ranking events.
- Produces: Three control events, required ranking events, a server-created six-assignment lock, optional swap events, three confirmations, and a server-created seven-day start.

- [ ] **Step 1: Write failing selection tests**

Test both exact paths:

```tsx
await user.click(screen.getByRole("button", { name: "Keep control" }));
expect(screen.getByText("Choose one for Jesse + Brett")).toBeInTheDocument();
expect(screen.getByText("Choose one for Jesse + Hunter")).toBeInTheDocument();
```

```tsx
await user.click(screen.getByRole("button", { name: "Hand over control" }));
expect(screen.getByText("Brett and Hunter will each choose one from your five.")).toBeInTheDocument();
expect(screen.getByText("Completed challenges score double points.")).toBeInTheDocument();
```

Add coverage for distinct self choices, only eligible choices, ranked first and second picks, hidden rankings, waiting for required selectors, and six assignments after lock.

Run:

```bash
npm test -- src/app/steps/selection.test.tsx
```

Expected: FAIL because selection components do not exist.

- [ ] **Step 2: Implement the control explanation and self-selected path**

`ControlChoice` must show a side-by-side comparison with worked examples using a two-point challenge: two points when self-selected and four points when delegated. `SelfSelection` requires two different eligible challenges and explicit assignment to the two pair tracks.

- [ ] **Step 3: Implement delegated ranked selection**

For every recipient who chose delegation, each partner ranks two distinct eligible challenges. The selector sees the recipient's five seeds and calibrated points, not the recipient's private post-round ratings. The interface states that another brother may want the same first choice and that the app will resolve the conflict fairly.

- [ ] **Step 4: Implement waiting and round-lock presentation**

Before lock, show only whose required action is outstanding. After the server returns `round.locked`, show all six assignments, pair attribution, and points. Each recipient chooses **Everything still works** or requests one swap. The original selector resolves the swap from the remaining eligible seed set. When all three recipients confirm, the server records the shared start time and seven-day deadline and the dashboard becomes active.

- [ ] **Step 5: Verify and commit weekly selection**

Run:

```bash
npm test -- src/app/steps/selection.test.tsx src/domain/domain.test.ts server/handler.test.ts
npm run typecheck
```

Expected: all selection, domain, and API tests pass.

Commit:

```bash
git add src/app
git commit -m "feat: add weekly challenge selection"
```

---

### Task 8: Build the Linked Dashboard, Completion Stories, Results, and Debrief

**Files:**
- Create: `/Users/jesse/claude/challenge-game/src/app/dashboard/PartnershipTracks.tsx`
- Create: `/Users/jesse/claude/challenge-game/src/app/dashboard/WeeklyAssignments.tsx`
- Create: `/Users/jesse/claude/challenge-game/src/app/dashboard/CompletionForm.tsx`
- Create: `/Users/jesse/claude/challenge-game/src/app/dashboard/Results.tsx`
- Create: `/Users/jesse/claude/challenge-game/src/app/dashboard/Debrief.tsx`
- Create: `/Users/jesse/claude/challenge-game/src/app/dashboard/dashboard.test.tsx`
- Modify: `/Users/jesse/claude/challenge-game/src/app/App.tsx`

**Interfaces:**
- Consumes: Six locked assignments, completion events, `calculateScores`, deadline, and feedback events.
- Produces: Active round dashboard, completion submission, linked standings, shared outcome, stories, and three post-round debriefs.

- [ ] **Step 1: Write failing dashboard and result tests**

Test that Jesse sees only his two completion actions, all three partnership totals are visible, delegated assignments show doubled points, stories are optional, the completion form requires a felt-difficulty rating, the group result stays in progress through five completions, all six completions trigger the shared win, and the leader is computed from the lower adjacent pair total.

Run:

```bash
npm test -- src/app/dashboard/dashboard.test.tsx
```

Expected: FAIL because dashboard components do not exist.

- [ ] **Step 2: Implement the linked partnership visualization**

Use a compact triangle with three labeled edges on wide screens and three stacked pair cards on narrow screens. The DOM reading order must be:

```text
Jesse + Brett
Jesse + Hunter
Brett + Hunter
```

Each pair shows earned points, two contributing assignments, and completion state. The individual table labels its value **Linked score: your lower partnership total**.

- [ ] **Step 3: Implement completion and optional story submission**

`CompletionForm` restates the finish line, lets the recipient enter up to 2,000 characters, requires felt difficulty from 1 to 5, and submits `assignment.completed`. Do not add proof, approval, photo, or video fields.

- [ ] **Step 4: Implement results and post-round debrief**

`Results` leads with the shared outcome and then shows individual linked standings and all optional stories. If fewer than six assignments finish before the deadline, use `The week ended with X of 6 complete` rather than naming a losing player.

`Debrief` uses six questions from the spec and submits one `feedback.submitted` event. Feedback remains visible only as aggregate counts plus the three `changeNextWeek` responses.

- [ ] **Step 5: Verify and commit the playable round**

Run:

```bash
npm test -- src/app/dashboard/dashboard.test.tsx
npm test
npm run typecheck
npm run build
```

Expected: full suite passes, TypeScript exits 0, client and API builds succeed.

Commit:

```bash
git add src/app
git commit -m "feat: complete weekly challenge round"
```

---

### Task 9: Add Placeholder PWA Metadata, Accessibility Checks, and Admin Recovery

**Files:**
- Create: `/Users/jesse/claude/challenge-game/public/manifest.webmanifest`
- Create: `/Users/jesse/claude/challenge-game/public/placeholder-icon.svg`
- Create: `/Users/jesse/claude/challenge-game/src/app/admin/AdminRecovery.tsx`
- Create: `/Users/jesse/claude/challenge-game/src/app/admin/admin.test.tsx`
- Create: `/Users/jesse/claude/challenge-game/src/app/accessibility.test.tsx`
- Modify: `/Users/jesse/claude/challenge-game/index.html`
- Modify: `/Users/jesse/claude/challenge-game/src/styles/app.css`
- Modify: `/Users/jesse/claude/challenge-game/server/validation.ts`

**Interfaces:**
- Consumes: Existing app flow and event API.
- Produces: Add-to-home-screen metadata, keyboard and screen-reader coverage, and minimal Jesse-only operational recovery actions.

- [ ] **Step 1: Write failing accessibility and admin tests**

Test that every form control has an accessible name, focus moves to the next screen heading after successful transitions, touch controls have the `control` class with 44-pixel minimum height, and admin recovery is hidden unless the local player is Jesse and the URL includes `?admin=1`.

Test only these recovery actions: reopen seeding before the week starts, clear one mistaken uncompleted assignment, and end the current test round. Each action requires a browser confirmation and creates an append-only `admin.recovery` event rather than deleting rows.

- [ ] **Step 2: Add neutral install metadata**

Create `manifest.webmanifest`:

```json
{
  "name": "Challenge Lab",
  "short_name": "Challenges",
  "start_url": "/challenge-lab",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1f2937",
  "icons": [
    {
      "src": "/projects/challenge-game/placeholder-icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any"
    }
  ]
}
```

The placeholder icon contains a simple one-color numeral `3` in a circle and is explicitly replaced when the brand direction arrives.

- [ ] **Step 3: Implement append-only admin recovery**

Extend the event union and server validation with `admin.recovery`. Permit only `actor: "jesse"` and the three named operations. The reducer records correction events and derives current state without removing prior history.

- [ ] **Step 4: Verify and commit operational readiness**

Run:

```bash
npm test -- src/app/accessibility.test.tsx src/app/admin/admin.test.tsx
npm test
npm run typecheck
npm run build
```

Expected: all tests pass and both client and API build.

Commit:

```bash
git add public index.html src server
git commit -m "feat: add install metadata and recovery tools"
```

---

### Task 10: Integrate with jessemaddox.com, Verify Three-Device Play, and Publish

**Files:**
- Create: `/Users/jesse/claude/challenge-game/scripts/deployToSite.mjs`
- Create: `/Users/jesse/claude/challenge-game/scripts/createEventSheet.mjs`
- Create: `/Users/jesse/claude/challenge-game/docs/ALPHA-CHECKLIST.md`
- Generate: `/Users/jesse/claude/jessemaddox.com/projects/challenge-game/`
- Generate: `/Users/jesse/claude/jessemaddox.com/api/challenge-game.mjs`
- Modify: `/Users/jesse/claude/jessemaddox.com/vercel.json`
- Test: `/Users/jesse/claude/jessemaddox.com/tests/challenge-game-function.test.mjs`

**Interfaces:**
- Consumes: Verified `dist/`, bundled API, Google OAuth environment, and website Vercel deployment.
- Produces: `https://jessemaddox.com/challenge-lab`, shared Google Sheet state, API health, and an explicit three-browser alpha checklist.

- [ ] **Step 1: Inspect both repositories and protect unrelated work**

Run:

```bash
git -C /Users/jesse/claude/challenge-game status --short --branch
git -C /Users/jesse/claude/jessemaddox.com status --short --branch
git -C /Users/jesse/claude/jessemaddox.com diff -- vercel.json api projects/challenge-game tests
```

Expected: the challenge-game repository is clean after Task 9. Record any unrelated website changes and do not stage them.

- [ ] **Step 2: Write the failing deployed-function contract test**

Create `tests/challenge-game-function.test.mjs` in the website repo. Import `createHandler` from `../api/challenge-game.mjs`, inject a memory store, and assert empty GET, valid seed POST, duplicate retry, stale revision 409, disallowed origin 403, and invalid player 400.

Run:

```bash
node --test tests/challenge-game-function.test.mjs
```

Expected: FAIL because the bundled function has not been copied.

- [ ] **Step 3: Create the dedicated event spreadsheet without exposing credentials**

`scripts/createEventSheet.mjs` reads `/Users/jesse/.config/google-docs-mcp/token.json`, refreshes OAuth without printing tokens, creates a spreadsheet named `Challenge Game V1 Events`, and prints only its spreadsheet ID. It creates the `Challenge Game Events` header row defined in Task 4.

Run:

```bash
node scripts/createEventSheet.mjs
```

Expected: one spreadsheet ID. Store it in Vercel as `CHALLENGE_GAME_SHEET_ID` for production, preview, and development without committing it. Confirm with `vercel env ls` that the variable name exists in all three environments.

- [ ] **Step 4: Implement a guarded deployment copier**

`deployToSite.mjs` resolves these two exact destinations and exits unless the destination website root ends with `/Users/jesse/claude/jessemaddox.com`:

```js
const appDestination = "/Users/jesse/claude/jessemaddox.com/projects/challenge-game";
const apiDestination = "/Users/jesse/claude/jessemaddox.com/api/challenge-game.mjs";
```

It removes only `projects/challenge-game`, recreates it, copies the contents of `dist/`, and copies `dist-api/challenge-game.mjs` to the exact API destination. It never deletes or rewrites any other website path.

Run:

```bash
npm run build
node scripts/deployToSite.mjs
```

Expected: the script reports copied client file count and the exact API destination.

- [ ] **Step 5: Add the unlisted Vercel route and verify the website repository**

Add this rewrite to `vercel.json` before the general project routes:

```json
{
  "source": "/challenge-lab",
  "destination": "/projects/challenge-game/index.html"
}
```

Run:

```bash
node --test tests/challenge-game-function.test.mjs
./scripts/check-links.sh
git diff --check
git diff -- vercel.json api/challenge-game.mjs tests/challenge-game-function.test.mjs projects/challenge-game
```

Expected: function tests pass, link checker passes, whitespace check is clean, and the diff contains only the challenge-game deployment plus one rewrite.

- [ ] **Step 6: Run the three-browser alpha checklist**

Create `docs/ALPHA-CHECKLIST.md` with exact profiles:

```markdown
# V1 Alpha Checklist

- Profile A selects Jesse, Profile B selects Brett, and Profile C selects Hunter.
- Each profile chooses five different categories and one challenge per category.
- Verify no seed content is visible until all three submit.
- Calibrate at least one challenge down and one up.
- Jesse chooses self-selection. Brett and Hunter choose delegation.
- Submit all required rankings, including one deliberate first-choice collision.
- Verify six distinct assignments and the seven-day deadline.
- Complete five assignments and verify the group remains in progress.
- Complete the sixth and verify shared completion plus lower-pair linked standings.
- Submit all three debriefs and verify the round closes.
- Switch identity on one device and verify shared state remains unchanged.
```

Run locally with `vercel dev` from the website repo and complete the checklist in three separate browser profiles.

- [ ] **Step 7: Commit and publish the source project**

Commit the deployment scripts and checklist:

```bash
git -C /Users/jesse/claude/challenge-game add scripts docs/ALPHA-CHECKLIST.md
git -C /Users/jesse/claude/challenge-game commit -m "chore: add challenge lab deployment workflow"
```

Create the private GitHub remote and push `main`:

```bash
gh repo create jessecmaddox3/challenge-game --private --source=/Users/jesse/claude/challenge-game --remote=origin --push
```

Expected: GitHub creates `jessecmaddox3/challenge-game`, `origin` points to that repository, and local `main` tracks `origin/main`. Do not include `.env`, OAuth tokens, spreadsheet IDs, or website output in the source repository.

- [ ] **Step 8: Commit and publish the website deployment**

Stage only challenge-game paths:

```bash
git -C /Users/jesse/claude/jessemaddox.com add vercel.json api/challenge-game.mjs tests/challenge-game-function.test.mjs projects/challenge-game
git -C /Users/jesse/claude/jessemaddox.com commit -m "feat: publish three-brother challenge lab"
git -C /Users/jesse/claude/jessemaddox.com push origin main
```

Expected: Vercel auto-deploys `main`.

- [ ] **Step 9: Verify production and record the release**

Run:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://jessemaddox.com/challenge-lab
curl -sS -o /dev/null -w "%{http_code}\n" https://jessemaddox.com/api/challenge-game
```

Expected: both commands print `200`.

Verify the live page contains `noindex,nofollow`, select each identity on a real Android or iPhone browser, submit one reversible test event, and confirm it appears in the dedicated sheet. Record the source commit, website commit, test count, deployed URL, and any known alpha limitation in the project handoff only if work remains unfinished or a cross-tool handoff is beginning.

## Plan Self-Review

- **Spec coverage:** Tasks 1 through 10 cover project separation, 360-item content, personal calibration, full seeding, hidden batch commitment, control versus delegation, conflict resolution, linked scoring, shared completion, stories, debrief, server persistence, recovery, mobile access, and deployment.
- **Scope:** The plan produces one cohesive V1. Brand identity, auctions, general groups, native applications, notifications, and public features remain outside the implementation.
- **Type consistency:** Player IDs, pair IDs, point values, events, snapshots, assignments, and API revision fields are defined once and consumed consistently by later tasks.
- **Safety:** Google credentials and spreadsheet IDs stay outside Git. Deployment replaces only the exact generated project directory and API bundle. Website staging is explicit by path.
