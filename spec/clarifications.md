Functionality & User Flow
Main purpose of the app: It should both generate rules for a challenge run and be a live tool to track your progress. just save it in the browser state, no actual user management.

Randomization: In the “Random Evolution Challenge”: Yes, use a seed system. Users should be allowed to re-roll (also no duplicate results). the rule set intends for you to re-roll after each boss, with some checkpoints for when you go up a digivolution stage. Just keep it simple so that the user can choose themself.

State Persistence:

Should users be able to save their progress (LocalStorage, Export/Import)? Just a simple global local storage for stateful components like the re-roll tool. Nothing more complex for now.

Data structure & content
Boss progression: How is story progress measured?

List of bosses in order? You can get this from the link I provided.

Which boss checkpoints trigger evolution tier upgrades (Baby→Rookie→Champion→...)? TBD, just allow for such a system but it doesnt matter for now which number of bosses trigger these checkpoints.

Digimon data: What do we need from the scrapes? Image/Icons + Name + Evolution Stage should be fine for now. But think of a sensible json structure which can be expanded in the future.

Challenge run schema: Should the schema be expandable for future challenge runs? out of scope for now

Technical details
Scraping strategy: just manually scraping once and commiting the json files is fine for now.

Routing: What routes do we need? landing page + detail pages for each challenge run by id + about page

Multi-user: Is it planned that multiple users can share their runs (via URL parameters with seed)? no thats out of scope

Scope & prioritization
MVP vs. future: Should the first phase only have the one challenge run, or should the architecture already be prepared for multiple challenge types?

Yes, it should only have one, but the structure needs to be built to allow for multiple ones.