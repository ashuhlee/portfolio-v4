import { GitHubCalendar } from 'react-github-calendar';
import { useState, useEffect, useRef, cloneElement } from 'react';
import type { ReactElement } from 'react';

type ThemePalette = { light: [string,string,string,string,string]; dark: [string,string,string,string,string] };

const themes: ThemePalette[] = [
	// 0: pink (default)
	{
		light: ['#f5f5f5', '#ffe3f1', '#ffcbe9', '#ffa6d9', '#FE6FC1'],
		dark:  ['#1a1721', '#4a1e3a', '#8f3568', '#FF94D6', '#ffc4eb'],
	},
	// 1: purple
	{
		light: ['#f5f5f5', '#E8E7FD', '#C9C7FB', '#A09DFA', '#7A76F2'],
		dark:  ['#1a1721', '#252244', '#4845a0', '#8580f5', '#A8A6FF'],
	},
	// 2: blue
	{
		light: ['#f5f5f5', '#D6E5FF', '#B8CEFF', '#89AEFF', '#5591FF'],
		dark:  ['#1a1721', '#1a2a45', '#1e4d8c', '#5591FF', '#80AAFF'],
	},
];

type Activity = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };
type TooltipState = { text: string; x: number; y: number } | null;

export default function GitHubContributions() {
	const [isDark, setIsDark] = useState(false);
	const [brandIdx, setBrandIdx] = useState(() => {
		try {
			const idx = parseInt(localStorage.getItem('brand-color-idx') ?? '0', 10);
			return isNaN(idx) ? 0 : Math.min(idx, themes.length - 1);
		} catch { return 0; }
	});
	const [tip, setTip] = useState<TooltipState>(null);
	const wrapRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const check = () => {
			setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
			try {
				const idx = parseInt(localStorage.getItem('brand-color-idx') ?? '0', 10);
				setBrandIdx(isNaN(idx) ? 0 : Math.min(idx, themes.length - 1));
			} catch {}
		};
		check();
		const observer = new MutationObserver(check);
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style'] });
		return () => observer.disconnect();
	}, []);

	const activeTheme = themes[brandIdx] ?? themes[0];

	const labels = {
		months: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
	};

	function formatDate(date: string) {
		return new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
			month: 'short', day: 'numeric', year: 'numeric',
		});
	}

	function renderBlock(block: ReactElement, activity: Activity) {
		return cloneElement(block, {
			onMouseEnter: (e: MouseEvent) => {
				if (activity.count === 0) return;
				const rect = (e.currentTarget as Element).getBoundingClientRect();
				const wrap = wrapRef.current?.getBoundingClientRect();
				setTip({
					text: `${activity.count} contribution${activity.count !== 1 ? 's' : ''} · ${formatDate(activity.date)}`,
					x: rect.left - (wrap?.left ?? 0) + rect.width / 2,
					y: rect.top - (wrap?.top ?? 0),
				});
			},
			onMouseLeave: () => setTip(null),
		} as object);
	}

	const tooltipStyle: React.CSSProperties = {
		position: 'absolute',
		left: tip?.x ?? 0,
		top: (tip?.y ?? 0) - 36,
		transform: 'translateX(-50%)',
		pointerEvents: 'none',
		whiteSpace: 'nowrap',
		fontFamily: 'var(--font-mono), monospace',
		fontSize: '11px',
		padding: '0.5em 1em',
		backgroundColor: 'var(--color-bg-page)',
		color: 'var(--color-text-primary)',
		border: '1px solid var(--color-text-primary)',
		opacity: tip ? 1 : 0,
		transition: 'opacity 120ms ease',
		zIndex: 10,
	};

	const scrollStyle = {
		overflowX: 'auto',
		scrollbarWidth: 'none',
		msOverflowStyle: 'none',
	} as React.CSSProperties;

	return (
		<div ref={wrapRef} style={{ position: 'relative' }}>
			{tip && <div style={tooltipStyle}>{tip.text}</div>}
			<div className="cal-scroll" style={scrollStyle}>
				<GitHubCalendar
					username="ashuhlee"
					theme={activeTheme}
					colorScheme={isDark ? 'dark' : 'light'}
					showColorLegend={false}
					showTotalCount={false}
					blockSize={15}
					blockRadius={0}
					blockMargin={8}
					fontSize={12}
					labels={labels}
					renderBlock={renderBlock}
				/>
			</div>
		</div>
	);
}
