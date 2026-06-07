import { useCallback, useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, X, Loader2, ScanText, CheckCircle2, AlertCircle } from 'lucide-react';

interface OcrStatus {
  isRecognizing: boolean;
  progress: number;
  text: string | null;
  confidence: number | null;
  error: string | null;
}

interface ImageUploaderProps {
  onImageRecognized: (text: string) => void;
}

export default function ImageUploader({ onImageRecognized }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrStatus, setOcrStatus] = useState<OcrStatus>({
    isRecognizing: false,
    progress: 0,
    text: null,
    confidence: null,
    error: null,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // 图片转base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 调用OCR API
  const performOcr = useCallback(async (file: File) => {
    setOcrStatus({
      isRecognizing: true,
      progress: 10,
      text: null,
      confidence: null,
      error: null,
    });

    try {
      setOcrStatus(prev => ({ ...prev, progress: 30 }));

      // 将图片转为base64
      const base64 = await fileToBase64(file);
      setOcrStatus(prev => ({ ...prev, progress: 50 }));

      // 调用后端OCR接口
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });

      setOcrStatus(prev => ({ ...prev, progress: 80 }));

      if (!response.ok) {
        throw new Error(`OCR请求失败: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'OCR识别失败');
      }

      // 识别成功，回填文本
      setOcrStatus({
        isRecognizing: false,
        progress: 100,
        text: result.text,
        confidence: result.confidence,
        error: null,
      });

      // 通知父组件
      onImageRecognized(result.text);
    } catch (error) {
      console.error('OCR识别错误:', error);
      setOcrStatus({
        isRecognizing: false,
        progress: 0,
        text: null,
        confidence: null,
        error: error instanceof Error ? error.message : 'OCR识别异常，请重试',
      });
    }
  }, [onImageRecognized]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith('image/')) {
        processFile(files[0]);
      }
    },
    []
  );

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // 处理文件选择：显示预览 + 自动触发OCR
  const processFile = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    // 重置OCR状态
    setOcrStatus({
      isRecognizing: false,
      progress: 0,
      text: null,
      confidence: null,
      error: null,
    });
    // 自动开始OCR识别
    performOcr(file);
  };

  // 支持粘贴图片
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [performOcr]);

  const clearImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    setOcrStatus({
      isRecognizing: false,
      progress: 0,
      text: null,
      confidence: null,
      error: null,
    });
    if (inputRef.current) inputRef.current.value = '';
  };

  // 渲染OCR状态区域
  const renderOcrStatus = () => {
    if (ocrStatus.isRecognizing) {
      return (
        <div className="mt-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-medium text-primary">正在识别图片文字...</p>
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                  style={{ width: `${ocrStatus.progress}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-mono text-gray-500">{ocrStatus.progress}%</span>
          </div>
        </div>
      );
    }

    if (ocrStatus.error) {
      return (
        <div className="mt-3 px-4 py-3 bg-danger/5 border border-danger/20 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-danger mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-danger">识别失败</p>
              <p className="text-xs text-gray-600 mt-1">{ocrStatus.error}</p>
              <button
                onClick={() => selectedFile && performOcr(selectedFile)}
                className="mt-2 text-xs text-danger hover:text-danger/80 font-medium"
              >
                点击重试
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (ocrStatus.text && ocrStatus.confidence !== null) {
      return (
        <div className="mt-3 px-4 py-3 bg-success/5 border border-success/20 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-success">文字识别完成</p>
                <span className="text-xs px-2 py-0.5 bg-success/10 text-success rounded-full">
                  置信度 {(ocrStatus.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                {ocrStatus.text}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                文本已自动填入上方输入框，您可以编辑修正后进行解析
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-3">
      {!previewUrl ? (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
            isDragging
              ? 'border-accent bg-accent/5 scale-[1.02]'
              : 'border-gray-300 hover:border-accent hover:bg-gray-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            拖拽图片到此处上传
          </p>
          <p className="text-sm text-gray-500 mb-4">
            或点击选择文件 · 支持 Ctrl+V 粘贴截图
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <ImageIcon className="w-4 h-4" />
              JPG / PNG / WebP
            </span>
            <span className="flex items-center gap-1">
              <ScanText className="w-4 h-4" />
              自动OCR识别
            </span>
          </div>
        </div>
      ) : (
        <div className="relative group space-y-3">
          {/* 图片预览 */}
          <div className="relative">
            <img
              src={previewUrl}
              alt="题目预览"
              className="w-full h-48 object-contain rounded-xl border border-gray-200 bg-white"
            />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 p-1.5 bg-danger/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger"
            >
              <X className="w-4 h-4" />
            </button>
            {selectedFile && !ocrStatus.isRecognizing && (
              <div className="absolute bottom-2 left-2 px-3 py-1.5 bg-black/60 text-white text-xs rounded-lg backdrop-blur-sm">
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)}KB)
              </div>
            )}
          </div>

          {/* OCR状态展示 */}
          {renderOcrStatus()}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      {!previewUrl && (
        <p className="text-xs text-center text-gray-400">
          上传后系统将自动识别图片中的题目文字并填入输入框
        </p>
      )}
    </div>
  );
}
