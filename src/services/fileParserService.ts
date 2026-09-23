import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import type { AttachedFile, FileTypeCategory, ParsedSheetData } from '../types/fileAttachment';

// PDF.js 워커 경로 설정 (안전한 CDN 워커 fallback 설정)
try {
  if (typeof window !== 'undefined' && pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;
  }
} catch (e) {
  console.warn('[PDF.js Worker Setup Warning]', e);
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
 * 1. 스프레드시트 (.xlsx, .xls, .csv) 파싱 파이프라인
 */
export async function parseSpreadsheet(file: File): Promise<{
  markdownReport: string;
  sheets: ParsedSheetData[];
}> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellFormula: true });
  
  const parsedSheets: ParsedSheetData[] = [];
  const reportParts: string[] = [];

  reportParts.push(`📊 [스프레드시트 분석 데이터: "${file.name}"]`);
  reportParts.push(`- 포함된 시트 목록: ${workbook.SheetNames.join(', ')}\n`);

  for (const sheetName of workbook.SheetNames) {
    // 렌더링 스레드 블로킹 방지: 다중 시트/수식 파싱 중 이벤트 루프에 제어권 양보
    await new Promise(resolve => setTimeout(resolve, 0));

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    // 2차원 배열 데이터 추출
    const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (!rawData || rawData.length === 0) continue;

    const headers: string[] = (rawData[0] || []).map((h, i) => String(h || `열_${i + 1}`).trim());
    const dataRows = rawData.slice(1).filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined));

    // 적용된 수식 셀 탐색
    const formulas: Array<{ cell: string; formula: string }> = [];
    Object.keys(worksheet).forEach(cellKey => {
      if (cellKey.startsWith('!')) return;
      const cell = worksheet[cellKey];
      if (cell && cell.f) {
        formulas.push({ cell: cellKey, formula: `=${cell.f}` });
      }
    });

    // 객체 행 데이터 구성
    const objectRows: Record<string, any>[] = dataRows.map(row => {
      const obj: Record<string, any> = {};
      headers.forEach((h, idx) => {
        obj[h] = row[idx] ?? '';
      });
      return obj;
    });

    // Markdown Table 생성 (최대 상위 15행 미리보기로 토큰 최적화)
    let mdTable = `| ${headers.join(' | ')} |\n`;
    mdTable += `| ${headers.map(() => '---').join(' | ')} |\n`;

    const previewRows = dataRows.slice(0, 15);
    previewRows.forEach(row => {
      const rowValues = headers.map((_, idx) => {
        const val = row[idx];
        return String(val ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
      });
      mdTable += `| ${rowValues.join(' | ')} |\n`;
    });

    if (dataRows.length > 15) {
      mdTable += `*... 외 ${dataRows.length - 15}개 데이터 행 생략*\n`;
    }

    parsedSheets.push({
      sheetName,
      headers,
      rows: objectRows,
      formulas,
      markdownTable: mdTable,
      rowCount: dataRows.length
    });

    reportParts.push(`### [시트: "${sheetName}"] (총 ${dataRows.length}개 행)`);
    reportParts.push(mdTable);

    if (formulas.length > 0) {
      reportParts.push(`📌 적용된 주요 수식 셀:`);
      formulas.slice(0, 8).forEach(f => {
        reportParts.push(`- 셀 ${f.cell}: \`${f.formula}\``);
      });
      if (formulas.length > 8) {
        reportParts.push(`- 외 ${formulas.length - 8}개 수식 적용됨`);
      }
    }
    reportParts.push('');
  }

  return {
    markdownReport: reportParts.join('\n'),
    sheets: parsedSheets
  };
}

/**
 * 2. 워드 (.docx) 및 텍스트 (.txt, .md) 문서 파싱 파이프라인
 */
export async function parseWordOrTextDocument(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    // HTML 변환을 통해 제목(H1/H2) 및 목록 계층 보존
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
    const rawResult = await mammoth.extractRawText({ arrayBuffer });

    let markdown = htmlResult.value
      .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n')
      .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n')
      .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n')
      .replace(/<ul>(.*?)<\/ul>/gis, '$1\n')
      .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<[^>]+>/g, '') // 잔여 태그 제거
      .trim();

    if (!markdown || markdown.length < 10) {
      markdown = rawResult.value;
    }

    return `📄 [워드 문서 구조 및 본문: "${file.name}"]\n\n${markdown}`;
  }

  // 텍스트 파일 (.txt, .md, .json)
  const textContent = await file.text();
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
    const maxPages = Math.min(pdf.numPages, 10); // 최대 10페이지 파싱

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const textItems = content.items.map((item: any) => item.str || '');
      const pageStr = textItems.join(' ').replace(/\s+/g, ' ').trim();
      if (pageStr) {
        pagesText.push(`[페이지 ${pageNum}]\n${pageStr}`);
      }
    }

    if (pdf.numPages > 10) {
      pagesText.push(`*... (총 ${pdf.numPages}페이지 중 상위 10페이지 추출 완료)*`);
    }

    return `📕 [PDF 문서 텍스트: "${file.name}" (총 ${pdf.numPages}페이지)]\n\n${pagesText.join('\n\n')}`;
  } catch (err) {
    console.warn('[PDF.js fallback mode]', err);
    // 방어용 Fallback: ArrayBuffer 내 UTF-8 / ASCII 텍스트 스트림 정규식 파싱
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const rawString = decoder.decode(arrayBuffer);
    const textMatches = rawString.match(/\(([^()]{3,})\)/g);
    if (textMatches && textMatches.length > 5) {
      const extracted = textMatches.map(m => m.slice(1, -1)).join(' ').slice(0, 3000);
      return `📕 [PDF 문서 텍스트 추출본: "${file.name}"]\n\n${extracted}`;
    }
    return `📕 [PDF 문서: "${file.name}"] - 텍스트 추출이 제한된 문서입니다. 본문 요약 또는 직접 텍스트 입력을 권장합니다.`;
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
      case 'image': {
        const { dataUrl, base64, mimeType } = await parseImageFile(file);
        attached.previewUrl = dataUrl;
        attached.base64 = base64;
        attached.mimeType = mimeType;
        attached.parsedContent = `🖼️ [첨부된 이미지: "${file.name}"] (Gemini Vision 레이아웃 및 뷰타입 역설계 연동)`;
        break;
      }
      case 'hwp': {
        attached.isUnsupportedHwp = true;
        attached.error = '한글 문서(.hwp, .hwpx)는 브라우저 보안 및 전용 바이너리 포맷 제약으로 직접 파싱이 어렵습니다. 텍스트를 복사하여 붙여넣거나 PDF로 변환 후 업로드해 주세요.';
        break;
      }
      default: {
        attached.error = '지원되지 않는 파일 포맷입니다.';
      }
    }
  } catch (err: any) {
    console.error(`[FileParser] Error parsing ${file.name}:`, err);
    attached.error = err.message || '파일 파싱 중 오류가 발생했습니다.';
  } finally {
    attached.isParsing = false;
  }

  return attached;
}
