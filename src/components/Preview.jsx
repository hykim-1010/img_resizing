import { useState } from 'react';

function formatSize(bytes) {
  if (!bytes || bytes <= 0) {
    return '0 KB';
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(2)} MB`;
}

const POST_PROCESS_OPTIONS = [
  {
    value: null,
    label: '기본(여백 유지)',
    description: '비율을 유지하고 남는 영역은 여백으로 둡니다.',
  },
  {
    value: 'fitHeight',
    label: '세로 맞춤',
    description: '세로를 꽉 채우고 좌우 초과분은 중앙 크롭합니다.',
  },
  {
    value: 'fitWidth',
    label: '가로 맞춤',
    description: '가로를 꽉 채우고 상하 초과분은 중앙 크롭합니다.',
  },
];

function toPercent(px, total) {
  if (!total || total <= 0) {
    return 0;
  }

  return (px / total) * 100;
}

function MarginOverlay({ imageData }) {
  const margin = imageData?.margin;
  if (!margin || !margin.hasMargin) {
    return null;
  }

  const topPct = toPercent(margin.topPx, imageData.height);
  const rightPct = toPercent(margin.rightPx, imageData.width);
  const bottomPct = toPercent(margin.bottomPx, imageData.height);
  const leftPct = toPercent(margin.leftPx, imageData.width);

  return (
    <div
      className="pointer-events-none absolute border-2 border-dashed border-blue-500"
      style={{
        top: `${topPct}%`,
        right: `${rightPct}%`,
        bottom: `${bottomPct}%`,
        left: `${leftPct}%`,
      }}
    />
  );
}

function formatQuality(qualityValue) {
  if (typeof qualityValue !== 'number') {
    return '-';
  }

  return String(Math.round(qualityValue * 100));
}

export default function Preview({
  uploadedImages,
  resultImages,
  activeImageIndex,
  previewSettings,
  isProcessing,
  hasPendingChanges,
  onPrev,
  onNext,
  onSelectIndex,
  onPostProcessChange,
}) {
  const [previewMode, setPreviewMode] = useState('fit');
  const sourceImage = uploadedImages[activeImageIndex] ?? null;
  const imageData = resultImages[activeImageIndex] ?? null;
  const isMultiMode = uploadedImages.length > 1;
  const canShowPostProcessPanel = Boolean(previewSettings) && previewSettings.mode === 3 && Boolean(imageData);
  const selectedPostProcess = previewSettings?.postProcess ?? null;
  const canSelectCropCriteria = Boolean(imageData?.hasMargin);
  const isPixelMode = previewMode === 'pixel';

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">결과 미리보기</h2>
        {isMultiMode && (
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
            {activeImageIndex + 1} / {uploadedImages.length}
          </span>
        )}
      </div>

      {!sourceImage ? (
        <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
          이미지를 업로드하면 결과가 여기에 표시됩니다.
        </div>
      ) : isProcessing ? (
        <div className="mt-4 animate-pulse space-y-3">
          <div className="h-56 rounded-lg bg-gray-200" />
          <div className="h-4 w-2/3 rounded bg-gray-200" />
          <div className="h-4 w-1/2 rounded bg-gray-200" />
        </div>
      ) : imageData ? (
        <div className="mt-4 space-y-3">
          {hasPendingChanges && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
              설정이 변경되었습니다. 최신 결과를 보려면 미리보기를 다시 생성하세요.
            </div>
          )}

          {isMultiMode && (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onPrev}
                disabled={activeImageIndex === 0}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                이전
              </button>
              <p className="min-w-0 truncate text-sm font-medium text-gray-700">{sourceImage.file.name}</p>
              <button
                type="button"
                onClick={onNext}
                disabled={activeImageIndex >= uploadedImages.length - 1}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                다음
              </button>
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-gray-100 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium text-gray-600">Preview mode</p>
              <div className="inline-flex rounded-md border border-gray-300 bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewMode('fit')}
                  className={[
                    'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                    isPixelMode ? 'text-gray-600 hover:bg-gray-100' : 'bg-blue-600 text-white',
                  ].join(' ')}
                >
                  Fit
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('pixel')}
                  className={[
                    'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                    isPixelMode ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100',
                  ].join(' ')}
                >
                  100%
                </button>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[520px]">
              {isPixelMode ? (
                <div className="max-h-[520px] overflow-auto rounded border border-gray-200 bg-white p-2">
                  <div
                    className="relative mx-auto"
                    style={{ width: `${imageData.width}px`, height: `${imageData.height}px` }}
                  >
                    <img src={imageData.url} alt="결과 미리보기" className="h-full w-full object-fill" />
                    <MarginOverlay imageData={imageData} />
                  </div>
                </div>
              ) : (
                <div
                  className="relative mx-auto w-full overflow-hidden"
                  style={{ aspectRatio: `${imageData.width} / ${imageData.height}` }}
                >
                  <img
                    src={imageData.url}
                    alt="결과 미리보기"
                    className="absolute inset-0 h-full w-full object-fill"
                  />
                  <MarginOverlay imageData={imageData} />
                </div>
              )}
            </div>
          </div>

          {isMultiMode && (
            <div className="flex gap-1 overflow-x-auto pb-1">
              {uploadedImages.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => onSelectIndex(index)}
                  className={[
                    'h-2.5 min-w-8 rounded-full transition-colors',
                    index === activeImageIndex ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400',
                  ].join(' ')}
                  aria-label={`${index + 1}번째 결과 보기`}
                />
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <p>
              크기: {imageData.width} x {imageData.height} px
            </p>
            <p>용량: {formatSize(imageData.size)}</p>
          </div>

          {imageData?.encodeMeta?.sizeLimitEnabled && (
            <div
              className={[
                'rounded-md px-3 py-2 text-xs',
                imageData.encodeMeta.sizeLimitReached
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border border-amber-200 bg-amber-50 text-amber-700',
              ].join(' ')}
            >
              {imageData.encodeMeta.sizeLimitReached
                ? '최대 용량 제한을 만족했습니다.'
                : '제한 미달성: 가능한 최저 품질로 출력했습니다.'}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
            <p>최종 포맷: {(imageData?.encodeMeta?.finalFormat ?? '-').toUpperCase()}</p>
            <p>적용 품질: {formatQuality(imageData?.encodeMeta?.appliedJpegQuality)}</p>
            <p>목표 용량: {formatSize(imageData?.encodeMeta?.sizeLimitBytes)}</p>
            <p>실제 용량: {formatSize(imageData?.size)}</p>
          </div>

          {canShowPostProcessPanel && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-blue-900">후처리 기준</p>
                {canSelectCropCriteria && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                    전체 재생성
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-blue-800">
                {canSelectCropCriteria
                  ? '현재 결과에 여백이 감지되었습니다. 기준을 바꾸면 업로드된 전체 파일을 같은 설정으로 다시 처리합니다.'
                  : '현재 결과는 여백이 없어 후처리 기준을 변경할 수 없습니다.'}
              </p>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
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
                        'rounded-md border px-3 py-2 text-left transition-colors',
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-blue-200 bg-white text-blue-800 hover:bg-blue-100',
                        isDisabled ? 'cursor-not-allowed opacity-50 hover:bg-white' : '',
                      ].join(' ')}
                    >
                      <p className="text-sm font-semibold">{option.label}</p>
                      <p className={['mt-0.5 text-xs', isSelected ? 'text-blue-100' : 'text-blue-700'].join(' ')}>
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
          설정값을 입력한 뒤 미리보기 생성 버튼을 눌러 결과를 확인하세요.
        </div>
      )}
    </section>
  );
}
