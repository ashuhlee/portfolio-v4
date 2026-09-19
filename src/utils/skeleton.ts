import '@/styles/skeleton.css';

const FADE_OUT_MS = 250;

const PREVIEW_MS = 0;

function getMedia(el: HTMLElement): HTMLImageElement | HTMLVideoElement | null {
	if (el instanceof HTMLImageElement || el instanceof HTMLVideoElement) return el;
	return el.querySelector('video');
}

function isLoaded(media: HTMLImageElement | HTMLVideoElement): boolean {
	return media instanceof HTMLImageElement ? media.complete : media.readyState >= 2;
}

export function attachSkeletons(selector: string) {
	document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
		const media = getMedia(el);
		const container = el.parentElement;
		if (!media || !container || (!PREVIEW_MS && isLoaded(media))) return;

		const skeleton = document.createElement('div');
		skeleton.className = 'skeleton';
		skeleton.setAttribute('aria-hidden', 'true');
		container.append(skeleton);

		const place = () => {
			const box = container.getBoundingClientRect();
			const rect = el.getBoundingClientRect();
			skeleton.style.left = `${rect.left - box.left - container.clientLeft}px`;
			skeleton.style.top = `${rect.top - box.top - container.clientTop}px`;
			skeleton.style.width = `${rect.width}px`;
			skeleton.style.height = `${rect.height}px`;
		};

		place();
		const observer = new ResizeObserver(place);
		observer.observe(container);

		let loaded = isLoaded(media);
		let waited = !PREVIEW_MS;

		if (PREVIEW_MS) el.style.visibility = 'hidden';

		const reveal = () => {
			observer.disconnect();
			el.style.visibility = '';
			skeleton.classList.add('skeleton--done');
			setTimeout(() => skeleton.remove(), FADE_OUT_MS);
		};

		const tryReveal = () => {
			if (loaded && waited) reveal();
		};

		const markLoaded = () => {
			loaded = true;
			tryReveal();
		};

		const loadEvent = media instanceof HTMLImageElement ? 'load' : 'loadeddata';
		media.addEventListener(loadEvent, markLoaded, { once: true });
		media.addEventListener('error', markLoaded, { once: true });

		if (PREVIEW_MS) {
			setTimeout(() => {
				waited = true;
				tryReveal();
			}, PREVIEW_MS);
		}
	});
}
