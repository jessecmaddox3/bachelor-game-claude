import type { PointsValue } from '../models/boardSpec';
import { ACTIVITY_SEEDS } from './activitySeeds';

export const ACTIVITY_CATEGORIES = ['social', 'games', 'sports', 'outdoors', 'creative', 'food', 'service', 'learning', 'movement', 'drinking', 'bold'] as const;
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  social: 'Social & performance', games: 'Games & competition', sports: 'Sports', outdoors: 'Outdoors',
  creative: 'Creative', food: 'Food & taste', service: 'Helpful acts', learning: 'Learning',
  movement: 'Physical challenges', drinking: 'Adult drinks', bold: 'Bold but safe',
};

export type ActivityBrowseCategory = ActivityCategory | 'kids';

export const ACTIVITY_BROWSE_CATEGORY_LABELS: Record<ActivityBrowseCategory, string> = {
  ...ACTIVITY_CATEGORY_LABELS,
  kids: 'Kids',
};

export const ACTIVITY_OCCASIONS = ['bachelor', 'bachelorette', 'kids-weekend', 'anniversary', 'family-reunion', 'friends-weekend', 'beach-trip', 'general'] as const;
export type ActivityOccasion = (typeof ACTIVITY_OCCASIONS)[number];

export const ACTIVITY_OCCASION_LABELS: Record<ActivityOccasion, string> = {
  bachelor: '💍 Bachelor Weekend', bachelorette: '🥂 Bachelorette Weekend', 'kids-weekend': '🧸 Kids Weekend',
  anniversary: '💛 Anniversary / Couples', 'family-reunion': '🌳 Family Reunion',
  'friends-weekend': '🏡 Friends Weekend', 'beach-trip': '🏖️ Beach Trip', general: '🎲 General Gathering',
};

export type ActivityDifficulty = 'easy' | 'stretch' | 'quest';

export interface PresetActivity {
  id: string;
  name: string;
  instruction: string;
  points: PointsValue;
  maxPoints?: number;
  category: ActivityCategory;
  occasions: readonly ActivityOccasion[];
  difficulty: ActivityDifficulty;
  formats: readonly ('board' | 'individual-lob')[];
  adultOnly?: boolean;
  primaryOccasion?: ActivityOccasion;
  browseTags?: readonly ActivityBrowseCategory[];
}

const ALL: readonly ActivityOccasion[] = ACTIVITY_OCCASIONS;
const ADULT: readonly ActivityOccasion[] = ['bachelor', 'bachelorette', 'anniversary', 'friends-weekend', 'beach-trip', 'general'];
const GROUPS: readonly ActivityOccasion[] = ['bachelor', 'bachelorette', 'family-reunion', 'friends-weekend', 'beach-trip', 'general'];
const FAMILY: readonly ActivityOccasion[] = ['kids-weekend', 'family-reunion', 'general'];
const CELEBRATIONS: readonly ActivityOccasion[] = ['bachelor', 'bachelorette', 'anniversary', 'family-reunion', 'friends-weekend', 'beach-trip', 'general'];

const a = (
  id: string, name: string, instruction: string, points: PointsValue, category: ActivityCategory,
  occasions: readonly ActivityOccasion[] = ALL, difficulty: ActivityDifficulty = 'easy',
  options: Pick<PresetActivity, 'maxPoints' | 'adultOnly' | 'primaryOccasion' | 'browseTags'> = {},
): PresetActivity => ({ id, name, instruction, points, category, occasions, difficulty, formats: ['board', 'individual-lob'], ...options });

const CONSOLIDATED_SEED_IDS = new Set([
  'bch-cornhole-champ', 'bte-cornhole-win', 'fri-cornhole-champ', 'gen-cornhole-score',
  'bch-sunrise-photo', 'fri-sunrise-watch',
  'fam-taste-test', 'ann-blind-taste', 'fri-blind-taste', 'gen-taste-mystery',
  'fam-photo-recreate', 'ann-photo-recreate',
  'fri-first-coffee', 'fam-timeline-build', 'kid-thank-you-note',
  'fam-help-cleanup', 'fri-plate-wash', 'gen-help-clean', 'fri-cabin-fix',
  'fam-toast-honor', 'gen-toast', 'fri-toast-story',
  'kid-set-table', 'fam-help-setup',
  'bte-card-game-win', 'kid-card-game',
  'bch-dance-floor-stranger', 'bte-dance-with-stranger',
  'kid-talent-show', 'fri-talent-share', 'gen-mini-talent',
  'fam-interview-elder',
  'bch-cold-plunge', 'fri-cold-plunge', 'sea-cold-plunge',
  'bch-arm-wrestle', 'fri-arm-wrestle', 'gen-arm-wrestle',
  'bch-karaoke-solo', 'bte-karaoke-verse', 'fri-karaoke-song',
  'bch-group-photo-pose', 'bte-group-selfie', 'gen-group-photo',
]);

