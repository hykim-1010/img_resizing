import { useEffect, useRef, useState } from 'react';

export default function Uploader({ uploadedImages, activeImageIndex, isProcessing, onUpload, onSelectIndex }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPageDragActive, setIsPageDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const pageDragCounterRef = useRef(0);

  useEffect(() => {
    const handleDragEnter = () => {
      pageDragCounterRef.current += 1;
      setIsPageDragActive(true);
    };

    const handleDragLeave = () => {
      pageDragCounterRef.current -= 1;
      if (pageDragCounterRef.current <= 0) {
        pageDragCounterRef.current = 0;
        setIsPageDragActive(false);
      }
    };

    const handleDrop = () => {
      pageDragCounterRef.current = 0;
      setIsPageDragActive(false);
    };

    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    onUpload(Array.from(event.dataTransfer.files || []));
  };

  const handleFileChange = (event) => {
    onUpload(Array.from(event.target.files || []));
    event.target.value = '';
  };

  const isHighlighted = isDragOver || isPageDragActive;
  const activeImage = uploadedImages[activeImageIndex] ?? null;
  const isMultiMode = uploadedImages.length > 1;

  return (
    <div>
      <div
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          'cursor-pointer select-none rounded-lg border-2 border-dashed transition-all duration-200',
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : isPageDragActive
              ? 'border-blue-300 bg-blue-50/50'
              : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50',
          isProcessing ? 'pointer-events-none opacity-70' : '',
        ].join(' ')}
      >
        <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" multiple className="hidden" onChange={handleFileChange} />

        {activeImage ? (
          <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
              <img src={activeImage.url} alt="원본 미리보기" className="h-full w-full object-contain" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{activeImage.file.name}</p>
              <p className="mt-1 text-sm text-gray-500">{activeImage.width} x {activeImage.height} px</p>
              <p className="mt-2 text-xs text-gray-400">클릭하거나 파일을 드롭하면 선택한 파일 목록으로 교체됩니다.</p>
            </div>
          </div>
        ) : (
          <div className="flex min-h-28 flex-col items-center justify-center gap-2 px-4 py-5 text-center">
            <div className={['flex h-10 w-10 items-center justify-center rounded-full transition-colors', isHighlighted ? 'bg-blue-100' : 'bg-gray-100'].join(' ')}>
              <svg className={['h-5 w-5', isHighlighted ? 'text-blue-500' : 'text-gray-400'].join(' ')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>

            <div>
              <p className={['text-sm font-medium', isHighlighted ? 'text-blue-600' : 'text-gray-700'].join(' ')}>{isHighlighted ? '여기에 파일을 놓아주세요' : '이미지를 드래그하거나 클릭해 업로드'}</p>
              <p className="mt-1 text-xs text-gray-400">JPG, PNG, WEBP 여러 개 선택 가능</p>
            </div>
          </div>
        )}
      </div>

      {isMultiMode && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {uploadedImages.map((image, index) => {
            const isActive = index === activeImageIndex;

            return (
              <button
                key={image.id}
                type="button"
                onClick={() => onSelectIndex(index)}
                disabled={isProcessing}
                className={[
                  'flex min-w-40 items-center gap-2 rounded-lg border p-2 text-left transition-colors',
                  isActive ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
                  isProcessing ? 'cursor-not-allowed opacity-60' : '',
                ].join(' ')}
              >
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-100">
                  <img src={image.url} alt="" className="h-full w-full object-contain" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">{image.file.name}</p>
                  <p className="text-[11px] text-gray-500">{index + 1} / {uploadedImages.length}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
