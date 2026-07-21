# Cooperative Rivalry Mechanics Library

> **TL;DR:** Cooperative rivalry works when players need one another to succeed but retain a meaningful reason to outperform one another. The strongest three-player pattern for the challenge product is linked partnership scoring, supported by simultaneous commitments, recipient-controlled eligibility, personal difficulty calibration, and a shared qualification condition. Auctions are valuable for allocating open tasks but are deferred because they tend to send work to whoever finds it easiest rather than whoever would grow most from doing it.

## Recommendation

Treat mechanics as testable tools rather than permanent product identity. Each weekly round should use a named ruleset, record what happened, and preserve the results. Add a mechanism only when it addresses an observed problem.

The first round tests linked partnerships, a shared completion condition, recipient-seeded challenge eligibility, delegated choice, nonlinear difficulty points, and simultaneous locking. Bidding and all other mechanisms remain documented candidates.

## Evaluation Questions

Every mechanic should be evaluated against the same questions:

1. What behavior is it trying to encourage?
2. Who controls the decision and who bears the burden?
3. Does truthful behavior help the player, or does the rule reward gaming?
4. Does it preserve consent and allow a graceful counter?
5. Does it favor existing ability, money, free time, confidence, or social power?
6. Can a losing player sabotage the group?
7. Does it create a story or merely move a number?
8. Is the explanation simpler than the problem it solves?

## Core Cooperative Rivalry Structures

These structures determine how players can simultaneously root for and compete with one another. The useful distinction is whether cooperation happens through shared pair scores, a shared survival condition, or parallel team and individual standings.

| Mechanic | How it works | Best use | Main risk | Current status |
|---|---|---|---|---|
| Linked partnerships | Every pair shares a score; a player's result depends on both partnerships | Exactly three players with overlapping relationships | A weak partnership can feel punitive | Test in V1 |
| Shared qualification gate | Nobody can win individually until the group reaches a minimum result | Groups that should help the last person cross a finish line | A losing player can hold the group hostage | Test through six-completion weekly goal |
| Dual standings | The same action contributes to individual and team standings | Leagues, sales teams, sports, family competitions | Players may optimize only the more prestigious table | Candidate |
| Weakest-link score | A player's or team's result equals its lowest component | Preventing neglect and encouraging balanced support | One miss can dominate all other effort | Test gently through lower partnership score |
| Personal objectives inside a group goal | Each player has a private or individual target while protecting a public result | Replayable groups with trust and negotiation | Hidden goals can create suspicion or sabotage | Later experiment |
| Multiple winners with personal rivals | Each player must beat a designated rival while preserving the shared system | Larger negotiation games | Hard to explain and vulnerable to kingmaking | Research only |

The closest direct precedent is *Between Two Cities*. Each player builds one city with the neighbor on each side, and the player's final score is the lower of those two city scores. Winning therefore requires balanced attention to both partnerships. [Official Stonemaier description](https://store.stonemaiergames.com/products/between-two-cities-essential-edition)

