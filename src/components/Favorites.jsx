import { useState } from 'react';

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeQualityStep(value) {
  const rounded = Math.round(Number(value) / 10) * 10;
  return clampNumber(rounded, 10, 100);
}

function createInitialForm(settings) {
  const mode = settings?.mode ?? 1;

  return {
    label: '',
    mode,
    width: settings?.width ?? 1200,
    heightBasis: mode === 2 ? settings?.height ?? 1200 : settings?.height ?? 1200,
    height: mode === 3 ? settings?.height ?? 1200 : settings?.height ?? 1200,
    format: settings?.format ?? 'jpg',
    quality: normalizeQualityStep(settings?.quality ?? 90),
    postProcess: mode === 3 ? settings?.postProcess ?? null : null,
    limitFileSize: Boolean(settings?.limitFileSize),
    maxFileSizeMB: settings?.maxFileSizeMB ?? 1,
  };
}

function getFavoriteDescription(favorite) {
  const modeText =
    favorite.mode === 1
      ? `W ${favorite.width}px`
      : favorite.mode === 2
        ? `H ${favorite.width}px`
        : `${favorite.width}x${favorite.height}px`;

  const postProcessText =
    favorite.mode === 3 && favorite.postProcess
      ? favorite.postProcess === 'fitHeight'
        ? 'fitHeight'
        : 'fitWidth'
      : 'none';
  const sizeLimitText = favorite.limitFileSize
    ? `<=${Number(favorite.maxFileSizeMB || 1).toFixed(1)}MB`
    : 'noLimit';

  return `${modeText} | ${favorite.format.toUpperCase()} | Q${favorite.quality} | ${postProcessText} | ${sizeLimitText}`;
}

