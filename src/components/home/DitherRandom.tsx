import { useState } from 'react';
import Dither, { type DitherProps, type RGB } from './Dither';

function isMultiple(waveColor: RGB | RGB[]): waveColor is RGB[] {
	return Array.isArray(waveColor[0]);
}

interface DitherRandomProps extends Omit<DitherProps, 'waveColor'> {
	waveColor: RGB | RGB[];
}

export default function DitherRandom({ waveColor, ...rest }: DitherRandomProps) {
	const [resolvedColor] = useState<RGB>(() =>
		isMultiple(waveColor) ? waveColor[Math.floor(Math.random() * waveColor.length)] : waveColor
	);
	// The canvas has to mount, spin up a WebGL context, and compile its
	// shaders before it can paint anything — fade it in once that's done
	// (onCreated) instead of letting the pattern pop in abruptly.
	const [ready, setReady] = useState(false);

	return (
		<div style={{ width: '100%', height: '100%', opacity: ready ? 1 : 0, transition: 'opacity 0.5s ease' }}>
			<Dither waveColor={resolvedColor} onCreated={() => setReady(true)} {...rest} />
		</div>
	);
}
