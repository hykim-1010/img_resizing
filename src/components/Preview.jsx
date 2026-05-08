import { useState } from 'react';

function toPercent(px, total) {
  if (!total || total <= 0) return 0;
  return (px / total) * 100;
}

function MarginOverlay({ imageData }) {
  const margin = imageData?.margin;
  if (!margin || !margin.hasMargin) return null;

  const topPct = toPercent(margin.topPx, imageData.height);
  const rightPct = toPercent(margin.rightPx, imageData.width);
  const bottomPct = toPercent(margin.bottomPx, imageData.height);
  const leftPct = toPercent(margin.leftPx, imageData.width);

  return (
    <>
      {margin.topPx > 0 && <div className="pointer-events-none absolute bg-blue-500/15" style={{ top: 0, left: 0, right: 0, height: `${topPct}%` }} />}
      {margin.bottomPx > 0 && <div className="pointer-events-none absolute bg-blue-500/15" style={{ bottom: 0, left: 0, right: 0, height: `${bottomPct}%` }} />}
      {margin.leftPx > 0 && (
        <div className="pointer-events-none absolute bg-blue-500/15" style={{ top: `${topPct}%`, bottom: `${bottomPct}%`, left: 0, width: `${leftPct}%` }} />
      )}
      {margin.rightPx > 0 && (
        <div className="pointer-events-none absolute bg-blue-500/15" style={{ top: `${topPct}%`, bottom: `${bottomPct}%`, right: 0, width: `${rightPct}%` }} />
      )}

      <div
        className="pointer-events-none absolute border-2 border-dashed border-blue-500"
        style={{ top: `${topPct}%`, right: `${rightPct}%`, bottom: `${bottomPct}%`, left: `${leftPct}%` }}
      />

      {margin.topPx > 0 && (
        <div className="pointer-events-none absolute left-1/2 top-1 -translate-x-1/2 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          상단 {margin.topPx}px
        </div>
      )}
      {margin.bottomPx > 0 && (
        <div className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          하단 {margin.bottomPx}px
        </div>
      )}
      {margin.leftPx > 0 && (
        <div className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          좌측 {margin.leftPx}px
        </div>
      )}
      {margin.rightPx > 0 && (
        <div className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          우측 {margin.rightPx}px
        </div>
      )}
    </>
  );
}

export default function Preview({
  uploadedImages,
  resultImages,
  activeImageIndex,
  isProcessing,
  hasPendingChanges,
  onPrev,
  onNext,
  onSelectIndex,
}) {
  const [previewMode, setPreviewMode] = useState('fit');
  const sourceImage = uploadedImages[activeImageIndex] ?? null;
  const imageData = resultImages[activeImageIndex] ?? null;
  const isMultiMode = uploadedImages.length > 1;
  const isPixelMode = previewMode === 'pixel';

  return (
    <section className="flex h-full min-h-0 flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">결과 미리보기</h2>
        {isMultiMode && <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">{activeImageIndex + 1} / {uploadedImages.length}</span>}
      </div>

      {!sourceImage ? (
        <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">이미지를 업로드하면 결과가 여기에 표시됩니다.</div>
      ) : isProcessing ? (
        <div className="mt-4 animate-pulse space-y-3">
          <div className="h-56 rounded-lg bg-gray-200" />
          <div className="h-4 w-2/3 rounded bg-gray-200" />
          <div className="h-4 w-1/2 rounded bg-gray-200" />
        </div>
      ) : imageData ? (
        <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3">
          {hasPendingChanges && <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">설정이 변경되었습니다. 최신 결과를 보려면 미리보기를 다시 생성하세요.</div>}

          {isMultiMode && (
            <div className="flex items-center justify-between gap-2">
              <button type="button" onClick={onPrev} disabled={activeImageIndex === 0} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-40">
                이전
              </button>
              <p className="min-w-0 truncate text-sm font-medium text-gray-700">{sourceImage.file.name}</p>
              <button type="button" onClick={onNext} disabled={activeImageIndex >= uploadedImages.length - 1} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-40">
                다음
              </button>
            </div>
          )}

          <div className="min-h-0 flex-1 rounded-lg border border-gray-200 bg-gray-100 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-gray-600">Preview mode</p>
              <div className="inline-flex rounded-md border border-gray-300 bg-white p-0.5">
                <button type="button" onClick={() => setPreviewMode('fit')} className={['rounded px-2.5 py-1 text-xs font-medium transition-colors', isPixelMode ? 'text-gray-600 hover:bg-gray-100' : 'bg-blue-600 text-white'].join(' ')}>
                  Fit
                </button>
                <button type="button" onClick={() => setPreviewMode('pixel')} className={['rounded px-2.5 py-1 text-xs font-medium transition-colors', isPixelMode ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'].join(' ')}>
                  100%
                </button>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[500px]">
              {isPixelMode ? (
                <div className="max-h-[45vh] overflow-auto rounded border border-gray-200 bg-white p-2">
                  <div className="relative mx-auto" style={{ width: `${imageData.width}px`, height: `${imageData.height}px` }}>
                    <img src={imageData.url} alt="결과 미리보기" className="h-full w-full object-contain" />
                    <MarginOverlay imageData={imageData} />
                  </div>
                </div>
              ) : (
                <div className="relative mx-auto w-full overflow-hidden" style={{ aspectRatio: `${imageData.width} / ${imageData.height}`, maxHeight: '45vh' }}>
                  <img src={imageData.url} alt="결과 미리보기" className="absolute inset-0 h-full w-full object-contain" />
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
                  className={['h-2.5 min-w-8 rounded-full transition-colors', index === activeImageIndex ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'].join(' ')}
                  aria-label={`${index + 1}번 결과 보기`}
                />
              ))}
            </div>
          )}

          {imageData?.hasMargin && imageData?.margin && (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
              여백 정보: 상단 {imageData.margin.topPx}px, 우측 {imageData.margin.rightPx}px, 하단 {imageData.margin.bottomPx}px, 좌측 {imageData.margin.leftPx}px
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">설정값을 입력하고 미리보기 생성 버튼을 눌러 결과를 확인하세요.</div>
      )}
    </section>
  );
}
