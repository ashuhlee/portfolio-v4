import { useEffect, useState } from 'react';
import PixelBlast from './PixelBlast';

function getTheme(): string {
	if (typeof document === 'undefined') return 'light';
	return document.documentElement.getAttribute('data-theme') || 'light';
}

type PixelBlastProps = React.ComponentProps<typeof PixelBlast>;

interface PixelBlastGateProps extends PixelBlastProps {
	// Only mounts PixelBlast while the site is in this theme. Omit to always
	// render, regardless of theme.
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

	return <PixelBlast {...rest} />;
}
