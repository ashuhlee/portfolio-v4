let cached: boolean | null = null;

export default function checkHardwareAcceleration(): boolean {
	if (cached !== null) return cached;
	if (typeof document === 'undefined') return true;

	const canvas = document.createElement('canvas');
	const attrs: WebGLContextAttributes = { failIfMajorPerformanceCaveat: true };
	const gl = (canvas.getContext('webgl2', attrs) || canvas.getContext('webgl', attrs)) as WebGLRenderingContext | null;

	if (!gl) {
		cached = false;
		return cached;
	}

	let hasAcceleration = true;
	const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
	if (debugInfo) {
		const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string;
		if (renderer && (renderer.includes('SwiftShader') || renderer.includes('Software'))) {
			hasAcceleration = false;
		}
	}

	gl.getExtension('WEBGL_lose_context')?.loseContext();

	cached = hasAcceleration;
	return cached;
}
