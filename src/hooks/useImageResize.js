import { useCallback } from 'react';

const JPG_MIN_QUALITY_FOR_TEXT_CLARITY = 0.92;
const MIN_LIMIT_JPG_QUALITY = JPG_MIN_QUALITY_FOR_TEXT_CLARITY;
const LIMIT_SEARCH_STEPS = 6;
const GLOBAL_SHARPEN_PROFILE = {
  amount: 0.42,
  threshold: 4.2,
  maxDelta: 14,
};
const PNG_QUANTIZATION_STEP = 4;
const ENABLE_PNG_QUANTIZATION = false;
const WEAK_COLOR_BOOST_PROFILE = {
  saturationBoost: 1.08,
  contrastBoost: 1.05,
};

function createEmptyMargin() {
  return { topPx: 0, rightPx: 0, bottomPx: 0, leftPx: 0, hasMargin: false };
}

function normalizeMargin(rawMargin) {
  const margin = {
    topPx: Math.max(0, Math.round(rawMargin.topPx || 0)),
    rightPx: Math.max(0, Math.round(rawMargin.rightPx || 0)),
    bottomPx: Math.max(0, Math.round(rawMargin.bottomPx || 0)),
    leftPx: Math.max(0, Math.round(rawMargin.leftPx || 0)),
    hasMargin: false,
  };
  margin.hasMargin = margin.topPx > 0 || margin.rightPx > 0 || margin.bottomPx > 0 || margin.leftPx > 0;
  return margin;
}

function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return { canvas, ctx };
}

function normalizeJpegQuality(quality) {
  const numericQuality = Number(quality);
  if (numericQuality >= 100) return 1;
  return Math.max(0.1, Math.min(0.99, numericQuality / 100));
}

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function applyGlobalSharpen(canvas, profile) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const totalPixels = width * height;
  if (totalPixels < 9 || totalPixels > 8_000_000) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const original = new Uint8ClampedArray(data);
  const { amount, threshold, maxDelta } = profile;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const idx = (y * width + x) * 4;
      const top = ((y - 1) * width + x) * 4;
      const bottom = ((y + 1) * width + x) * 4;
      const left = (y * width + (x - 1)) * 4;
      const right = (y * width + (x + 1)) * 4;

      const yC = original[idx] * 0.299 + original[idx + 1] * 0.587 + original[idx + 2] * 0.114;
      const yT = original[top] * 0.299 + original[top + 1] * 0.587 + original[top + 2] * 0.114;
      const yB = original[bottom] * 0.299 + original[bottom + 1] * 0.587 + original[bottom + 2] * 0.114;
      const yL = original[left] * 0.299 + original[left + 1] * 0.587 + original[left + 2] * 0.114;
      const yR = original[right] * 0.299 + original[right + 1] * 0.587 + original[right + 2] * 0.114;

      const blurY = (yT + yB + yL + yR) * 0.25;
      const edgeDelta = yC - blurY;
      if (Math.abs(edgeDelta) <= threshold) continue;

      const boost = Math.max(-maxDelta, Math.min(maxDelta, edgeDelta * amount));
      data[idx] = clampByte(original[idx] + boost);
      data[idx + 1] = clampByte(original[idx + 1] + boost);
      data[idx + 2] = clampByte(original[idx + 2] + boost);
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function applyLightPngQuantization(canvas, step = PNG_QUANTIZATION_STEP) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  if (width * height < 1) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const quantStep = Math.max(2, Math.round(step));
  const half = quantStep / 2;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = clampByte(Math.floor(data[i] / quantStep) * quantStep + half);
    data[i + 1] = clampByte(Math.floor(data[i + 1] / quantStep) * quantStep + half);
    data[i + 2] = clampByte(Math.floor(data[i + 2] / quantStep) * quantStep + half);
  }

  ctx.putImageData(imageData, 0, 0);
}

function applyWeakColorBoost(canvas, profile = WEAK_COLOR_BOOST_PROFILE) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  if (width * height < 1) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const { saturationBoost, contrastBoost } = profile;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Weak global contrast around mid gray.
    r = (r - 128) * contrastBoost + 128;
    g = (g - 128) * contrastBoost + 128;
    b = (b - 128) * contrastBoost + 128;

    // Weak saturation boost via luma-distance scaling.
    const y = r * 0.299 + g * 0.587 + b * 0.114;
    r = y + (r - y) * saturationBoost;
    g = y + (g - y) * saturationBoost;
    b = y + (b - y) * saturationBoost;

    data[i] = clampByte(r);
    data[i + 1] = clampByte(g);
    data[i + 2] = clampByte(b);
  }

  ctx.putImageData(imageData, 0, 0);
}

