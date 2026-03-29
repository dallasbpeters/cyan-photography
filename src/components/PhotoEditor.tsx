import { useEffect, useRef } from 'react';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import { initPhotoEditor } from '../imgly';
import { X } from 'lucide-react';

interface PhotoEditorProps {
  imageUrl: string;
  onClose: () => void;
}

export function PhotoEditor({ imageUrl, onClose }: PhotoEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cesdkRef = useRef<CreativeEditorSDK | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;

    const config = {
      userId: 'cyan-photo-editor',
    };

    CreativeEditorSDK.create(containerRef.current, config)
      .then(async (cesdk) => {
        if (disposed) {
          cesdk.dispose();
          return;
        }

        cesdkRef.current = cesdk;

        try {
          await initPhotoEditor(cesdk);

          // Create a scene with the photo
          await cesdk.actions.run('scene.create', {
            page: { width: 1080, height: 1080, unit: 'Pixel' },
          });

          const engine = cesdk.engine;
          const page = engine.block.findByType('page')[0];

          if (page != null) {
            // Replace the page's default fill with an image fill
            const imageFill = engine.block.createFill('image');
            engine.block.setString(imageFill, 'fill/image/imageFileURI', imageUrl);
            engine.block.setFill(page, imageFill);
            engine.block.setContentFillMode(page, 'Cover');

            // Zoom to fit
            await engine.scene.zoomToBlock(page, 40, 40, 40, 40);
          }
        } catch (error) {
          console.error('[CE.SDK init] Failed:', error);
        }
      })
      .catch((error) => {
        console.error('Failed to initialize CE.SDK:', error);
      });

    return () => {
      disposed = true;
      if (cesdkRef.current) {
        cesdkRef.current.dispose();
        cesdkRef.current = null;
      }
    };
  }, [imageUrl]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="flex items-center justify-between px-6 h-14 bg-black border-b border-white/10 shrink-0">
        <h2 className="text-sm font-light uppercase tracking-[0.3em] text-white/60">
          Photo Editor
        </h2>
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-[10px] uppercase tracking-[0.2em]"
        >
          <X size={16} />
          Close
        </button>
      </div>
      <div
        ref={containerRef}
        className="flex-1"
        style={{ minHeight: 0 }}
      />
    </div>
  );
}
