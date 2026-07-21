# Three-Brother Challenge Lab V1 Design

> **TL;DR:** Build a mobile-first web game for Jesse, Brett, and Hunter that exposes all 360 challenge candidates, lets each brother seed five challenges from five chosen categories, and runs one real seven-day challenge round. Each player calibrates the five challenges for personal difficulty, then either chooses two for himself at base points or lets his brothers choose one each from his preapproved five for double points. Completed challenges score on the relevant two-person partnership track. The first release is intentionally a mechanics lab with plain placeholder styling, durable shared state, and a short debrief rather than a claim that the permanent game has been solved.

## Recommendation

Build one complete playable loop before adding surveys, bidding, native applications, invitations, or permanent league rules. The first round should be simple enough to explain in one screen while still testing the most distinctive ideas: broad content discovery, recipient-controlled eligibility, delegated choice, personalized relationships, linked partnership scores, and a shared weekly finish line.

The application should use a neutral working title and intentionally plain visual shell. Jesse will explore names, logos, and visual directions with Claude and Gemini in parallel. The product should accept a later theme without changing the game state, content model, or screen flow.

## Product Promise

Give three brothers a structured reason to choose worthwhile, funny, useful, or stretching experiences for themselves and one another, then learn which rules make them want to do it again.

## V1 Participants and Access

- The only players are Jesse, Brett, and Hunter.
- The application is a mobile-first website available on Android, iPhone, and desktop browsers.
- It is hosted at an unlisted, `noindex` path on `jessemaddox.com`.
- The first screen asks the visitor to choose Jesse, Brett, or Hunter. The device remembers the choice and provides a visible **Switch brother** action.
- There are no accounts, passwords, invitations, email addresses, phone numbers, or general-purpose group creation.
- Name selection is convenience rather than security. The app must not store sensitive personal information.
- Shared state is durable and synchronized through a small server-side event store.

## V1 Experience

### 1. Choose a Brother

The visitor selects one of three large name buttons. The selected identity is stored locally on the device. The server validates that every submitted action names one of the three known players.

### 2. Pick Five Categories

The player sees all 20 atlas categories with concise descriptions and chooses exactly five. This step is about interests and curiosity, not a commitment to perform anything.

The category screen must show enough range to make the breadth of the product legible. It should not rank, recommend, or preselect categories in V1.

### 3. Seed Five Challenges

For each selected category, the player sees all 18 challenges in that category and chooses one. The result is a personal seed set of exactly five challenges.

The interface repeatedly states:

> You are not agreeing to do these. You are showing us what catches your attention.

Each card shows the title, concrete instruction, finish line, general size, default points, primary motivational job, and any relevant review flag. The full 360-item atlas is available through the category flow. V1 does not reduce it to the 80-item editorial shortlist.

After selecting each challenge, the player calibrates its default points with one tap: **Easier for me**, **About right**, or **Bigger for me**. Calibration moves the score at most one rung on `1 → 2 → 3 → 5`. If the challenge is already routine and creates no personal stretch, the player replaces it rather than retaining a trivial scoring option. Personal points lock before either brother can choose a weekly assignment.

Selections remain private until all three brothers have completed seeding. They are then revealed together. This prevents later choices from being shaped by another player's visible progress or preferences.

### 4. Choose Control or Delegation

Each brother chooses one of two paths for the first weekly round.

**Keep control:** The player selects two distinct challenges from his own five. He assigns one to his partnership with each brother. Completion earns the locked personal points on the relevant partnership track.

**Hand over control:** Each of the other brothers selects one distinct challenge from the player's five. Completion earns double the locked personal points on the relevant partnership track.

The five-item seed set is the consent boundary. A brother cannot assign something outside the recipient's own five in V1. If circumstances have changed, the recipient can request one swap before the week begins. The selecting brother then chooses a different item from the remaining seed set. There is no penalty or public rejection label.

If both selecting brothers want the same challenge, each submits a ranked first and second choice privately. The application resolves the conflict so the two final challenges are distinct. A random priority coin flip determines who receives the contested first choice, and the other partnership receives its second choice. The coin-flip winner rotates in the next round.

### 5. Lock the Week

All six assignments are locked before any are revealed as final and before the seven-day clock begins. This batch commitment rule is the first safeguard against standings-based sabotage.

The week starts when all three players have two locked assignments. V1 uses a seven-day window. The shared dashboard shows the common deadline, current assignments, and each brother's completion state.

