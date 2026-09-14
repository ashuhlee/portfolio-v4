import { useState } from 'react';
import Dither from './Dither.jsx';

function isMultiple(waveColor) {
	return Array.isArray(waveColor[0]);
}

export default function DitherRandom({ waveColor, ...rest }) {
	const [resolvedColor] = useState(() =>
		isMultiple(waveColor) ? waveColor[Math.floor(Math.random() * waveColor.length)] : waveColor
	);
	return <Dither waveColor={resolvedColor} {...rest} />;
}
