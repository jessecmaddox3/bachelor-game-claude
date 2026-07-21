# Challenge Difficulty Scoring Audit

> **TL;DR:** Use a 1, 2, 3, and 5 point ladder for V1, then double the locked personal score when a brother chooses the challenge. A challenge starts with an editorial default based on inherent burden. The recipient can move that score one rung down or up before anyone chooses the weekly assignments. A full 360-item audit recommends retaining the atlas band for 347 challenges and changing 13 gameplay defaults. Four challenges cannot finish within one week as written.

## Recommendation

Use two layers of difficulty:

1. **Default points** estimate the challenge's minimum inherent burden across time, repetition, coordination, cost, effort, exposure, and vulnerability.
2. **Personal points** let the recipient mark the challenge easier or bigger for him by moving at most one rung before his brothers make their selections.

The point ladder is `1, 2, 3, 5`. Brother-selected challenges earn twice the locked personal score, creating final values of `2, 4, 6, 10`.

This is intentionally more compact than Claude Sonnet's independently proposed `1, 3, 7, 15` ladder. Sonnet's steeper scale better represents absolute burden, but the V1 delegation multiplier would produce values up to 30 and allow one Quest to dominate a two-slot weekly round. The compact scale preserves meaningful differences while keeping control versus delegation central.

## Default Point Rubric

Score the required minimum finish line, not an expensive, dangerous, embarrassing, or unnecessarily intense interpretation.

| Points | Band | General expected burden |
|---:|---|---|
| 1 | Spark | Usually 2 to 15 active minutes, one simple action, little preparation, and no meaningful coordination or exposure |
| 2 | Nudge | Usually 15 to 90 minutes, modest preparation, one interpersonal ask, a simple artifact, or a small amount of coordination |
| 3 | Stretch | Usually 90 minutes to a half-day, two to four repetitions within a week, travel or scheduling, or meaningful social, emotional, professional, or physical stretch |
| 5 | Quest | Five or more days of real commitment, an overnight or substantial outing, a formal application or competition, a major favor, or consequential coordination |

Use six dimensions when time alone is misleading:

1. Active time and repetition
2. Planning, coordination, and travel
3. Required money or equipment
4. Physical or cognitive effort
5. Social exposure or reputational stakes
6. Emotional vulnerability or habit disruption

The highest meaningful dimension normally controls. Raise a band only when the burden is inherent to the finish line.

## Personal Calibration

The recipient calibrates only the five challenges in his seed set. This is part of choosing the challenges, not a separate preference survey.

For each seeded challenge, show the default and three options:

- **Easier for me:** Move down one rung.
- **About right:** Keep the default.
- **Bigger for me:** Move up one rung.

The ladder is `1 → 2 → 3 → 5`. The personal score locks before either brother selects the weekly challenges. It may decrease if the challenge is resized for practical reasons, but it cannot increase after the selector is known. If the recipient already does the activity routinely and it creates no stretch, he should replace the seed rather than farm a one-point completion.

The delegation multiplier is applied after calibration.

## Independent Review Comparison

Two read-only reviews examined the atlas from different perspectives. Their disagreement is useful because it exposes the main scoring choice rather than hiding it.

| Review | Proposed ladder | Method | Strongest contribution | Main limitation |
|---|---|---|---|---|
| Claude Sonnet | 1, 3, 7, 15 | Direct mapping of existing S/M/L/XL tags | Strong absolute burden separation and risk-flag review | Did not perform challenge-level retagging; too steep after 2x delegation |
| Detailed scoring analyst | 1, 2, 3, 5 | Full item-level audit with 13 recommended overrides | Machine-usable assignments, compact weekly balance, and precise edge cases | Compact values understate absolute differences between some tasks |

Local validation corrected the raw atlas distribution to 78 Spark, 174 Nudge, 89 Stretch, and 19 Quest entries before gameplay overrides.

## Recommended Default Changes

The audit retains the existing atlas size for 347 of 360 challenges. These 13 should receive a different `defaultPoints` value in the runtime catalog without silently rewriting the editorial source tag.

| ID | Challenge | Atlas points | V1 points | Reason |
|---|---|---:|---:|---|
| 08.14 | Extreme Photo Zoom | 1 | 2 | Requires preparing five images and running the guessing round |
| 09.08 | Desk Escape Sequence | 3 | 2 | Design plus nine minutes of movement in one day |
| 09.14 | Movement Snack Draft | 3 | 2 | Three two-minute movements and minimal setup |
| 09.16 | Choose-Your-Own Triathlon | 3 | 2 | Thirty accessible minutes is generally a Nudge |
| 09.18 | Three-Date Movement Pact | 5 | 3 | Three modest sessions within one week, not a Quest by default |
| 11.01 | Hydration Anchor | 3 | 2 | Three cues during one day |
| 11.03 | The Ten-Minute Landing | 5 | 3 | Three ten-minute routines across three nights |
| 11.04 | Energy Field Notes | 3 | 2 | Three brief logs and one observation in one day |
| 11.13 | Two-Evening Cannabis Pause | 5 | 3 | Two evenings is a Stretch baseline; personal calibration may raise it |
| 12.13 | Shortcut Relay | 1 | 2 | Requires learning and coordinating with two other people |
| 14.08 | Fact-Check the Broadcast | 1 | 2 | Primary-source verification and reporting generally exceeds a Spark |
| 16.18 | Twenty-Four-Hour Creation | 5 | 3 | The prompt specifies a small project completed within one day |
| 17.11 | Recommendation Swap | 5 | 3 | One local outing within seven days is generally a Stretch |

