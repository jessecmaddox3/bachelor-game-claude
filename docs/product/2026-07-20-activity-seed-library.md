# Activity Seed Library (per occasion)

Companion to `2026-07-20-setup-and-activities-redesign-HANDOFF.md`. This is the
event-specific challenge content to wire into `src/content/activities.ts`.

## How to use this file (for Codex)

Each table below is one occasion. Map each row to a `PresetActivity`:

```ts
a(id, name, instruction, points, category, [occasions...], difficulty, { adultOnly })
```

- **`points`**: integer as given, or a range → use the existing `PointsValue`
  range form (e.g. "1 to 3").
- **`category`**: already one of the 11 valid keys (`social games sports outdoors
  creative food service learning movement drinking bold`).
- **`difficulty`**: `easy | stretch | quest`.
- **`AdultOnly = yes`** → `{ adultOnly: true }`. These may ONLY appear in adult
  occasions (bachelor, bachelorette, anniversary, friends-weekend, beach-trip,
  general). NEVER in kids-weekend; at most a couple mild toasts in family-reunion.
- **`occasions`**: default each seed item to the single occasion of its table.
  Many are reusable across occasions — Codex may add extra occasion tags where it
  clearly fits (e.g. a good icebreaker into `general`), but don't force it.
- Keep IDs exactly as written (they're unique and prefixed per occasion).

**`RECOMMENDED_ACTIVITY_IDS[occasion]`**: pick a strong ~12-16 from each table
(a good spread of categories, mostly easy/stretch, a couple quests) so "Add
recommended set" builds a great board in one tap. A suggested pick is marked with
a ⭐ in a "Rec" column where helpful; otherwise use judgment.

**Occasions covered:** bachelor, bachelorette, kids-weekend, family-reunion,
beach-trip (NEW), anniversary, friends-weekend, general.

---

## Bachelor weekend (`bachelor`)

| id | Name | Instruction | Points | Category | Difficulty | AdultOnly |
|---|---|---|---|---|---|---|
| bch-groom-toast | Deliver Groom Toast | Give an impromptu 60-second toast honoring the groom in front of the whole crew. | 3 | social | stretch | no |
| bch-stranger-cheers | Cheers a Stranger | Get someone outside the group to clink glasses and say congrats to the groom. | 2 | social | easy | no |
| bch-fiancee-blessing | Get Fiancee's Blessing | Video call the bride-to-be and have her wish the crew good luck for the weekend. | 2 | social | easy | no |
| bch-best-man-story | Tell Best Man Story | Publicly tell the group your favorite story about the groom, embarrassing optional. | 2 | social | easy | no |
| bch-wingman-intro | Play Wingman | Introduce the groom to a new group of people using only compliments about his fiancee. | 3 | social | stretch | no |
| bch-poker-buyin | Win a Poker Hand | Win a single hand in a group card game and collect the pot with a victory speech. | 2 | games | easy | no |
| bch-cornhole-champ | Win Cornhole Match | Beat another pair in a full game of cornhole. | 2 | games | easy | no |
| bch-trivia-groom | Ace Groom Trivia | Correctly answer 3 in a row of questions about how the groom met his fiancee. | 2 | games | easy | no |
| bch-pool-trickshot | Land a Trick Shot | Sink a called trick shot in pool or billiards. | 3 | games | stretch | no |
| bch-golf-hole | Play a Hole of Golf | Complete one hole of golf, mini or full course, with the group as witnesses. | 3 | sports | stretch | no |
| bch-cannonball | Perfect Cannonball | Execute a cannonball jump into a pool or lake that soaks at least two bystanders. | 2 | sports | easy | no |
| bch-arm-wrestle | Win Arm Wrestle | Beat someone in the group at arm wrestling. | 2 | sports | easy | no |
| bch-hike-summit | Reach a Summit | Hike to a lookout point or peak and take a group photo there. | 4 | outdoors | quest | no |
| bch-campfire-build | Build a Campfire | Start a fire from kindling without using lighter fluid. | 3 | outdoors | stretch | no |
| bch-sunrise-photo | Catch the Sunrise | Be awake and photograph the sunrise with at least one other groomsman. | 3 | outdoors | stretch | no |
| bch-fish-catch | Catch a Fish | Reel in and hold up a fish, real or comically small, for a photo. | 4 | outdoors | quest | no |
| bch-groom-caricature | Draw the Groom | Sketch a caricature of the groom and get him to sign it. | 2 | creative | easy | no |
| bch-vow-parody | Write Mock Vows | Compose and perform 3 funny fake wedding vow lines about the groom's habits. | 3 | creative | stretch | no |
| bch-group-photo-pose | Stage a Group Photo | Direct the whole crew into a themed pose and take the photo. | 2 | creative | easy | no |
| bch-local-delicacy | Try Local Delicacy | Order and finish a dish neither you nor the groom has tried before. | 2 | food | easy | no |
| bch-hot-wing-run | Survive Hot Wings | Finish a full plate of the spiciest wings on the menu without a drink. | 3 | food | stretch | no |
| bch-round-buyer | Buy the Group a Round | Purchase a round of drinks for the whole crew. | 2 | service | easy | yes |
| bch-groom-bag-carry | Be the Groom's Caddy | Carry the groom's stuff (drinks, jacket, phone) hands-free for one full hour. | 2 | service | easy | no |
| bch-hangover-kit | Deliver Hangover Kit | Hand-deliver water, snacks, and painkillers to a hurting groomsman before they ask. | 2 | service | easy | no |
| bch-dance-floor | Own the Dance Floor | Get the whole crew dancing together at the same time for one full song. | 3 | movement | stretch | no |
| bch-flag-football | Score in Pickup Game | Score a point or goal in any pickup sport the group organizes. | 3 | movement | stretch | no |
| bch-toast-shot | Lead a Group Shot | Propose a toast and get the entire crew to take a shot together. | 2 | drinking | easy | yes |
| bch-bartender-friend | Befriend the Bartender | Get the bartender to learn and use the groom's name unprompted. | 3 | drinking | stretch | yes |
| bch-mystery-cocktail | Order Bartender's Choice | Let the bartender pick your drink with zero input and finish it. | 2 | drinking | easy | yes |
| bch-karaoke-solo | Sing Karaoke Solo | Perform one full karaoke song solo in front of the group. | 4 | bold | quest | no |
| bch-dance-floor-stranger | Dance With a Stranger | Get someone outside the group to dance with you for at least one song. | 3 | bold | stretch | no |
| bch-cold-plunge | Take the Cold Plunge | Jump into a cold pool, lake, or ocean in swimwear. | 3 | bold | stretch | no |
| bch-propose-toast-stranger | Toast With Strangers | Get an entire nearby table of strangers to raise a glass to the groom. | 3 | bold | stretch | no |

---

## Bachelorette weekend (`bachelorette`)

| id | Name | Instruction | Points | Category | Difficulty | AdultOnly |
|---|---|---|---|---|---|---|
| bte-bride-story | Toast The Bride | Stand up and share a favorite memory of the bride in under 60 seconds. | 2 | social | easy | no |
| bte-stranger-compliment | Compliment A Stranger | Give a genuine compliment to someone outside the group and report their reaction. | 2 | social | easy | no |
| bte-group-selfie | Squad Selfie Spot | Get the whole crew into one photo at a scenic spot on the trip. | 1 | social | easy | no |
| bte-karaoke-verse | Karaoke Moment | Sing at least one full verse of a song, karaoke or not. | 3 | social | stretch | no |
| bte-bride-impression | Impersonate The Bride | Do your best impression of the bride's laugh or catchphrase for the group. | 2 | social | easy | no |
| bte-trivia-bride | Bride Trivia Master | Correctly answer three questions about the bride asked by another guest. | 2 | games | easy | no |
| bte-card-game-win | Win A Card Game | Win one full round of any card or dice game with the group. | 2 | games | easy | no |
| bte-scavenger-item | Scavenger Find | Find and bring back an item from a scavenger list set by the bride. | 3 | games | stretch | no |
| bte-newlywed-guess | Newlywed-Style Guess | Correctly predict how the bride would answer a fun would-you-rather question. | 2 | games | easy | no |
| bte-mini-golf-birdie | Mini Golf Birdie | Score par or better on any hole during a round of mini golf or putting. | 3 | sports | stretch | no |
| bte-cornhole-win | Cornhole Champ | Win a cornhole or ladder-toss match against another guest. | 3 | sports | stretch | no |
| bte-pool-lap | Pool Lap Dare | Swim one full lap of the pool without stopping. | 2 | sports | easy | no |
| bte-sunrise-walk | Sunrise Walk | Take a walk outside and watch the sunrise or sunset with the bride. | 3 | outdoors | stretch | no |
| bte-hike-photo | Scenic Overlook Photo | Hike or walk to a scenic viewpoint and snap a group photo there. | 3 | outdoors | stretch | no |
| bte-flower-crown | Flower Crown Craft | Make a flower crown or bouquet for the bride using items found outdoors. | 3 | outdoors | stretch | no |
| bte-friendship-bracelet | Craft A Bracelet | Make a friendship bracelet and give it to the bride. | 2 | creative | easy | no |
| bte-advice-card | Marriage Advice Card | Write one piece of marriage advice on a card for the bride's memory book. | 2 | creative | easy | no |
| bte-photo-booth-prop | Photo Booth Prop | Create a handmade photo booth prop and use it in a group picture. | 2 | creative | easy | no |
| bte-vow-poem | Write A Silly Vow | Write and read aloud a silly two-line "vow" for the bride and groom. | 3 | creative | stretch | no |
| bte-signature-cocktail | Name A Cocktail | Invent and name a signature drink in honor of the bride. | 2 | food | easy | no |
| bte-brunch-dish | Brunch Dish Review | Order something new on the brunch menu and rate it out of five stars for the group. | 2 | food | easy | no |
| bte-dessert-share | Share A Dessert | Split a dessert with the bride and toast to her with the last bite. | 2 | food | easy | no |
| bte-carry-bags | Carry The Bags | Carry the bride's bags or belongings for one full outing without being asked twice. | 2 | service | easy | no |
| bte-playlist-add | Build The Playlist | Add three songs to the weekend's shared playlist. | 1 | service | easy | no |
| bte-spa-appointment | Book The Spa Slot | Schedule or check in the group for a spa treatment or beauty appointment. | 2 | service | easy | no |
| bte-dance-floor-fill | Fill The Dance Floor | Get at least three people dancing with you at once. | 3 | movement | stretch | no |
| bte-yoga-pose | Sunrise Yoga Pose | Hold a yoga pose for 30 seconds while the group counts down. | 2 | movement | easy | no |
| bte-conga-line | Start A Conga Line | Start a conga line with at least four people joining in. | 4 | movement | quest | no |
| bte-dance-battle-win | Win A Dance Battle | Win a head-to-head dance-off judged by the group. | 3 | movement | stretch | no |
| bte-toast-champagne | Champagne Toast | Lead a champagne toast to the bride with the whole group raising a glass. | 2 | drinking | easy | yes |
| bte-signature-shot | Try The Bar's Special | Order the bar's featured or signature drink and rate it for the group. | 2 | drinking | easy | yes |
| bte-talk-to-stranger | Make A New Friend | Strike up a five-minute conversation with someone you've never met on the trip. | 3 | bold | stretch | no |
| bte-dance-with-stranger | One Dance, One Stranger | Dance for at least one song with someone outside your group. | 3 | bold | stretch | no |
| bte-bold-outfit | Wear It Proud | Wear a bold accessory (sash, veil, tiara) for an entire outing without taking it off. | 2 | bold | easy | no |

---

## Kids weekend (`kids-weekend`) — NO adult content

| id | Name | Instruction | Points | Category | Difficulty | AdultOnly |
|---|---|---|---|---|---|---|
| kid-read-aloud | Read Aloud | Read one whole picture book or two book chapters out loud to someone. | 2 | learning | easy | no |
| kid-tell-joke | Tell A Joke | Make three different people laugh with a joke you know or make up. | 1 | social | easy | no |
| kid-talent-show | Put On A Talent Show | Perform a song, dance, or trick for the family. | 3 | social | stretch | no |
| kid-puppet-show | Puppet Show | Make sock or paper puppets and put on a two-minute puppet show. | 3 | creative | stretch | no |
| kid-obstacle-course | Beat The Obstacle Course | Build a backyard or living room obstacle course and complete it. | 3 | games | stretch | no |
| kid-scavenger-hunt | Win A Scavenger Hunt | Find five items from a scavenger hunt list before anyone else. | 3 | games | stretch | no |
| kid-card-game | Win A Card Game | Play and win one round of a card or board game with a family member. | 2 | games | easy | no |
| kid-cartwheel | Do A Cartwheel | Do a cartwheel, somersault, or handstand (with a spotter if needed). | 2 | sports | easy | no |
| kid-mini-race | Run A Backyard Race | Race a family member from one end of the yard to the other. | 2 | sports | easy | no |
| kid-cone-toss | Bean Bag Toss | Land three bean bags or socks into a bucket from five steps away. | 2 | sports | easy | no |
| kid-nature-walk | Go On A Nature Walk | Take a walk outside and collect five different leaves, rocks, or sticks. | 2 | outdoors | easy | no |
| kid-bug-hunt | Find Five Bugs | Spot and name five different bugs or animals outside. | 3 | outdoors | stretch | no |
| kid-cloud-watch | Cloud Shapes | Lie outside and name three shapes you see in the clouds. | 1 | outdoors | easy | no |
| kid-build-fort | Build A Fort | Build a blanket or pillow fort big enough to sit inside. | 3 | creative | stretch | no |
| kid-draw-picture | Draw A Picture | Draw and color a picture of your favorite animal or place. | 2 | creative | easy | no |
| kid-sidewalk-chalk | Sidewalk Chalk Art | Draw a chalk masterpiece on the driveway or sidewalk. | 2 | creative | easy | no |
| kid-build-tower | Build The Tallest Tower | Build the tallest tower you can out of blocks or cups without it falling. | 3 | creative | stretch | no |
| kid-help-snack | Help Make A Snack | Help make a snack for the family, like trail mix or sandwiches. | 3 | food | stretch | no |
| kid-set-table | Set The Table | Set the table with plates, napkins, and silverware for a meal. | 2 | service | easy | no |
| kid-clean-toys | Clean Up Toys | Put away all your toys and books without being asked twice. | 2 | service | easy | no |
| kid-make-bed | Make Your Bed | Make your bed neatly all by yourself. | 1 | service | easy | no |
| kid-compliment-three | Give Three Compliments | Say something kind to three different people today. | 1 | service | easy | no |
| kid-help-adult | Help An Adult | Help an adult with one chore, like folding laundry or sweeping. | 2 | service | easy | no |
| kid-thank-you-note | Write A Thank You Note | Write or draw a thank-you note for someone in your family. | 2 | learning | easy | no |
| kid-learn-fact | Learn A New Fact | Learn one new fact about an animal or place and share it with someone. | 2 | learning | easy | no |
| kid-dance-freeze | Freeze Dance Champion | Dance to a song and freeze the moment the music stops, five times in a row. | 4 | movement | quest | no |

---

## Family reunion (`family-reunion`) — cross-generational

| id | Name | Instruction | Points | Category | Difficulty | AdultOnly |
|---|---|---|---|---|---|---|
| fam-relative-story | Tell A Story | Tell the group a story about a relative who couldn't make it this year. | 2 | social | easy | no |
| fam-interview-elder | Interview An Elder | Interview the oldest relative present and ask them one thing they wish they'd asked their own grandparents. | 3 | learning | stretch | no |
| fam-family-tree | Sketch The Family Tree | Draw as much of the family tree as you can from memory, then check it with a relative. | 3 | learning | stretch | no |
| fam-timeline-build | Build A Timeline | Work with someone from a different generation to list five major family events in order. | 3 | learning | stretch | no |
| fam-photo-recreate | Recreate An Old Photo | Find an old family photo and recreate the pose with the people available today. | 3 | creative | stretch | no |
| fam-teach-recipe | Teach A Recipe | Have an older relative teach a younger one how to make a family recipe from memory. | 4 | food | quest | no |
| fam-name-origin | Explain A Name | Find out and share the story behind how you (or a sibling) got your name. | 2 | learning | easy | no |
| fam-nickname-swap | Trade Nicknames | Ask three relatives what their childhood nickname was and report back. | 2 | social | easy | no |
| fam-cross-gen-team | Pair Up And Win | Team up with someone at least 20 years older or younger than you and win any game together. | 3 | games | stretch | no |
| fam-tug-of-war | Kids Vs Grown-Ups | Organize and complete a round of tug-of-war, kids team against the grown-ups team. | 3 | movement | stretch | no |
| fam-three-legged | Three-Legged Race | Complete a three-legged race paired with a relative from a different generation. | 3 | movement | stretch | no |
| fam-scavenger-item | Family Scavenger Hunt | Find someone wearing or carrying an item that belonged to a grandparent or great-grandparent. | 2 | games | easy | no |
| fam-talent-show | Perform A Talent | Perform a short talent (song, joke, dance, magic trick) in front of at least five relatives. | 3 | social | stretch | no |
| fam-impression | Do An Impression | Do your best impression of another relative and get someone to guess who it is. | 2 | social | easy | no |
| fam-help-cleanup | Lend A Hand | Help clean up after a meal without being asked. | 2 | service | easy | no |
| fam-help-setup | Set The Table | Set or reset the table for the next meal for the whole group. | 2 | service | easy | no |
| fam-carry-gear | Carry The Load | Help carry chairs, coolers, or supplies to or from the reunion setup area. | 2 | service | easy | no |
| fam-compliment-round | Give Five Compliments | Give a genuine compliment to five different relatives. | 2 | social | easy | no |
| fam-group-photo | Wrangle A Group Photo | Organize and take a group photo with at least three generations in it. | 3 | creative | stretch | no |
| fam-family-trivia | Family Trivia Challenge | Quiz two relatives with three trivia questions about family history and get at least one right. | 3 | learning | stretch | no |
| fam-cornhole-mixed | Mixed-Age Cornhole | Play a full game of cornhole or ladder toss with players spanning at least three generations. | 3 | sports | stretch | no |
| fam-nature-walk | Guided Nature Walk | Lead or join a walk outside and point out three plants, birds, or landmarks to a younger cousin. | 2 | outdoors | easy | no |
| fam-campfire-song | Lead A Campfire Song | Get at least four relatives to sing or hum along to one song together. | 3 | social | stretch | no |
| fam-craft-together | Craft With A Cousin | Make a simple craft or drawing together with a cousin of a different age. | 2 | creative | easy | no |
| fam-taste-test | Blind Taste Test | Run a blind taste test of two family dishes and have three relatives guess which is which. | 3 | food | stretch | no |
| fam-toast-honor | Raise A Toast | Raise a glass and give a short toast honoring the family, with at least two other adults joining in. | 2 | drinking | easy | yes |

---

## Beach trip (`beach-trip`) — NEW OCCASION

| id | Name | Instruction | Points | Category | Difficulty | AdultOnly |
|---|---|---|---|---|---|---|
| sea-sandcastle | Build A Sandcastle | Build a sandcastle with at least one tower and a moat, then photograph it. | 2 | creative | easy | no |
| sea-sunrise | Watch The Sunrise | Get the whole group to the beach to watch the sunrise together. | 4 | outdoors | quest | no |
| sea-jump-waves | Jump Every Wave | Jump ten incoming waves in a row without turning your back to the ocean. | 2 | movement | easy | no |
| sea-shell-collect | Collect Five Shells | Collect five different types of seashells and arrange them for a photo. | 1 | outdoors | easy | no |
| sea-cleanup | Beach Cleanup Sweep | Spend ten minutes picking up litter from the beach and dispose of it properly. | 3 | service | stretch | no |
| sea-seafood-try | Try Local Seafood | Order and eat a local seafood dish none of you have tried before. | 3 | food | stretch | no |
| sea-sunset-photo | Golden Sunset Photo | Take a group silhouette photo of everyone facing the sunset. | 2 | creative | easy | no |
| sea-boardwalk-game | Win A Boardwalk Game | Win a prize or a round at a boardwalk arcade or carnival game. | 3 | games | stretch | no |
| sea-bodysurf | Catch A Bodysurf Wave | Successfully bodysurf one wave all the way to the shore. | 3 | sports | stretch | no |
| sea-paddleboard | Stand-Up Paddleboard | Stand up on a paddleboard or kayak for at least thirty seconds without falling. | 3 | sports | stretch | no |
| sea-sand-angel | Make A Sand Angel | Lie down and make a sand angel, then get up and photograph the print. | 1 | movement | easy | no |
| sea-volleyball | Beach Volleyball Rally | Play a beach volleyball rally of at least ten hits without the ball touching the sand. | 2 | sports | easy | no |
| sea-tide-pool | Tide Pool Explorer | Find and identify one living creature in a tide pool or shallow water. | 2 | outdoors | easy | no |
| sea-buried | Bury A Teammate | Bury a willing teammate up to the neck in sand and decorate them. | 2 | games | easy | no |
| sea-limbo | Beach Towel Limbo | Hold an impromptu limbo contest using a beach towel or umbrella pole. | 2 | games | easy | no |
| sea-frisbee-catch | Frisbee Trick Catch | Complete a behind-the-back or between-the-legs frisbee catch. | 2 | sports | easy | no |
| sea-message-bottle | Message In A Bottle | Write a message, seal it in a bottle or jar, and photograph it at the water's edge. | 2 | creative | easy | no |
| sea-sing-song | Beach Bonfire Serenade | Sing a full song around the bonfire or firepit loud enough for the whole group to hear. | 3 | social | stretch | no |
| sea-icecream-race | Ice Cream Speed Eat | Race a teammate to finish a scoop of ice cream or a popsicle without a brain-freeze wince. | 2 | food | easy | no |
| sea-cannonball | Best Cannonball Splash | Do a cannonball jump into the ocean or pool and get another person's judged approval. | 2 | movement | easy | no |
| sea-tan-line | Show Off A Tan Line | Reveal your most ridiculous new tan or sunburn line to the group. | 1 | social | easy | no |
| sea-stranger-photo | Beach Stranger Photo | Get a friendly stranger on the beach to take a fun group photo of you all. | 2 | social | easy | no |
| sea-crab-walk | Crab Walk Race | Race a teammate crab-walking ten yards down the sand. | 2 | movement | easy | no |
| sea-pina-colada | Ocean-Themed Cocktail | Order or mix a beach-themed cocktail like a piña colada or mai tai. | 2 | drinking | easy | yes |
| sea-post-swim-toast | Post-Swim Toast | Take a celebratory drink together right after everyone gets out of the ocean. | 1 | drinking | easy | yes |
| sea-flip-cup-sand | Beach Flip Cup | Win a round of flip cup set up on a beach towel or cooler lid. | 3 | drinking | stretch | yes |
| sea-cold-plunge | Cold Ocean Plunge | Fully submerge in the ocean first thing in the morning before anyone else is awake. | 4 | bold | quest | no |
| sea-seaweed-crown | Seaweed Crown Dare | Wear a crown made of seaweed or kelp in public for at least five minutes. | 3 | bold | stretch | no |

---

## Anniversary / couples (`anniversary`)

_Note: `ann-renewal-quest` category corrected from the invalid `quest` to `social`._

| id | Name | Instruction | Points | Category | Difficulty | AdultOnly |
|---|---|---|---|---|---|---|
| ann-first-date | Recreate First Date | Recreate one detail from your first date together (order, outfit, or location). | 2 | social | stretch | no |
| ann-love-letter | Write Appreciation Note | Write your partner a short note naming one thing you appreciate about them. | 1 | creative | easy | no |
| ann-shared-memory | Recall Shared Memory | Take turns describing your favorite shared memory in full detail. | 1 | social | easy | no |
| ann-cook-together | Cook a Meal Together | Cook one full dish together from start to finish, no separate stations. | 3 | food | stretch | no |
| ann-plan-surprise | Plan a Surprise | Secretly plan one small surprise for your partner to happen later today. | 3 | service | stretch | no |
| ann-slow-dance | Dance Together | Slow dance to one full song, phones down. | 2 | movement | easy | no |
| ann-couples-trivia | Couples Trivia Round | Each partner answers 3 questions about the other and tallies correct guesses. | 3 | games | stretch | no |
| ann-toast-us | Toast to Us | Raise a glass and give a short toast celebrating your relationship. | 1 | drinking | easy | yes |
| ann-photo-recreate | Recreate Old Photo | Find an old couple photo and recreate the pose exactly. | 2 | creative | stretch | no |
| ann-compliment-battle | Compliment Battle | Take turns giving compliments until one partner runs out first. | 1 | social | easy | no |
| ann-blind-taste | Blind Taste Test | Blindfold your partner and have them guess 3 foods or drinks by taste. | 2 | food | stretch | no |
| ann-back-massage | Give a Mini Massage | Give your partner a 3-minute shoulder or hand massage. | 1 | service | easy | no |
| ann-couples-wager | Silly Bet | Make a playful wager on a small competition and honor the loser's forfeit. | 2 | games | stretch | no |
| ann-slow-walk | Take a Walk Together | Go for a walk together with phones left behind. | 1 | outdoors | easy | no |
| ann-vow-rewrite | Rewrite a Vow | Write one new personal vow or promise to read aloud to your partner. | 3 | creative | stretch | no |
| ann-song-dedication | Dedicate a Song | Pick a song that reminds you of your partner and explain why. | 1 | social | easy | no |
| ann-cheers-toast | Clink and Confess | Clink glasses and each confess one thing you're grateful for this year. | 2 | drinking | stretch | yes |
| ann-dessert-share | Share One Dessert | Split one dessert using only one spoon between you. | 1 | food | easy | no |
| ann-piggyback-race | Piggyback Challenge | One partner carries the other piggyback for 20 steps. | 3 | movement | stretch | no |
| ann-flirty-note | Leave a Flirty Note | Hide a flirty note somewhere your partner will find it later today. | 2 | bold | stretch | yes |
| ann-star-gaze | Star Gaze Together | Sit outside together and find one constellation or shape in the sky. | 2 | outdoors | stretch | no |
| ann-eye-contact | Silent Eye Contact | Hold uninterrupted eye contact with your partner for 60 seconds without laughing. | 3 | bold | stretch | no |
| ann-future-plan | Plan a Future Trip | Spend 5 minutes planning a real or dream future trip together. | 2 | creative | stretch | no |
| ann-renewal-quest | Renew Your Vows | Stand together and formally re-say your original wedding vows or promises. | 5 | social | quest | no |

---

## Friends weekend (`friends-weekend`)

| id | Name | Instruction | Points | Category | Difficulty | AdultOnly |
|---|---|---|---|---|---|---|
| fri-group-cook | Group Cook-Off | Split into two teams and cook competing dishes from the same ingredients, then vote on a winner. | 4 | food | quest | no |
| fri-first-coffee | First One Up Makes Coffee | Be the first person awake and make a full pot of coffee for the group. | 1 | service | easy | no |
| fri-cabin-fix | Cabin Improvement | Fix, tidy, or upgrade one shared space (stack firewood, organize the kitchen, fix a wobbly chair). | 2 | service | easy | no |
| fri-game-night-win | Win Game Night | Win an official group game night tournament (cards, board game, or trivia). | 4 | games | quest | no |
| fri-group-hike | Group Adventure Hike | Lead the whole group on a hike, walk, or outdoor excursion of at least 30 minutes. | 3 | outdoors | stretch | no |
| fri-talent-share | Talent Share | Perform a hidden talent for the group (juggling, magic trick, impression, instrument). | 3 | social | stretch | no |
| fri-toast-story | Give a Toast | Give a genuine toast or story about the group at a meal. | 2 | social | easy | no |
| fri-cornhole-champ | Cornhole Champion | Win a best-of-three cornhole or lawn game match against another pair. | 2 | sports | stretch | no |
| fri-plate-wash | Dish Duty Volunteer | Wash or dry all the dishes after a meal without being asked. | 1 | service | easy | no |
| fri-sunrise-watch | Catch the Sunrise | Wake up and watch the sunrise, then report back with a photo or description. | 2 | outdoors | stretch | no |
| fri-craft-something | Make a Craft | Create something by hand for the group (friendship bracelet, drawing, campfire skewer). | 2 | creative | easy | no |
| fri-blind-taste | Blind Taste Test | Correctly guess 3 out of 4 items in a blind taste test set up by another player. | 2 | food | stretch | no |
| fri-cocktail-invent | Invent a Cocktail | Invent and name an original cocktail (or mocktail) and serve it to the group. | 3 | drinking | stretch | yes |
| fri-shot-ski | Group Shot Ski | Organize and complete a synchronized group shot with at least 3 people. | 2 | drinking | easy | yes |
| fri-cold-plunge | Cold Water Plunge | Jump into a lake, pool, or cold shower in swimwear. | 3 | bold | stretch | no |
| fri-karaoke-song | Karaoke Performance | Sing a full song solo or duet in front of the group. | 3 | social | stretch | no |
| fri-morning-workout | Lead a Workout | Lead a group stretch, yoga session, or quick workout for at least 10 minutes. | 2 | movement | easy | no |
| fri-canoe-row | Paddle or Row | Paddle a canoe, kayak, or rowboat for at least 15 minutes. | 3 | outdoors | stretch | no |
| fri-blindfold-draw | Blindfolded Portrait | Draw a recognizable portrait of another player while blindfolded. | 2 | creative | easy | no |
| fri-trivia-master | Trivia Master | Answer 5 group trivia questions correctly in a row. | 3 | games | stretch | no |
| fri-campfire-story | Tell a Ghost Story | Tell a scary or funny story around the fire that gets a genuine reaction from the group. | 2 | social | easy | no |
| fri-photo-scavenger | Scavenger Photo Hunt | Find and photograph 5 items from a scavenger list within one hour. | 3 | outdoors | stretch | no |
| fri-mystery-food | Try Something New | Eat a food or dish none of you has tried before and rate it publicly. | 2 | food | easy | no |
| fri-arm-wrestle | Arm Wrestling Champion | Win an arm wrestling match against a bigger or stronger opponent in the group. | 4 | bold | quest | no |

---

## General / any gathering (`general`)

| id | Name | Instruction | Points | Category | Difficulty | AdultOnly |
|---|---|---|---|---|---|---|
| gen-icebreaker | Meet Someone New | Introduce yourself to someone you've never met and learn one fun fact about them. | 1 | social | easy | no |
| gen-group-photo | Group Photo | Get five or more people together for a goofy group photo. | 1 | social | easy | no |
| gen-compliment | Give a Compliment | Give a genuine compliment to someone you don't know well. | 1 | social | easy | no |
| gen-mini-talent | Mini Talent Share | Show off a quick talent or party trick to at least two people. | 2 | social | stretch | no |
| gen-toast | Raise a Toast | Lead a short toast with a drink in hand. | 2 | drinking | stretch | yes |
| gen-cheers-strangers | Cheers a Stranger | Clink glasses and say cheers with someone you just met. | 1 | drinking | easy | yes |
| gen-rock-paper-scissors | Best of Three | Win a best-of-three round of rock paper scissors against someone. | 1 | games | easy | no |
| gen-staring-contest | Staring Contest | Win a staring contest against another guest. | 2 | games | stretch | no |
| gen-trivia-win | Win a Trivia Question | Correctly answer a trivia question someone else asks you. | 2 | games | stretch | no |
| gen-card-trick | Perform a Card Trick | Perform any simple card or magic trick for someone. | 3 | games | stretch | no |
| gen-thumb-war | Thumb War Champion | Win a thumb war against another guest. | 1 | games | easy | no |
| gen-ball-keepup | Sports Move | Successfully juggle, dribble, or keep-up a ball or object ten times in a row. | 3 | sports | stretch | no |
| gen-cornhole-score | Score a Point | Score a point in any lawn or tabletop game being played. | 2 | sports | stretch | no |
| gen-arm-wrestle | Arm Wrestle | Win an arm wrestling match against another guest. | 3 | sports | stretch | no |
| gen-find-object | Nature Scavenger Find | Find and bring back a small natural object like a leaf, rock, or flower. | 1 | outdoors | easy | no |
| gen-cloud-shape | Spot a Cloud Shape | Point out a cloud shape to someone and get them to agree what it looks like. | 2 | outdoors | stretch | no |
| gen-sunset-selfie | Sky Selfie | Take a selfie with the sky or outdoor scenery in the background. | 1 | outdoors | easy | no |
| gen-quick-sketch | Quick Sketch | Draw a recognizable sketch of another guest in under two minutes. | 2 | creative | stretch | no |
| gen-freestyle-dance | Freestyle Dance Move | Bust out an original dance move in front of at least two people. | 2 | creative | stretch | no |
| gen-name-song | Make Up a Tune | Make up and sing a short original jingle about the event. | 3 | creative | stretch | no |
| gen-taste-mystery | Guess the Flavor | Correctly guess a food or drink item while blindfolded or by taste alone. | 3 | food | stretch | no |
| gen-share-snack | Share a Bite | Split a snack or treat with someone you just met. | 1 | food | easy | no |
| gen-help-clean | Lend a Hand | Help clean up, carry, or set up something without being asked. | 2 | service | stretch | no |
| gen-teach-fact | Teach a Fun Fact | Teach another guest one interesting fact they didn't already know. | 2 | learning | stretch | no |

---

## Totals

| Occasion | Count |
|---|---|
| bachelor | 33 |
| bachelorette | 34 |
| kids-weekend | 26 |
| family-reunion | 26 |
| beach-trip | 28 |
| anniversary | 24 |
| friends-weekend | 24 |
| general | 24 |
| **Total new seeds** | **~219** |

Codex: dedupe against the existing 89-item generic library by name/intent where
there's obvious overlap (e.g. karaoke, cornhole, arm-wrestle, cold-plunge appear
in multiple sets — that's fine, they're occasion-scoped; just don't create two
identical IDs). Prefer these occasion-flavored versions for the recommended sets.
