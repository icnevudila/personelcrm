import sharp from "sharp";

// Claude limitleri: max 10 MB decoded, max 8000px kenar
const CLAUDE_MAX_BYTES = 4 * 1024 * 1024;
const CLAUDE_MAX_DIMENSION = 8000;
const LOG_PREFIX = "[copyfast/imagePrep]";

function log(...args) {
  console.log(LOG_PREFIX, ...args);
}

function formatBytes(n) {
  return `${(n / 1024 / 1024).toFixed(2)} MB (${n} bytes)`;
}

function needsDimensionResize(meta) {
  const w = meta.width || 0;
  const h = meta.height || 0;
  return w > CLAUDE_MAX_DIMENSION || h > CLAUDE_MAX_DIMENSION;
}

async function getOutputMeta(buffer) {
  const m = await sharp(buffer).metadata();
  return { width: m.width, height: m.height };
}

async function compressToLimit(buffer, meta) {
  const qualities = [85, 75, 65, 55, 45, 35];
  const maxDims = [CLAUDE_MAX_DIMENSION, 6000, 4096, 3000, 2000, 1200];

  log("sıkıştırma başladı", {
    originalBytes: buffer.length,
    format: meta.format,
    width: meta.width,
    height: meta.height,
    needsDimensionResize: needsDimensionResize(meta),
  });

  for (const maxDim of maxDims) {
    for (const quality of qualities) {
      const output = await sharp(buffer)
        .rotate()
        .resize({
          width: maxDim,
          height: maxDim,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();

      const outMeta = await getOutputMeta(output);

      log("deneme", {
        maxDim,
        quality,
        outputBytes: output.length,
        dimensions: `${outMeta.width}x${outMeta.height}`,
      });

      const fitsDimensions =
        outMeta.width <= CLAUDE_MAX_DIMENSION && outMeta.height <= CLAUDE_MAX_DIMENSION;
      const fitsBytes = output.length <= CLAUDE_MAX_BYTES;

      if (fitsDimensions && fitsBytes) {
        log("sıkıştırma başarılı", {
          maxDim,
          quality,
          outputBytes: output.length,
          dimensions: `${outMeta.width}x${outMeta.height}`,
        });
        return output;
      }
    }
  }

  log("sıkıştırma başarısız — tüm denemeler limit üstü");
  return null;
}

export async function prepareImageForClaude(url) {
  log("görsel hazırlanıyor", { url });

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Görsel indirilemedi: ${url}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(buffer).metadata();

  log("indirildi", {
    bytes: formatBytes(buffer.length),
    format: meta.format,
    dimensions: `${meta.width}x${meta.height}`,
  });

  const output = await compressToLimit(buffer, meta);
  if (!output) {
    throw new Error(
      `Görsel Claude API sınırına sığdırılamadı. Orijinal: ${formatBytes(buffer.length)}, ${meta.width}x${meta.height}px`
    );
  }

  const outMeta = await getOutputMeta(output);
  const base64 = output.toString("base64");
  const base64Bytes = Buffer.byteLength(base64, "utf8");

  log("Claude'a gönderilecek", {
    decodedBytes: formatBytes(output.length),
    base64Bytes: formatBytes(base64Bytes),
    dimensions: `${outMeta.width}x${outMeta.height}`,
    mediaType: "image/jpeg",
  });

  if (outMeta.width > CLAUDE_MAX_DIMENSION || outMeta.height > CLAUDE_MAX_DIMENSION) {
    throw new Error(
      `Görsel boyutu hâlâ çok büyük: ${outMeta.width}x${outMeta.height}px. Claude limiti ${CLAUDE_MAX_DIMENSION}px.`
    );
  }

  if (output.length > 10 * 1024 * 1024) {
    throw new Error(
      `Görsel dosya boyutu hâlâ çok büyük: ${formatBytes(output.length)}. Claude limiti 10 MB.`
    );
  }

  return {
    base64,
    mediaType: "image/jpeg",
    debug: {
      originalBytes: buffer.length,
      outputBytes: output.length,
      base64Bytes,
      width: outMeta.width,
      height: outMeta.height,
    },
  };
}
