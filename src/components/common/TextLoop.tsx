import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { gsap } from 'gsap';

import './TextLoop.css';

type Shape = 'wave' | 'circle' | 'infinity' | 'arch' | 'line';

interface TextLoopProps {
	text?: string;
	shape?: Shape;
	path?: string;
	speed?: number;
	direction?: 'forward' | 'reverse';
	separator?: string;
	curviness?: number;
	fontSize?: number;
	fontWeight?: number;
	letterSpacing?: number;
	uppercase?: boolean;
	color?: string;
	ribbon?: boolean;
	ribbonColor?: string;
	ribbonWidth?: number;
	pauseOnHover?: boolean;
	className?: string;
	style?: CSSProperties;
}

const DEFAULT_W = 1200;
const DEFAULT_H = 520;
const EDGE_PAD = 6;
const LINE_OVERSCAN = 320;

const buildPath = (shape: Shape, curviness: number, ribbonWidth: number, viewW: number, viewH: number) => {
	const cx = viewW / 2;
	const cy = viewH / 2;
	const c = Math.max(0, curviness);
	const room = Math.max(20, cy - Math.max(0, ribbonWidth) / 2 - EDGE_PAD);

	switch (shape) {
		case 'circle': {
			const r = Math.min(90 + c * 0.95, room);
			return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`;
		}
		case 'infinity': {
			const r = 150 + c * 1.4;
			const h = Math.min(60 + c * 0.95, room);
			return [
				`M ${cx} ${cy}`,
				`C ${cx + r * 0.55} ${cy - h} ${cx + r} ${cy - h} ${cx + r} ${cy}`,
				`C ${cx + r} ${cy + h} ${cx + r * 0.55} ${cy + h} ${cx} ${cy}`,
				`C ${cx - r * 0.55} ${cy - h} ${cx - r} ${cy - h} ${cx - r} ${cy}`,
				`C ${cx - r} ${cy + h} ${cx - r * 0.55} ${cy + h} ${cx} ${cy}`,
				'Z',
			].join(' ');
		}
		case 'arch': {
			const rise = Math.min(120 + c * 1.1, room * 2);
			return `M 120 ${cy + rise / 2} Q ${cx} ${cy - rise * 1.5} ${viewW - 120} ${cy + rise / 2}`;
		}
		case 'line':
			return `M ${-LINE_OVERSCAN} ${cy} L ${viewW + LINE_OVERSCAN} ${cy}`;
		case 'wave':
		default: {
			const a = Math.min(c * 2.2, room * 2);
			return `M -320 ${cy} Q -160 ${cy - a} 0 ${cy} T 320 ${cy} T 640 ${cy} T 960 ${cy} T 1280 ${cy} T ${viewW + 320} ${cy}`;
		}
	}
};

const TextLoop = ({
	text = 'React ✦ Bits',
	shape = 'wave',
	path,
	speed = 90,
	direction = 'forward',
	separator = '✦',
	curviness = 90,
	fontSize = 46,
	fontWeight = 800,
	letterSpacing = 2,
	uppercase = true,
	color = '#ffffff',
	ribbon = true,
	ribbonColor = '#5227FF',
	ribbonWidth = 86,
	pauseOnHover = true,
	className = '',
	style = {},
}: TextLoopProps) => {
	const rootRef = useRef<HTMLDivElement>(null);
	const pathRef = useRef<SVGPathElement>(null);
	const measureRef = useRef<SVGTextElement>(null);
	const headRef = useRef<SVGTextPathElement>(null);
	const tailRef = useRef<SVGTextPathElement>(null);

	const [metrics, setMetrics] = useState({ length: 0, reps: 1 });
	const [containerW, setContainerW] = useState(0);

	const rawId = useId();
	const pathId = `text-loop-${rawId.replace(/:/g, '')}`;

	// A plain line is sized 1 unit = 1px so fontSize and ribbonWidth stay true to their pixel values.
	const isPixelLine = shape === 'line' && !path;
	const viewW = isPixelLine && containerW ? containerW : DEFAULT_W;
	const viewH = isPixelLine ? ribbonWidth : DEFAULT_H;

	const d = useMemo(
		() => path || buildPath(shape, curviness, ribbonWidth, viewW, viewH),
		[path, shape, curviness, ribbonWidth, viewW, viewH],
	);

	const unit = useMemo(() => {
		const base = uppercase ? String(text).toUpperCase() : String(text);
		const gap = separator ? ` ${separator} ` : '   ';
		return `${base}${gap}`;
	}, [text, separator, uppercase]);

	const textStyle = useMemo(
		() => ({ fontSize: `${fontSize}px`, fontWeight, letterSpacing: `${letterSpacing}px` }),
		[fontSize, fontWeight, letterSpacing],
	);

	useLayoutEffect(() => {
		const root = rootRef.current;
		if (!root || !isPixelLine) return undefined;

		const update = () => setContainerW(Math.round(root.getBoundingClientRect().width));
		update();

		const observer = new ResizeObserver(update);
		observer.observe(root);
		return () => observer.disconnect();
	}, [isPixelLine]);

	useLayoutEffect(() => {
		const pathEl = pathRef.current;
		const measureEl = measureRef.current;
		if (!pathEl || !measureEl) return undefined;

		let cancelled = false;

		const measure = () => {
			if (cancelled) return;
			let length = 0;
			let unitWidth = 0;
			try {
				length = pathEl.getTotalLength();
				unitWidth = measureEl.getComputedTextLength();
			} catch {
				return;
			}
			if (!length) return;

			const reps = unitWidth > 0 ? Math.max(1, Math.round(length / unitWidth)) : 1;
			setMetrics((prev) => (prev.length === length && prev.reps === reps ? prev : { length, reps }));
		};

		measure();
		document.fonts?.ready.then(measure).catch(() => {});

		return () => {
			cancelled = true;
		};
	}, [d, unit, fontSize, fontWeight, letterSpacing]);

	useEffect(() => {
		const { length } = metrics;
		const head = headRef.current;
		const tail = tailRef.current;
		if (!head || !tail || !length) return undefined;

		const apply = (offset: number) => {
			const partner = offset >= 0 ? offset - length : offset + length;
			head.setAttribute('startOffset', String(offset));
			tail.setAttribute('startOffset', String(partner));
		};

		apply(0);

		const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (prefersReduced || speed <= 0) return undefined;

		const state = { offset: 0 };
		const tween = gsap.to(state, {
			offset: direction === 'reverse' ? -length : length,
			duration: length / speed,
			ease: 'none',
			repeat: -1,
			onUpdate: () => apply(state.offset),
		});

		const root = rootRef.current;
		const pause = () => tween.pause();
		const resume = () => tween.resume();

		if (pauseOnHover && root) {
			root.addEventListener('pointerenter', pause);
			root.addEventListener('pointerleave', resume);
		}

		return () => {
			tween.kill();
			if (pauseOnHover && root) {
				root.removeEventListener('pointerenter', pause);
				root.removeEventListener('pointerleave', resume);
			}
		};
	}, [metrics, speed, direction, pauseOnHover]);

	const loopText = unit.repeat(metrics.reps);
	const fitLength = metrics.length || undefined;

	return (
		<div ref={rootRef} className={`text-loop ${className}`.trim()} style={style}>
			<svg
				className="text-loop-svg"
				viewBox={`0 0 ${viewW} ${viewH}`}
				preserveAspectRatio="xMidYMid meet"
				role="img"
				aria-label={text}
			>
				<path
					ref={pathRef}
					id={pathId}
					d={d}
					fill="none"
					style={{ stroke: ribbon ? ribbonColor : 'none' }}
					strokeWidth={ribbon ? ribbonWidth : 0}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>

				<text ref={measureRef} className="text-loop-measure" style={textStyle} aria-hidden="true">
					{unit}
				</text>

				<text
					className="text-loop-text"
					style={{ ...textStyle, fill: color }}
					dominantBaseline="central"
					aria-hidden="true"
					textLength={fitLength}
					lengthAdjust="spacing"
				>
					<textPath ref={headRef} href={`#${pathId}`} startOffset={0}>
						{loopText}
					</textPath>
				</text>

				<text
					className="text-loop-text"
					style={{ ...textStyle, fill: color }}
					dominantBaseline="central"
					aria-hidden="true"
					textLength={fitLength}
					lengthAdjust="spacing"
				>
					<textPath ref={tailRef} href={`#${pathId}`} startOffset={0}>
						{loopText}
					</textPath>
				</text>
			</svg>
		</div>
	);
};

export default TextLoop;