### 6. Complete and Reflect

Each player can mark an assignment **Done** and optionally add a short story or note. Proof, approval, photos, and video are not required.

At completion, the player privately rates how difficult the challenge actually felt. This rating is research data and does not alter the current week's score. It will help recalibrate base points and personal difficulty in later rounds without creating an argument during V1.

At the end of the week, each brother answers a compact debrief:

- Did the challenge feel well matched?
- Did choosing or delegating feel motivating?
- Did the points feel fair?
- Did the partnership score make you care about the other person's result?
- Should this challenge appear again?
- What should change next week?

This is a post-round debrief, not an onboarding preference survey.

## Points and Linked Partnerships

V1 begins with the atlas's four size bands and the familiar nonlinear point scale. The challenge-level audit retains the atlas band for 347 challenges and defines a separate gameplay override for 13. The complete mapping and rationale live in `docs/product/2026-07-21-challenge-difficulty-scoring-audit.md`.

| General size | Typical burden | Base points | Delegated points |
|---|---|---:|---:|
| Spark, S | Roughly 2 to 15 minutes with little preparation | 1 | 2 |
| Nudge, M | Roughly 15 to 90 minutes or modest social effort | 2 | 4 |
| Stretch, L | Meaningful preparation, discomfort, persistence, or several steps | 3 | 6 |
| Quest, XL | Multi-day, event-scale, costly, or consequential | 5 | 10 |

Every published default point value must be stored on the challenge record rather than inferred in the interface. The recipient can move it one rung down or up before weekly selection. The resulting personal score cannot increase after a selector is revealed. The delegation multiplier is applied only after personal calibration.

There are three shared partnership tracks:

- Jesse and Brett
- Jesse and Hunter
- Brett and Hunter

When Jesse completes the challenge assigned to his Brett slot, those points go to Jesse and Brett's shared track. Brett's challenge for the Jesse slot also scores on that same track. Each pair can therefore receive points from two completed assignments per week.

Each brother's competitive linked score is the lower of his two partnership scores. The highest linked score leads the individual standings. This prevents a player from winning by investing in only one relationship.

The group victory condition is completion of all six accepted challenges within the weekly window. The individual standings exist inside that shared result. If the group misses the shared condition, the dashboard still records completed challenges and stories without labeling an individual a failure.

## One-Week Eligibility

The browsing and seeding flow shows the entire atlas, including long Quests. A player may seed a challenge that cannot reasonably finish in seven days because the seed set also captures product interest.

Before control or delegation is chosen, the app labels each seed as either **This week** or **Future round**. Every player must have at least two **This week** options before the round can lock. If fewer than two of the original five qualify, the player adds weekly alternates from any of the five selected categories. The original five remain recorded as the preference seed.

V1 does not silently shrink or rewrite long challenges to force them into a week.

## Screens and Components

The initial interface should be functional, responsive, and intentionally neutral.

1. **Identity:** Three brother buttons, working-title explanation, and privacy note.
2. **Home:** Current phase, next required action, three-player status, and linked partnership diagram.
3. **Category picker:** All 20 categories, five-selection counter, and continue action.
4. **Challenge browser:** One selected category at a time, 18 complete cards, base points, and one selection.
5. **Seed review:** Five chosen challenges and the non-commitment explanation.
6. **Waiting room:** Shows who has finished seeding without revealing selections.
7. **Round choice:** Keep control or hand over control, with exact scoring consequences.
8. **Partner selection:** Ranked selections from a brother's weekly-eligible seed set.
9. **Round lock:** Six assignments, conflict resolution, swap requests, and start readiness.
10. **Weekly dashboard:** Deadline, two personal assignments, three partnership tracks, linked standings, and group completion progress.
11. **Completion:** Done action, optional story, and private felt-difficulty rating.
12. **Results and debrief:** Group result, linked standings, stories, and short feedback form.

Placeholder presentation should use semantic HTML, large touch targets, accessible contrast, system fonts, and a small set of replaceable CSS tokens. It should not establish a permanent palette, type system, illustration style, logo, or brand voice.

## Content Model

The initial structured catalog contains all 360 challenges. Each record includes:

- Stable challenge ID
- Title
- Instruction and exact finish line
- Category
- General size, default points, and optional personal points
- Primary motivational job
- One-week eligibility
- Time estimate
- Sensitive-topic and review flags
- Lower-friction adaptation when available
- Editorial status

