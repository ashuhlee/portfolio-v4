import { useEffect, useState } from 'react';
import PixelBlast from './PixelBlast';
import checkHardwareAcceleration from '../../utils/hardwareAcceleration';

function getTheme(): string {
	if (typeof document === 'undefined') return 'light';
	return document.documentElement.getAttribute('data-theme') || 'light';
}

type PixelBlastProps = React.ComponentProps<typeof PixelBlast>;

interface PixelBlastGateProps extends PixelBlastProps {
	visibleInTheme?: 'light' | 'dark';
}

export default function PixelBlastGate({ visibleInTheme, ...rest }: PixelBlastGateProps) {
	const [theme, setTheme] = useState(getTheme);

	useEffect(() => {
		const observer = new MutationObserver(() => setTheme(getTheme()));
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
		return () => observer.disconnect();
	}, []);

	if (visibleInTheme && theme !== visibleInTheme) return null;

	if (!checkHardwareAcceleration()) return null;

	return <PixelBlast {...rest} />;
}