## Machine-Usable Assignments

IDs use `category.item` from the atlas. Each array contains challenges 01 through 18 in order after applying the 13 overrides.

```json
{
  "01": [1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1],
  "02": [2,2,3,2,3,2,2,3,1,2,3,3,2,1,3,3,2,2],
  "03": [1,1,1,1,1,2,1,1,2,1,1,2,1,2,2,2,2,1],
  "04": [1,2,3,2,3,2,2,1,2,2,3,2,3,2,2,1,3,3],
  "05": [3,2,3,2,1,1,2,2,2,2,1,3,3,2,3,2,2,2],
  "06": [2,2,3,2,2,3,2,3,2,2,2,3,2,2,1,2,2,1],
  "07": [1,1,2,2,1,1,2,2,2,1,2,2,2,1,2,2,2,2],
  "08": [2,2,2,2,1,2,3,2,2,1,2,2,2,2,2,2,2,2],
  "09": [1,1,2,1,2,1,2,2,2,2,2,2,1,2,2,2,2,3],
  "10": [2,2,2,2,3,2,3,1,2,1,2,3,2,2,3,2,3,3],
  "11": [2,3,3,2,3,2,2,2,2,1,3,2,3,3,3,2,3,2],
  "12": [2,2,2,3,2,2,1,2,3,2,2,3,2,3,3,3,2,1],
  "13": [1,2,1,3,2,2,3,2,2,1,3,3,2,3,1,2,2,5],
  "14": [2,2,1,2,2,2,2,2,2,2,2,2,3,2,1,2,2,2],
  "15": [2,3,2,2,1,2,2,2,2,2,3,1,2,2,3,2,1,1],
  "16": [2,2,2,1,3,2,2,2,3,3,1,2,3,2,3,3,2,3],
  "17": [2,2,2,2,2,3,2,3,3,3,3,3,3,2,3,3,3,3],
  "18": [2,2,1,3,2,1,1,2,2,5,2,3,2,2,2,2,1,3],
  "19": [1,1,5,3,3,2,2,1,3,5,5,5,5,5,5,3,3,5],
  "20": [3,3,2,2,2,5,3,3,3,5,3,2,3,3,5,3,3,5]
}
```

Validation passed: 360 assignments, 20 categories, and 18 positions per category.

## Gameplay Distribution

After the 13 overrides, most challenges are two-point Nudges. That is desirable for a first weekly game because most choices create a meaningful action without becoming a project.

| Default points | Count | Share |
|---:|---:|---:|
| 1 | 75 | 21% |
| 2 | 182 | 51% |
| 3 | 89 | 25% |
| 5 | 14 | 4% |
| **Total** | **360** | **100%** |

The average baseline is 2.16 points.

## One-Week Conflicts

Four entries cannot finish inside a seven-day round as written. They remain visible during discovery but must be labeled **Future round** or receive a separately reviewed one-week adaptation before assignment.

- `19.11 Daily Tiny Drawing`: 14 days
- `19.13 Compliment Practice`: 10 days
- `19.15 Beginner's Twenty Minutes`: 10 sessions
- `20.18 Local Curiosity Month`: one month

Other challenges may depend on event schedules, weather, travel, childcare, cost, equipment, workplace context, a romantic partner, or willing third parties. These are not automatically ineligible, but the recipient must confirm feasibility before the week locks.

## High-Variance Challenges

Several challenges need specific finish lines because their titles cover very different burdens:

- `20.06 Submit Something`: A joke submission and a job application are not equivalent.
- `18.04 Repair Before Replace`: Complexity, tools, safety, and cost vary widely.
- `18.10 Invisible Labor Trade`: Both recurring tasks must be defined before acceptance.
- `12.01 Automate a Pebble` and `12.16 Open Data Story`: Existing technical skill can change burden by hours.
- Career challenges: Workplace culture and professional consequences can dominate time.
- Friendship, romance, and performance prompts: Emotional exposure varies more than duration.
- Movement challenges: Scale against ability, pain, fitness, and environment, never raw volume.
- Health and substance prompts: Private opt-in only, with no public proof or competitive escalation.
- Challenges requiring another person: Success must be the respectful attempt when the third party's consent controls the outcome.

## Validation Rules

The runtime catalog should fail validation when:

- A challenge lacks an atlas ID, default points, or one-week status.
- Default points fall outside `1, 2, 3, 5`.
- Personal calibration moves more than one rung.
- Personal points change upward after partner selection begins.
- The delegation multiplier is applied before calibration.
- A known multi-week challenge is assigned without an approved one-week adaptation.
- A challenge awards more points for optional danger, spending, humiliation, or volume.