function drawImageWithProgressiveDownscale(targetCtx, img, sourceRect, targetRect) {
  const { sx, sy, sw, sh } = sourceRect;
  const { dx, dy, dw, dh } = targetRect;
  const downscaleRatio = Math.min(dw / sw, dh / sh);

  if (downscaleRatio >= 0.8) {
    targetCtx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    return;
  }

  let currentCanvas = document.createElement('canvas');
  currentCanvas.width = Math.max(1, Math.round(sw));
  currentCanvas.height = Math.max(1, Math.round(sh));
  let currentCtx = currentCanvas.getContext('2d');
  if (!currentCtx) {
    targetCtx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    return;
  }

  currentCtx.imageSmoothingEnabled = true;
  currentCtx.imageSmoothingQuality = 'high';
  currentCtx.drawImage(img, sx, sy, sw, sh, 0, 0, currentCanvas.width, currentCanvas.height);

  while (currentCanvas.width * 0.5 > dw * 1.05 && currentCanvas.height * 0.5 > dh * 1.05) {
    const nextCanvas = document.createElement('canvas');
    nextCanvas.width = Math.max(dw, Math.round(currentCanvas.width * 0.5));
    nextCanvas.height = Math.max(dh, Math.round(currentCanvas.height * 0.5));
    const nextCtx = nextCanvas.getContext('2d');
    if (!nextCtx) break;
    nextCtx.imageSmoothingEnabled = true;
    nextCtx.imageSmoothingQuality = 'high';
    nextCtx.drawImage(currentCanvas, 0, 0, currentCanvas.width, currentCanvas.height, 0, 0, nextCanvas.width, nextCanvas.height);
    currentCanvas = nextCanvas;
    currentCtx = nextCtx;
  }

  targetCtx.drawImage(currentCanvas, 0, 0, currentCanvas.width, currentCanvas.height, dx, dy, dw, dh);
}

function canvasToBlob(canvas, mimeType, qualityValue) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob failed'))),
      mimeType,
      qualityValue,
    );
  });
}

async function encodeJpegWithMaxBytes(canvas, preferredQuality, maxBytes, minQuality = MIN_LIMIT_JPG_QUALITY) {
  let bestBlob = await canvasToBlob(canvas, 'image/jpeg', preferredQuality);
  if (bestBlob.size <= maxBytes) return { blob: bestBlob, appliedQuality: preferredQuality, reachedTarget: true };

  const resolvedMinQuality = Math.min(preferredQuality, Math.max(MIN_LIMIT_JPG_QUALITY, minQuality));
  const minBlob = await canvasToBlob(canvas, 'image/jpeg', resolvedMinQuality);
  if (minBlob.size > maxBytes) {
    return { blob: minBlob, appliedQuality: resolvedMinQuality, reachedTarget: false };
  }

  let low = resolvedMinQuality;
  let high = preferredQuality;
  bestBlob = minBlob;
  let appliedQuality = resolvedMinQuality;
  for (let i = 0; i < LIMIT_SEARCH_STEPS; i += 1) {
    const mid = (low + high) / 2;
    const testBlob = await canvasToBlob(canvas, 'image/jpeg', mid);
    if (testBlob.size <= maxBytes) {
      low = mid;
      bestBlob = testBlob;
      appliedQuality = mid;
    } else {
      high = mid;
    }
  }
  return { blob: bestBlob, appliedQuality, reachedTarget: true };
}

