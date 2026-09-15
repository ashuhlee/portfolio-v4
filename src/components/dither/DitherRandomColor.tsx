import { useState } from 'react';
import DitherCanvas, { type DitherProps, type RGB } from './DitherCanvas';

function isMultiple(waveColor: RGB | RGB[]): waveColor is RGB[] {
	return Array.isArray(waveColor[0]);
}

interface DitherRandomColorProps extends Omit<DitherProps, 'waveColor'> {
	waveColor: RGB | RGB[];
}

export default function DitherRandomColor({ waveColor, ...rest }: DitherRandomColorProps) {
	const [resolvedColor] = useState<RGB>(() =>
		isMultiple(waveColor) ? waveColor[Math.floor(Math.random() * waveColor.length)] : waveColor
	);
	const [ready, setReady] = useState(false);

	return (
		<div style={{ width: '100%', height: '100%', opacity: ready ? 1 : 0, transition: 'opacity 0.5s ease' }}>
			<DitherCanvas waveColor={resolvedColor} onCreated={() => setReady(true)} {...rest} />
		</div>
	);
}