/** Curated public library. The source-faithful 2017 adult rows live only in its historical occasion pack. */
export const ACTIVITY_LIBRARY: PresetActivity[] = [
  // Social and performance
  a('specific-toast', 'Give a Specific Toast', 'Give a short toast that names one true, specific thing about the group or guest of honor.', 1, 'social', CELEBRATIONS),
  a('true-story', 'Tell a True 60-Second Story', 'Tell a true one-minute story about someone in the group.', 1, 'social', GROUPS),
  a('three-voice-read', 'Read a Book in Three Voices', 'Read a short book or scene aloud using at least three distinct character voices.', 2, 'social', FAMILY),
  a('karaoke-song', 'Perform One Full Karaoke Song', 'Perform one complete song, solo or with a willing partner.', 2, 'social', ADULT, 'stretch'),
  a('invite-one-dance', 'Invite Someone for One Dance', 'Invite someone outside your group to join one dance, with no pressure if they decline.', 3, 'social', ADULT, 'stretch'),
  a('talent-share', 'Share a Talent', 'Perform one short song, dance, trick, impression, or other talent for the group.', 2, 'social', ALL, 'stretch'),
  a('secret-skill', 'Teach Your Secret Skill', 'Teach a small skill that most people in the group did not know you had.', 2, 'social'),
  a('story-circle', 'Start a Six-Person Story Circle', 'Gather six people and prompt each person to tell a true two-minute story.', 3, 'social', GROUPS, 'stretch'),
  a('compliment-evidence', 'Compliment With Evidence', 'Tell someone one thing you value about them and include a specific example.', 1, 'social'),
  a('group-anthem', 'Write a Group Anthem Chorus', 'Write and perform a short chorus about the group or occasion.', 3, 'social', CELEBRATIONS, 'stretch'),
  a('family-interview', 'Interview an Older Relative', 'Ask an older relative or friend three questions about childhood and share one answer.', 2, 'social', FAMILY),
  a('invent-handshake', 'Invent a Group Handshake', 'Create a repeatable handshake with at least three moves and teach it to two people.', 1, 'social', ALL),

  // Games and competition
  a('board-game-win', 'Win a Card, Dice, or Board Game', 'Win one complete round of an agreed card, dice, or board game.', 2, 'games', ALL),
  a('chess-win', 'Win a Game of Chess', 'Win one complete game of chess.', 2, 'games', ALL),
  a('rps-best-five', 'Win Rock Paper Scissors, Best of Five', 'Beat another player in a best-of-five match.', 1, 'games', ALL, 'easy', { maxPoints: 3 }),
  a('charades-round', 'Win a Charades Round', 'Get your team to guess the prompt before time expires.', 1, 'games', ALL, 'easy', { maxPoints: 3 }),
  a('honoree-trivia', 'Win Honoree Trivia', 'Answer the most questions correctly in a five-question guest-of-honor trivia round.', 2, 'games', CELEBRATIONS),
  a('puzzle-finish', 'Finish a 100-Piece Puzzle', 'Complete a puzzle of at least 100 pieces with one or more teammates.', 2, 'games', ALL),
  a('scavenger-nine', 'Complete Nine-Square Scavenger Bingo', 'Complete a pre-agreed nine-square observation or photo bingo card.', 2, 'games', ALL),
  a('minute-game', 'Win a One-Minute Challenge', 'Win a safe household minute-to-win-it style challenge.', 1, 'games', ALL, 'easy', { maxPoints: 3 }),
  a('trivia-team', 'Lead a Team to a Trivia Win', 'Captain a team that wins a full trivia round.', 2, 'games', GROUPS),
  a('card-game-teach', 'Teach and Finish a Card Game', 'Teach a card game that half the group has not played and finish one round.', 2, 'games', ALL),

  // Sports
  a('cornhole-win', 'Win a Cornhole Game', 'Win one standard or agreed-shortened game of cornhole.', 2, 'sports', GROUPS),
  a('ping-pong-win', 'Win a Ping Pong Game', 'Win one game of table tennis to the agreed score.', 2, 'sports', GROUPS),
  a('pool-win', 'Win a Game of Pool', 'Win one complete game of pool.', 2, 'sports', ADULT),
  a('mini-golf-hole', 'Win a Mini Golf Hole', 'Post the lowest score in the group on one mini golf hole.', 1, 'sports', ALL, 'easy', { maxPoints: 3 }),
  a('free-throw-three', 'Make Three Free Throws in a Row', 'Make three free throws consecutively from an appropriate distance.', 2, 'sports', ALL),
  a('frisbee-target', 'Hit a Frisbee Target', 'Hit a clearly marked target from an agreed distance.', 2, 'sports', ALL),
  a('three-event-field-day', 'Complete a Three-Event Field Day', 'Compete in three safe, accessible mini-events with a team.', 3, 'sports', GROUPS, 'stretch'),
  a('catch-fish', 'Catch and Responsibly Release a Fish', 'Catch a fish legally and handle or release it according to local guidance.', 3, 'sports', ['bachelor', 'family-reunion', 'friends-weekend', 'general'], 'stretch'),

  // Outdoors
  a('sunrise-view', 'Reach a Viewpoint for Sunrise', 'Reach a legal, safe viewpoint before sunrise with a buddy and transportation plan.', 3, 'outdoors', ADULT, 'stretch'),
  a('new-park', 'Visit a New Park', 'Visit a park no one in your group has used and name its best feature.', 2, 'outdoors', ALL),
  a('quiet-minute', 'Notice Five Sounds Outside', 'Sit outdoors silently for one minute, then name five sounds.', 1, 'outdoors', ALL),
  a('nature-field-guide', 'Make a Five-Item Field Guide', 'Sketch or describe five different leaves, rocks, clouds, or signs of animals.', 2, 'outdoors', FAMILY),
  a('stargaze-constellation', 'Find a Constellation', 'Use a guide to identify one constellation and show it to someone else.', 2, 'outdoors', ALL),
  a('trail-map', 'Draw a Trail Map From Memory', 'Walk a safe route, then draw a map with at least five landmarks.', 2, 'outdoors', ALL),
  a('outdoor-photo-hunt', 'Complete a Five-Photo Nature Hunt', 'Capture five pre-agreed natural subjects without disturbing wildlife.', 2, 'outdoors', ALL),
  a('public-space-reset', 'Leave a Shared Outdoor Space Better', 'Complete a safe cleanup or reset without handling hazardous waste.', 2, 'outdoors', ALL),

  // Creative
  a('short-story-words', 'Write a 200 to 300 Word Story', 'Write a complete story using three words supplied by the group.', 3, 'creative', ALL, 'stretch'),
  a('paper-airplane-test', 'Test Three Paper Airplanes', 'Fold three designs, name them, and measure which flies farthest.', 2, 'creative', ALL),
  a('book-weight-bridge', 'Build a Book-Weight Bridge', 'Build a bridge from paper, tape, or blocks that holds one book for ten seconds.', 3, 'creative', ALL, 'stretch'),
  a('one-minute-documentary', 'Make a One-Minute Documentary', 'Create a sixty-second documentary about an ordinary object.', 3, 'creative', ALL, 'stretch'),
  a('tiny-museum', 'Build a Five-Object Museum', 'Choose five objects, label them, and give someone a two-minute tour.', 2, 'creative', ALL),
  a('family-flag', 'Design a Group Flag', 'Design a flag with three symbols and explain what each represents.', 2, 'creative', ALL),
  a('bad-art-gallery', 'Create a Five-Minute Art Gallery', 'Everyone draws the same subject for five minutes, then gives each work a sincere award.', 2, 'creative', GROUPS),
  a('recreate-photo', 'Recreate an Old Photo', 'Recreate an old group or family photo with every participant’s consent.', 3, 'creative', ['anniversary', 'family-reunion', 'friends-weekend', 'general'], 'stretch'),
  a('twenty-four-hour-project', 'Finish a Creative Project in 24 Hours', 'Define and finish a small song, story, drawing, recipe, game, or object within one day.', 5, 'creative', ADULT, 'quest'),

  // Food and taste
  a('signature-dish', 'Cook a Signature Group Dish', 'Cook one quality dish for at least four people and ask for two tasting notes.', 3, 'food', GROUPS, 'stretch'),
  a('new-cuisine', 'Try One New Cuisine', 'Cook or order one dish from a cuisine you have never knowingly tried.', 2, 'food', ALL),
  a('blind-snack-rank', 'Rank Three Snacks Blind', 'Taste three allergy-safe foods without seeing labels and give each one a tasting note.', 2, 'food', ALL),
  a('three-ingredient-snack', 'Make a Three-Ingredient Snack', 'Create a snack using exactly three agreed, allergy-safe ingredients.', 2, 'food', ALL),
  a('no-recipe-dessert', 'Invent a No-Recipe Dessert', 'Create a simple dessert from available ingredients and give it a name.', 3, 'food', ALL, 'stretch'),
  a('breakfast-group', 'Make Breakfast for the Group', 'Prepare or coordinate breakfast for at least four people.', 2, 'food', GROUPS),
  a('recipe-story', 'Collect a Recipe and Its Story', 'Ask someone for a meaningful recipe and record the story attached to it.', 2, 'food', ['anniversary', 'family-reunion', 'general']),
  a('intimidating-recipe', 'Cook the Intimidating Recipe', 'Make a recipe you have avoided because of one unfamiliar technique.', 3, 'food', ADULT, 'stretch'),

  // Helpful acts
  a('first-up-coffee', 'First One Up Makes Coffee or Tea', 'The first person awake prepares coffee, tea, or breakfast setup for the group.', 2, 'service', GROUPS),
  a('meal-cleanup', 'Complete a Full Meal Cleanup', 'Clear, wash, dry, and reset the meal area without being assigned.', 2, 'service', ALL),
  a('set-table', 'Set the Table', 'Set or reset the table for a group meal with the needed dishes, napkins, and utensils.', 2, 'service', FAMILY),
  a('water-round', 'Run a Water and Snack Round', 'Offer water and a snack option to everyone in the group.', 1, 'service', GROUPS, 'easy', { maxPoints: 2 }),
  a('cabin-improvement', 'Improve One Shared Space', 'Notice and complete one useful shared-space task before anyone assigns it.', 2, 'service', GROUPS),
  a('thank-you-note', 'Write a Specific Thank-You Note', 'Write a short note naming one thing a person did and why it mattered.', 2, 'service', ALL),
  a('kindness-relay', 'Complete a Kindness Relay', 'Do one specific helpful act for another group member, then invite them to continue.', 2, 'service', ALL),
  a('skill-donation', 'Donate One Hour of a Skill', 'Give one hour of a useful skill to a person or organization that requested it.', 3, 'service', ADULT, 'stretch'),
  a('reunion-reset', 'Complete a Ten-Minute Cleanup Relay', 'Work across generations or teams to reset a shared reunion space for ten minutes.', 2, 'service', ['family-reunion']),

  // Learning
  a('unknown-genre', 'Read 50 Pages From a New Genre', 'Read at least fifty pages from a genre you normally avoid and name one strength.', 3, 'learning', ALL, 'stretch'),
  a('teach-one-fact', 'Teach One New Fact', 'Learn one fact well enough to teach it without reading from the source.', 2, 'learning', ALL),
  a('word-collector', 'Collect Five New Words', 'Find five unfamiliar words, guess their meanings, and check the guesses.', 2, 'learning', FAMILY),
  a('beginner-class', 'Attend a Beginner Class', 'Attend one legitimate introductory class in a subject where you are a true beginner.', 5, 'learning', ADULT, 'quest'),
  a('learn-small-trick', 'Learn and Teach a Small Trick', 'Learn a knot, card flourish, or hand trick well enough to teach it.', 2, 'learning', ALL),
  a('relationship-museum', 'Build a Relationship Museum', 'Choose five objects connected to shared memories and explain each one.', 3, 'learning', ['anniversary'], 'stretch'),
  a('family-timeline', 'Build a Family Timeline', 'Add at least one event from each represented generation to a shared timeline.', 3, 'learning', ['family-reunion'], 'stretch'),
  a('memory-map', 'Draw a Shared-Memory Map', 'Draw a map with five places connected to shared memories and label each one.', 3, 'learning', ['anniversary', 'family-reunion'], 'stretch'),

  // Movement
  a('dance-chorus', 'Learn a 30-Second Dance', 'Learn and perform thirty seconds of a dance with a willing partner or group.', 2, 'movement', ALL),
  a('hula-hoop', 'Hula Hoop for 20 Seconds', 'Keep a hula hoop moving for twenty seconds, with an adapted movement allowed.', 1, 'movement', ALL),
  a('stretch-leader', 'Lead Five Group Stretches', 'Lead five gentle stretches, with permission for anyone to skip or adapt.', 1, 'movement', ALL),
  a('animal-circuit', 'Complete an Animal-Movement Circuit', 'Cross a room or yard four ways inspired by different animals.', 1, 'movement', FAMILY),
  a('personal-best', 'Improve a Safe Personal Best', 'Choose one repeatable movement, establish a safe baseline, and improve it once.', 2, 'movement', ALL),
  a('phone-free-walk', 'Take a Phone-Free 20-Minute Walk', 'Walk for twenty minutes without phones and ask three prepared questions.', 2, 'movement', ['anniversary', 'family-reunion', 'friends-weekend', 'general']),
  a('sock-ball-course', 'Complete a Sock-Ball Course', 'Design and complete a five-station indoor course with a rolled-up pair of socks.', 2, 'movement', FAMILY),
  a('group-walk-mile', 'Complete a Group Mile', 'Walk or roll an accessible mile together at the group’s pace.', 2, 'movement', ALL),

  // Safe, optional 21+ module. Never selected for kids or family packs.
  a('tasting-notes', 'Write Three Small-Pour Tasting Notes', 'Compare three small tasting pours and write one flavor note for each; zero-proof drinks qualify.', 2, 'drinking', ADULT, 'easy', { adultOnly: true }),
  a('house-drink', 'Create a House Drink', 'Create one standard-serving cocktail or zero-proof drink and give it a name.', 2, 'drinking', ADULT, 'easy', { adultOnly: true }),
  a('drink-label', 'Design the Weekend Drink Label', 'Design a name and simple label for a cocktail or zero-proof house drink.', 2, 'drinking', ADULT, 'easy', { adultOnly: true }),
  a('snack-pairing', 'Explain a Drink and Snack Pairing', 'Pair one small tasting pour or zero-proof drink with a snack and explain why it works.', 2, 'drinking', ADULT, 'easy', { adultOnly: true }),
  a('beverage-style-match', 'Match Three Beverage Styles', 'Match three small unlabeled alcoholic or zero-proof samples to a provided style list.', 2, 'drinking', ADULT, 'stretch', { adultOnly: true }),
  a('zero-proof-remix', 'Make a Zero-Proof Remix', 'Create a convincing zero-proof version of a familiar mixed drink.', 3, 'drinking', ADULT, 'stretch', { adultOnly: true }),

  // Bold, but never dangerous or humiliating
  a('open-mic', 'Perform Three Minutes at an Open Mic', 'Perform three prepared minutes at a legitimate open mic or for the full private group.', 5, 'bold', ADULT, 'quest'),
  a('formalwear-errand', 'Do an Ordinary Errand in Formalwear', 'Complete one ordinary public errand in formal clothes without disrupting anyone.', 2, 'bold', ADULT, 'stretch'),
  a('public-beginner', 'Be a Visible Beginner', 'Try a legitimate beginner activity where mistakes are expected.', 3, 'bold', ADULT, 'stretch'),
  a('local-event', 'Attend an Unfamiliar Local Event', 'Attend one public event from a pre-screened list you would not normally choose.', 3, 'bold', ADULT, 'stretch'),
  a('courageous-invitation', 'Make the Courageous Invitation', 'Invite a specific person to a meaningful activity you have hesitated to propose, with an easy way to decline.', 3, 'bold', ADULT, 'stretch'),
  a('phone-free-first-hour', 'Keep the First Hour Phone-Free', 'Keep the first waking hour screen-free and note what fills the space.', 2, 'bold', ALL),

  // Reusable ideas shared across occasion types.
  a('crew-shared-connection', 'Find the Shared Connection', 'Pair two people who did not know each other well and find one genuine thing they have in common.', 2, 'social', ['bachelor', 'bachelorette', 'family-reunion', 'friends-weekend', 'general']),
  a('honoree-superlative', 'Give a Specific Superlative', 'Give the guest of honor a funny but kind superlative and explain the evidence.', 2, 'social', ['bachelor', 'bachelorette', 'anniversary', 'family-reunion', 'general']),
  a('photo-caption-contest', 'Win the Photo Caption', 'Write a caption for a group photo and win the group’s vote.', 2, 'games', ALL),
  a('two-truths-one-lie', 'Win Two Truths and a Lie', 'Share two true stories and one invented story, then fool at least half the group.', 2, 'social', ALL),
  a('team-trick-shot', 'Land a Team Trick Shot', 'Complete a safe two-person trick shot with both people contributing.', 3, 'sports', ['bachelor', 'bachelorette', 'kids-weekend', 'family-reunion', 'friends-weekend', 'beach-trip', 'general'], 'stretch'),
  a('safe-arm-wrestle', 'Win a Friendly Arm Wrestle', 'Win a seated arm-wrestling match after both players agree on position, effort, and an immediate stop signal.', 2, 'sports', GROUPS, 'stretch'),
  a('wall-sit-chorus', 'Wall Sit Through a Chorus', 'Hold a wall sit, seated adaptation, or equivalent effort through one song chorus.', 2, 'movement', ['bachelor', 'bachelorette', 'kids-weekend', 'friends-weekend', 'general']),
  a('balance-high-five', 'Complete the Balance High-Five', 'Hold a safe balance pose with a partner long enough to exchange five high-fives.', 2, 'movement', ALL),
  a('group-photo-pose', 'Stage a Group Photo', 'Direct the willing group into one themed pose and take the photo.', 2, 'creative', ALL),
  a('build-snack-board', 'Build the Group Snack Board', 'Arrange a shareable snack board with at least three allergy-safe foods and label one surprise favorite.', 2, 'food', ALL),
  a('secret-helper', 'Complete a Secret Helpful Act', 'Quietly complete one useful task for the group, leave no clue, and reveal yourself only after someone notices.', 2, 'service', ALL),
  a('kid-teaches-game', 'Let a Kid Teach the Game', 'Let a child teach the rules of a game, then play one complete round their way.', 2, 'games', ['kids-weekend', 'family-reunion'], 'easy', { browseTags: ['kids'] }),
  a('family-lookalike', 'Find the Family Look-Alike', 'Find two willing relatives who share a visible expression or mannerism and take a side-by-side photo.', 2, 'social', ['family-reunion'], 'easy', { browseTags: ['kids'] }),
  a('object-with-story', 'Find an Object With a Story', 'Ask someone to choose a nearby object and tell the story that makes it meaningful.', 2, 'learning', ['anniversary', 'family-reunion', 'friends-weekend', 'general']),
  a('local-recommendation', 'Follow a Local Recommendation', 'Ask a local for one safe food, view, or activity recommendation and try it.', 3, 'bold', ['bachelor', 'bachelorette', 'friends-weekend', 'beach-trip', 'general'], 'stretch'),
  a('one-song-dj', 'DJ One Perfect Song', 'Choose one song for the current moment and get at least three people to agree it fits.', 2, 'creative', ['bachelor', 'bachelorette', 'anniversary', 'family-reunion', 'friends-weekend', 'beach-trip', 'general']),
  a('cold-water-plunge', 'Take a Safe Cold-Water Plunge', 'Choose a supervised, legal spot, check conditions, enter with a buddy, and skip it if the water or weather is unsafe.', 3, 'bold', ADULT, 'stretch'),

  // Event-specific seeds are the backbone of each occasion's picker.
  ...ACTIVITY_SEEDS.filter((seed) => !CONSOLIDATED_SEED_IDS.has(seed.id)).map((seed) => a(
    seed.id,
    seed.name,
    seed.instruction,
    seed.points,
    seed.category,
    [seed.occasion],
    seed.difficulty,
    {
      ...('adultOnly' in seed && seed.adultOnly ? { adultOnly: true } : {}),
      primaryOccasion: seed.occasion,
      ...(seed.id.startsWith('kid-') ? { browseTags: ['kids'] as const } : {}),
    },
  )),
];

