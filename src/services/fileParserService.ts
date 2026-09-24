import JSZip from 'jszip';
import * as XLSXRaw from 'xlsx';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import type { AttachedFile, FileTypeCategory, ParsedSheetData } from '../types/fileAttachment';

// SheetJS (xlsx) ESM/CJS 번들러 환경 호환 안전 참조 객체 획득 헬퍼
let cachedXLSX: any = null;
export async function getSafeXLSX(): Promise<any> {
  if (cachedXLSX && cachedXLSX.utils && cachedXLSX.read) {
    return cachedXLSX;
  }
  if (typeof window !== 'undefined' && (window as any).XLSX?.utils) {
    cachedXLSX = (window as any).XLSX;
    return cachedXLSX;
  }
  try {
    const rawModule = await import('xlsx');
    const mod = (rawModule as any).utils ? rawModule : ((rawModule as any).default || rawModule);
    if (mod && mod.utils) {
      cachedXLSX = mod;
      return cachedXLSX;
    }
  } catch (err) {
    console.warn('[SheetJS Dynamic Import Warning, using static fallback]', err);
  }
  const staticMod = (XLSXRaw as any).utils ? XLSXRaw : ((XLSXRaw as any).default || XLSXRaw);
  cachedXLSX = staticMod;
  return cachedXLSX;
}

// PDF.js 워커 경로 설정 (안전한 CDN 워커 fallback 설정)
try {
  if (typeof window !== 'undefined' && pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;
  }
} catch (e) {
  console.warn('[PDF.js Worker Setup Warning]', e);
}

// ─── 파일 화이트리스트 및 친절한 가이드 메시지 ─────────────────────────────
export const ALLOWED_EXTENSIONS = ['xlsx', 'xls', 'csv', 'docx', 'pdf', 'hwpx', 'txt', 'md'];

export const HWP_CONVERSION_GUIDE_MSG =
  '⚠️ 구형 한글(.hwp) 파일은 보안 바이너리 규격으로 웹에서 직접 분석할 수 없습니다. 한글 프로그램에서 [파일 -> PDF로 저장하기] 또는 [다른 이름으로 저장 -> Word(DOCX)]로 변환하여 첨부해 주세요.';

export const UNSUPPORTED_FORMAT_MSG =
  '⚠️ 분석 가능한 문서 포맷(Excel, CSV, Word, PDF, HWPX, 메모장)만 첨부할 수 있습니다.';

export const MIN_TEXT_LENGTH_MSG =
  '⚠️ 추출된 본문 텍스트가 10자 미만인 빈 파일이거나 읽을 수 없는 문서입니다.';

export interface FileValidationResult {
  valid: boolean;
  reason?: 'hwp' | 'unsupported';
  message?: string;
}

export function validateFileBeforeParsing(file: File): FileValidationResult {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'hwp') {
    return { valid: false, reason: 'hwp', message: HWP_CONVERSION_GUIDE_MSG };
  }
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, reason: 'unsupported', message: UNSUPPORTED_FORMAT_MSG };
  }
  return { valid: true };
}

/**
 * 파일 확장자에 따른 카테고리 판별
 */
export function getFileCategory(extension: string): FileTypeCategory {
  const ext = extension.toLowerCase().replace('.', '');
  if (['xlsx', 'xls', 'csv'].includes(ext)) return 'spreadsheet';
  if (['docx', 'doc', 'txt', 'md', 'json'].includes(ext)) return 'document';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return 'image';
  if (['hwp', 'hwpx'].includes(ext)) return 'hwp';
  return 'unsupported';
}

/**
 * 바이트 단위 용량 포맷팅 (예: 1.2 MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * HTML 기반 위장 .xls 파일 여부 자가 감지 (첫 2048바이트 검사)
 */
export async function isHtmlDisguisedSpreadsheet(file: File): Promise<boolean> {
  try {
    const slice = file.slice(0, 2048);
    const buf = await slice.arrayBuffer();
    const text = new TextDecoder('utf-8', { fatal: false }).decode(buf).toLowerCase();
    return (
      text.includes('<table') ||
      text.includes('<html') ||
      text.includes('<tr') ||
      text.includes('<td') ||
      text.includes('xmlns:x="urn:schemas-microsoft-com:office:excel') ||
      text.includes('application/vnd.ms-excel')
    );
  } catch {
    return false;
  }
}

/**
 * 브라우저 내장 DOMParser를 사용한 HTML 테이블 스프레드시트 파서 (라이브러리 의존성 제로 고속 추출)
 */
