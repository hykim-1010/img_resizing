import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'img-resizer:favorites:v1';

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeQualityStep(value) {
  const rounded = Math.round(Number(value) / 10) * 10;
  return clampNumber(rounded, 10, 100);
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeFavorite(item, index = 0) {
  const mode = [1, 2, 3].includes(item?.mode) ? item.mode : 1;
  const rawWidth = Number(item?.width);
  const rawHeight = Number(item?.height);
  const width = Number.isFinite(rawWidth) ? clampNumber(Math.round(rawWidth), 1, 10000) : 1200;
  const height =
    mode === 3 && Number.isFinite(rawHeight) ? clampNumber(Math.round(rawHeight), 1, 10000) : 0;
  const format = item?.format === 'png' ? 'png' : 'jpg';
  const quality = Number.isFinite(Number(item?.quality))
    ? normalizeQualityStep(Number(item.quality))
    : 90;
  const label = String(item?.label || '').trim() || `Preset ${index + 1}`;
  const postProcess =
    mode === 3 && ['fitHeight', 'fitWidth'].includes(item?.postProcess) ? item.postProcess : null;
  const limitFileSize = Boolean(item?.limitFileSize);
  const maxFileSizeMB = Number.isFinite(Number(item?.maxFileSizeMB))
    ? clampNumber(Number(item.maxFileSizeMB), 0.1, 20)
    : 1;

  return {
    id: typeof item?.id === 'string' && item.id ? item.id : createId(),
    label,
    width,
    height,
    format,
    quality,
    mode,
    postProcess,
    limitFileSize,
    maxFileSizeMB,
  };
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((item, index) => normalizeFavorite(item, index));
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(() => loadFavorites());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = useCallback((favoriteInput) => {
    const normalized = normalizeFavorite(favoriteInput);
    setFavorites((prev) => [...prev, normalized]);
    return normalized;
  }, []);

  const deleteFavorite = useCallback((id) => {
    setFavorites((prev) => prev.filter((favorite) => favorite.id !== id));
  }, []);

  const reorderFavorites = useCallback((fromIndex, toIndex) => {
    setFavorites((prev) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex >= prev.length ||
        fromIndex === toIndex
      ) {
        return prev;
      }

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  return {
    favorites,
    addFavorite,
    deleteFavorite,
    reorderFavorites,
  };
}
