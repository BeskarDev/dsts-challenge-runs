/**
 * Svelte action to portal (teleport) an element to a target container
 * This moves the element in the DOM while maintaining Svelte reactivity
 */
export function portal(node: HTMLElement, target: HTMLElement | string = 'body') {
	let targetEl: HTMLElement;

	function update(newTarget: HTMLElement | string) {
		target = newTarget;
		targetEl = typeof target === 'string' ? document.querySelector(target) || document.body : target;
		targetEl.appendChild(node);
	}

	function destroy() {
		if (node.parentNode) {
			node.parentNode.removeChild(node);
		}
	}

	update(target);

	return {
		update,
		destroy
	};
}