export async function parseHtmlSpreadsheet(file: File): Promise<{
  markdownReport: string;
  sheets: ParsedSheetData[];
}> {
  const fullBuffer = await file.arrayBuffer();
  let htmlText = '';
  try {
    const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
    htmlText = utf8Decoder.decode(fullBuffer);
  } catch {
    try {
      const eucKrDecoder = new TextDecoder('euc-kr', { fatal: false });
      htmlText = eucKrDecoder.decode(fullBuffer);
    } catch {
      htmlText = new TextDecoder('utf-8', { fatal: false }).decode(fullBuffer);
    }
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  const tables = Array.from(doc.querySelectorAll('table'));

  if (!tables || tables.length === 0) {
    throw new Error('HTML 테이블 태그(<table>)를 찾을 수 없습니다.');
  }

  const parsedSheets: ParsedSheetData[] = [];
  const reportParts: string[] = [];

  reportParts.push(`📊 [HTML 변종 .xls 스프레드시트 분석 데이터: "${file.name}"]`);
  reportParts.push('- 브라우저 표준 DOMParser 고속 안전 추출 모드 적용 (라이브러리 프리 무손실)\n');

  tables.forEach((table, tIdx) => {
    const sheetName = tables.length === 1 ? 'Sheet1' : `Table_${tIdx + 1}`;
    const rawRows: string[][] = [];

    const trElements = Array.from(table.querySelectorAll('tr'));
    for (const tr of trElements) {
      const cellElements = Array.from(tr.querySelectorAll('th, td'));
      if (cellElements.length === 0) continue;
      const row = cellElements.map((cell) => (cell.textContent || '').replace(/\s+/g, ' ').trim());
      if (row.some((c) => c !== '')) {
        rawRows.push(row);
      }
    }

    if (rawRows.length === 0) return;

    // 스마트 헤더 행 감지 (1~6행 중 유효 텍스트 셀이 3개 이상인 행 선택)
    let headerRowIndex = 0;
    let maxValid = 0;
    const checkLimit = Math.min(rawRows.length, 6);
    for (let r = 0; r < checkLimit; r++) {
      const validCount = rawRows[r].filter((c) => c !== '' && !c.startsWith('__EMPTY')).length;
      if (validCount >= 3) {
        headerRowIndex = r;
        maxValid = validCount;
        break;
      }
      if (validCount > maxValid) {
        maxValid = validCount;
        headerRowIndex = r;
      }
    }

    const rawHeaders = rawRows[headerRowIndex] || [];
    const validColIndices: number[] = [];
    rawHeaders.forEach((h, idx) => {
      const hasHeader = h !== '' && !h.startsWith('__EMPTY');
      const hasData = rawRows.slice(headerRowIndex + 1, headerRowIndex + 20).some((r) => (r[idx] || '').trim() !== '');
      if (hasHeader || hasData) {
        validColIndices.push(idx);
      }
    });

    const headers: string[] = validColIndices.map((colIdx, i) => {
      let title = rawHeaders[colIdx] || '';
      if (!title || title.startsWith('__EMPTY') || /^열_\d+$/i.test(title)) {
        title = i === 0 ? '항목명' : `속성_${i + 1}`;
      }
      return title;
    });

    const dataRows = rawRows
      .slice(headerRowIndex + 1)
      .map((row) => validColIndices.map((colIdx) => row[colIdx] || ''))
      .filter((row) => row.some((c) => c !== ''));

    const objectRows: Record<string, any>[] = dataRows.map((row) => {
      const obj: Record<string, any> = {};
      headers.forEach((h, idx) => {
        obj[h] = row[idx] || '';
      });
      return obj;
    });

    // 마크다운 테이블 생성 (최대 상위 40행)
    let mdTable = `| ${headers.join(' | ')} |\n`;
    mdTable += `| ${headers.map(() => '---').join(' | ')} |\n`;
    const previewRows = dataRows.slice(0, 40);
    previewRows.forEach((row) => {
      const cells = headers.map((_, idx) => (row[idx] || '').replace(/\|/g, '\\|').replace(/\n/g, ' '));
      mdTable += `| ${cells.join(' | ')} |\n`;
    });
    if (dataRows.length > 40) {
      mdTable += `*... 외 ${dataRows.length - 40}개 데이터 행 생략*\n`;
    }

    reportParts.push(`### 시트: ${sheetName} (총 ${dataRows.length}개 행)`);
    reportParts.push(`- 컬럼 목록: ${headers.join(', ')}`);
    reportParts.push(mdTable);

    parsedSheets.push({
      sheetName,
      headers,
      rows: objectRows,
      formulas: [],
      markdownTable: mdTable,
      rowCount: dataRows.length,
    });
  });

  return {
    markdownReport: reportParts.join('\n\n'),
    sheets: parsedSheets,
  };
}

/**
 * 1. 스프레드시트 (.xlsx, .xls, .csv) 파싱 파이프라인
 */
export async function parseSpreadsheet(file: File): Promise<{
  markdownReport: string;
  sheets: ParsedSheetData[];
}> {
  // 1. HTML 테이블 기반 위장 .xls 파일 여부 1차 자가 감지 (라이브러리 프리 고속 파싱)
  const isHtml = await isHtmlDisguisedSpreadsheet(file);
  if (isHtml) {
    try {
      return await parseHtmlSpreadsheet(file);
    } catch (htmlErr) {
      console.warn('[HTML Spreadsheet Parser Failed, trying SheetJS fallback]', htmlErr);
    }
  }

  // 2. 순수 바이너리 엑셀(.xlsx / 진짜 .xls) 안전 파싱 처리
  let XLSX: any;
  try {
    const XLSXModule = await import('xlsx');
    XLSX = (XLSXModule as any).utils ? XLSXModule : ((XLSXModule as any).default || XLSXModule);
  } catch (impErr) {
    console.warn('[SheetJS import fail, trying static fallback]', impErr);
    XLSX = (XLSXRaw as any).utils ? XLSXRaw : ((XLSXRaw as any).default || XLSXRaw);
  }

  if (!XLSX || !XLSX.utils) {
    try {
      return await parseHtmlSpreadsheet(file);
    } catch {
      throw new Error('Excel parser engine init failed');
    }
  }

  // .xls 및 .xlsx 포맷 안전 파싱 파이프라인 (ArrayBuffer -> BinaryString 2단계 fallback)
  let workbook: any;
  try {
    const arrayBuffer = await file.arrayBuffer();
    workbook = XLSX.read(arrayBuffer, { type: 'array', cellFormula: true });
  } catch (readErr: any) {
    console.warn('[XLSX ArrayBuffer Read Fail, trying binary string]', readErr);
    try {
      const binaryStr = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsBinaryString(file);
      });
      workbook = XLSX.read(binaryStr, { type: 'binary', cellFormula: true });
    } catch (binErr: any) {
      try {
        return await parseHtmlSpreadsheet(file);
      } catch {
        throw new Error(`엑셀 파일 파싱 실패: ${binErr.message || readErr.message || '파일이 손상되었거나 지원되지 않는 형식입니다.'}`);
      }
    }
  }

  if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('엑셀 파일 내 유효한 워크시트가 존재하지 않습니다.');
  }

  const parsedSheets: ParsedSheetData[] = [];
  const reportParts: string[] = [];

  reportParts.push(`📊 [스프레드시트 분석 데이터: "${file.name}"]`);
  reportParts.push(`- 포함된 시트 목록: ${workbook.SheetNames.join(', ')}\n`);

  for (const sheetName of workbook.SheetNames) {
    await new Promise((resolve) => setTimeout(resolve, 0));

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    // 2차원 배열 데이터 추출
    let rawData: any[][] = [];
    try {
      rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    } catch (sheetJsonErr) {
      console.warn(`[SheetJS] sheet_to_json failed for sheet "${sheetName}":`, sheetJsonErr);
      continue;
    }

    if (!rawData || rawData.length === 0) continue;

    // 스마트 헤더 행 감지
    let headerRowIndex = 0;
    let maxValidCells = 0;

    const checkLimit = Math.min(rawData.length, 6);
    for (let r = 0; r < checkLimit; r++) {
      const row = rawData[r] || [];
      const validCells = row.filter((cell: any) => {
        const str = String(cell ?? '').trim();
        return str !== '' && !str.startsWith('__EMPTY') && !str.startsWith('열_');
      }).length;

      if (validCells >= 3) {
        headerRowIndex = r;
        maxValidCells = validCells;
        break;
      }
      if (validCells > maxValidCells) {
        maxValidCells = validCells;
        headerRowIndex = r;
      }
    }

    const rawHeaderRow = rawData[headerRowIndex] || [];
    const validColIndices: number[] = [];
    rawHeaderRow.forEach((h: any, idx: number) => {
      const colTitle = String(h ?? '').trim();
      const hasHeader = colTitle !== '' && !colTitle.startsWith('__EMPTY');
      const hasColumnData = rawData.slice(headerRowIndex + 1, headerRowIndex + 20).some((row) => {
        const val = String((row || [])[idx] ?? '').trim();
        return val !== '';
      });

      if (hasHeader || hasColumnData) {
        validColIndices.push(idx);
      }
    });

    const headers: string[] = validColIndices.map((colIdx, i) => {
      let title = String(rawHeaderRow[colIdx] ?? '').trim();
      if (!title || title.startsWith('__EMPTY') || /^열_\d+$/i.test(title)) {
        title = i === 0 ? '항목명' : `속성_${i + 1}`;
      }
      return title;
    });

    const dataRows = rawData
      .slice(headerRowIndex + 1)
      .filter((row) => row && row.some((cell: any) => cell !== '' && cell !== null && cell !== undefined))
      .map((row) => validColIndices.map((colIdx) => row[colIdx] ?? ''));

    const formulas: Array<{ cell: string; formula: string }> = [];
    try {
      Object.keys(worksheet).forEach((cellKey) => {
        if (cellKey.startsWith('!')) return;
        const cell = worksheet[cellKey];
        if (cell && cell.f) {
          formulas.push({ cell: cellKey, formula: `=${cell.f}` });
        }
      });
    } catch {}

    const objectRows: Record<string, any>[] = dataRows.map((row) => {
      const obj: Record<string, any> = {};
      headers.forEach((h, idx) => {
        obj[h] = row[idx] ?? '';
      });
      return obj;
    });

    let mdTable = `| ${headers.join(' | ')} |\n`;
    mdTable += `| ${headers.map(() => '---').join(' | ')} |\n`;

    const previewRows = dataRows.slice(0, 40);
    previewRows.forEach((row) => {
      const rowValues = headers.map((_, idx) => {
        const val = row[idx];
        return String(val ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
      });
      mdTable += `| ${rowValues.join(' | ')} |\n`;
    });

    if (dataRows.length > 40) {
      mdTable += `*... 외 ${dataRows.length - 40}개 데이터 행 생략*\n`;
    }

    reportParts.push(`### 시트명: ${sheetName} (총 ${dataRows.length}개 행)`);
    reportParts.push(`- 컬럼 목록: ${headers.join(', ')}`);
    reportParts.push(mdTable);

    parsedSheets.push({
      sheetName,
      headers,
      rows: objectRows,
      formulas,
      markdownTable: mdTable,
      rowCount: dataRows.length,
    });
  }

  return {
    markdownReport: reportParts.join('\n\n'),
    sheets: parsedSheets,
  };
}

