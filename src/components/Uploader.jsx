import { useState, useRef, useEffect, useCallback } from 'react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function Uploader({ sourceImage, onUpload, showToast }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPageDragActive, setIsPageDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const pageDragCounterRef = useRef(0);

  // 페이지 전체 드래그 감지
  useEffect(() => {
    const handleDragEnter = () => {
      pageDragCounterRef.current += 1;
      setIsPageDragActive(true);
    };
    const handleDragLeave = () => {
      pageDragCounterRef.current -= 1;
      if (pageDragCounterRef.current === 0) setIsPageDragActive(false);
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

  const processFile = useCallback(
    (file) => {
      if (!file) return;
      if (!ACCEPTED_TYPES.includes(file.type)) {
        showToast('지원하지 않는 파일 형식입니다');
        return;
      }

      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        // 이전 URL 해제
        if (sourceImage?.url) URL.revokeObjectURL(sourceImage.url);
        onUpload({ file, url, width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = url;
    },
    [onUpload, showToast, sourceImage]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e) => {
    processFile(e.target.files[0]);
    e.target.value = '';
  };

  const handleClick = () => fileInputRef.current?.click();

  const isHighlighted = isDragOver || (isPageDragActive && !isDragOver);

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={[
        'relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 select-none',
        isDragOver
          ? 'border-blue-500 bg-blue-50'
          : isPageDragActive
          ? 'border-blue-300 bg-blue-50/50'
          : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50',
      ].join(' ')}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {sourceImage ? (
        // 업로드 완료 상태
        <div className="flex items-center gap-6 p-6">
          <div className="shrink-0 w-32 h-32 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
            <img
              src={sourceImage.url}
              alt="원본 미리보기"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{sourceImage.file.name}</p>
            <p className="text-sm text-gray-500 mt-1">
              {sourceImage.width} × {sourceImage.height} px
            </p>
            <p className="text-xs text-gray-400 mt-3">
              클릭하거나 새 파일을 드롭하면 이미지가 교체됩니다
            </p>
          </div>
        </div>
      ) : (
        // 기본 업로드 안내
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
          <div
            className={[
              'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
              isDragOver ? 'bg-blue-100' : 'bg-gray-100',
            ].join(' ')}
          >
            <svg
              className={['w-6 h-6', isDragOver ? 'text-blue-500' : 'text-gray-400'].join(' ')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>
          <div>
            <p
              className={[
                'text-base font-medium',
                isDragOver ? 'text-blue-600' : 'text-gray-700',
              ].join(' ')}
            >
              {isDragOver ? '여기에 놓으세요' : '이미지를 드래그하거나 클릭하여 업로드'}
            </p>
            <p className="text-sm text-gray-400 mt-1">JPG, PNG, WEBP 지원</p>
          </div>
        </div>
      )}
    </div>
  );
}
