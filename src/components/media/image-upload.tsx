/**
 * ͼƬ�ϴ�������ͻ��������
 * 
 * ���ܣ�
 * - �������ק�ϴ�ͼƬ��������
 * - Ԥ�����ϴ���ͼƬ
 * - ͨ���ص� onUpload �����ص� URL ���������
 * 
 * ʹ�÷�ʽ��
 *   <ImageUpload
 *     currentUrl="/uploads/xxx.png"     // ��ǰ����ͼƬ����ѡ��
 *     onUpload={(url) => setField(url)} // �ϴ��ɹ���Ļص�
 *   />
 */

"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  /** ��ǰ�Ѵ��ڵ�ͼƬ URL������Ԥ���� */
  currentUrl?: string | null;
  /** �ϴ��ɹ���Ļص�������Ϊ���������ص� /uploads/xxx ·�� */
  onUpload: (url: string) => void;
  /** �ϴ�����Ŀ�ȣ�Ĭ�� 200px */
  width?: number;
  /** �ϴ�����ĸ߶ȣ�Ĭ�� 200px */
  height?: number;
}

export function ImageUpload({
  currentUrl,
  onUpload,
  width = 200,
  height = 200,
}: ImageUploadProps) {
  // �ϴ���״̬
  const [uploading, setUploading] = useState(false);
  // ����Ԥ�� URL��ѡ���ļ����ϴ����ǰʹ�ã�
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  // ���ص��ļ�ѡ�� input ����
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * �����ļ�ѡ���¼�
   * 1. ���ñ���Ԥ��
   * 2. ���� FormData ���͵� /api/upload
   * 3. �ɹ������ onUpload �ص�
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ���ñ���Ԥ�������ļ��ϴ����ǰ����ʾ��
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    setUploading(true);
    try {
      // ���� multipart/form-data ������
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "�ϴ�ʧ��");
      }

      // �ϴ��ɹ���֪ͨ�������ͬʱ����Ԥ��Ϊ��ʵ URL
      onUpload(data.url);
      setPreviewUrl(data.url);
      // �ͷ���ʱ blob URL
      URL.revokeObjectURL(localPreview);
      toast.success("ͼƬ�ϴ��ɹ�");
    } catch (error: any) {
      // �ϴ�ʧ�ܣ���ԭԤ�����ļ�ѡ��
      toast.error(error.message || "�ϴ�ʧ�ܣ�������");
      setPreviewUrl(currentUrl || null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setUploading(false);
    }
  };

  /**
   * ������ϴ���ͼƬ
   */
  const handleClear = () => {
    setPreviewUrl(null);
    onUpload("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* ===== Ԥ������ ===== */}
      <div
        className="relative border-2 border-dashed border-muted-foreground/25 rounded-lg overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
        style={{ width: `${width}px`, height: `${height}px` }}
        onClick={() => fileInputRef.current?.click()}
      >
        {previewUrl ? (
          // ��ͼƬ����ʾԤ��
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Ԥ��"
              className="w-full h-full object-cover"
            />
            {/* �ϴ������� */}
            {uploading && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </>
        ) : (
          // ��ͼƬ����ʾ�ϴ���ʾ
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <Upload className="h-8 w-8 mb-1" />
            <span className="text-xs">
              {uploading ? "�ϴ���..." : "����ϴ�"}
            </span>
          </div>
        )}
      </div>

      {/* ===== ���ص��ļ�ѡ�� input ===== */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {/* ===== �����ť����ͼƬʱ��ʾ�� ===== */}
      {previewUrl && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation(); // ��ֹ���� input ���
            handleClear();
          }}
          disabled={uploading}
        >
          <X className="h-3 w-3 mr-1" />
          �Ƴ�ͼƬ
        </Button>
      )}
    </div>
  );
}
