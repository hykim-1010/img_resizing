import { useEffect, useMemo, useState } from 'react';

const POST_PROCESS_OPTIONS = [
  { value: null, label: '기본(여백 유지)' },
  { value: 'fitHeight', label: '세로 맞춤' },
  { value: 'fitWidth', label: '가로 맞춤' },
];

function formatSize(bytes) {
  if (!bytes || bytes <= 0) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function sanitizeFileName(name) {
  return name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim().replace(/[. ]+$/g, '');
}

function buildSuggestedName(sourceImage, imageData) {
  if (!sourceImage || !imageData) return 'resized-image';
  const baseName = sourceImage.file.name.replace(/\.[^.]+$/, '');
  return `${baseName}_${imageData.width}x${imageData.height}`;
}

function formatQuality(qualityValue) {
  if (typeof qualityValue !== 'number') return '-';
  return `${Math.round(qualityValue * 100)}`;
}

export default function Downloader({
  imageData,
  settings,
  sourceImage,
  isMultiMode,
  isProcessing,
  successfulResultCount,
  totalResultSize,
  onDownload,
  onPostProcessChange,
}) {
  const disabled = isProcessing || !imageData;
  const finalFormat = imageData?.encodeMeta?.finalFormat ?? settings.format;
  const extension = finalFormat === 'jpg' ? 'jpg' : 'png';

  const suggestedName = useMemo(() => buildSuggestedName(sourceImage, imageData), [sourceImage, imageData]);
  const [fileName, setFileName] = useState(suggestedName);

  const canShowPostProcessPanel = settings.mode === 3 && Boolean(imageData);
  const canSelectCropCriteria = Boolean(imageData?.hasMargin);
  const selectedPostProcess = settings?.postProcess ?? null;

  useEffect(() => {
    setFileName(suggestedName);
  }, [suggestedName]);

  const handleDownload = () => {
    if (disabled) return;
    onDownload(sanitizeFileName(fileName) || suggestedName);
  };

  if (isMultiMode) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
          <p>파일 수: {successfulResultCount}</p>
          <p>총 용량: {formatSize(totalResultSize)}</p>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={disabled || successfulResultCount === 0}
          className={[
            'mt-4 w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors',
            disabled || successfulResultCount === 0 ? 'cursor-not-allowed bg-gray-200 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700',
          ].join(' ')}
        >
          ZIP 다운로드
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
        <p>크기: {imageData ? `${imageData.width} x ${imageData.height} px` : '-'}</p>
        <p>용량: {formatSize(imageData?.size)}</p>
        <p>포맷: {(imageData?.encodeMeta?.finalFormat ?? '-').toUpperCase()}</p>
        <p>품질: {formatQuality(imageData?.encodeMeta?.appliedJpegQuality)}</p>
      </div>

      {canShowPostProcessPanel && (
        <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-blue-900">후처리 기준</p>
            {canSelectCropCriteria && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">여백 감지됨</span>}
          </div>

          <div className="mt-2 grid grid-cols-1 gap-2">
            {POST_PROCESS_OPTIONS.map((option) => {
              const isSelected = selectedPostProcess === option.value;
              const isCropOption = option.value !== null;
              const isDisabled = isCropOption && !canSelectCropCriteria;

              return (
                <button
                  key={option.value ?? 'none'}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onPostProcessChange(option.value)}
                  className={[
                    'rounded-md border px-3 py-2 text-left text-sm transition-colors',
                    isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-blue-200 bg-white text-blue-800 hover:bg-blue-100',
                    isDisabled ? 'cursor-not-allowed opacity-50 hover:bg-white' : '',
                  ].join(' ')}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {imageData?.encodeMeta?.sizeLimitEnabled && (
        <div
          className={[
            'mb-3 rounded-md px-3 py-2 text-xs',
            imageData.encodeMeta.sizeLimitReached ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-amber-200 bg-amber-50 text-amber-700',
          ].join(' ')}
        >
          {imageData.encodeMeta.sizeLimitReached ? '최대 파일 크기 제한을 만족했습니다.' : '제한 미달로 가능한 최저 품질로 출력되었습니다.'}
        </div>
      )}

      <label className="mb-3 block text-sm">
        <span className="mb-1 block font-medium text-gray-700">파일명</span>
        <input
          type="text"
          value={fileName}
          onChange={(event) => setFileName(event.target.value)}
          disabled={disabled}
          placeholder="파일명을 입력하세요"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none ring-blue-400 focus:ring disabled:cursor-not-allowed disabled:bg-gray-100"
        />
        <p className="mt-1 text-xs text-gray-500">확장자: .{extension}</p>
      </label>

      <button
        type="button"
        onClick={handleDownload}
        disabled={disabled}
        className={[
          'w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors',
          disabled ? 'cursor-not-allowed bg-gray-200 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700',
        ].join(' ')}
      >
        결과 다운로드
      </button>
    </section>
  );
}
