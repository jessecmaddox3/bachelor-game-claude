# Challenge Chain MVP

> **Status, 2026-07-21:** This remains useful mechanics research, but it is no longer the immediate build target. Jesse redirected the current phase toward broad motivation research, five gameplay options, and a 360-item challenge atlas where humor and fun are first-class outcomes. Private links, turn-passing, backend state, and recovery remain future product concerns. Start with `2026-07-21-challenge-motivation-and-gameplay.md` and `2026-07-21-challenge-atlas-360.md` before using this document as an implementation plan.

> **TL;DR:** Start with one private circle, one active challenge, and one turn. The host lobs first. The recipient completes the challenge on the honor system, taps **I did it**, and immediately earns the next lob. The content library and resulting chain of stories are the product. Defer points, proof, penalties, parallel challenges, notifications, and social-network features.

## Product Promise

A private group of people who trust one another takes turns giving each other specific, worthwhile reasons to do something they would not otherwise do.

The turn is the reward. Complete what was lobbed at you, then choose who goes next and what they should try.

## Core Rules

1. A host creates a private circle for 2 to 12 named people.
2. The host receives the first turn.
3. On a turn, that person chooses another active member and selects a curated challenge or writes a custom one.
4. Pressing **Lob challenge** makes it active immediately. There is no acceptance ceremony in the first release.
5. The recipient completes it and taps **I did it**. Completion is self-attested.
6. A response is optional. Some challenges can invite text or a link, such as pasting a 200 to 300 word story. This is sharing, not verification.
7. Completion transfers the turn to the recipient immediately.
8. The circle home shows the current challenge and a chronological chain of completed challenges.
9. There are no points or leaderboards in the MVP. Difficulty helps people choose an appropriate challenge but is not a score.

## Safety Valve

The expected behavior is to do the challenge. A quiet **Need a different one?** action exists for something unsafe, impossible, inaccessible, misunderstood, or badly matched.

The sender replaces it with a new challenge for the same recipient. There is no penalty, public failure badge, or gamified pass system. The host can reset a genuinely stuck chain.

## State Model

An active circle has exactly one of these states:

1. A named member holds the turn and can lob.
2. One challenge is active for one recipient.

It never has several active challenges at once.

State transitions:

- Host starts circle, then host holds the turn.
- Turn holder lobs, then one assignment becomes active.
- Recipient completes, then assignment closes and recipient holds the turn.
- Recipient requests replacement, then sender substitutes a new assignment.
- Host resets a stalled chain, then restores or transfers the turn.
- Host archives the circle, then its history becomes read-only.

## Minimal Screens

### Create Circle

Circle name, Friends or Family mode, and 2 to 12 display names. Avoid account setup, phone numbers, and email collection.

### Invite

Generate a private member link for each named person. The host copies links into the group’s existing text thread. The MVP does not build notifications.

### Circle Home

One dominant card says either **Jesse is choosing the next challenge** or **Kait challenged Jesse to...** The page has one context-appropriate action, a compact member strip, and the completed chain below.

### Choose Challenge

Filter curated cards by interest, difficulty, time, and setting. Choose the target member, review the exact finish line, and lob it. Include a clearly labeled custom-challenge option.

### Complete

Restate the finish line, offer an optional response field, and show **I did it**. Completion leads directly to a celebratory **Your turn** state.

## Minimal Data

- **Circle:** name, mode, host, status, current turn member, active assignment, settings, timestamps
- **Member:** circle, display name, host/member role, status, private invite-token hash
- **Challenge:** stable ID, title, instruction, exact finish line, interests, audience, difficulty, duration, setting, requirements, safety flags, adaptation, response prompt, pack membership
- **Assignment:** circle, chosen challenge or custom text, sender, recipient, status, lobbed time, completed time, optional response
- **Event:** actor, transition type, assignment, timestamp, and small recovery metadata

Completion and turn transfer must be one atomic server action so double taps cannot create two turns.

## Privacy

- No public discovery, profiles, follower graph, search indexing, or public feed
- High-entropy private links, with token hashes stored server-side
- Display names only
- Existing group chats handle invitations and nudges
- All activity is visible only inside the circle
- Text and outbound links only at first, with no hosted photos or video
- Family circles are adult-created and adult-administered
- Hosts can archive and permanently delete a circle

## Content Requirement

Launch with 60 to 100 editorially finished challenges, not an infinite generator. Each needs a concrete instruction, exact finish line, audience eligibility, interest tags, three-level difficulty, duration, setting, adaptation, and safety review.

The strongest initial interests are:

- Create
- Read and write
- Learn
- Taste and cook
- Move and explore
- Connect and contribute
- Perform and play
- Personal experiments

The current board library and 100-item editorial catalog are the raw material. Multi-day personal experiments should be eligible for lobbing but not automatically appear on a weekend board.

## Explicitly Deferred

- Points, rankings, streaks, prizes, penalties, and consequences
- Proof, witnesses, challenger approval, and photo judging
- Parallel assignments, teams, tournaments, rounds, or seasons
- Password accounts, public profiles, feeds, direct messages, comments, and reactions
- Email, SMS, and push notifications
- AI-generated challenges and public submissions
- Rich-media hosting, maps, location tracking, and payments
- Board and QR integration
- Sophisticated fairness and recommendation algorithms

## Prototype Success Test

The first test is whether a chain survives and creates stories, not whether people browse many ideas.

Test three real circles. A promising result is:

- Each circle completes at least five links
- Most chosen challenges can finish within 48 hours
- Fewer than one in five assignments requests replacement
- At least half of completions include an optional response
- Participants say a challenge chosen by someone who knows them felt more motivating than choosing one alone

If chains stall, inspect challenge quality, sizing, and the one-at-a-time rule before adding notifications, points, or penalties.