The source atlas remains the editorial reference. The structured catalog becomes the runtime source of truth and receives automated validation for record count, category count, required fields, unique IDs, and point range.

## State and Data Flow

V1 uses an append-only event model so experiments remain auditable and later rules can be compared without rewriting history.

Core records are:

- **Player:** Jesse, Brett, or Hunter
- **Catalog challenge:** Static structured content
- **Seed:** Five categories, five challenges, default points, locked personal points, and weekly alternates
- **Round:** Round number, ruleset version, phase, start, deadline, and status
- **Control choice:** Self-selected or delegated
- **Selection:** Selector, recipient, pair track, ranked choices, resolved challenge, and multiplier
- **Completion:** Assignment, timestamp, optional story, and felt-difficulty rating
- **Feedback:** Round-specific debrief answers
- **Event:** Idempotency key, actor, action, payload, and timestamp

The client loads a read-only snapshot, submits one validated action at a time, and then reloads the canonical snapshot. Server actions enforce the current round phase and reject stale or duplicate transitions.

## Hosting and Storage

This product has crossed the threshold from a board-generator extension into a persistent project. After Jesse approves this spec, create a sibling source project at `~/claude/challenge-game`. Keep the existing `bachelor-game-claude` repository as the research and editorial source during the transition.

The source application should use React, TypeScript, Vite, and a mobile-first responsive shell. Its production build deploys to `jessemaddox.com/projects/challenge-game/`, with an unlisted vanity path configured in Vercel.

For V1, use a Vercel serverless API and a dedicated Google Sheet as a lightweight append-only event store. This follows existing, tested infrastructure on `jessemaddox.com`, avoids introducing another vendor before the mechanic is proven, and leaves a clean migration path to a relational database later. The API owns validation, idempotency, and snapshot reconstruction. Browser code never receives Google credentials.

## Error Handling and Recovery

- Every write uses a client-generated idempotency key so retries cannot duplicate selections or completions.
- A failed save leaves the local screen intact and offers a clear retry action.
- The server rejects actions submitted for the wrong round phase and returns the latest state.
- A player can revise category and seed choices until all three players lock seeding.
- A pre-week swap request pauses only the affected assignment, not the entire application.
- Jesse has a minimal admin recovery view for reopening a phase, correcting a mistaken identity action, or ending a test round. Admin recovery is operational tooling, not a normal game mechanic.
- Event history is never destructively rewritten during V1.

## Testing and Verification

Automated tests cover:

- Exactly 360 catalog records and 18 challenges in each of 20 categories
- Unique challenge IDs, audited default points, and valid personal calibration
- Exactly five category and five seed selections per player
- Private seeds remaining hidden until all three submit
- Self-selected personal scoring and delegated double scoring
- Distinct final assignments after ranked-choice conflict resolution
- Correct partnership attribution in both directions
- Linked score using the lower partnership score
- All six completions required for the shared weekly win
- Idempotent API writes and stale-phase rejection
- Identity persistence and switching
- Mobile viewport behavior, keyboard access, and accessible labels
- Production build and deployed API health check

Manual alpha verification uses three separate browser profiles to complete the entire round from identity selection through debrief.

## V1 Success Test

The first release succeeds if:

- All three brothers finish category and challenge seeding.
- All three understand the control-versus-double-points choice without explanation from Jesse.
- Six assignments lock successfully.
- At least four assignments are completed during the week.
- The pair tracks make each brother notice or care about both other players' progress.
- The debrief produces concrete changes for round two.
- All three want to try another ruleset or another week.

## Explicitly Deferred

- Onboarding preference survey
- Bidding, auctions, and challenge markets
- Permanent difficulty handicaps or dynamic point pricing
- Native Android and iPhone applications
- Accounts, invitations, and arbitrary groups
- Push, email, or SMS notifications
- Public profiles, feeds, reactions, and comments
- Photo and video hosting or proof judging
- AI-generated challenges and public submissions
- A permanent product name, logo, visual identity, or design system
- Treating the current weekly rules as the final game

## Mechanics Research Preservation

The project must maintain a separate Mechanics Library. Every candidate mechanism should record the problem it solves, minimum player count, useful contexts, known risks, research or game precedents, current decision status, and experiment results. Deferred ideas remain available for later rounds and future products rather than disappearing from the active conversation.
