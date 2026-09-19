export type SettingKey = 'soundEffects' | 'tooltips' | 'trailingCursor';
export type Settings = Record<SettingKey, boolean>;

export const SETTINGS_EVENT = 'settings:change';

const STORAGE_KEY = 'site-settings';

export const DEFAULT_SETTINGS: Settings = {
	soundEffects: true,
	tooltips: true,
	trailingCursor: true,
};

let cache: Settings | null = null;

function readStored(): Settings {
	const settings = { ...DEFAULT_SETTINGS };

	try {
		const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
		for (const key of Object.keys(DEFAULT_SETTINGS) as SettingKey[]) {
			if (typeof parsed?.[key] === 'boolean') settings[key] = parsed[key];
		}
	} catch {}

	return settings;
}

function emit(key: SettingKey, value: boolean) {
	document.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: { key, value } }));
}

export function getSettings(): Settings {
	return (cache ??= readStored());
}

export function getSetting(key: SettingKey): boolean {
	return getSettings()[key];
}

export function setSetting(key: SettingKey, value: boolean) {
	const settings = getSettings();
	if (settings[key] === value) return;

	settings[key] = value;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch {}

	emit(key, value);
}

export function toggleSetting(key: SettingKey): boolean {
	const next = !getSetting(key);
	setSetting(key, next);
	return next;
}

export function onSettingChange(key: SettingKey, callback: (value: boolean) => void): () => void {
	const handler = (event: Event) => {
		const detail = (event as CustomEvent<{ key: SettingKey; value: boolean }>).detail;
		if (detail.key === key) callback(detail.value);
	};

	document.addEventListener(SETTINGS_EVENT, handler);
	return () => document.removeEventListener(SETTINGS_EVENT, handler);
}

// Keep other open tabs in sync when a setting changes elsewhere
if (typeof window !== 'undefined') {
	window.addEventListener('storage', (event) => {
		if (event.key !== STORAGE_KEY) return;

		const previous = getSettings();
		cache = readStored();

		for (const key of Object.keys(cache) as SettingKey[]) {
			if (cache[key] !== previous[key]) emit(key, cache[key]);
		}
	});
}
