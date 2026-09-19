const SAFARI_PATTERN = /^((?!chrome|chromium|android|crios|fxios|edgios|edg\/).)*safari/i;

export default function isSafari(): boolean {
	if (typeof navigator === 'undefined') return false;
	return SAFARI_PATTERN.test(navigator.userAgent);
}
