import { useEffect, useMemo, useState } from 'react';

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

function sanitizeFileName(name) {
  return name
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '');
}

function buildSuggestedName(sourceImage, imageData) {
  if (!sourceImage || !imageData) {
    return 'resized-image';
  }

  const baseName = sourceImage.file.name.replace(/\.[^.]+$/, '');
  return `${baseName}_${imageData.width}x${imageData.height}`;
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
}) {
  const disabled = isProcessing || !imageData;

  const finalFormat = imageData?.encodeMeta?.finalFormat ?? settings.format;
  const extension = finalFormat === 'jpg' ? 'jpg' : 'png';

  const suggestedName = useMemo(() => buildSuggestedName(sourceImage, imageData), [sourceImage, imageData]);
  const [fileName, setFileName] = useState(suggestedName);

  useEffect(() => {
    setFileName(suggestedName);
  }, [suggestedName]);

  const handleDownload = () => {
    if (disabled) {
      return;
    }

    onDownload(sanitizeFileName(fileName) || suggestedName);
  };

  if (isMultiMode) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">ZIP 다운로드</h2>
            <p className="mt-1 text-sm text-gray-500">미리보기로 생성된 모든 결과를 ZIP 1개로 저장합니다.</p>
          </div>
          <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
            {successfulResultCount}개
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-600">
          <p>파일 수: {successfulResultCount}</p>
          <p>총 용량: {formatSize(totalResultSize)}</p>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={disabled || successfulResultCount === 0}
          className={[
            'mt-4 w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors',
            disabled || successfulResultCount === 0
              ? 'cursor-not-allowed bg-gray-200 text-gray-500'
              : 'bg-blue-600 text-white hover:bg-blue-700',
          ].join(' ')}
        >
          ZIP 다운로드
        </button>

        <p className="mt-2 text-xs text-gray-500">
          {successfulResultCount > 0
            ? 'ZIP 내부 파일명은 원본 파일명과 결과 크기를 기준으로 저장됩니다.'
            : '미리보기를 생성하면 ZIP 다운로드를 사용할 수 있습니다.'}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
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
        <p className="mt-1 text-xs text-gray-500">저장 확장자: .{extension}</p>
      </label>

      <button
        type="button"
        onClick={handleDownload}
        disabled={disabled}
        className={[
          'w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors',
          disabled
            ? 'cursor-not-allowed bg-gray-200 text-gray-500'
            : 'bg-blue-600 text-white hover:bg-blue-700',
        ].join(' ')}
      >
        결과 다운로드 {imageData ? `(${formatSize(imageData.size)})` : ''}
      </button>

      <p className="mt-2 text-xs text-gray-500">
        {imageData
          ? `다운로드 예상 용량: ${formatSize(imageData.size)}`
          : '이미지를 업로드하고 미리보기를 생성해 주세요.'}
      </p>
    </section>
  );
}