function FavoriteModal({
  open,
  form,
  onFormChange,
  onClose,
  onSubmit,
  disabled,
}) {
  if (!open) {
    return null;
  }

  const widthDisabled = form.mode === 2;
  const heightDisabled = form.mode !== 3;
  const showPostProcess = form.mode === 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">즐겨찾기 추가</h3>

        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">별칭</span>
            <input
              type="text"
              value={form.label}
              onChange={(event) => onFormChange({ label: event.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none ring-blue-400 focus:ring"
              placeholder="예: 인스타 피드 4:5"
              maxLength={40}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">모드</span>
            <select
              value={form.mode}
              onChange={(event) => onFormChange({ mode: Number(event.target.value) })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none ring-blue-400 focus:ring"
            >
              <option value={1}>가로 기준</option>
              <option value={2}>세로 기준</option>
              <option value={3}>가로 x 세로</option>
            </select>
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">
                {form.mode === 2 ? '가로(px, 자동)' : '가로(px)'}
              </span>
              <input
                type="number"
                min={1}
                max={10000}
                disabled={widthDisabled}
                value={form.width}
                onChange={(event) => onFormChange({ width: Number(event.target.value) || 1 })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none ring-blue-400 focus:ring disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">
                {form.mode === 2 ? '세로(px)' : form.mode === 3 ? '세로(px)' : '세로(px, 자동)'}
              </span>
              <input
                type="number"
                min={1}
                max={10000}
                disabled={form.mode === 1}
                value={form.mode === 2 ? form.heightBasis : form.height}
                onChange={(event) => {
                  const value = Number(event.target.value) || 1;
                  if (form.mode === 2) {
                    onFormChange({ heightBasis: value });
                  } else {
                    onFormChange({ height: value });
                  }
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none ring-blue-400 focus:ring disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </label>
          </div>

          {heightDisabled && (
            <p className="text-xs text-gray-500">선택한 모드에 따라 비활성화된 값은 자동 계산됩니다.</p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">파일 형식</span>
              <select
                value={form.format}
                onChange={(event) => onFormChange({ format: event.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none ring-blue-400 focus:ring"
              >
                <option value="jpg">JPG</option>
                <option value="png">PNG</option>
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">압축률 ({form.quality})</span>
              <select
                value={form.quality}
                onChange={(event) => onFormChange({ quality: Number(event.target.value) || 10 })}
                disabled={form.format === 'png'}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none ring-blue-400 focus:ring disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {showPostProcess && (
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">후처리</span>
              <select
                value={form.postProcess ?? ''}
                onChange={(event) => onFormChange({ postProcess: event.target.value || null })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none ring-blue-400 focus:ring"
              >
                <option value="">none</option>
                <option value="fitHeight">fitHeight</option>
                <option value="fitWidth">fitWidth</option>
              </select>
            </label>
          )}

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={Boolean(form.limitFileSize)}
                onChange={(event) => onFormChange({ limitFileSize: event.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              최대 용량 제한
            </label>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min={0.1}
                max={20}
                step={0.1}
                value={form.maxFileSizeMB}
                onChange={(event) => onFormChange({ maxFileSizeMB: Number(event.target.value) || 0.1 })}
                disabled={!form.limitFileSize}
                className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none ring-blue-400 focus:ring disabled:cursor-not-allowed disabled:bg-gray-100"
              />
              <span className="text-sm text-gray-700">MB 이하</span>
            </div>
            <p className="mt-2 text-xs text-gray-500">JPG에서만 적용됩니다.</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled}
            className={[
              'rounded-md px-3 py-2 text-sm font-semibold',
              disabled ? 'cursor-not-allowed bg-gray-200 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700',
            ].join(' ')}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Favorites({
  favorites,
  settings,
  disabled,
  onAdd,
  onDelete,
  onReorder,
  onApply,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(() => createInitialForm(settings));
  const [dragIndex, setDragIndex] = useState(null);

  const openModal = () => {
    setForm(createInitialForm(settings));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleFormChange = (partial) => {
    setForm((prev) => {
      const next = { ...prev, ...partial };

      if (partial.mode && partial.mode !== 3) {
        next.postProcess = null;
      }

      if (Object.prototype.hasOwnProperty.call(partial, 'quality')) {
        next.quality = normalizeQualityStep(partial.quality);
      }

      return next;
    });
  };

  const handleSubmit = () => {
    const label = form.label.trim();
    if (!label) {
      return;
    }

    const mode = [1, 2, 3].includes(form.mode) ? form.mode : 1;
    const width = clampNumber(Math.round(Number(form.width) || 1), 1, 10000);
    const heightBasis = clampNumber(Math.round(Number(form.heightBasis) || 1), 1, 10000);
    const height = clampNumber(Math.round(Number(form.height) || 1), 1, 10000);
    const quality = normalizeQualityStep(form.quality);
    const format = form.format === 'png' ? 'png' : 'jpg';
    const limitFileSize = Boolean(form.limitFileSize);
    const maxFileSizeMB = clampNumber(Number(form.maxFileSizeMB) || 1, 0.1, 20);
    const postProcess = mode === 3 && ['fitHeight', 'fitWidth'].includes(form.postProcess)
      ? form.postProcess
      : null;

    const favorite = {
      label,
      mode,
      width: mode === 2 ? heightBasis : width,
      height: mode === 3 ? height : 0,
      format,
      quality,
      postProcess,
      limitFileSize,
      maxFileSizeMB,
    };

    onAdd(favorite);
    setIsModalOpen(false);
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">즐겨찾기</h2>
        <button
          type="button"
          onClick={openModal}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + 추가
        </button>
      </div>

      {favorites.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
          저장한 즐겨찾기가 없습니다. 자주 쓰는 설정을 등록해 보세요.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-2">
          {favorites.map((favorite, index) => (
            <div
              key={favorite.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) {
                  onReorder(dragIndex, index);
                }
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              className={[
                'flex items-center gap-2 rounded-lg border px-3 py-2',
                dragIndex === index ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white',
              ].join(' ')}
            >
              <button
                type="button"
                title={getFavoriteDescription(favorite)}
                onClick={() => onApply(favorite)}
                disabled={disabled}
                className={[
                  'min-w-0 flex-1 truncate text-left text-sm',
                  disabled ? 'cursor-not-allowed text-gray-400' : 'text-gray-800',
                ].join(' ')}
              >
                <span className="font-semibold">{favorite.label}</span>
                <span className="ml-2 text-xs text-gray-500">{getFavoriteDescription(favorite)}</span>
              </button>
              <button
                type="button"
                onClick={() => onDelete(favorite.id)}
                className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                title="삭제"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}

      <FavoriteModal
        open={isModalOpen}
        form={form}
        onFormChange={handleFormChange}
        onClose={closeModal}
        onSubmit={handleSubmit}
        disabled={disabled}
      />
    </section>
  );
}