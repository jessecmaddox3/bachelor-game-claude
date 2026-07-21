# Category-Ranked Activity Picker Design

## TL;DR

Replace the occasion dropdown with compact radio cards and place saved-board loading in the same Setup section. Replace the large activity cards with dense rows grouped by occasion-ranked categories. Every safe idea remains discoverable, while exact and reusable matches rank first. Custom wording and points move into an explicit editor mode. A small custom-idea form adds an idea only to the current board; central collection is deferred.

## Goals and Scope

This revision makes the existing poster builder faster to scan without changing the board engine, export system, or future Challenge Chain product. A user should be able to choose an occasion, understand the most relevant kinds of activities, select a useful board quickly, and still search the full safe catalog.

The release must:

- show all eight occasions as accessible radio-card choices;
- place saved-board selection and `Load preset` beside the occasion choices on desktop and directly below them on mobile;
- display compact activity rows grouped by category;
- rank categories and activities for the selected occasion without hiding safe ideas from other occasions;
- use one catalog record for ideas that work across several occasions;
- keep customization out of the normal picker until a user explicitly opens it;
- let a user add a custom activity to the current board;
- defer central custom-idea collection until a backend exists;
- clean ambiguous, role-dependent, unsafe, or awkward challenge copy.

## Setup Interaction

The occasion section becomes a split layout. The main area contains eight native radio inputs presented as compact cards. The secondary area contains the saved-board selector, a short replacement warning, and `Load preset`. Native radio behavior preserves keyboard navigation and a single selected value.

Changing the occasion updates `draft.libraryOccasion` but does not delete selected activities. Loading a saved board remains the only action that replaces the draft and requires confirmation when the current draft contains work.

On narrow screens, the radio cards use two columns and the saved-board panel moves below them. The section remains the first Setup decision.

## Catalog Model and Relevance

`PresetActivity.occasions` remains the eligibility and reuse field. A new optional `primaryOccasion` records where a strongly themed idea belongs first. A new optional `browseTags` array supports a secondary browse lens such as `kids` without replacing an activity's action category. Generic activities have no primary occasion. Occasion-specific seed activities keep their source occasion as primary only when their wording is genuinely occasion-specific.

The implementation must consolidate generic duplicates such as cornhole, sunrise, blind taste tests, cold plunges, arm wrestling, karaoke, group photos, and scavenger hunts into one canonical multi-occasion activity. The strongest title and instruction become the canonical record, while duplicate seed rows are excluded from the public catalog and recommended lists. This preserves themed ideas such as a groom toast or interviewing an elder while making reuse real rather than showing near-identical rows.

The picker does not filter to only `occasions.includes(selectedOccasion)`. It filters only for safety, search, selected-only mode, and the user's explicit category expansion. Within every category, activities sort by this stable score:

1. `primaryOccasion` matches the selected occasion.
2. `occasions` contains the selected occasion.
3. The activity is generic or broadly tagged.
4. The activity belongs primarily to another occasion.

Ties sort by difficulty (`easy`, `stretch`, `quest`), then name. This makes the top of each section useful and predictable while keeping the complete catalog available.

Kids weekend hides every `adultOnly` and `drinking` item. Family reunion shows an adult item only when it is explicitly tagged for family reunion, such as a mild family toast. Dangerous or humiliating 2017 legacy rows remain isolated in the historical saved board and never enter the public catalog.

## Category Presentation

The internal `movement` key is relabeled `Physical challenges`. `ActivityBrowseCategory` is `ActivityCategory | 'kids'`. A virtual `kids` browse category is available for Family reunion through `browseTags: ['kids']`. When an item could appear in more than one browse category, it is assigned to the first matching category in the selected occasion's ordered list. This prevents duplicate rows. Kids-tagged items retain their normal action category for occasions whose order does not include the Kids lens.

Category order is data, not component conditionals. Each occasion receives an ordered list. Categories with no safe rows are omitted.

The initial order should be:

| Occasion | Category order |
|---|---|
| Bachelor | Adult drinks, Physical challenges, Sports, Games, Social, Bold but safe, Outdoors, Food, Creative, Helpful acts, Learning |
| Bachelorette | Social, Games, Physical challenges, Bold but safe, Adult drinks, Creative, Food, Outdoors, Sports, Helpful acts, Learning |
| Kids weekend | Games, Creative, Physical challenges, Outdoors, Sports, Social, Learning, Food, Helpful acts |
| Anniversary | Social, Creative, Food, Helpful acts, Games, Outdoors, Physical challenges, Bold but safe, Adult drinks, Learning |
| Family reunion | Kids, Social, Games, Food, Helpful acts, Creative, Outdoors, Sports, Learning, Physical challenges, Adult drinks |
| Friends weekend | Games, Food, Outdoors, Social, Sports, Adult drinks, Physical challenges, Creative, Helpful acts, Bold but safe, Learning |
| Beach trip | Outdoors, Sports, Physical challenges, Games, Food, Social, Creative, Helpful acts, Adult drinks, Bold but safe, Learning |
| General gathering | Social, Games, Food, Creative, Outdoors, Physical challenges, Sports, Helpful acts, Learning, Bold but safe, Adult drinks |

## Compact Picker

The normal picker contains a search field, `Add recommended set`, `Selected only`, an `Add your own idea` control, a compact category jump row, and the grouped results. The selected count remains visible.

Each category section shows:

- a category heading and selected count;
- up to eight rows initially;
- a `Show N more` control when more rows exist;
- rows that contain a checkbox, short title, one-line instruction, points, and a small relevance or difficulty label;
- a blue selected state without turning the row into a large card.

Search expands matching categories automatically and ignores the per-category initial limit. `Selected only` also shows every selected match. Category jump controls scroll to sections rather than filtering the catalog.

## Explicit Customization Mode

`Customize wording and points` is a secondary button near the selected count. It opens a focused editor view in place of the idea browser. The editor contains only selected rows, the existing points and limit fields, bonus toggles, removal controls, and `Back to ideas`.

The editor is not rendered in the DOM until explicitly opened. Board scoring options remain a separate collapsed optional panel below the normal picker because those options affect the whole board rather than individual ideas.

## Custom Ideas

`Add your own idea` opens a small inline form with `Activity name` and `Points`. The name is required, uses the existing 90-character maximum, and points default to `1`. Submitting creates a selected draft activity with a fresh `uid` and no `catalogId`.

The custom idea persists only as part of the current Zustand draft and browser storage. It is not sent to a server, written to a file, or added to the shared catalog. A later backend can capture the same form through a separate submission interface without changing the draft activity model.

## Copy Cleanup

Activity titles must name an action that any participant can understand. Titles must not assume a confusing role, reward unsafe consumption, pressure strangers, normalize sunburn, or require unwilling bystanders.

Confirmed revisions include:

| Current | Revised |
|---|---|
| Tell Best Man Story | Share a Favorite Groom Story |
| Get Fiancee's Blessing | Get a Pre-Trip Pep Talk |
| Play Wingman | Give the Groom a Great Introduction |
| Survive Hot Wings | Try the Hottest Wing |
| Perfect Cannonball | Win the Cannonball Vote |
| Dance With a Stranger | Invite Someone to Dance |
| Show Off A Tan Line | Spot the Wildest Beach Outfit |

`Win the Cannonball Vote` must be judged on splash or form without targeting bystanders. `Try the Hottest Wing` must allow water and an easy decline. `Spot the Wildest Beach Outfit` must not praise sunburn. Stranger-facing prompts must say `invite` or `ask`, never assume participation.

Instructions must make water, adaptations, consent, and an easy decline available where relevant.

## Proposed New Canonical Ideas

These additions fill useful gaps without duplicating the current catalog. Claude should review them for ambiguity, repetition, safety, and missing occasion tags before implementation.

