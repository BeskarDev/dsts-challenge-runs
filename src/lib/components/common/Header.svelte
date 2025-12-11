<script lang="ts">
	import { base } from '$app/paths';
</script>

<header class="bg-primary-700 text-white shadow-lg">
	<div class="container mx-auto px-4 py-4">
		<div class="flex items-center justify-between">
			<a href="{base}/" class="text-2xl font-bold hover:text-primary-200 transition-colors">
				DSTS Challenge Runs
			</a>
			<nav>
				<ul class="flex gap-6">
					<li>
						<a
							href="{base}/"
							class="hover:text-primary-200 transition-colors font-medium"
						>
							Home
						</a>
					</li>
					<li>
						<a
							href="{base}/about"
							class="hover:text-primary-200 transition-colors font-medium"
						>
							About
						</a>
					</li>
				</ul>
			</nav>
		</div>
	</div>
</header>
