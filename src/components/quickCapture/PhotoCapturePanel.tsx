import React, { useState, useRef } from 'react';
import { Camera, Image, UploadCloud, Sparkles, Send, FileText, CheckCircle } from 'lucide-react';
import { compressImageToJpeg } from '../../services/imageCompressor';

interface PhotoCapturePanelProps {
  onSendImage: (base64DataUrl: string) => void;
  isProcessing: boolean;
}

const SAMPLE_PRESET_IMAGES = [
  {
    name: '영수증 예시 (스타벅스)',
    icon: '🧾',
    type: 'receipt',
    preview: 'https://images.unsplash.com/photo-1554415707-9e44667664d8?auto=format&fit=crop&w=400&q=80',
    description: '스타벅스 강남점 카페라떼 5,000원 결제 영수증'
  },
  {
    name: '명함 예시 (IT 기업 대표)',
    icon: '📇',
    type: 'business_card',
    preview: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80',
    description: '넥스트랩 대표 홍길동 / 010-1234-5678 / contact@nextlab.ai'
  },
  {
    name: '독서/메모 예시',
    icon: '📖',
    type: 'book_memo',
    preview: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=400&q=80',
    description: '아주 작은 습관의 힘 - "정체성의 변화가 행동을 결정한다"'
  }
];

export const PhotoCapturePanel: React.FC<PhotoCapturePanelProps> = ({
  onSendImage,
  isProcessing
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageToJpeg(file, 1024, 0.8);
      setSelectedImage(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const compressed = await compressImageToJpeg(file, 1024, 0.8);
        setSelectedImage(compressed);
      } catch {
        const reader = new FileReader();
        reader.onload = (event) => {
          setSelectedImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    } else if (file) {
      alert(`선택하신 파일(${file.name})은 문서/스프레드시트입니다.\n문서 기반 템플릿 역설계 및 노션 DB 자동 생성을 위해 상단 [빌더] 화면 대화창에 첨부해 주세요!`);
    }
  };

  const handleSelectPreset = async (imgUrl: string) => {
    try {
      const compressed = await compressImageToJpeg(imgUrl, 1024, 0.8);
      setSelectedImage(compressed);
    } catch {
      setSelectedImage(imgUrl);
    }
  };

  const handleSend = async () => {
    if (!selectedImage || isProcessing) return;
    try {
      // 전송 직전에도 1024px 압축 재검증
      const compressed = await compressImageToJpeg(selectedImage, 1024, 0.8);
      onSendImage(compressed);
    } catch {
      onSendImage(selectedImage);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-6">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Upload Dropzone or Preview */}
      {!selectedImage ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`w-full max-w-lg border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 transition ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/30'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
              영수증, 명함, 서적, 손글씨 메모 촬영 및 업로드
            </h3>
            <p className="text-xs text-neutral-400">
              Gemini Vision이 이미지 내용을 분석하여 알맞은 노션 DB로 자동 분류합니다.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition"
            >
              <Camera className="w-4 h-4" />
              <span>카메라 즉시 촬영</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs active:scale-95 transition"
            >
              <Image className="w-4 h-4" />
              <span>갤러리에서 선택</span>
            </button>
          </div>
        </div>
      ) : (
        /* Image Preview & Analyze Action Box */
        <div className="w-full max-w-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-4 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-neutral-800 dark:text-neutral-200">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>선택된 이미지 프리뷰</span>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="text-[11px] text-neutral-400 hover:text-rose-500 transition"
            >
              다른 이미지 선택
            </button>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 max-h-60 flex items-center justify-center bg-black/10">
            <img
              src={selectedImage}
              alt="Selected"
              className="max-h-60 w-auto object-contain rounded-xl"
            />
          </div>

          <div className="flex justify-end pt-2 border-t border-neutral-200/50 dark:border-neutral-800/50">
            <button
              onClick={handleSend}
              disabled={isProcessing}
              className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'AI Vision 분석 및 노션 전송 중...' : 'Gemini Vision OCR 분석 및 노션 전송'}</span>
              <Send className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Quick Preset Samples for Testing */}
      <div className="w-full max-w-lg space-y-2">
        <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-neutral-400">
          <FileText className="w-3.5 h-3.5" />
          <span>터치하여 바로 테스트해 볼 수 있는 샘플 이미지:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SAMPLE_PRESET_IMAGES.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPreset(preset.preview)}
              className="flex items-center space-x-2 p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-neutral-200/60 dark:border-neutral-700/60 text-left transition group"
            >
              <span className="text-xl">{preset.icon}</span>
              <div className="truncate">
                <div className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-indigo-600 truncate">
                  {preset.name}
                </div>
                <div className="text-[10px] text-neutral-400 truncate">
                  {preset.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