/**
 * 바이너리 쓰레기값 및 깨진 외계어 텍스트 필터 (Garbage Guard)
 * - %PDF 헤더나 PK 시그니처 시작 감지
 * - 제어문자/바이너리 바이트 비율이 20% 이상 시 쓰레기값으로 처리
 */
export function isBinaryGarbageText(text: string): boolean {
  if (!text || text.trim().length === 0) return true;
  const trimmed = text.trim();

  // 1. %PDF-1.x 외계어 헤더 및 PK 바이너리 시작 차단
  if (/^%PDF/i.test(trimmed) || trimmed.includes('%PDF-1.') || /^PK\x03\x04/i.test(trimmed)) {
    return true;
  }

  // 2. 비표준 제어문자 및 바이너리 바이트 비율 검사 (20% 이상 시 쓰레기값 처리)
  let nonPrintableCount = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // \t(9), \n(10), \r(13) 및 유효 한글/문자 이외의 제어문자/널바이트 검사
    if ((code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 65533) {
      nonPrintableCount++;
    }
  }

  const garbageRatio = nonPrintableCount / text.length;
  return garbageRatio >= 0.20;
}

export async function parseWordOrTextDocument(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    let markdown = '';

    // 1차: mammoth로 HTML/마크다운 추출 시도
    try {
      const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
      const rawResult = await mammoth.extractRawText({ arrayBuffer });

      markdown = htmlResult.value
        .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n')
        .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n')
        .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n')
        .replace(/<ul>(.*?)<\/ul>/gis, '$1\n')
        .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
        .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
        .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<em>(.*?)<\/em>/gi, '*$1*')
        .replace(/<[^>]+>/g, '')
        .trim();

      if (!markdown || markdown.length < 10) {
        markdown = (rawResult.value || '').trim();
      }
    } catch (mErr) {
      console.warn('[Mammoth Parse Warning, switching to JSZip XML extractor]', mErr);
    }

    // 2차 Fallback: JSZip으로 word/document.xml 압축 해제 후 <w:t> 순수 텍스트 추출
    if (!markdown || markdown.length < 10 || isBinaryGarbageText(markdown)) {
      try {
        const zip = await JSZip.loadAsync(arrayBuffer);
        const docXml = zip.file('word/document.xml');
        if (docXml) {
          const xmlContent = await docXml.async('text');
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');
          const tElements = xmlDoc.getElementsByTagName('w:t');
          const textChunks: string[] = [];
          for (let i = 0; i < tElements.length; i++) {
            const tVal = tElements[i].textContent || '';
            if (tVal.trim()) textChunks.push(tVal.trim());
          }
          markdown = textChunks.join(' ').replace(/\s+/g, ' ').trim();
        }
      } catch (zipErr) {
        console.warn('[DOCX JSZip Extract Error]', zipErr);
      }
    }

    if (!markdown || markdown.length < 10 || isBinaryGarbageText(markdown)) {
      throw new Error('Word(.docx) 문서 내 순수 텍스트를 추출하지 못했습니다.');
    }

    return `📄 [Word 문서 본문: "${file.name}"]\n\n${markdown}`;
  }

  // 텍스트 파일 (.txt, .md, .json)
  const textContent = await file.text();
  if (isBinaryGarbageText(textContent)) {
    throw new Error('텍스트 문서 내 바이너리 깨진 문자가 감지되어 첨부가 취소되었습니다.');
  }
  const docLabel = ext === 'json' ? 'JSON 데이터' : '텍스트 문서';
  return `📝 [${docLabel} 내용: "${file.name}"]\n\n${textContent.slice(0, 15000)}`;
}

