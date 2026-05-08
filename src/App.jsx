import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Uploader from './components/Uploader';
import ResizeSettings from './components/ResizeSettings';
import Preview from './components/Preview';
import Downloader from './components/Downloader';
import Favorites from './components/Favorites';
import { useImageResize } from './hooks/useImageResize';
import { useFavorites } from './hooks/useFavorites';
import { createZip } from './utils/createZip';

const DEFAULT_SETTINGS = {
  mode: 1,
  width: 1200,
  height: 1200,
  format: 'jpg',
  quality: 90,
  postProcess: null,
  limitFileSize: false,
  maxFileSizeMB: 1,
};

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeQualityStep(value) {
  const rounded = Math.round(Number(value) / 10) * 10;
  return clampNumber(rounded, 10, 100);
}

function sanitizeFileName(name) {
  return String(name || '')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '');
}

function buildDownloadName(resultImage) {
  const finalFormat = resultImage?.encodeMeta?.finalFormat ?? 'jpg';
  const extension = finalFormat === 'jpg' ? 'jpg' : 'png';
  const baseName = sanitizeFileName(resultImage?.file?.name?.replace(/\.[^.]+$/, '')) || 'resized-image';

  return `${baseName}_${resultImage.width}x${resultImage.height}.${extension}`;
}

function buildEffectiveSettings(nextSettings, sourceImage) {
  if (!sourceImage) {
    return { ...nextSettings };
  }

  const ratio = sourceImage.width / sourceImage.height;
  const effective = { ...nextSettings };

  if (effective.mode === 1) {
    effective.height = Math.max(1, Math.round(effective.width / ratio));
  }

  if (effective.mode === 2) {
    effective.width = Math.max(1, Math.round(effective.height * ratio));
  }

  return effective;
}

function buildSettingsFromFavorite(favorite, prevSettings) {
  const mode = [1, 2, 3].includes(favorite?.mode) ? favorite.mode : 1;
  const widthValue = clampNumber(Math.round(Number(favorite?.width) || 1), 1, 10000);
  const heightValue = clampNumber(Math.round(Number(favorite?.height) || 1), 1, 10000);
  const format = favorite?.format === 'png' ? 'png' : 'jpg';
  const quality = normalizeQualityStep(Number(favorite?.quality) || 90);
  const postProcess =
    mode === 3 && ['fitHeight', 'fitWidth'].includes(favorite?.postProcess)
      ? favorite.postProcess
      : null;
  const limitFileSize = Boolean(favorite?.limitFileSize);
  const maxFileSizeMB = clampNumber(Number(favorite?.maxFileSizeMB) || 1, 0.1, 20);

  if (mode === 1) {
    return {
      ...prevSettings,
      mode,
      width: widthValue,
      format,
      quality,
      postProcess: null,
      limitFileSize,
      maxFileSizeMB,
    };
  }

  if (mode === 2) {
    return {
      ...prevSettings,
      mode,
      height: widthValue,
      format,
      quality,
      postProcess: null,
      limitFileSize,
      maxFileSizeMB,
    };
  }

  return {
    ...prevSettings,
    mode,
    width: widthValue,
    height: heightValue,
    format,
    quality,
    postProcess,
    limitFileSize,
    maxFileSizeMB,
  };
}

function loadUploadedImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      resolve({
        id: crypto.randomUUID(),
        file,
        url,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to read image'));
    };

    img.src = url;
  });
}

