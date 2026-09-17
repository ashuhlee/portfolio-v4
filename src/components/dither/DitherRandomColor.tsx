import { useEffect, useState } from 'react';
import DitherCanvas, { type DitherProps, type RGB } from './DitherCanvas';
import checkHardwareAcceleration from '../../utils/hardwareAcceleration';

function isMultiple(waveColor: RGB | RGB[]): waveColor is RGB[] {
	return Array.isArray(waveColor[0]);
}

function getTheme(): string {
	if (typeof document === 'undefined') return 'light';
	return document.documentElement.getAttribute('data-theme') || 'light';
}

interface DitherRandomColorProps extends Omit<DitherProps, 'waveColor'> {
	waveColor: RGB | RGB[];
}

export default function DitherRandomColor({ waveColor, backgroundColor, ...rest }: DitherRandomColorProps) {
	const [resolvedColor] = useState<RGB>(() =>
		isMultiple(waveColor) ? waveColor[Math.floor(Math.random() * waveColor.length)] : waveColor
	);
	const [ready, setReady] = useState(false);
	const [theme, setTheme] = useState(getTheme);

	useEffect(() => {
		const observer = new MutationObserver(() => setTheme(getTheme()));
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
		return () => observer.disconnect();
	}, []);

	if (theme === 'dark') return null;
	if (!checkHardwareAcceleration()) return null;

	return (
		<div style={{ width: '100%', height: '100%', opacity: ready ? 1 : 0, transition: 'opacity 0.5s ease' }}>
			<DitherCanvas waveColor={resolvedColor} backgroundColor={backgroundColor} onCreated={() => setReady(true)} {...rest} />
		</div>
	);
}