/**
 * 3. PDF (.pdf) 문서 파싱 파이프라인 (페이지별 순차 텍스트 추출)
 */
export async function parsePdfDocument(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pagesText: string[] = [];

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true
    });

    const pdf = await loadingTask.promise;
    const maxPages = Math.min(pdf.numPages, 15);

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const textItems = content.items.map((item: any) => item.str || '');
      const pageStr = textItems.join(' ').replace(/\s+/g, ' ').trim();
      if (pageStr) {
        pagesText.push(`[페이지 ${pageNum}]\n${pageStr}`);
      }
    }

    const combined = pagesText.join('\n\n').trim();

    if (!combined || combined.length < 10 || isBinaryGarbageText(combined)) {
      throw new Error('PDF 내부 텍스트 추출에 실패했습니다. 한글 프로그램에서 [텍스트 문서(.txt)] 또는 [Word(.docx)]로 저장해 첨부해주세요.');
    }

    if (pdf.numPages > 15) {
      pagesText.push(`*... (총 ${pdf.numPages}페이지 중 상위 15페이지 추출 완료)*`);
    }

    return `📕 [PDF 문서 텍스트: "${file.name}" (총 ${pdf.numPages}페이지)]\n\n${pagesText.join('\n\n')}`;
  } catch (err: any) {
    console.warn('[PDF Parsing Error/Fallback Blocked]', err);
    // 깨진 바이너리를 절대로 반환하지 않고 즉시 예외(throw)로 차단
    throw new Error('PDF 내부 텍스트 추출에 실패했습니다. 한글 프로그램에서 [텍스트 문서(.txt)] 또는 [Word(.docx)]로 저장해 첨부해주세요.');
  }
}

