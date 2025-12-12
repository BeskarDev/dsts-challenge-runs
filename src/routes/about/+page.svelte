<script lang="ts">
	import Card from '$lib/components/common/Card.svelte';
</script>

<div class="max-w-4xl mx-auto">
	<h1 class="text-4xl font-bold text-gray-900 dark:text-muted-50 mb-8">About DSTS Challenge Runs</h1>

	<div class="space-y-6">
		<Card>
			<h2 class="text-2xl font-bold text-gray-900 dark:text-muted-50 mb-4">What is this?</h2>
			<p class="text-gray-700 dark:text-muted-300 mb-4">
				DSTS Challenge Runs is a web application designed to help players of
				<strong class="text-gray-900 dark:text-muted-100">Digimon Story Time Stranger</strong> create
				and track custom challenge runs. The app generates randomized rule sets and helps you monitor
				your progress throughout your playthrough.
			</p>
		</Card>

		<Card>
			<h2 class="text-2xl font-bold text-gray-900 dark:text-muted-50 mb-4">Features</h2>
			<ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-muted-300">
				<li>Seed-based randomization for reproducible challenge runs</li>
				<li>Track your progress through boss checkpoints</li>
				<li>Evolution tier restrictions based on story progress</li>
				<li>Re-roll functionality at checkpoints</li>
				<li>Local storage - all data stays in your browser</li>
			</ul>
		</Card>

		<Card>
			<h2 class="text-2xl font-bold text-gray-900 dark:text-muted-50 mb-4">How to Use</h2>
			<ol class="list-decimal list-inside space-y-2 text-gray-700 dark:text-muted-300">
				<li>Select a challenge type from the home page</li>
				<li>Generate your team using a seed (or let the app create one)</li>
				<li>Follow the rules displayed for your challenge</li>
				<li>Update your progress as you defeat bosses</li>
				<li>Re-roll at checkpoints if allowed</li>
			</ol>
		</Card>

		<Card>
			<h2 class="text-2xl font-bold text-gray-900 dark:text-muted-50 mb-4">Tech Stack</h2>
			<p class="text-gray-700 dark:text-muted-300 mb-2">Built with modern web technologies:</p>
			<ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-muted-300">
				<li>Svelte 5 with SvelteKit</li>
				<li>TypeScript</li>
				<li>Tailwind CSS</li>
				<li>Deployed on GitHub Pages</li>
			</ul>
		</Card>
	</div>
</div>
