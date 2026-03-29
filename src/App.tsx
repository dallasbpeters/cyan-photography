import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Photo, ViewMode } from './types';
import { Lightbox } from './components/Lightbox';
import { Admin } from './components/Admin';
import { Toaster, toast } from 'sonner';
import { portfolioService } from './services/portfolioService';
import { Iconoir } from 'iconoir-react';

export default function App() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [isAdminView, setIsAdminView] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);

  const refreshPhotos = useCallback(async () => {
    setIsLoadingPhotos(true);
    setLoadError(null);
    try {
      const list = await portfolioService.getPhotos();
      setPhotos(list);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not load photos';
      setLoadError(message);
      setPhotos([]);
      toast.error(message);
    } finally {
      setIsLoadingPhotos(false);
    }
  }, []);

  useEffect(() => {
    void refreshPhotos();
  }, [refreshPhotos]);

  useEffect(() => {
    const onChanged = () => void refreshPhotos();
    window.addEventListener('cyan-photos-changed', onChanged);
    return () => window.removeEventListener('cyan-photos-changed', onChanged);
  }, [refreshPhotos]);

  const filteredPhotos = photos.filter((p) => viewMode === 'all' || p.category === viewMode);
  const heroPhotos = photos.slice(0, 5);

  const handleNextHero = useCallback(() => {
    if (heroPhotos.length === 0) return;
    setHeroIndex((prev) => (prev + 1) % heroPhotos.length);
  }, [heroPhotos.length]);

  useEffect(() => {
    if (heroPhotos.length === 0) return;
    const timer = setInterval(handleNextHero, 8000);
    return () => clearInterval(timer);
  }, [handleNextHero, heroPhotos.length]);

  const handleNextLightbox = () => {
    if (lightboxIndex === null || filteredPhotos.length === 0) return;
    setLightboxIndex((lightboxIndex + 1) % filteredPhotos.length);
  };

  const handlePrevLightbox = () => {
    if (lightboxIndex === null || filteredPhotos.length === 0) return;
    setLightboxIndex((lightboxIndex - 1 + filteredPhotos.length) % filteredPhotos.length);
  };

  if (isAdminView) {
    return (
      <div className="min-h-screen bg-black text-white font-sans">
        <Toaster position="top-center" theme="dark" />
        <nav className="fixed top-0 left-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <h1 className="text-xl font-light tracking-[0.3em] uppercase">Cyan Admin</h1>
            <button 
              onClick={() => setIsAdminView(false)}
              className="text-[11px] uppercase tracking-[0.2em] font-medium hover:text-white/60 transition-colors"
            >
              Close Admin
            </button>
          </div>
        </nav>
        <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
          <Admin />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black overflow-x-hidden">
      <Toaster position="top-center" theme="dark" />

      {isLoadingPhotos && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          role="status"
          aria-live="polite"
          aria-label="Loading portfolio"
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">Loading portfolio…</p>
        </div>
      )}

      {loadError && !isLoadingPhotos && (
        <div
          className="fixed top-24 left-1/2 -translate-x-1/2 z-[90] max-w-md rounded border border-white/20 bg-black/90 px-6 py-4 text-center text-sm text-white/80"
          role="alert"
        >
          {loadError}
        </div>
      )}

      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden flex items-center">
        {/* Left Sidebar - Title List */}
        <div className="absolute left-0 top-0 h-full w-full md:w-[70%] z-40 flex flex-col justify-center px-8 md:px-24 pointer-events-none">
          <div className="space-y-1 md:space-y-2 pointer-events-auto">
            {heroPhotos.map((photo, i) => (
              <button 
                key={photo.id}
                onClick={() => setHeroIndex(i)}
                className={`group flex items-start gap-2 text-left transition-all duration-1000 ${
                  heroIndex === i ? 'text-white opacity-100' : 'text-white/5 hover:text-white/20'
                }`}
              >
                <span className="text-4xl md:text-8xl font-black tracking-tighter leading-[0.85] uppercase">
                  {photo.title}
                </span>
                <sup className="text-[10px] md:text-sm font-bold mt-3 md:mt-6 opacity-40">({i + 1})</sup>
              </button>
            ))}
          </div>
        </div>

        {/* Hero Rotator */}
        <div className="absolute inset-0 z-0">
          {heroPhotos.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={heroIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
                className="relative w-full h-full"
              >
                <img
                  src={heroPhotos[heroIndex]?.url}
                  alt={heroPhotos[heroIndex]?.title ?? ''}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/20" />
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="absolute inset-0 bg-neutral-950" aria-hidden />
          )}
        </div>

        {/* Branding Overlay */}
        <div className="absolute top-12 left-8 md:left-24 z-50">
          <h1 className="text-3xl text-cyan-500 tracking-[0.5em] uppercase">Cyan</h1>
        </div>
      </section>

      {/* Portfolio Grid - Just Images */}
      <section className="py-24 px-4 md:px-8 max-w-[1800px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {filteredPhotos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="group cursor-pointer aspect-video md:aspect-square overflow-hidden bg-white/5"
              onClick={() => setLightboxIndex(index)}
            >
              <img 
                src={photo.url} 
                alt={photo.title}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-12 border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold uppercase tracking-widest">Cyan</h2>
            <p className="text-sm text-white/40 uppercase tracking-widest max-w-xs">
              Visual Storyteller & Photographer
            </p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white/60 transition-colors"><Iconoir name="instagram" width={20} height={20} /></a>
              <a href="#" className="hover:text-white/60 transition-colors"><Iconoir name="email" width={20} height={20} /></a>
            </div>
          </div>
          
          <div className="flex flex-col gap-4 text-[10px] uppercase tracking-[0.3em] text-white/20">
            <button
              type="button"
              onClick={() => setIsAdminView(true)}
              className="hover:text-white transition-colors text-left"
            >
              Admin
            </button>
            <p>© 2024 Cyan. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Filter Bar */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-8 py-3 flex items-center gap-6 shadow-2xl">
          <button onClick={() => setViewMode('all')} className={`text-[10px] uppercase tracking-[0.3em] ${viewMode === 'all' ? 'text-white' : 'text-white/40'}`}>All</button>
          <button onClick={() => setViewMode('film')} className={`text-[10px] uppercase tracking-[0.3em] ${viewMode === 'film' ? 'text-white' : 'text-white/40'}`}>Film</button>
          <button onClick={() => setViewMode('photography')} className={`text-[10px] uppercase tracking-[0.3em] ${viewMode === 'photography' ? 'text-white' : 'text-white/40'}`}>Photo</button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsAdminView(true)}
        className="fixed bottom-6 right-6 z-[60] text-[9px] uppercase tracking-[0.3em] text-white/10 hover:text-white transition-colors duration-500"
      >
        Admin
      </button>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && filteredPhotos.length > 0 && (
          <Lightbox
            photos={filteredPhotos}
            currentIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNext={handleNextLightbox}
            onPrev={handlePrevLightbox}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