/**
 * 4. 이미지 (.png, .jpg, .jpeg, .webp) 파싱 파이프라인
 * - 대용량 원본 사진(10~20MB) 업로드 시 Gemini API 413 페이로드 에러 및 브라우저 메모리 고갈 방지
 * - 브라우저 Canvas 기반 최대 해상도(1600px) 유지 및 고화질 압축(JPEG 0.85) 자동 수행
 */
export async function parseImageFile(file: File): Promise<{
  dataUrl: string;
  base64: string;
  mimeType: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const originalDataUrl = reader.result as string;
      const img = new Image();
      
      img.onload = () => {
        try {
          const MAX_DIMENSION = 1600;
          let width = img.width;
          let height = img.height;

          // 가로/세로 비율 유지하며 최대 1600px 이내로 리사이징
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = Math.round((height * MAX_DIMENSION) / width);
              width = MAX_DIMENSION;
            } else {
              width = Math.round((width * MAX_DIMENSION) / height);
              height = MAX_DIMENSION;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            const base64 = compressedDataUrl.split(',')[1] || '';
            resolve({
              dataUrl: compressedDataUrl,
              base64,
              mimeType: 'image/jpeg'
            });
            return;
          }

          // Fallback: 캔버스 획득 실패 시 원본 반환
          const mimeType = file.type || 'image/png';
          const base64 = originalDataUrl.split(',')[1] || '';
          resolve({ dataUrl: originalDataUrl, base64, mimeType });
        } catch (canvasErr) {
          console.warn('[Image Compress Fallback]', canvasErr);
          const mimeType = file.type || 'image/png';
          const base64 = originalDataUrl.split(',')[1] || '';
          resolve({ dataUrl: originalDataUrl, base64, mimeType });
        }
      };

      img.onerror = () => {
        const mimeType = file.type || 'image/png';
        const base64 = originalDataUrl.split(',')[1] || '';
        resolve({ dataUrl: originalDataUrl, base64, mimeType });
      };

      img.src = originalDataUrl;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 통합 파일 파싱 진입점 함수
 */