| ID | Title | Instruction | Category | Browse tag | Points | Occasion tags |
|---|---|---|---|---|---:|---|
| crew-shared-connection | Find the Shared Connection | Pair two people who did not know each other well and find one genuine thing they have in common. | Social | None | 2 | Bachelor, Bachelorette, Family reunion, Friends weekend, General |
| honoree-superlative | Give a Specific Superlative | Give the guest of honor a funny but kind superlative and explain the evidence. | Social | None | 2 | Bachelor, Bachelorette, Anniversary, Family reunion, General |
| photo-caption-contest | Win the Photo Caption | Write a caption for a group photo and win the group's vote. | Games | None | 2 | All |
| team-trick-shot | Land a Team Trick Shot | Complete a safe two-person trick shot with both people contributing. | Sports | None | 3 | Bachelor, Bachelorette, Kids weekend, Family reunion, Friends weekend, Beach trip, General |
| wall-sit-chorus | Wall Sit Through a Chorus | Hold a wall sit, seated adaptation, or equivalent effort through one song chorus. | Physical challenges | None | 2 | Bachelor, Bachelorette, Kids weekend, Friends weekend, General |
| balance-high-five | Complete the Balance High-Five | Hold a safe balance pose with a partner long enough to exchange five high-fives. | Physical challenges | None | 2 | All |
| build-snack-board | Build the Group Snack Board | Arrange a shareable snack board with at least three different foods and label one surprise favorite. | Food | None | 2 | All |
| secret-helper | Complete a Secret Helpful Act | Quietly complete one useful task for the group, leave no clue, and reveal yourself only after someone notices. | Helpful acts | None | 2 | All |
| kid-teaches-game | Let a Kid Teach the Game | Let a child teach the rules of a game, then play one complete round their way. | Games | Kids | 2 | Kids weekend, Family reunion |
| family-lookalike | Find the Family Look-Alike | Find two willing relatives who share a visible expression or mannerism and take a side-by-side photo. | Social | Kids | 2 | Family reunion |
| object-with-story | Find an Object With a Story | Ask someone to choose a nearby object and tell the story that makes it meaningful. | Learning | None | 2 | Anniversary, Family reunion, Friends weekend, General |
| local-recommendation | Follow a Local Recommendation | Ask a local for one safe food, view, or activity recommendation and try it. | Bold but safe | None | 3 | Bachelor, Bachelorette, Friends weekend, Beach trip, General |
| one-song-dj | DJ One Perfect Song | Choose one song for the current moment and get at least three people to agree it fits. | Creative | None | 2 | Bachelor, Bachelorette, Anniversary, Family reunion, Friends weekend, Beach trip, General |
| two-truths-one-lie | Win Two Truths and a Lie | Share two true stories and one invented story, then fool at least half the group. | Social | None | 2 | All |

Each occasion's recommended set should include one or two safe canonical multi-occasion ideas alongside its strongest themed seeds. Recommended IDs must never reference a duplicate seed excluded from the catalog.

## Error Handling and Limits

The existing maximum of 80 selected activities remains. Disabled rows explain the cap through existing UI copy. Empty search results name the active query and offer to clear it. A custom activity with an empty name is not submitted. Invalid points restore the previous value through the existing parser.

Changing occasion never removes selected activities. Loading a preset warns before replacement. Expanding or collapsing category sections never changes selection.

## Testing and Acceptance

Tests must cover native radio behavior, preset proximity in the Setup section, category order for at least Bachelor and Family reunion, relevance sorting, access to an idea from another occasion, kids safety filtering, compact category expansion, explicit customization mode, custom idea creation, and revised ambiguous copy.

Acceptance flow:

1. Choose Bachelor from radio cards and see Adult drinks, Physical challenges, Sports, Social, and Bold near the top.
2. Load the Jesse 2017 saved board from the same Setup section only after explicit confirmation when work exists.
3. Search the complete safe catalog and select a Family reunion or General idea while Bachelor remains selected.
4. Switch to Family reunion and see a Kids category with no duplicate rows.
5. Add a custom activity and see it selected immediately.
6. Open `Customize wording and points`, edit the custom activity, and return to ideas.
7. Verify all 186 existing tests plus the new picker tests, typecheck, production build, and deploy-specific build.
