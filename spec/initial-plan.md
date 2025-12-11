in this new repository, I want to create a web app which allows you to play a selection of custom challenge runs in the game digimon story time stranger.

for this, lets start with building up a spec folder with all implementation plans and phases.

in general, the implementation should follow best practices, use professional patterns and clean code implementation practices.

First off give me feedback and ask followup questions needed before being able to write down the implementation plan and phases.

Tech Stack
node 24, typescript, svelte 5, shadcn-svelte + tailwind, vite, vitest

Deployment
static web app deployment to github pages (github workflow)

UX
modern, simple design, intuitive user flow, inspired by the source game (Digimon Story Time Stranger)

Architecture
landing page + header bar + routing
global state management (svelte stores) per challenge run
each challenge run has their own page
game info scraped from known websites (bosses, available digimon, etc) and stored in the repository as json files (structure to be defined) in their own directory:
https://game8.co/games/Digimon-Story-Time-Stranger/archives/553558 (boos info)
https://game8.co/games/Digimon-Story-Time-Stranger/archives/552892 (list of digimon)
Initial feature set
one initial challenge run: "Random Evolution Challenge" with the following rule set:

hard mode
restrict evolution by story progress (starting with baby only, then rookie after some boss, etc)
randomly determine which 6 digimon of the current max evolution the team has to be built from (may also have some boss checkpoints for re-rolling)
restrict max level to upcoming boss levels