function loadImageElement(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

export default function App() {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [appliedSettings, setAppliedSettings] = useState(null);
  const [resultImages, setResultImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [toast, setToast] = useState(null);
  const [isUploaderExpanded, setIsUploaderExpanded] = useState(true);
  const [settingsTab, setSettingsTab] = useState('direct');

  const toastTimerRef = useRef(null);
  const uploadedImagesRef = useRef([]);
  const resultImagesRef = useRef([]);
  const { resize } = useImageResize();
  const { favorites, addFavorite, deleteFavorite, reorderFavorites } = useFavorites();

  const activeImage = uploadedImages[activeImageIndex] ?? null;
  const activeResult = resultImages[activeImageIndex] ?? null;
  const isMultiMode = uploadedImages.length > 1;
  const successfulResults = useMemo(() => resultImages.filter(Boolean), [resultImages]);
  const totalResultSize = useMemo(
    () => resultImages.reduce((sum, result) => sum + (result?.size || 0), 0),
    [resultImages],
  );

  const showToast = useCallback((message) => {
    setToast(message);

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 2000);
  }, []);

  const revokeUploadedImages = useCallback((images) => {
    images.forEach((image) => {
      if (image?.url) {
        URL.revokeObjectURL(image.url);
      }
    });
  }, []);

  const revokeResultImages = useCallback((images) => {
    images.forEach((image) => {
      if (image?.url) {
        URL.revokeObjectURL(image.url);
      }
    });
  }, []);

  const clearResults = useCallback(() => {
    setResultImages((prev) => {
      revokeResultImages(prev);
      resultImagesRef.current = [];
      return [];
    });
  }, [revokeResultImages]);

  const resizeUploadedImage = useCallback(
    async (uploadedImage, baseSettings) => {
      const imageElement = await loadImageElement(uploadedImage.url);
      const effective = buildEffectiveSettings(baseSettings, uploadedImage);
      const { blob, encodeMeta, resultWidth, resultHeight, hasMargin, margin } = resize(imageElement, effective);
      const [outputBlob, outputMeta] = await Promise.all([blob, encodeMeta]);
      const url = URL.createObjectURL(outputBlob);

      return {
        id: crypto.randomUUID(),
        sourceId: uploadedImage.id,
        file: uploadedImage.file,
        blob: outputBlob,
        url,
        width: resultWidth,
        height: resultHeight,
        size: outputBlob.size,
        hasMargin,
        margin,
        encodeMeta: outputMeta,
      };
    },
    [resize],
  );

  const handleFilesUpload = useCallback(
    async (files) => {
      const nextFiles = Array.isArray(files) ? files : [];
      const validFiles = nextFiles.filter((file) => ACCEPTED_TYPES.includes(file.type));
      const invalidCount = nextFiles.length - validFiles.length;

      if (validFiles.length === 0) {
        if (invalidCount > 0) {
          showToast('吏?먰븯吏 ?딅뒗 ?뚯씪 ?뺤떇?낅땲??');
        }
        return;
      }

      setIsProcessing(true);

      try {
        const loadedImages = await Promise.all(validFiles.map((file) => loadUploadedImage(file)));

        revokeUploadedImages(uploadedImagesRef.current);
        clearResults();
        uploadedImagesRef.current = loadedImages;

        setUploadedImages(loadedImages);
        setActiveImageIndex(0);
        setAppliedSettings(null);
        setHasPendingChanges(true);

        if (invalidCount > 0) {
          showToast(`吏?먰븯吏 ?딅뒗 ?뚯씪 ${invalidCount}媛쒕뒗 ?쒖쇅?덉뒿?덈떎.`);
        }
      } catch {
        showToast('?대?吏瑜??쎈뒗 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.');
      } finally {
        setIsProcessing(false);
      }
    },
    [clearResults, revokeUploadedImages, showToast],
  );

  const handleSettingsChange = useCallback(
    (partial) => {
      let shouldWarnPngLimit = false;

      setSettings((prev) => {
        const next = {
          ...prev,
          ...partial,
        };

        if (next.mode !== 3) {
          next.postProcess = null;
        }

        if (next.format === 'png' && next.limitFileSize) {
          shouldWarnPngLimit = true;
        }

        return next;
      });

      if (shouldWarnPngLimit) {
        showToast('PNG?먯꽌???⑸웾 ?쒗븳??蹂댁옣?섍린 ?대졄?듬땲?? JPG瑜?沅뚯옣?⑸땲??');
      }

      setHasPendingChanges(true);
    },
    [showToast],
  );

  const applyPreview = useCallback(
    async (baseSettings) => {
      if (uploadedImages.length === 0) {
        showToast('癒쇱? ?대?吏瑜??낅줈?쒗빐 二쇱꽭??');
        return;
      }

      setIsProcessing(true);

      try {
        const nextResults = [];
        let failCount = 0;

        for (const uploadedImage of uploadedImages) {
          try {
            nextResults.push(await resizeUploadedImage(uploadedImage, baseSettings));
          } catch {
            nextResults.push(null);
            failCount += 1;
          }
        }

        setResultImages((prev) => {
          revokeResultImages(prev);
          resultImagesRef.current = nextResults;
          return nextResults;
        });
        setAppliedSettings(baseSettings);
        setHasPendingChanges(false);
        setActiveImageIndex((prev) => Math.min(prev, Math.max(0, uploadedImages.length - 1)));

        if (failCount > 0) {
          showToast(`Preview done: success ${nextResults.filter(Boolean).length}, failed ${failCount}`);
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [resizeUploadedImage, revokeResultImages, showToast, uploadedImages],
  );

  const handlePreviewClick = useCallback(() => {
    applyPreview(settings);
  }, [applyPreview, settings]);

  const handlePostProcessPreview = useCallback(
    (postProcess) => {
      const nextSettings = {
        ...settings,
        postProcess: settings.mode === 3 ? postProcess : null,
      };

      setSettings(nextSettings);
      applyPreview(nextSettings);
    },
    [applyPreview, settings],
  );

  const handleFavoriteAdd = useCallback(
    (favoriteInput) => {
      addFavorite(favoriteInput);
      showToast('利먭꺼李얘린瑜???ν뻽?듬땲??');
    },
    [addFavorite, showToast],
  );

  const handleFavoriteDelete = useCallback(
    (favoriteId) => {
      deleteFavorite(favoriteId);
      showToast('利먭꺼李얘린瑜???젣?덉뒿?덈떎.');
    },
    [deleteFavorite, showToast],
  );

  const handleFavoriteReorder = useCallback(
    (fromIndex, toIndex) => {
      reorderFavorites(fromIndex, toIndex);
    },
    [reorderFavorites],
  );

  const handleFavoriteApply = useCallback(
    async (favorite) => {
      if (!activeImage) {
        showToast('먼저 이미지를 업로드해 주세요.');
        return;
      }

      const nextSettings = buildSettingsFromFavorite(favorite, settings);
      setSettings(nextSettings);
      setAppliedSettings(null);
      setHasPendingChanges(true);

      await applyPreview(nextSettings);
      showToast('즐겨찾기 설정으로 미리보기를 생성했습니다.');
    },
    [activeImage, applyPreview, settings, showToast],
  );

  const handleDownload = useCallback(
    async (fileName) => {
      if (!activeResult) {
        return;
      }

      if (isMultiMode) {
        const zipEntries = successfulResults.map((result) => ({
          name: buildDownloadName(result),
          blob: result.blob,
        }));
        const zipBlob = await createZip(zipEntries);
        const now = new Date();
        const timestamp = [
          now.getFullYear(),
          String(now.getMonth() + 1).padStart(2, '0'),
          String(now.getDate()).padStart(2, '0'),
          String(now.getHours()).padStart(2, '0'),
          String(now.getMinutes()).padStart(2, '0'),
        ].join('');
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `resized-images_${timestamp}.zip`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return;
      }

      const finalFormat = activeResult?.encodeMeta?.finalFormat ?? settings.format;
      const extension = finalFormat === 'jpg' ? 'jpg' : 'png';
      const resolvedName = sanitizeFileName(fileName) || sanitizeFileName(buildDownloadName(activeResult).replace(/\.[^.]+$/, ''));
      const link = document.createElement('a');

      link.href = activeResult.url;
      link.download = `${resolvedName}.${extension}`;
      link.click();
    },
    [activeResult, isMultiMode, settings.format, successfulResults],
  );

  const handlePrevImage = useCallback(() => {
    setActiveImageIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextImage = useCallback(() => {
    setActiveImageIndex((prev) => Math.min(uploadedImages.length - 1, prev + 1));
  }, [uploadedImages.length]);

  useEffect(() => {
    uploadedImagesRef.current = uploadedImages;
  }, [uploadedImages]);

  useEffect(() => {
    resultImagesRef.current = resultImages;
  }, [resultImages]);

  useEffect(() => {
    setIsUploaderExpanded(uploadedImages.length === 0);
  }, [uploadedImages.length]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }

      revokeUploadedImages(uploadedImagesRef.current);
      revokeResultImages(resultImagesRef.current);
    };
  }, [revokeResultImages, revokeUploadedImages]);

  return (
    <div className="h-screen overflow-hidden bg-gray-50">
      <main className="mx-auto flex h-full max-w-[1280px] flex-col gap-4 px-6 py-4">
        <h1 className="shrink-0 text-2xl font-bold text-gray-900">IMG Resizer</h1>
        <section className="shrink-0 rounded-xl border border-gray-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setIsUploaderExpanded((prev) => !prev)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <div>
              <p className="text-sm font-semibold text-gray-900">이미지 업로드</p>
              <p className="text-xs text-gray-500">
                {uploadedImages.length > 0 ? `${uploadedImages.length}개 업로드됨` : '이미지를 추가해 주세요'}
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-700">{isUploaderExpanded ? '접기' : '펼치기'}</span>
          </button>
          {isUploaderExpanded && (
            <div className="border-t border-gray-200 p-4">
              <Uploader
                uploadedImages={uploadedImages}
                activeImageIndex={activeImageIndex}
                isProcessing={isProcessing}
                onUpload={handleFilesUpload}
                onSelectIndex={setActiveImageIndex}
              />
            </div>
          )}
        </section>
        <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="space-y-4 overflow-y-auto pr-1 lg:col-span-4">
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">리사이즈 설정 영역</h2>
              <div className="mt-3 inline-flex rounded-md border border-gray-200 bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setSettingsTab('direct')}
                  className={[
                    'rounded px-4 py-2 text-sm font-semibold transition-colors',
                    settingsTab === 'direct' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900',
                  ].join(' ')}
                >
                  직접 설정
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab('favorite')}
                  className={[
                    'rounded px-4 py-2 text-sm font-semibold transition-colors',
                    settingsTab === 'favorite' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900',
                  ].join(' ')}
                >
                  즐겨찾기
                </button>
              </div>

              <div className="mt-4">
                {settingsTab === 'direct' ? (
                  <ResizeSettings
                    sourceImage={activeImage}
                    settings={settings}
                    onChange={handleSettingsChange}
                    onPreview={handlePreviewClick}
                    disabled={isProcessing}
                  />
                ) : (
                  <Favorites
                    favorites={favorites}
                    settings={settings}
                    disabled={isProcessing}
                    onAdd={handleFavoriteAdd}
                    onDelete={handleFavoriteDelete}
                    onReorder={handleFavoriteReorder}
                    onApply={handleFavoriteApply}
                  />
                )}
              </div>
            </section>
          </div>

          <div className="min-h-0 overflow-hidden pr-1 lg:col-span-5">
            <Preview
              uploadedImages={uploadedImages}
              resultImages={resultImages}
              activeImageIndex={activeImageIndex}
              previewSettings={appliedSettings}
              isProcessing={isProcessing}
              hasPendingChanges={hasPendingChanges}
              onPrev={handlePrevImage}
              onNext={handleNextImage}
              onSelectIndex={setActiveImageIndex}
            />
          </div>

          <div className="space-y-4 pr-1 lg:col-span-3">
            <Downloader
              imageData={activeResult}
              settings={appliedSettings ?? settings}
              sourceImage={activeImage}
              isMultiMode={isMultiMode}
              isProcessing={isProcessing}
              successfulResultCount={successfulResults.length}
              totalResultSize={totalResultSize}
              onDownload={handleDownload}
              onPostProcessChange={handlePostProcessPreview}
            />
          </div>
        </section>
      </main>

      {toast && (
        <div className="pointer-events-none fixed bottom-6 right-6 z-50 rounded-lg bg-gray-900 px-4 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

