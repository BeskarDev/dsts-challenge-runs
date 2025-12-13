<script lang="ts">
	import Card from '$lib/components/common/Card.svelte';
</script>

<svelte:head>
	<title>About - Digital Challenge Companion</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
	<h1 class="text-4xl font-bold text-gray-900 dark:text-muted-50 mb-8">
		About Digital Challenge Companion
	</h1>

	<div class="space-y-6">
		<Card>
			<h2 class="text-2xl font-bold text-gray-900 dark:text-muted-50 mb-4">What is this?</h2>
			<p class="text-gray-700 dark:text-muted-300 mb-4">
				Digital Challenge Companion is a web application designed to help players of
				<strong class="text-gray-900 dark:text-muted-100">Digimon Story: Time Stranger</strong> track
				custom challenge runs. The app generates randomized teams based on a seed system and helps you
				monitor your progress throughout your playthrough.
			</p>
		</Card>

		<Card>
			<h2 class="text-2xl font-bold text-gray-900 dark:text-muted-50 mb-4">Features</h2>
			<ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-muted-300">
				<li>
					<strong>Seed-based randomization</strong> for reproducible and shareable challenge runs
				</li>
				<li>
					<strong>Evolution tier restrictions</strong> based on story progress and boss checkpoints
				</li>
				<li><strong>Boss checkpoint tracking</strong> to monitor your progress through the game</li>
				<li>
					<strong>Re-roll functionality</strong> at designated checkpoints to refresh your team
				</li>
				<li>
					<strong>Local storage</strong> - all your challenge data stays in your browser (no account needed)
				</li>
				<li><strong>Dark/Light mode support</strong> for comfortable play at any time</li>
				<li>
					<strong>Japanese localization</strong> for those that prefer the original Japanese names and
					terms :)
				</li>
			</ul>
		</Card>

		<Card>
			<h2 class="text-2xl font-bold text-gray-900 dark:text-muted-50 mb-4">How to Use</h2>
			<ol class="list-decimal list-inside space-y-2 text-gray-700 dark:text-muted-300">
				<li>Start a challenge run from the home page</li>
				<li>Generate your team using a seed (or let the app create one randomly)</li>
				<li>Review the rules displayed for your challenge type</li>
				<li>Update your progress as you defeat bosses in the game</li>
				<li>Automatically re-roll your team at checkpoint bosses to get a fresh random team</li>
				<li>Track your history of completed and in-progress runs</li>
			</ol>
		</Card>

		<Card>
			<h2 class="text-2xl font-bold text-gray-900 dark:text-muted-50 mb-4">Challenge Types</h2>
			<div class="space-y-3 text-gray-700 dark:text-muted-300">
				<div>
					<h3 class="font-semibold text-gray-900 dark:text-muted-100 mb-1">
						Random Evolution Challenge
					</h3>
					<p>
						Build your team from randomly selected Digimon that unlock as you progress through the
						story. Your team composition changes with each boss checkpoint, and you're restricted to
						using only the evolution stages available at your current progress point.
					</p>
				</div>
				<div>
					<h3 class="font-semibold text-gray-900 dark:text-muted-100 mb-1">Other Challenges</h3>
					<p>
						The first challenge is just something I thought would be fun for repeat casual
						playthroughs and to see many different digimon you maybe wouldnt pick normally.
						<br />I may add more challenge types in the future based on user feedback and ideas!
					</p>
				</div>
			</div>
		</Card>

		<Card>
			<h2 class="text-2xl font-bold text-gray-900 dark:text-muted-50 mb-4">Tech Stack</h2>
			<p class="text-gray-700 dark:text-muted-300 mb-2">Built with modern web technologies:</p>
			<ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-muted-300">
				<li><strong>Svelte 5</strong> with SvelteKit for reactive UI</li>
				<li><strong>TypeScript</strong> for type-safe development</li>
				<li><strong>Shadcn + Tailwind CSS</strong> for responsive styling</li>
			</ul>
		</Card>

		<Card>
			<h2 class="text-2xl font-bold text-gray-900 dark:text-muted-50 mb-4">Copyright Notice</h2>
			<div class="space-y-3 text-gray-700 dark:text-muted-300">
				<p>
					This fan-made project does not claim ownership of any images, icons, or linked content
					displayed on this website. All Digimon-related images and data are the property of their
					respective copyright holders.
				</p>
				<p>Images and content are sourced from:</p>
				<ul class="list-disc list-inside space-y-1 ml-4">
					<li>
						<a
							href="https://www.grindosaur.com/"
							target="_blank"
							rel="noopener noreferrer"
							class="text-primary-600 dark:text-primary-400 hover:underline"
						>
							Grindosaur
						</a> - Digimon data and attribute icons
					</li>
					<li>
						<a
							href="https://game8.co/"
							target="_blank"
							rel="noopener noreferrer"
							class="text-primary-600 dark:text-primary-400 hover:underline"
						>
							Game8.co
						</a> - Boss images and strategy guides
					</li>
				</ul>
				<p class="text-sm italic mt-3">
					If you are a representative of Grindosaur, Game8.co, or any other copyright holder and
					would like content removed or modified, please contact me via Reddit at
					<a
						href="https://www.reddit.com/user/theRapkin"
						target="_blank"
						rel="noopener noreferrer"
						class="text-primary-600 dark:text-primary-400 hover:underline font-medium"
					>
						u/theRapkin
					</a>.
				</p>
			</div>
		</Card>
	</div>
</div>