function resolveGeometry(img, settings) {
  const { mode, width, height, postProcess = null } = settings;
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  const ratio = srcW / srcH;
  let destW = srcW;
  let destH = srcH;
  let srcX = 0;
  let srcY = 0;
  let srcCropW = srcW;
  let srcCropH = srcH;
  let drawMode3 = null;

  if (mode === 1) {
    destW = Math.max(1, Math.round(width));
    destH = Math.max(1, Math.round(destW / ratio));
  } else if (mode === 2) {
    destH = Math.max(1, Math.round(height));
    destW = Math.max(1, Math.round(destH * ratio));
  } else {
    const targetW = Math.max(1, Math.round(width));
    const targetH = Math.max(1, Math.round(height));
    destW = targetW;
    destH = targetH;
    if (postProcess === 'fitHeight') {
      const scaledW = Math.round(targetH * ratio);
      if (scaledW >= targetW) {
        const cropRatio = targetW / scaledW;
        srcCropW = Math.max(1, Math.round(srcW * cropRatio));
        srcX = Math.round((srcW - srcCropW) / 2);
      } else {
        drawMode3 = { drawW: scaledW, drawH: targetH, offsetX: Math.round((targetW - scaledW) / 2), offsetY: 0 };
      }
    } else if (postProcess === 'fitWidth') {
      const scaledH = Math.round(targetW / ratio);
      if (scaledH >= targetH) {
        const cropRatio = targetH / scaledH;
        srcCropH = Math.max(1, Math.round(srcH * cropRatio));
        srcY = Math.round((srcH - srcCropH) / 2);
      } else {
        drawMode3 = { drawW: targetW, drawH: scaledH, offsetX: 0, offsetY: Math.round((targetH - scaledH) / 2) };
      }
    } else {
      const scaledH = Math.round(targetW / ratio);
      drawMode3 = { drawW: targetW, drawH: scaledH, offsetX: 0, offsetY: Math.round((targetH - scaledH) / 2) };
    }
  }

  let margin = createEmptyMargin();
  let sourceRect;
  let targetRect;
  if (mode === 3 && drawMode3) {
    sourceRect = { sx: 0, sy: 0, sw: srcW, sh: srcH };
    targetRect = { dx: drawMode3.offsetX, dy: drawMode3.offsetY, dw: drawMode3.drawW, dh: drawMode3.drawH };
    margin = normalizeMargin({
      topPx: drawMode3.offsetY,
      rightPx: destW - (drawMode3.offsetX + drawMode3.drawW),
      bottomPx: destH - (drawMode3.offsetY + drawMode3.drawH),
      leftPx: drawMode3.offsetX,
    });
  } else {
    sourceRect = { sx: srcX, sy: srcY, sw: srcCropW, sh: srcCropH };
    targetRect = { dx: 0, dy: 0, dw: destW, dh: destH };
  }
  return { destW, destH, margin, sourceRect, targetRect };
}

export function useImageResize() {
  const resize = useCallback((img, settings) => {
    const { format, quality, limitFileSize = false, maxFileSizeMB = 1 } = settings;
    const { destW, destH, margin, sourceRect, targetRect } = resolveGeometry(img, settings);
    const finalPair = createCanvas(destW, destH);
    const finalCanvas = finalPair.canvas;
    const finalCtx = finalPair.ctx;

    if (format === 'jpg') {
      finalCtx.fillStyle = '#ffffff';
      finalCtx.fillRect(0, 0, destW, destH);
    }
    drawImageWithProgressiveDownscale(finalCtx, img, sourceRect, targetRect);
    applyGlobalSharpen(finalCanvas, GLOBAL_SHARPEN_PROFILE);
    applyWeakColorBoost(finalCanvas, WEAK_COLOR_BOOST_PROFILE);

    const outputPromise = (async () => {
      const requestedFormat = format;
      let finalFormat = requestedFormat;
      let outputBlob;
      let sizeLimitReached = true;
      let appliedJpegQuality = null;

      if (requestedFormat === 'jpg') {
        const sizeLimitEnabled = Boolean(limitFileSize);
        const userQuality = normalizeJpegQuality(quality);
        const preferredQuality = Math.max(userQuality, JPG_MIN_QUALITY_FOR_TEXT_CLARITY);

        if (!sizeLimitEnabled) {
          outputBlob = await canvasToBlob(finalCanvas, 'image/jpeg', preferredQuality);
          appliedJpegQuality = preferredQuality;
        } else {
          const maxBytes = Math.max(1, Math.round(Number(maxFileSizeMB) * 1024 * 1024));
          const encoded = await encodeJpegWithMaxBytes(finalCanvas, preferredQuality, maxBytes, JPG_MIN_QUALITY_FOR_TEXT_CLARITY);
          outputBlob = encoded.blob;
          appliedJpegQuality = encoded.appliedQuality;
          sizeLimitReached = encoded.reachedTarget;
        }
      } else {
        if (ENABLE_PNG_QUANTIZATION) {
          applyLightPngQuantization(finalCanvas);
        }
        outputBlob = await canvasToBlob(finalCanvas, 'image/png');
      }

      return {
        blob: outputBlob,
        encodeMeta: {
          finalFormat,
          requestedFormat,
          appliedJpegQuality,
          sizeLimitEnabled: Boolean(limitFileSize) && requestedFormat === 'jpg',
          sizeLimitBytes:
            Boolean(limitFileSize) && requestedFormat === 'jpg'
              ? Math.max(1, Math.round(Number(maxFileSizeMB) * 1024 * 1024))
              : null,
          sizeLimitReached,
        },
      };
    })();

    return {
      canvas: finalCanvas,
      resultWidth: destW,
      resultHeight: destH,
      hasMargin: margin.hasMargin,
      margin,
      blob: outputPromise.then((result) => result.blob),
      encodeMeta: outputPromise.then((result) => result.encodeMeta),
    };
  }, []);

  return { resize };
}