export const RECOMMENDED_ACTIVITY_IDS: Record<ActivityOccasion, readonly string[]> = {
  bachelor: ['bch-groom-toast', 'bch-stranger-cheers', 'bch-best-man-story', 'bch-poker-buyin', 'cornhole-win', 'bch-golf-hole', 'bch-hike-summit', 'bch-groom-caricature', 'bch-local-delicacy', 'bch-groom-bag-carry', 'bch-dance-floor', 'bch-toast-shot', 'bch-cannonball', 'group-photo-pose', 'honoree-superlative', 'team-trick-shot'],
  bachelorette: ['bte-bride-story', 'bte-stranger-compliment', 'karaoke-song', 'bte-trivia-bride', 'board-game-win', 'bte-scavenger-item', 'bte-mini-golf-birdie', 'cornhole-win', 'bte-sunrise-walk', 'bte-friendship-bracelet', 'bte-advice-card', 'bte-signature-cocktail', 'bte-carry-bags', 'bte-dance-floor-fill', 'bte-toast-champagne', 'group-photo-pose'],
  'kids-weekend': ['kid-read-aloud', 'kid-tell-joke', 'talent-share', 'kid-puppet-show', 'kid-obstacle-course', 'kid-scavenger-hunt', 'board-game-win', 'kid-cartwheel', 'kid-nature-walk', 'kid-bug-hunt', 'kid-build-fort', 'kid-draw-picture', 'kid-help-snack', 'set-table', 'kid-teaches-game', 'photo-caption-contest'],
  anniversary: ['ann-first-date', 'ann-love-letter', 'ann-shared-memory', 'ann-cook-together', 'ann-plan-surprise', 'ann-slow-dance', 'ann-couples-trivia', 'recreate-photo', 'ann-compliment-battle', 'blind-snack-rank', 'ann-back-massage', 'ann-slow-walk', 'ann-vow-rewrite', 'ann-star-gaze', 'object-with-story', 'honoree-superlative'],
  'family-reunion': ['fam-relative-story', 'family-interview', 'fam-family-tree', 'recreate-photo', 'fam-teach-recipe', 'fam-name-origin', 'fam-nickname-swap', 'fam-cross-gen-team', 'fam-tug-of-war', 'fam-scavenger-item', 'fam-talent-show', 'meal-cleanup', 'fam-group-photo', 'fam-family-trivia', 'kid-teaches-game', 'family-lookalike'],
  'friends-weekend': ['fri-group-cook', 'first-up-coffee', 'cabin-improvement', 'fri-game-night-win', 'fri-group-hike', 'talent-share', 'specific-toast', 'cornhole-win', 'meal-cleanup', 'sunrise-view', 'fri-craft-something', 'blind-snack-rank', 'cold-water-plunge', 'karaoke-song', 'fri-morning-workout', 'fri-photo-scavenger'],
  'beach-trip': ['sea-sandcastle', 'sea-sunrise', 'sea-jump-waves', 'sea-shell-collect', 'sea-cleanup', 'sea-seafood-try', 'sea-sunset-photo', 'sea-boardwalk-game', 'sea-bodysurf', 'sea-volleyball', 'sea-tide-pool', 'sea-limbo', 'sea-sing-song', 'cold-water-plunge', 'team-trick-shot', 'one-song-dj'],
  general: ['gen-icebreaker', 'two-truths-one-lie', 'gen-compliment', 'talent-share', 'gen-rock-paper-scissors', 'gen-staring-contest', 'gen-trivia-win', 'gen-card-trick', 'gen-ball-keepup', 'gen-find-object', 'gen-sunset-selfie', 'gen-quick-sketch', 'gen-freestyle-dance', 'blind-snack-rank', 'cabin-improvement', 'gen-teach-fact'],
};

export const STARTER_RULES = [
  { heading: 'HONOR SYSTEM', text: 'Mark only activities you genuinely complete. Friendly witnesses are welcome; proof is not required.' },
  { heading: 'CONSENT', text: 'Anyone may skip or adapt an activity that feels unsafe, inappropriate, inaccessible, or too personal.' },
  { heading: 'POINTS', text: 'Use the listed default points unless the group agrees on a change before play begins.' },
  { heading: 'GOOD SPIRIT', text: 'The goal is shared stories and good effort. Do not turn an activity into humiliation, pressure, or risk.' },
];

/** Rich-text-lite source used by the single rules editor. */
export const STARTER_RULES_CONTENT = STARTER_RULES
  .map((rule) => `**${rule.heading}**\n${rule.text}`)
  .join('\n\n');

export const STARTER_FOOTNOTE = 'Choose activities appropriate for your group, setting, ages, abilities, and local conditions.';
