import { useCallback } from 'react';

/**
 * Canvas API 기반 이미지 리사이징 훅
 *
 * 모드 ① 가로 기준: width 고정, height 비율 자동
 * 모드 ② 세로 기준: height 고정, width 비율 자동
 * 모드 ③ 가로×세로 지정: 기본(상하 여백), fitHeight(좌우 크롭), fitWidth(상하 크롭)
 */
export function useImageResize() {
  /**
   * 이미지 리사이징 실행
   *
   * @param {HTMLImageElement} img - 원본 이미지 엘리먼트
   * @param {object} settings
   * @param {1|2|3} settings.mode
   * @param {number} settings.width  - 목표 가로 (모드 ①③)
   * @param {number} settings.height - 목표 세로 (모드 ②③)
   * @param {'jpg'|'png'} settings.format
   * @param {number} settings.quality - 1~100
   * @param {'fitHeight'|'fitWidth'|null} [settings.postProcess] - 모드 ③ 후처리
   *
   * @returns {{ canvas: HTMLCanvasElement, resultWidth: number, resultHeight: number,
   *             hasMargin: boolean, blob: Promise<Blob> }}
   */
  const resize = useCallback((img, settings) => {
    const { mode, width, height, format, quality, postProcess = null } = settings;

    const srcW = img.naturalWidth;
    const srcH = img.naturalHeight;
    const ratio = srcW / srcH;

    let destW, destH;
    let srcX = 0, srcY = 0, srcCropW = srcW, srcCropH = srcH;
    let hasMargin = false;

    if (mode === 1) {
      // 모드 ①: 가로 고정, 세로 비율
      destW = width;
      destH = Math.round(width / ratio);
    } else if (mode === 2) {
      // 모드 ②: 세로 고정, 가로 비율
      destH = height;
      destW = Math.round(height * ratio);
    } else {
      // 모드 ③: 가로×세로 지정
      const targetW = width;
      const targetH = height;

      if (postProcess === 'fitHeight') {
        // 세로 기준 비율 확대 → 가로 초과분 중앙 크롭
        const scaledW = Math.round(targetH * ratio);
        destW = targetW;
        destH = targetH;

        if (scaledW >= targetW) {
          // 가로가 넘침 → 크롭
          const cropRatio = targetW / scaledW;
          srcCropW = Math.round(srcW * cropRatio);
          srcCropH = srcH;
          srcX = Math.round((srcW - srcCropW) / 2);
          srcY = 0;
        } else {
          // 가로가 모자람 → 여백 발생 (일반적으론 발생 안 하지만 방어)
          destW = scaledW;
        }
      } else if (postProcess === 'fitWidth') {
        // 가로 기준 비율 확대 → 세로 초과분 중앙 크롭
        const scaledH = Math.round(targetW / ratio);
        destW = targetW;
        destH = targetH;

        if (scaledH >= targetH) {
          // 세로가 넘침 → 크롭
          const cropRatio = targetH / scaledH;
          srcCropH = Math.round(srcH * cropRatio);
          srcCropW = srcW;
          srcY = Math.round((srcH - srcCropH) / 2);
          srcX = 0;
        } else {
          // 세로가 모자람 → 여백 발생 (일반적으론 발생 안 하지만 방어)
          destH = scaledH;
        }
      } else {
        // 기본: 가로 기준 비율 리사이징 후 지정 세로 캔버스에 세로 중앙정렬
        const scaledH = Math.round(targetW / ratio);
        destW = targetW;
        destH = targetH;
        hasMargin = scaledH < targetH;
        // 크롭 없이 drawImage 시 offsetY 계산은 draw 단계에서 처리
        // scaledH를 별도 저장
        settings._scaledH = scaledH;
      }
    }

    // Canvas 생성 및 드로우
    const canvas = document.createElement('canvas');
    canvas.width = destW;
    canvas.height = destH;
    const ctx = canvas.getContext('2d');

    if (format === 'jpg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, destW, destH);
    }

    if (mode === 3 && !postProcess) {
      const scaledH = settings._scaledH ?? destH;
      const offsetY = Math.round((destH - scaledH) / 2);
      ctx.drawImage(img, 0, 0, destW, scaledH < destH ? scaledH : destH);
      if (scaledH < destH) {
        // 이미 fillRect로 배경 채워진 상태 — 이미지를 중앙에 다시 그림
        ctx.clearRect(0, 0, destW, destH);
        if (format === 'jpg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, destW, destH);
        }
        ctx.drawImage(img, 0, offsetY, destW, scaledH);
      }
    } else {
      ctx.drawImage(img, srcX, srcY, srcCropW, srcCropH, 0, 0, destW, destH);
    }

    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const qualityValue = format === 'jpg' ? quality / 100 : undefined;

    const blob = new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('canvas.toBlob failed'));
        },
        mimeType,
        qualityValue,
      );
    });

    return { canvas, resultWidth: destW, resultHeight: destH, hasMargin, blob };
  }, []);

  return { resize };
}