*New Angeles* combines a shared failure condition with personal rivalries. Players must keep the city productive, but each corporation also wants more capital than its secret rival. If the city fails, nobody wins. [Official Fantasy Flight rulebook](https://images-cdn.fantasyflightgames.com/filer_public/ae/bb/aebb1411-1b59-4bb2-a5c3-142e313a972b/ad03_rulebookcompressed.pdf)

Formula 1 illustrates dual standings in ordinary life: the same race points feed both the individual Drivers' Championship and the team Constructors' Championship. [Formula 1 championship guide](https://www.formula1.com/en/latest/article/the-beginners-guide-to-the-f1-drivers-championship.53MjXJzTDxQnfxfoCLnxNZ)

## Choice, Consent, and Challenge Assignment

Choice mechanisms determine how much control the recipient retains. More options do not automatically create fairness. The proposer's incentives must be tied to the recipient receiving something worthwhile.

| Mechanic | How it works | Best use | Main risk | Current status |
|---|---|---|---|---|
| Recipient-seeded pool | Recipient first identifies acceptable or interesting options | Trust-preserving personalized challenges | Favorites may not all be practical this week | Test in V1 |
| Same-tier Three Doors | Sender offers three options with comparable burden | Autonomy without obvious easy-point farming | Difficulty estimates may be wrong | Later round |
| Difficulty-ladder Three Doors | Sender offers an easy, medium, and hard path | Visible voluntary stretch and risk-reward choice | Easy option may dominate | Later round |
| Cut and choose | One person creates the division or menu; the other chooses | Fair allocation when the proposer shares consequences | Proposer can exploit unequal information | Candidate |
| Ranked partner selection | Two selectors rank choices and the system resolves conflicts | Simultaneous assignment without first-mover advantage | Extra interaction cost | Test in V1 |
| Counter or same-spirit alternative | Recipient requests a resized or adapted version | Safety, accessibility, and changed circumstances | Repeated counters can stall play | Required safety valve |
| Rotating curator | One player creates the week's menu or round | Variety and clear responsibility | Curator quality determines the entire round | Later experiment |
| Random assignment ring | Each player challenges one designated next player | Even distribution with minimal negotiation | Pairing may be poorly matched | Candidate |

Research on divide-and-choose under uncertain preferences finds that the divider has incentives to diversify options, but also shows that multiple offers can benefit the divider while making the chooser worse off in some settings. The product inference is that three options alone are not enough. The sender must care whether the recipient genuinely wants and completes one. [Divide-and-choose analysis](https://arxiv.org/abs/2207.03076)

## Difficulty and Fairness

Difficulty should be treated like a handicap, not an intrinsic property of an activity. Static points can provide a useful starting estimate, but demonstrated personal burden should improve later rounds.

| Mechanic | How it works | Best use | Main risk | Current status |
|---|---|---|---|---|
| General burden points | Editorial estimate based on time, effort, logistics, exposure, and consequence | Simple first release | Same activity differs sharply by person | Test in V1 |
| Recipient difficulty rating | Recipient rates expected or felt burden | Capturing subjective stretch | Players can inflate ratings when points matter | Collect as non-scoring research first |
| Third-person median | Sender, recipient, and neutral player rate difficulty; median wins | Resolving large disagreements in a three-player group | Adds judgment and friction | Later experiment |
| Personal category handicap | Past ratings adjust future points by person and category | Repeated seasons with different abilities | Requires enough history and can become opaque | Later system |
| Personal-best scoring | Player competes against prior willingness or performance | Health, mastery, and habit challenges | Less direct rivalry | Candidate |
| One-step adjustment | Recipient can move a proposed size up or down one level before accepting | Lightweight personalization | Negotiation may become strategic | Candidate |

The World Handicap System explicitly adjusts competition around demonstrated ability and playing conditions so golfers of different abilities can compete equitably. The product analogue is to measure challenge stretch relative to the recipient rather than treating raw activity as universal difficulty. [USGA purpose of handicapping](https://www.usga.org/content/usga/home-page/handicapping/roh/Content/rules/1%201%20Purpose%20of%20the%20World%20Handicap%20System.htm)

Large-scale walking-challenge analysis found that highly unequal participant matching weakened the benefit of competition. This supports personalized baselines and comparable commitments rather than raw totals. [Walking challenge analysis](https://arxiv.org/abs/1702.07437)

## Scoring and Anti-Farming Levers

These levers control whether players can win by repeating low-cost actions. They should be added carefully because some quick challenges are valuable precisely because they are easy and funny.

| Lever | What it changes | Useful when | Main risk | Current status |
|---|---|---|---|---|
| Nonlinear points | Harder work is more point-efficient, such as 1, 2, 3, 5 | Limited time should reward meaningful stretch | Encourages point disputes or overreach | Test in V1 |
| Delegation multiplier | Surrendering control increases the reward | Autonomy is protected by a preapproved pool | Delegation becomes mathematically automatic | Test in V1 |
| Limited scoring slots | Only a fixed number of completions count | Preventing unlimited easy-task farming | Players may wait for perfect choices | Test with two weekly slots |
| Tier requirement | Qualification requires at least one task from a higher tier | Easy options dominate repeatedly | Can feel compulsory | Later if observed |
| Diminishing repeated rewards | Repeated categories or easy tiers score less | Repetition is crowding out range | Punishes legitimate specialties and humor | Later if observed |
| Set or variety bonus | A mix of categories earns a bonus | Encouraging discovery | Players chase taxonomy instead of meaning | Candidate |
| Progression unlock | Higher tiers become available after earlier completion | Gradual onboarding and safety | Artificial grind | Later system |
| Challenge budget | Senders have limited pressure or burden points to spend | Preventing unlimited large asks | Adds currency management | Candidate |
| Catch-up assistance | Trailing players get selection priority or support | Persistent ability gaps | Can undermine earned standings | Only after evidence |

Ticket to Ride provides a familiar example of nonlinear reward and bounded commitment. Longer routes require more resources and are worth disproportionately more points, while unfinished destination commitments can lose points. [Official rules](https://cdn.svc.asmodee.net/staging-daysofwonder/uploads/2024/07/7201-T2R-Rules-EN-20240423_LOWRES.pdf)

## Timing, Commitment, and Sabotage Controls

Many incentive problems arise from decision timing rather than point values. Locking choices before standings change can remove the opportunity for a player to target someone who has just become safe or vulnerable.

| Mechanic | How it works | Best use | Main risk | Current status |
|---|---|---|---|---|
| Simultaneous commit and reveal | Everyone locks choices before any are shown | Preventing reactive sabotage and copying | Waiting for the final submitter | Test in V1 |
| Fixed weekly cadence | A round has a common beginning and end | Urgency, shared attention, and easy iteration | One week may not fit substantial challenges | Test in V1 |
| Completion-created turn | Finishing earns the right to challenge next | Reciprocal chains | One stalled challenge freezes the game | Preserve for later |
| Preloaded point endowment | Players start with points and lose them on misses | Loss-framed accountability | Misses feel punitive | Research only |
| Random representative | One team member's result determines the team's daily outcome | Spreading accountability in larger teams | Unlucky selection can feel unfair | Research only |
| Fresh-start reset | New week clears or reframes prior misses | Re-entry after failure | Weakens long-term continuity | Candidate |
| Visible goal gradient | Progress is grouped into reachable levels | Sustained multi-step effort | Cosmetic levels can replace real meaning | Candidate |

The STEP UP randomized trial compared support, collaboration, and competition. Its collaboration arm used three-person teams, a randomly selected daily representative, weekly point endowments, and level progression. All gamified arms increased activity during the intervention, with competition producing the largest effect in that study. [STEP UP trial](https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/2749761)

A separate four-arm field experiment found the hybrid design combining cooperation and inter-team competition produced the largest behavioral difference, while not improving self-reported intrinsic motivation. The useful caution is that activity can rise without making the experience more loved. [Hybrid gamification field experiment](https://www.sciencedirect.com/science/article/pii/S1071581923002148)

## Auctions and Markets

Auctions are best when multiple people could perform the same task and privately know their own cost. They are less suitable when the goal is to give a particular person a meaningful stretch.

| Auction form | How it works | Best use | Main risk | Current status |
|---|---|---|---|---|
| Open descending bid | Players successively offer to do a task for fewer points | Theatrical, easily understood open challenges | Strategic timing and race to the bottom | Deferred |
| Sealed reverse bid | Each player privately states minimum acceptable points | Revealing relative burden without anchoring | Players may inflate because points also determine victory | Deferred |
| Reverse Vickrey | Lowest bidder gets the task at the second-lowest bid | One-shot allocation with private costs | Assumptions weaken in repeated social play | Deferred |
| Challenge draft with budgets | Group approves a pool, then players spend limited currency to claim items | Six-item pools and category ownership | Measures desire more than beneficial stretch | Deferred |
| Partnership auction | Potential partners bid for the right to support a recipient | Allocating help where a partner adds unusual value | Can make relationships feel transactional | Research candidate |
| Multi-attribute bid | Bid combines points, assistance, time, or quality | Business task allocation and favors | Complex scoring and negotiation | Future product research |

A reverse Vickrey task auction assigns work to the lowest bidder and pays the second-lowest bid. This can encourage truthful cost revelation under the model's assumptions. In the challenge product, however, victory points are both compensation and competitive score, players interact repeatedly, and personal growth may require assigning the task to someone other than the lowest-cost performer. [CMU task-allocation paper](https://www.cs.cmu.edu/~mberna/mrrg/papers/AAAI051sarned2.pdf)

## Motivation and Relationship Levers

These mechanisms affect why a player cares, not only how points move.

| Mechanic | Purpose | Main risk | Current status |
|---|---|---|---|
| Sender assist credit | Reward a sender when the recipient completes a well-matched challenge | Sender farms easy completions | Candidate |
| Skin in the Game | Sender offers a favor, shared effort, or experience | Fun becomes transactional | Later mode |
| Story Mischief | Challenges build a callback, artifact, or running joke | Harder to score and compare | Later mode |
| Rivalry awards | Recognize best story, boldest try, or most useful act | Too many awards dilute competition | Later season |
| Temptation bundle | Pair a difficult task with a recipient-chosen pleasure | Reward overshadows the action | Content pattern |
| Specific positive feedback | Celebrate the exact effort or story | Requires thoughtful copy | Product requirement |
| Private boundaries | Remember topics and contexts a person never wants | Data sensitivity | Later with real identity controls |

Self-Determination Theory supports autonomy, competence, and relatedness as a safer motivational foundation. Expected tangible rewards can undermine free-choice intrinsic motivation in some contexts, while specific positive feedback can enhance interest. The design implication is to use points for structure and tension without making them the sole meaning of the experience. [Ryan and Deci](https://www.selfdeterminationtheory.org/SDT/documents/2000_RyanDeci_SDT.pdf), [reward meta-analysis](https://selfdeterminationtheory.org/wp-content/uploads/2014/04/1999_DeciKoestnerRyan_Meta.pdf)

## Experiment Log

This table should be updated after every played round. Record observed behavior rather than only opinions.

| Round | Rules tested | What happened | Keep | Change | Next hypothesis |
|---|---|---|---|---|---|
| V1, week one | Recipient-seeded five, self-select at base or delegate at double, linked pair tracks, lower partnership score, all-six shared completion | Not played yet | Not evaluated | Not evaluated | Does delegated choice create motivating tension without weakening consent? |

## Current Decision Register

- **Use now:** Three players, linked pair tracks, lower-partnership individual score, batch lock, recipient-seeded eligibility, two weekly slots, general difficulty points, delegation multiplier, shared six-completion goal, and post-round felt-difficulty ratings.
- **Preserve for a near-term experiment:** Same-tier Three Doors, difficulty-ladder Three Doors, self-curated negotiation, sender assist credit, personal category handicaps, story-based awards, challenge budgets, and rotating curators.
- **Defer until the core loop is understood:** Auctions, open challenge markets, favor stakes, dynamic pricing, public leaderboards, notifications, and automatic recommendation systems.
- **Reject as a default:** Unilateral forced challenges, public proof requirements, unlimited point farming, universally fixed difficulty, and mechanics that reward humiliation, danger, or an unwilling third party.
