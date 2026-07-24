import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { ACTIVITY_LIBRARY, ACTIVITY_CATEGORIES, ACTIVITY_OCCASIONS, RECOMMENDED_ACTIVITY_IDS, STARTER_RULES, STARTER_RULES_CONTENT, STARTER_FOOTNOTE } from '../../src/content/activities';
import { ACTIVITY_ID_ALIASES, canonicalActivityId } from '../../src/content/activityAliases';
import {
  ACTIVITY_CATEGORY_ORDER,
  activityRelevance,
  groupActivitiesForOccasion,
  isActivitySafeForOccasion,
} from '../../src/content/activityBrowse';
import { THEME_PRESETS } from '../../src/content/themes';
import { boardSpecSchema, pointsLabel, pointsValueSchema } from '../../src/models/boardSpec';
import { makeSpec } from '../helpers/fixtures';
import {
  OCCASION_PACKS,
  JESSE_2017_ACTIVITIES,
  JESSE_2017_PLAYERS,
  JESSE_2017_RULES,
  createJesse2017Draft,
} from '../../src/content/occasions';
import { toBoardSpec } from '../../src/store/toBoardSpec';
import { buildBoard } from '../../src/engine/buildBoard';
import { testMetrics } from '../helpers/loadFonts';
import { overflowingRuns, outOfPage } from '../helpers/invariants';