/**
 * 5. HWPX (.hwpx) XML 기반 파서
 * - HWPX는 표준 ZIP/XML 압축 아카이브 포맷
 * - JSZip을 통해 Contents/section*.xml 파일들을 순회하며 <hp:p> 문단 내 <hp:t> 텍스트 노드를 100% 무손실 추출
 */
export async function parseHwpxDocument(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Contents/section0.xml, Contents/section1.xml ... 탐색
  const sectionFiles = Object.keys(zip.files).filter((filename) =>
    /^Contents\/section\d+\.xml$/i.test(filename) ||
    /Contents\/section/i.test(filename)
  );

  // 파일 번호순 정렬
  sectionFiles.sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, '') || '0', 10);
    const numB = parseInt(b.replace(/\D/g, '') || '0', 10);
    return numA - numB;
  });

  const allParagraphs: string[] = [];

  for (const sFile of sectionFiles) {
    const xmlContent = await zip.file(sFile)?.async('text');
    if (!xmlContent) continue;

    // DOMParser를 통한 XML 파싱
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');

    const paragraphs = xmlDoc.getElementsByTagName('hp:p');
    if (paragraphs && paragraphs.length > 0) {
      for (let i = 0; i < paragraphs.length; i++) {
        const pElem = paragraphs[i];
        const textElems = pElem.getElementsByTagName('hp:t');
        const textParts: string[] = [];
        for (let j = 0; j < textElems.length; j++) {
          const t = textElems[j].textContent || '';
          if (t.trim()) textParts.push(t.trim());
        }
        const fullPara = textParts.join(' ').trim();
        if (fullPara) {
          allParagraphs.push(fullPara);
        }
      }
    } else {
      // DOMParser 실패 시 정규식 fallback
      const matches = xmlContent.match(/<hp:t[^>]*>(.*?)<\/hp:t>/gis) || xmlContent.match(/<t[^>]*>(.*?)<\/t>/gis);
      if (matches) {
        matches.forEach((m) => {
          const clean = m.replace(/<[^>]+>/g, '').trim();
          if (clean) allParagraphs.push(clean);
        });
      }
    }
  }

  // 섹션이 없었을 경우 기타 xml 파일(header.xml, body.xml 등) 검사
  if (allParagraphs.length === 0) {
    const anyXmlFiles = Object.keys(zip.files).filter((fn) => fn.endsWith('.xml') && !fn.includes('manifest'));
    for (const xmlFn of anyXmlFiles) {
      const xml = await zip.file(xmlFn)?.async('text');
      if (xml) {
        const matches = xml.match(/<hp:t[^>]*>(.*?)<\/hp:t>/gis);
        if (matches) {
          matches.forEach((m) => {
            const clean = m.replace(/<[^>]+>/g, '').trim();
            if (clean) allParagraphs.push(clean);
          });
        }
      }
    }
  }

  if (allParagraphs.length === 0) {
    return `📄 [한글(HWPX) 문서: "${file.name}"]\n\n본 문서 내에서 텍스트 태그를 발견하지 못했습니다.`;
  }

  return `📄 [한글(HWPX) 문서 텍스트: "${file.name}"] (HWPX XML 파싱 추출 완료)\n\n${allParagraphs.join('\n')}`;
}

