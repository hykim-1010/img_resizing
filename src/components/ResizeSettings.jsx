import { useState } from 'react';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function calculateDerivedSize(settings, sourceImage) {
  if (!sourceImage) {
    return {
      displayWidth: settings.width,
      displayHeight: settings.height,
    };
  }

  const ratio = sourceImage.width / sourceImage.height;
  const calculatedWidth = clamp(Math.round(settings.height * ratio), 1, 10000);
  const calculatedHeight = clamp(Math.round(settings.width / ratio), 1, 10000);

  return {
    displayWidth: settings.mode === 2 ? calculatedWidth : settings.width,
    displayHeight: settings.mode === 1 ? calculatedHeight : settings.height,
  };
}

export default function ResizeSettings({ sourceImage, settings, onChange, onPreview, disabled }) {
  const widthDisabled = settings.mode === 2;
  const heightDisabled = settings.mode === 1;
  const { displayWidth, displayHeight } = calculateDerivedSize(settings, sourceImage);

  const [editingField, setEditingField] = useState(null);
  const [draft, setDraft] = useState({ width: '', height: '' });

  const startEditing = (field) => {
    const value = field === 'width' ? settings.width : settings.height;
    setEditingField(field);
    setDraft((prev) => ({ ...prev, [field]: String(value) }));
  };

  const commitDimension = (field) => {
    const rawValue = draft[field];
    const parsed = Number(rawValue);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      onChange({ [field]: 1 });
      setDraft((prev) => ({ ...prev, [field]: '1' }));
      setEditingField(null);
      return;
    }

    const nextValue = clamp(Math.round(parsed), 1, 10000);
    onChange({ [field]: nextValue });
    setDraft((prev) => ({ ...prev, [field]: String(nextValue) }));
    setEditingField(null);
  };

  const handleDimensionChange = (field) => (event) => {
    const nextRaw = event.target.value;
    setDraft((prev) => ({ ...prev, [field]: nextRaw }));

    if (nextRaw === '') {
      return;
    }

    const parsed = Number(nextRaw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return;
    }

    onChange({ [field]: clamp(Math.round(parsed), 1, 10000) });
  };

  const handleQualityChange = (event) => {
    const parsed = Number(event.target.value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    onChange({ quality: clamp(Math.round(parsed), 10, 100) });
  };

  const handleMaxFileSizeToggle = (event) => {
    onChange({ limitFileSize: event.target.checked });
  };

  const handleMaxFileSizeChange = (event) => {
    const parsed = Number(event.target.value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    onChange({ maxFileSizeMB: clamp(Math.round(parsed * 10) / 10, 0.1, 20) });
  };

  const widthValue = widthDisabled
    ? String(displayWidth)
    : editingField === 'width'
      ? draft.width
      : String(settings.width);

  const heightValue = heightDisabled
    ? String(displayHeight)
    : editingField === 'height'
      ? draft.height
      : String(settings.height);

  return (
    <section className="space-y-4">
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">모드</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[
              { value: 1, label: '가로 고정' },
              { value: 2, label: '세로 고정' },
              { value: 3, label: '캔버스 맞춤' },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onChange({ mode: item.value })}
                disabled={disabled}
                className={[
                  'rounded-md border px-3 py-2 text-sm transition-colors',
                  settings.mode === item.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
                  disabled ? 'cursor-not-allowed opacity-50' : '',
                ].join(' ')}
              >
                {item.label}
              </button>
            ))}
          </div>
          {settings.mode === 3 && (
            <p className="mt-2 text-xs text-gray-500">기본: 여백 유지 | fitHeight: 좌우 크롭 | fitWidth: 상하 크롭</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">가로(px)</span>
            <input
              type="number"
              min={1}
              max={10000}
              value={widthValue}
              disabled={disabled || widthDisabled}
              onFocus={() => startEditing('width')}
              onChange={handleDimensionChange('width')}
              onBlur={() => commitDimension('width')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none ring-blue-400 focus:ring"
            />
            {settings.mode === 2 && sourceImage && (
              <p className="mt-1 text-xs text-gray-500">세로 값을 기준으로 자동 계산됩니다.</p>
            )}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">세로(px)</span>
            <input
              type="number"
              min={1}
              max={10000}
              value={heightValue}
              disabled={disabled || heightDisabled}
              onFocus={() => startEditing('height')}
              onChange={handleDimensionChange('height')}
              onBlur={() => commitDimension('height')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none ring-blue-400 focus:ring"
            />
            {settings.mode === 1 && sourceImage && (
              <p className="mt-1 text-xs text-gray-500">가로 값을 기준으로 자동 계산됩니다.</p>
            )}
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">파일 형식</span>
            <select
              value={settings.format}
              onChange={(event) => onChange({ format: event.target.value })}
              disabled={disabled}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none ring-blue-400 focus:ring"
            >
              <option value="jpg">JPG</option>
              <option value="png">PNG</option>
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">압축률 ({settings.quality})</span>
            <select
              value={settings.quality}
              onChange={handleQualityChange}
              disabled={disabled || settings.format === 'png'}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none ring-blue-400 focus:ring disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">압축률 ↑ = 용량 ↑ / 압축률 ↓ = 용량 ↓</p>
          </label>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="mb-2 text-sm font-semibold text-gray-800">고급 옵션</p>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={Boolean(settings.limitFileSize)}
              onChange={handleMaxFileSizeToggle}
              disabled={disabled}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            결과 파일 최대 용량 제한
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">추천</span>
          </label>

          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              min={0.1}
              max={20}
              step={0.1}
              value={settings.maxFileSizeMB}
              onChange={handleMaxFileSizeChange}
              disabled={disabled || !settings.limitFileSize}
              className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none ring-blue-400 focus:ring disabled:cursor-not-allowed disabled:bg-gray-100"
            />
            <span className="text-sm text-gray-700">MB 이하</span>
          </div>

          {settings.format === 'png' ? (
            <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700">
              PNG는 무손실 포맷이라 용량 제한을 보장하기 어렵습니다. JPG를 권장합니다.
            </p>
          ) : (
            <p className="mt-2 text-xs text-gray-500">JPG에서 자동 압축으로 목표 용량에 맞춥니다.</p>
          )}
        </div>

        <button
          type="button"
          onClick={onPreview}
          disabled={disabled || !sourceImage}
          className={[
            'w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors',
            disabled || !sourceImage
              ? 'cursor-not-allowed bg-gray-200 text-gray-500'
              : 'bg-blue-600 text-white hover:bg-blue-700',
          ].join(' ')}
        >
          미리보기 생성
        </button>
      </div>
    </section>
  );
}