const normalizedActivityTitle = (value: string) => value
  .toLowerCase()
  .replace(/\b(a|an|the|one)\b/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()
  .replace(/\s+/g, ' ');

describe('activity library', () => {
  it('has at least 40 activities, all schema-valid', () => {
    expect(ACTIVITY_LIBRARY.length).toBeGreaterThanOrEqual(40);
    for (const a of ACTIVITY_LIBRARY) {
      expect(a.name.length).toBeGreaterThan(0);
      expect(a.name.length).toBeLessThanOrEqual(90);
      expect(pointsValueSchema.safeParse(a.points).success).toBe(true);
      expect(ACTIVITY_CATEGORIES).toContain(a.category);
      if (a.maxPoints !== undefined) {
        expect(a.maxPoints).toBeGreaterThanOrEqual(1);
        expect(a.maxPoints).toBeLessThanOrEqual(99);
      }
    }
  });

  it('has stable unique ids and useful occasion coverage', () => {
    expect(new Set(ACTIVITY_LIBRARY.map((a) => a.id)).size).toBe(ACTIVITY_LIBRARY.length);
    expect(ACTIVITY_OCCASIONS).toContain('beach-trip');
    expect(ACTIVITY_LIBRARY.filter((a) => /^(bch|bte|kid|fam|sea|ann|fri|gen)-/.test(a.id)).length).toBeGreaterThanOrEqual(170);
    for (const occasion of ACTIVITY_OCCASIONS) {
      expect(ACTIVITY_LIBRARY.filter((a) => a.occasions.includes(occasion)).length).toBeGreaterThanOrEqual(24);
      expect(RECOMMENDED_ACTIVITY_IDS[occasion].length).toBeGreaterThanOrEqual(12);
      expect(RECOMMENDED_ACTIVITY_IDS[occasion].length).toBeLessThanOrEqual(16);
      expect(RECOMMENDED_ACTIVITY_IDS[occasion].every((id) => {
        const activity = ACTIVITY_LIBRARY.find((item) => item.id === id);
        return activity?.occasions.includes(occasion);
      })).toBe(true);
    }
    const kidEligible = ACTIVITY_LIBRARY.filter((a) => a.occasions.includes('kids-weekend'));
    expect(kidEligible.every((a) => !a.adultOnly && a.category !== 'drinking')).toBe(true);
    expect(ACTIVITY_LIBRARY.find((a) => a.id === 'sea-sandcastle')?.occasions).toEqual(['beach-trip']);
    expect(ACTIVITY_LIBRARY.find((a) => a.id === 'sea-pina-colada')?.adultOnly).toBe(true);
    expect(ACTIVITY_LIBRARY.some((a) => a.name === 'Write a 200 to 300 Word Story')).toBe(true);
  });

  it('orders browse categories for Bachelor and Family reunion', () => {
    expect(ACTIVITY_CATEGORY_ORDER.bachelor.slice(0, 5)).toEqual([
      'drinking', 'movement', 'sports', 'games', 'social',
    ]);
    expect(ACTIVITY_CATEGORY_ORDER['family-reunion'].slice(0, 5)).toEqual([
      'kids', 'social', 'games', 'food', 'service',
    ]);
  });

  it('groups every safe activity once and gives Family reunion a Kids lens', () => {
    const groups = groupActivitiesForOccasion(ACTIVITY_LIBRARY, 'family-reunion');
    expect(groups[0]?.category).toBe('kids');
    expect(groups[0]?.activities.some((item) => item.id === 'kid-teaches-game')).toBe(true);
    const groupedIds = groups.flatMap((group) => group.activities.map((item) => item.id));
    expect(new Set(groupedIds).size).toBe(groupedIds.length);
    expect(groupedIds).not.toContain('house-drink');
  });

  it('keeps exact, reusable, generic, and other-occasion ideas in relevance order', () => {
    const exact = ACTIVITY_LIBRARY.find((item) => item.id === 'bch-groom-toast')!;
    const reusable = ACTIVITY_LIBRARY.find((item) => item.id === 'specific-toast')!;
    const generic = ACTIVITY_LIBRARY.find((item) => item.id === 'balance-high-five')!;
    const other = ACTIVITY_LIBRARY.find((item) => item.id === 'kid-puppet-show')!;
    expect([
      activityRelevance(exact, 'bachelor'),
      activityRelevance(reusable, 'bachelor'),
      activityRelevance(generic, 'bachelor'),
      activityRelevance(other, 'bachelor'),
    ]).toEqual([0, 1, 2, 3]);
  });

  it('enforces child-safe browsing without hiding safe cross-occasion ideas', () => {
    const houseDrink = ACTIVITY_LIBRARY.find((item) => item.id === 'house-drink')!;
    const familyToast = ACTIVITY_LIBRARY.find((item) => item.id === 'specific-toast')!;
    expect(isActivitySafeForOccasion(houseDrink, 'kids-weekend')).toBe(false);
    expect(isActivitySafeForOccasion(houseDrink, 'family-reunion')).toBe(false);
    expect(isActivitySafeForOccasion(familyToast, 'kids-weekend')).toBe(true);
  });

  it('ships revised challenge copy and excludes consolidated generic seeds', () => {
    expect(ACTIVITY_LIBRARY.find((item) => item.id === 'bch-best-man-story')?.name).toBe('Share a Favorite Groom Story');
    expect(ACTIVITY_LIBRARY.find((item) => item.id === 'bch-cannonball')?.instruction).not.toMatch(/bystander/i);
    expect(ACTIVITY_LIBRARY.find((item) => item.id === 'bch-hot-wing-run')?.instruction).toMatch(/water/i);
    expect(ACTIVITY_LIBRARY.find((item) => item.id === 'sea-tan-line')?.instruction).not.toMatch(/sunburn/i);
    expect(ACTIVITY_LIBRARY.find((item) => item.id === 'bte-stranger-compliment')?.instruction).not.toMatch(/report their reaction/i);
    expect(ACTIVITY_LIBRARY.find((item) => item.id === 'invite-one-dance')?.instruction).toMatch(/invite/i);
    expect(ACTIVITY_LIBRARY.find((item) => item.id === 'sea-stranger-photo')?.instruction).toMatch(/^Ask/i);
    expect(ACTIVITY_LIBRARY.find((item) => item.id === 'gen-cheers-strangers')?.instruction).toMatch(/invite/i);
    for (const removedId of [
      'bch-cornhole-champ', 'fri-cornhole-champ', 'fri-blind-taste', 'fri-karaoke-song',
      'bch-cold-plunge', 'fri-arm-wrestle', 'gen-group-photo',
    ]) {
      expect(ACTIVITY_LIBRARY.some((item) => item.id === removedId)).toBe(false);
    }
  });

  it('exposes one unambiguous public title for every safe occasion catalog', () => {
    for (const occasion of ACTIVITY_OCCASIONS) {
      const visible = groupActivitiesForOccasion(ACTIVITY_LIBRARY, occasion)
        .flatMap((group) => group.activities);
      const seen = new Map<string, string>();
      for (const activity of visible) {
        const title = normalizedActivityTitle(activity.name);
        expect(
          seen.get(title),
          `${occasion} repeats "${activity.name}" as ${seen.get(title)} and ${activity.id}`,
        ).toBeUndefined();
        seen.set(title, activity.id);
      }
    }
  });

  it('maps every legacy catalog id to a public canonical activity', () => {
    const publicIds = new Set(ACTIVITY_LIBRARY.map((activity) => activity.id));
    for (const [legacyId, canonicalId] of Object.entries(ACTIVITY_ID_ALIASES)) {
      expect(publicIds.has(legacyId), `${legacyId} must not remain public`).toBe(false);
      expect(publicIds.has(canonicalId), `${canonicalId} must remain public`).toBe(true);
      expect(canonicalActivityId(legacyId)).toBe(canonicalId);
    }
    expect(canonicalActivityId('custom-catalog-id')).toBe('custom-catalog-id');
    expect(canonicalActivityId(undefined)).toBeUndefined();
  });

  it('keeps the intentionally distinct dessert variants clearly named', () => {
    expect(ACTIVITY_LIBRARY.find((item) => item.id === 'bte-dessert-share')?.name)
      .toBe("Bride's Dessert Toast");
    expect(ACTIVITY_LIBRARY.find((item) => item.id === 'ann-dessert-share')?.name)
      .toBe('One-Spoon Dessert');
  });

  it('mixes safe reusable ideas into every recommended set', () => {
    for (const occasion of ACTIVITY_OCCASIONS) {
      const canonicalCount = RECOMMENDED_ACTIVITY_IDS[occasion]
        .filter((id) => !/^(bch|bte|kid|ann|fam|fri|sea|gen)-/.test(id)).length;
      expect(canonicalCount).toBeGreaterThanOrEqual(1);
    }
  });

  it('starter rules and footnote satisfy the schema inside a spec', () => {
    const spec = makeSpec({ rules: STARTER_RULES, rulesContent: STARTER_RULES_CONTENT, footnote: STARTER_FOOTNOTE });
    expect(spec.rules.length).toBeGreaterThanOrEqual(4);
    expect(spec.rulesContent).toContain('**HONOR SYSTEM**');
  });
});

describe('theme presets', () => {
  it('every preset merges into a valid spec theme', () => {
    expect(THEME_PRESETS.length).toBeGreaterThanOrEqual(4);
    for (const p of THEME_PRESETS) {
      const spec = boardSpecSchema.parse({ ...makeSpec(), theme: p.theme });
      expect(spec.theme).toBeDefined();
      expect(p.id.length).toBeGreaterThan(0);
      expect(p.name.length).toBeGreaterThan(0);
    }
  });

  it('includes the steven look with the fidelity fields on', () => {
    const steven = THEME_PRESETS.find((p) => p.id === 'steven');
    expect(steven?.theme.allCaps).toBe(true);
    expect(steven?.theme.cornerLabel).toBe('THE GAME');
  });
});

describe('occasion packs', () => {
  it('registers the complete Jesse 2017 source data', () => {
    expect(OCCASION_PACKS.map((pack) => pack.id)).toContain('jesse-bachelor-2017');
    expect(JESSE_2017_PLAYERS).toEqual([
      'Beej', 'Billy', 'Brett', 'Chris B.', 'Chris W.', 'Dan', 'Dave', 'Drew', 'Grant', 'Hugh',
      'Hunter B.', 'Hunter M.', 'James', 'Jesse', 'Jim', 'Jon', 'Kent', 'Luckey', 'Luke', 'Marshall',
      'Mason', 'Matt P.', 'Matt W.', 'Micah', 'Mike', 'Preston', 'Rob L.', 'Rob W.', 'Ryan', 'Steven',
    ]);
    expect(JESSE_2017_ACTIVITIES.map((activity) => [
      activity.name,
      pointsLabel(activity.points, 'dash'),
      activity.maxPoints ?? null,
    ])).toEqual([
      ["Eat the Mystery Thing (It's Edible, Mostly)", '1', null],
      ["Don't Sleep in a Bed", '2', null],
      ['Karaoke Serenade', '1', 2],
      ['Meal Cleanup', '1', null],
      ['Sleep After 3am', '2', 4],
      ['Sleep Before 7pm', '-1', null],
      ['100 Total Pullups', '2', null],
      ['100 Pushups in 10 Minutes', '2', null],
      ['69 Burpees', '2', null],
      ['Canoe Time Trials', '1-5', null],
      ['Catch a Fish (Biggest)', '3', 4],
      ['Indoor Bball Shot', '2', null],
      ['Win Paintball Duel', '2', 4],
      ['Lose Paintball Duel', '1', 4],
      ['Throwing Axe Bullseye', '2', null],
      ['Win a Game of CanJam', '1', null],
      ['Win a Game of Stump', '1', null],
      ['Win Game of Chess', '1', null],
      ['Win Hide and Seek', '2', 4],
      ['2 Shots in a Row', '2', 4],
      ['Beer Bong', '2', 4],
      ['Buffalo Someone', '1', 4],
      ['Spin Coin, Finish Beer First', '2', 4],
      ['Hit Target with Football', '1', null],
      ['Life Someone', '1', 4],
      ['Shotgun a Beer', '1', 3],
      ['Bleed (Involuntarily)', '1', null],
      ['Eat a (Really Hot) Pepper', '2', null],
      ['Jump in the Lake', '2', 4],
      ['Throw Up', '2', 8],
      ['Drink 2 Beers in Handcuffs', '2', null],
      ['Beer Pong Tournament', '0-4', null],
      ['Ping Pong Tournament', '0-4', null],
      ['Pool Tournament', '0-4', null],
      ['RPS Tournament', '0-4', null],
      ['Know the Name', '2', null],
      ['Bonus Awarded by Bachelor', '1-5', null],
    ]);
    expect(JESSE_2017_RULES.map((rule) => rule.heading)).toEqual(expect.arrayContaining([
      'SECTION 1. GAME RULES',
      'SECTION 6. TERM',
    ]));
    expect(JESSE_2017_RULES.at(-1)?.text).toContain('TOTAL COMBINED LIFESPAN');
    const rulesSource = JESSE_2017_RULES.map((rule) => `${rule.heading}\n${rule.text}`).join('\n\n');
    expect(createHash('sha256').update(rulesSource).digest('hex')).toBe(
      '2c28881e7c016800d944abd422c0686737fa846d63dd5acd894aa63f7a1b3244',
    );
  });

  it('labels the historical preset as My Bachelor Party Weekend', () => {
    expect(OCCASION_PACKS.find((pack) => pack.id === 'jesse-bachelor-2017')?.name).toBe('My Bachelor Party Weekend');
  });

  it('maps every listed activity exactly and parses to a valid BoardSpec', () => {
    const draft = createJesse2017Draft();
    const parsed = toBoardSpec(draft);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.spec.players).toEqual([...JESSE_2017_PLAYERS]);
    expect(parsed.spec.activities.map(({ name, points, maxPoints }) => ({
      name,
      points,
      ...(maxPoints !== undefined ? { maxPoints } : {}),
    }))).toEqual(JESSE_2017_ACTIVITIES);
    expect(parsed.spec.pointsRangeFormat).toBe('dash');
    expect(parsed.spec.totalsTarget).toBe(100);
    expect(parsed.spec.cornerBoxes).toHaveLength(4);
  });

  it('creates fresh independent editor rows on every load', () => {
    const first = createJesse2017Draft();
    const second = createJesse2017Draft();
    expect(first.activities[0]!.uid).not.toBe(second.activities[0]!.uid);
    first.players[0] = 'Changed';
    first.rulesContent = 'Changed';
    expect(second.players[0]).toBe('Beej');
    expect(second.rulesContent).not.toBe('Changed');
  });

  it('builds a feasible portrait scene without dropping the agreement tail', () => {
    const parsed = toBoardSpec(createJesse2017Draft());
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const built = buildBoard(parsed.spec, testMetrics());
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.scene.widthIn).toBe(60);
    expect(built.scene.heightIn).toBe(48);
    const sceneText = built.scene.primitives
      .filter((p) => p.kind === 'text')
      .map((p) => p.text)
      .join(' ');
    for (const label of parsed.spec.cornerBoxes) expect(sceneText).toContain(label);
    expect(built.scene.primitives.some((p) => p.kind === 'text' && p.text === 'GAME RULES:')).toBe(false);
    expect(built.scene.primitives.some((p) => p.kind === 'text' && p.text === 'BUFFALO')).toBe(true);
    expect(built.scene.primitives.some((p) => p.kind === 'text' && p.text === 'BEER PONG')).toBe(true);
    expect(built.scene.primitives.filter((p) => p.kind === 'text' && p.rotate === -45)).toHaveLength(31);
    expect(sceneText).toContain('TOTAL COMBINED LIFESPAN OF ALL MEMBERS OF THE TEAM.');
    expect(sceneText).toContain('0-4');
    expect(built.scene.primitives.filter((p) => p.kind === 'text' && p.text === '100')).toHaveLength(1);
    expect(overflowingRuns(built.scene, testMetrics())).toEqual([]);
    expect(outOfPage(built.scene)).toEqual([]);
  });
});