/**
 * 6. HWP (.hwp) 구형 5.0 바이너리 안전 파서 & 방어막
 * - HWP 5.0은 OLE Compound File 바이너리 구조
 * - ArrayBuffer 기반 UTF-16LE / UTF-8 텍스트 스트림 영역 디코딩 시도
 * - 파싱 실패 또는 바이너리 암호화 시에도 throw Error 크래시를 내지 않고 안전하게 안내 및 warning 반환
 */
export async function parseHwpDocument(file: File): Promise<{
  text: string;
  hasExtractedText: boolean;
  warning?: string;
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // 1차 시도: UTF-16LE 바이트 스트림 디코딩 후 한글/영문 텍스트 패턴 추출
    const utf16Decoder = new TextDecoder('utf-16le', { fatal: false });
    const decodedUtf16 = utf16Decoder.decode(arrayBuffer);

    // 4자 이상 유효 한글 및 문장 패턴 정규식 매칭
    const validKoreanRegex = /[\uAC00-\uD7A3a-zA-Z0-9\s.,!?:;/()'\"~%+=#\-]{4,}/g;
    const matchesUtf16 = decodedUtf16.match(validKoreanRegex) || [];

    const filteredChunks = matchesUtf16
      .map((s) => s.trim())
      .filter((s) => {
        if (s.length < 4) return false;
        // 한글이나 알파벳이 2개 이상 포함된 유효 텍스트만 필터링
        const koreanOrAlpha = (s.match(/[\uAC00-\uD7A3a-zA-Z]/g) || []).length;
        return koreanOrAlpha >= 2;
      });

    // 2차 시도: UTF-8 디코딩 결과에서도 텍스트 추출 시도
    const utf8Decoder = new TextDecoder('utf-8', { fatal: false });
    const decodedUtf8 = utf8Decoder.decode(arrayBuffer);
    const matchesUtf8 = decodedUtf8.match(validKoreanRegex) || [];
    const filteredUtf8 = matchesUtf8
      .map((s) => s.trim())
      .filter((s) => {
        if (s.length < 4) return false;
        const koreanOrAlpha = (s.match(/[\uAC00-\uD7A3a-zA-Z]/g) || []).length;
        return koreanOrAlpha >= 2;
      });

    const bestChunks = filteredChunks.length >= filteredUtf8.length ? filteredChunks : filteredUtf8;
    const combinedText = bestChunks.join('\n').slice(0, 15000);

    if (combinedText.length > 50) {
      return {
        text: `📄 [한글(HWP) 문서 텍스트: "${file.name}"] (바이너리 텍스트 스트림 추출 완료)\n\n${combinedText}`,
        hasExtractedText: true,
        warning: 'HWP 바이너리에서 텍스트를 추출했습니다. 일부 서식이나 표 구조는 단순 텍스트로 반영되었을 수 있습니다.'
      };
    }

    // 텍스트 추출이 불충분한 경우: 빨간 에러(throw) 없이 안내 텍스트와 warning 반환
    return {
      text: `📄 [한글(HWP) 문서: "${file.name}"]\n\n본 HWP 문서는 암호화되거나 압축된 바이너리 스트림 포맷으로 인해 브라우저 직접 텍스트 추출이 제한되었습니다. 최적의 AI 템플릿 설계를 위해 본문 내용을 복사하여 대화창에 붙여넣으시거나, HWP 문서를 PDF 또는 워드(DOCX)로 '다른 이름으로 저장'하여 첨부해 주시면 100% 정밀 분석이 가능합니다.`,
      hasExtractedText: false,
      warning: 'HWP 파일은 보안 바이너리 포맷입니다. 텍스트 추출이 제한될 경우 PDF 또는 워드(DOCX)로 변환해 첨부하시면 가장 정확합니다.'
    };
  } catch (err: any) {
    console.warn('[HWP Parser Fallback]', err);
    return {
      text: `📄 [한글(HWP) 문서: "${file.name}"]\n\nHWP 파일 텍스트 추출 중 호환성 이슈가 발생했습니다. 정확한 AI 템플릿 생성을 위해 PDF 또는 워드(DOCX)로 변환하여 첨부해 주시기 바랍니다.`,
      hasExtractedText: false,
      warning: 'HWP 파일은 보안 바이너리 포맷입니다. 텍스트 추출이 제한될 경우 PDF 또는 워드(DOCX)로 변환해 첨부하시면 가장 정확합니다.'
    };
  }
}

