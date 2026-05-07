const CRC_TABLE = (() => {
  const table = new Uint32Array(256);

  for (let i = 0; i < 256; i += 1) {
    let value = i;

    for (let j = 0; j < 8; j += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    table[i] = value >>> 0;
  }

  return table;
})();

function getCrc32(bytes) {
  let crc = 0xffffffff;

  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(view, offset, value) {
  view.setUint16(offset, value, true);
}

function writeUint32(view, offset, value) {
  view.setUint32(offset, value, true);
}

function createLocalHeader(fileNameBytes, crc32, size) {
  const buffer = new ArrayBuffer(30 + fileNameBytes.length);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  writeUint32(view, 0, 0x04034b50);
  writeUint16(view, 4, 20);
  writeUint16(view, 6, 0x0800);
  writeUint16(view, 8, 0);
  writeUint16(view, 10, 0);
  writeUint16(view, 12, 0);
  writeUint32(view, 14, crc32);
  writeUint32(view, 18, size);
  writeUint32(view, 22, size);
  writeUint16(view, 26, fileNameBytes.length);
  writeUint16(view, 28, 0);
  bytes.set(fileNameBytes, 30);

  return bytes;
}

function createCentralHeader(fileNameBytes, crc32, size, offset) {
  const buffer = new ArrayBuffer(46 + fileNameBytes.length);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  writeUint32(view, 0, 0x02014b50);
  writeUint16(view, 4, 20);
  writeUint16(view, 6, 20);
  writeUint16(view, 8, 0x0800);
  writeUint16(view, 10, 0);
  writeUint16(view, 12, 0);
  writeUint16(view, 14, 0);
  writeUint32(view, 16, crc32);
  writeUint32(view, 20, size);
  writeUint32(view, 24, size);
  writeUint16(view, 28, fileNameBytes.length);
  writeUint16(view, 30, 0);
  writeUint16(view, 32, 0);
  writeUint16(view, 34, 0);
  writeUint16(view, 36, 0);
  writeUint32(view, 38, 0);
  writeUint32(view, 42, offset);
  bytes.set(fileNameBytes, 46);

  return bytes;
}

function createEndRecord(fileCount, centralSize, centralOffset) {
  const buffer = new ArrayBuffer(22);
  const view = new DataView(buffer);

  writeUint32(view, 0, 0x06054b50);
  writeUint16(view, 4, 0);
  writeUint16(view, 6, 0);
  writeUint16(view, 8, fileCount);
  writeUint16(view, 10, fileCount);
  writeUint32(view, 12, centralSize);
  writeUint32(view, 16, centralOffset);
  writeUint16(view, 20, 0);

  return new Uint8Array(buffer);
}

export async function createZip(entries) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const data = new Uint8Array(await entry.blob.arrayBuffer());
    const fileNameBytes = encoder.encode(entry.name);
    const crc32 = getCrc32(data);
    const localHeader = createLocalHeader(fileNameBytes, crc32, data.length);
    const centralHeader = createCentralHeader(fileNameBytes, crc32, data.length, offset);

    localParts.push(localHeader, data);
    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  const centralOffset = offset;
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const endRecord = createEndRecord(entries.length, centralSize, centralOffset);

  return new Blob([...localParts, ...centralParts, endRecord], {
    type: 'application/zip',
  });
}
