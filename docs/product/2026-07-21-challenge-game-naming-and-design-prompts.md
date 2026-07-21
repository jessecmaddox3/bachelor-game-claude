# Challenge Game Naming and Design Prompts

> **TL;DR:** Use the first prompt independently with Claude and Gemini to generate and evaluate a broad name field, then compare their strongest candidates. After Jesse chooses two or three promising names, use the second prompt to develop distinct mobile visual systems and logo concepts. The prompts describe the real product without treating the current weekly mechanic as permanent.

## Recommendation

Run the naming prompt in separate fresh conversations so the models do not converge on one another's ideas. Do not tell the second model what the first model preferred. Bring both outputs back for synthesis rather than selecting a name only because both models repeated it.

Do not buy a domain, commission a logo, or treat trademark availability as confirmed from these outputs. Name and trademark screening comes after the creative field has been narrowed.

## Prompt 1: Naming and Brand Territories

Copy everything inside the block into a fresh Claude or Gemini conversation.

```text
Act as a senior naming strategist and playful game-brand creative director. I am developing a mobile-first challenge game that begins as a private experiment among three adult brothers but may later expand to friends, couples, families, teams, and communities.

The product gives people specific, well-matched reasons to do things they would otherwise postpone, overlook, or never think to try. The result might be laughter, discovery, connection, usefulness, mastery, personal expansion, a good story, or memorable nonsense. It is not a dare generator, chore chart, habit tracker, fitness-only product, self-help lecture, or public social network.

The first game has three overlapping two-person partnerships. Players browse a broad catalog of challenge ideas, identify things that interest them, and complete a short weekly round. They can retain control over their own choices or let someone who knows them choose from a preapproved set in exchange for a larger game reward. The emotional goal is cooperative rivalry: I want both of my partners to succeed, but I still want to beat them.

Important brand qualities:
- Playful, intelligent, generous, and a little mischievous
- Adult-friendly without being corporate or macho
- Broad enough to hold humor, growth, friendship, contribution, curiosity, and adventure
- Warm about relationships without sounding primarily romantic
- Suitable for a tiny private game now and a larger product later
- Easy to say aloud, spell, remember, and recommend
- Capable of supporting phrases such as “send a challenge,” “this week’s round,” and “good story”
- Should not imply coercion, humiliation, dangerous dares, generic productivity, or relentless self-optimization

Names I have considered:
- Boy Loves Challenges, the name of an old personal blog that I still like emotionally
- Love Challenges, which is compact but may sound too much like romantic relationship problems

Treat those as clues, not answers. Explore the warmth and enthusiasm in “loves challenges” while also opening very different creative territories.

Do the work in this order:

1. Identify 6 distinct naming territories. Give each territory a one-sentence strategic idea and 8 candidate names, for at least 48 candidates total. Make the territories genuinely different. Include at least one focused on stories and memorable action, one on playful exchange, one on cooperative rivalry, one on curiosity or expansion, one on invitation or momentum, and one unexpected territory.
2. Avoid merely combining the same small set of words. Include real words, suggestive compounds, short phrases, and a limited number of invented names.
3. Eliminate candidates that sound mainly romantic, juvenile, punitive, fitness-specific, self-help-heavy, or like enterprise task-management software.
4. Select 12 finalists. Score each from 1 to 10 for memorability, emotional fit, breadth, spoken clarity, visual potential, and risk of misunderstanding.
5. For each finalist, write:
   - A one-sentence brand promise
   - How someone would naturally use the name in conversation
   - The strongest reason to choose it
   - The strongest reason not to choose it
   - A possible short tagline
6. Recommend a top five, but include one safe choice, one emotionally warm choice, one clever game-forward choice, one unusual high-upside choice, and one choice that preserves some DNA from Boy Loves Challenges.
7. End with 10 naming questions or provocations that could unlock a better second round. Do not ask me to answer them before producing the first round.

Do not claim that domains, app-store names, social handles, or trademarks are available unless you actually perform and cite current searches. Even with searches, label all legal availability as unverified pending formal screening.
```

## Prompt 2: Visual System and Logo Directions

Use this after narrowing the names to two or three candidates. Replace the bracketed text before sending it.

```text
Act as a senior product designer and identity designer. Develop a distinctive visual system for a mobile-first cooperative-rivalry challenge game. The candidate product name is [NAME]. The alternate names still under consideration are [ALTERNATES].

Product summary:
- Initially used by three adult brothers
- Later adaptable to friends, couples, families, teams, and communities
- Players browse a wide range of funny, useful, social, curious, creative, and stretching challenges
- Players balance personal choice, trust in people who know them, shared partnership scores, and friendly competition
- The product should make doing something worth remembering feel inviting
- It must not resemble a fitness tracker, corporate task manager, children's chore chart, extreme-dare brand, dating app, or generic neon gaming product

Emotional qualities:
- Playful but not childish
- Warm but not sentimental
- Competitive but not aggressive
- Intelligent but not academic
- Slightly mischievous
- Focused on real-world action and resulting stories

The first application is mobile web. Its primary screens are:
1. Choose your identity
2. Pick 5 of 20 challenge categories
3. Browse 18 challenges within a category and select one
4. Review a personal set of five
5. Choose between self-selection at base points or partner selection at double points
6. View three overlapping two-person partnership scores
7. Complete two weekly challenges and add a short story
8. Review the weekly result

Create three sharply different visual directions. Do not produce three minor palette variations.

For each direction provide:
- A name and one-paragraph concept
- The emotional principle behind it
- Color roles with accessible light and dark values
- Typography recommendations using available or realistically licensable typefaces
- Shape language, spacing, iconography, and motion principles
- How challenge cards, points, partnership links, and completion states look
- A logo concept described precisely enough for an illustrator or image model
- A simple app-icon concept that remains recognizable at small size
- One example mobile home screen described from top to bottom
- What makes the direction ownable
- Its largest usability or brand risk

Then compare the three directions in a decision table and recommend one.

Logo requirements:
- Must work in one color before relying on gradients or illustration
- Must work without a mascot, although one direction may propose a mascot
- Avoid checkmarks as the entire idea, generic trophy cups, flexed arms, lightning bolts, mountain peaks, heart-only marks, and interlocking-chain clichés
- Explore the idea of three people with three pairwise connections without making the symbol look like a corporate network diagram
- Preserve a sense of motion, invitation, exchange, or a story beginning

Finish with:
1. A concise creative brief for the recommended direction
2. A design-token starter set
3. Five logo-generation prompts suitable for an image model
4. A list of visual clichés to reject during review
5. The exact questions you would ask after seeing the first mockups

Do not write implementation code yet. Focus on identity, interface direction, and decision-quality comparisons.
```

## Comparison Checklist

When both models return results, compare them on these questions before merging ideas:

- Does the name describe a world larger than self-improvement?
- Would Jesse be comfortable inviting Brett and Hunter to it without an explanation or apology?
- Can someone say the name naturally in a sentence?
- Does it support laughter and useful challenges equally well?
- Does the visual system make three overlapping partnerships immediately legible?
- Does it feel like real-world play rather than phone engagement for its own sake?
- Can the system welcome a funny 30-second challenge and a meaningful week-long challenge without changing personality?