export async function parseUploadedFile(file: File): Promise<AttachedFile> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const category = getFileCategory(ext);
  const sizeFormatted = formatFileSize(file.size);
  const id = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const attached: AttachedFile = {
    id,
    file,
    name: file.name,
    size: file.size,
    sizeFormatted,
    extension: ext,
    category,
    mimeType: file.type,
    isParsing: true
  };

  // 1차/2차 화이트리스트 사전 검증
  const validation = validateFileBeforeParsing(file);
  if (!validation.valid) {
    attached.isParsing = false;
    attached.error = validation.message;
    if (validation.reason === 'hwp') {
      attached.isUnsupportedHwp = true;
      attached.warning = validation.message;
    }
    return attached;
  }

  try {
    switch (category) {
      case 'spreadsheet': {
        const { markdownReport, sheets } = await parseSpreadsheet(file);
        attached.parsedContent = markdownReport;
        attached.sheets = sheets;
        break;
      }
      case 'document': {
        const content = await parseWordOrTextDocument(file);
        attached.parsedContent = content;
        break;
      }
      case 'pdf': {
        const content = await parsePdfDocument(file);
        attached.parsedContent = content;
        break;
      }
      case 'hwp': {
        // HWPX 파일만 파싱 허용
        if (file.name.toLowerCase().endsWith('.hwpx')) {
          try {
            const hwpxText = await parseHwpxDocument(file);
            attached.parsedContent = hwpxText;
            attached.summaryBadge = 'HWPX 본문 추출 완료';
          } catch (hwpxErr: any) {
            console.warn('[HWPX Parse Warning]', hwpxErr);
            attached.error = 'HWPX 파일 구조 파싱 실패. PDF나 Word(DOCX)로 변환해 첨부해주세요.';
            attached.parsedContent = undefined;
            attached.summaryBadge = 'HWPX 파싱 실패';
          }
        } else {
          attached.isUnsupportedHwp = true;
          attached.error = HWP_CONVERSION_GUIDE_MSG;
          attached.warning = HWP_CONVERSION_GUIDE_MSG;
          attached.parsedContent = undefined;
          attached.summaryBadge = 'HWP 변환 필요';
        }
        break;
      }
      default: {
        attached.error = UNSUPPORTED_FORMAT_MSG;
      }
    }
  } catch (err: any) {
    console.error(`[FileParser] Error parsing ${file.name}:`, err);
    attached.error = err.message || '파일 파싱 중 오류가 발생했습니다.';
  } finally {
    attached.isParsing = false;

    // 바이너리 깨진 쓰레기 텍스트 및 유효 길이(10자 미만) 검증
    if (!attached.error) {
      if (attached.parsedContent && isBinaryGarbageText(attached.parsedContent)) {
        attached.error = '⚠️ 파일 내 바이너리 깨진 문자가 감지되었습니다. [텍스트 문서(.txt)] 또는 [Word(.docx)]로 변환해 첨부해주세요.';
        attached.parsedContent = undefined;
        attached.sheets = undefined;
        attached.summaryBadge = undefined;
      } else {
        let rawTextLength = 0;
        if (attached.parsedContent) {
          rawTextLength += attached.parsedContent.replace(/[#\-\|\*\s`]/g, '').length;
        }
        if (attached.sheets) {
          attached.sheets.forEach((s) => {
            s.rows.forEach((r) => {
              Object.values(r).forEach((v) => {
                if (v) rawTextLength += String(v).trim().length;
              });
            });
          });
        }

        if (rawTextLength < 10) {
          attached.isTooShort = true;
          attached.error = MIN_TEXT_LENGTH_MSG;
          attached.parsedContent = undefined;
          attached.sheets = undefined;
          attached.summaryBadge = undefined;
        }
      }
    }

    // 칩(Badge) 요약 텍스트 산출
    if (!attached.error && !attached.isTooShort) {
      const totalRows = attached.sheets?.reduce((acc, s) => acc + (s.rowCount || 0), 0) || 0;
      const isMetering = /검침|계량기|수도|전기|가스|원격|meter|energy/i.test(attached.name + ' ' + (attached.parsedContent || ''));

      if (isMetering && totalRows > 0) {
        attached.summaryBadge = `[실시간 검침정보] ${totalRows}개 행 파싱 완료`;
      } else if (isMetering) {
        attached.summaryBadge = '[실시간 검침정보] 파싱 완료';
      } else if (totalRows > 0) {
        attached.summaryBadge = `${totalRows}개 행 파싱 완료`;
      } else if (attached.parsedContent) {
        attached.summaryBadge = '파싱 완료';
      }
    }
  }

  return attached;
}
