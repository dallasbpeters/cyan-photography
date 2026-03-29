import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Category, Photo } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Trash2, Plus, LogOut, LogIn, Shield, Pencil, FilePenLine, Tags, Upload } from 'lucide-react';
import { CategoryPicker } from './admin/CategoryPicker';
import { CategoriesManageDialog } from './admin/CategoriesManageDialog';
import { PhotoEditor } from './PhotoEditor';
import { toast } from 'sonner';
import { authApi, authStorage, portfolioService } from '../services/portfolioService';

const sortCategories = (list: Category[]): Category[] =>
  [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));

export const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(authStorage.getToken()));
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [editingPhotoUrl, setEditingPhotoUrl] = useState<string | null>(null);
  const [detailsPhoto, setDetailsPhoto] = useState<Photo | null>(null);
  const [detailsTitle, setDetailsTitle] = useState('');
  const [detailsCategoryId, setDetailsCategoryId] = useState('');
  const [detailsOrder, setDetailsOrder] = useState(0);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [newPhoto, setNewPhoto] = useState({
    title: '',
    categoryId: '',
    order: 0,
  });
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [batchCategoryId, setBatchCategoryId] = useState('');
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [uploadDraftFile, setUploadDraftFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const selectAllMobileRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  const loadPhotos = useCallback(async () => {
    if (!authStorage.getToken()) return;
    setIsLoadingPhotos(true);
    try {
      const list = await portfolioService.getPhotos();
      setPhotos(list);
    } catch {
      toast.error('Could not load photos');
      setPhotos([]);
    } finally {
      setIsLoadingPhotos(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    if (!authStorage.getToken()) return;
    setIsLoadingCategories(true);
    try {
      const list = await portfolioService.getCategories();
      setCategories(sortCategories(list));
    } catch {
      toast.error('Could not load categories');
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadPhotos();
    void loadCategories();
  }, [isAuthenticated, loadPhotos, loadCategories]);

  useEffect(() => {
    const onPhotos = () => void loadPhotos();
    const onCats = () => void loadCategories();
    window.addEventListener('cyan-photos-changed', onPhotos);
    window.addEventListener('cyan-categories-changed', onCats);
    return () => {
      window.removeEventListener('cyan-photos-changed', onPhotos);
      window.removeEventListener('cyan-categories-changed', onCats);
    };
  }, [loadPhotos, loadCategories]);

  useEffect(() => {
    if (categories.length === 0) return;
    setNewPhoto((prev) => {
      if (prev.categoryId && categories.some((c) => c.id === prev.categoryId)) return prev;
      return { ...prev, categoryId: categories[0].id };
    });
    setBatchCategoryId((prev) => {
      if (prev && categories.some((c) => c.id === prev)) return prev;
      return categories[0].id;
    });
  }, [categories]);

  const createCategoryFromLabel = useCallback(
    async (label: string): Promise<string | null> => {
      const trimmed = label.trim();
      if (!trimmed) return null;
      const maxOrder = Math.max(...categories.map((c) => c.sortOrder), -1);
      setIsSavingCategory(true);
      try {
        const cat = await portfolioService.createCategory({
          label: trimmed,
          sortOrder: maxOrder + 1,
        });
        await loadCategories();
        portfolioService.notifyCategoriesChanged();
        toast.success(`Added “${cat.label}”`);
        return cat.id;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not create category');
        return null;
      } finally {
        setIsSavingCategory(false);
      }
    },
    [categories, loadCategories],
  );

  const allPhotosSelected = photos.length > 0 && photos.every((p) => selectedPhotoIds.includes(p.id));
  const somePhotosSelected = selectedPhotoIds.length > 0;

  useEffect(() => {
    const indeterminate = somePhotosSelected && !allPhotosSelected;
    const desktop = selectAllRef.current;
    const mobile = selectAllMobileRef.current;
    if (desktop) desktop.indeterminate = indeterminate;
    if (mobile) mobile.indeterminate = indeterminate;
  }, [somePhotosSelected, allPhotosSelected]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLogin(true);
    try {
      const { token } = await authApi.login(loginEmail, loginPassword);
      authStorage.setToken(token);
      setIsAuthenticated(true);
      setLoginPassword('');
      toast.success('Signed in');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleLogout = () => {
    authStorage.setToken(null);
    setIsAuthenticated(false);
    setPhotos([]);
    setCategories([]);
    setSelectedPhotoIds([]);
    toast.message('Signed out');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhoto.categoryId) {
      toast.error('Choose a category');
      return;
    }
    if (!uploadDraftFile) {
      toast.error('Choose an image file to upload');
      return;
    }
    setIsUploadingImage(true);
    let url: string;
    try {
      const { url: uploaded } = await portfolioService.uploadImageFile(uploadDraftFile);
      url = uploaded;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
      return;
    } finally {
      setIsUploadingImage(false);
    }
    try {
      await portfolioService.addPhoto({ ...newPhoto, url });
      await loadPhotos();
      await loadCategories();
      portfolioService.notifyPhotosChanged();
      portfolioService.notifyCategoriesChanged();
      setUploadDraftFile(null);
      if (imageFileInputRef.current) imageFileInputRef.current.value = '';
      setNewPhoto((prev) => ({
        title: '',
        categoryId: prev.categoryId,
        order: photos.length + 1,
      }));
      toast.success('Photo added successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error adding photo');
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!confirm(`Delete category “${cat.label}”?`)) return;
    try {
      await portfolioService.deleteCategory(cat.id);
      await loadCategories();
      portfolioService.notifyCategoriesChanged();
      toast.success('Category deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete category');
    }
  };

  const handleTogglePhoto = (id: string) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleToggleAllPhotos = () => {
    if (allPhotosSelected) {
      setSelectedPhotoIds([]);
      return;
    }
    setSelectedPhotoIds(photos.map((p) => p.id));
  };

  const handleClearSelection = () => {
    setSelectedPhotoIds([]);
  };

  const handleBatchSetCategory = async () => {
    if (selectedPhotoIds.length === 0 || !batchCategoryId) return;
    setIsBatchUpdating(true);
    try {
      const updated = await portfolioService.batchSetPhotoCategories(selectedPhotoIds, batchCategoryId);
      await loadPhotos();
      await loadCategories();
      portfolioService.notifyPhotosChanged();
      portfolioService.notifyCategoriesChanged();
      setSelectedPhotoIds([]);
      if (updated === 0) {
        toast.error('No photos were updated — check selections and try again.');
        return;
      }
      toast.success(`Updated ${updated} photo(s)`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Batch update failed');
    } finally {
      setIsBatchUpdating(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedPhotoIds.length === 0) return;
    const n = selectedPhotoIds.length;
    if (!confirm(`Delete ${n} photo${n === 1 ? '' : 's'}? This cannot be undone.`)) return;
    setIsBatchDeleting(true);
    try {
      const deleted = await portfolioService.batchDeletePhotos(selectedPhotoIds);
      await loadPhotos();
      await loadCategories();
      portfolioService.notifyPhotosChanged();
      portfolioService.notifyCategoriesChanged();
      setSelectedPhotoIds([]);
      if (deleted === 0) {
        toast.error('No photos were deleted.');
        return;
      }
      toast.success(`Deleted ${deleted} photo${deleted === 1 ? '' : 's'}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Batch delete failed');
    } finally {
      setIsBatchDeleting(false);
    }
  };

  const handleOpenDetails = (photo: Photo) => {
    setDetailsPhoto(photo);
    setDetailsTitle(photo.title);
    setDetailsCategoryId(photo.categoryId);
    setDetailsOrder(photo.order);
  };

  const handleCloseDetails = () => {
    setDetailsPhoto(null);
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailsPhoto) return;
    if (!detailsCategoryId) {
      toast.error('Choose a category');
      return;
    }
    setIsSavingDetails(true);
    try {
      await portfolioService.updatePhoto(detailsPhoto.id, {
        title: detailsTitle.trim(),
        categoryId: detailsCategoryId,
        order: detailsOrder,
      });
      await loadPhotos();
      await loadCategories();
      portfolioService.notifyPhotosChanged();
      portfolioService.notifyCategoriesChanged();
      toast.success('Details saved');
      handleCloseDetails();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save details');
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await portfolioService.deletePhoto(id);
      await loadPhotos();
      await loadCategories();
      portfolioService.notifyPhotosChanged();
      portfolioService.notifyCategoriesChanged();
      setSelectedPhotoIds((prev) => prev.filter((x) => x !== id));
      toast.success('Photo deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error deleting photo');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[min(70dvh,32rem)] w-full px-2 space-y-6">
        <div className="p-5 sm:p-6 bg-white/5 rounded-full border border-white/10">
          <Shield className="size-10 text-white/20 sm:size-12" aria-hidden />
        </div>
        <h2 className="text-xl sm:text-2xl font-light tracking-[0.25em] sm:tracking-[0.3em] uppercase text-center">
          Admin Access
        </h2>
        <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] text-center max-w-sm px-2">
          Sign in with your Neon-backed admin account (create one with the seed script or register API).
        </p>
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm space-y-4"
          aria-label="Admin sign in"
        >
          <div className="space-y-2">
            <Label htmlFor="admin-email" className="text-[10px] uppercase tracking-widest text-white/40">
              Email
            </Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
              className="min-h-11 text-base bg-black/40 border-white/10 focus:border-white/40 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password" className="text-[10px] uppercase tracking-widest text-white/40">
              Password
            </Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
              className="min-h-11 text-base bg-black/40 border-white/10 focus:border-white/40 transition-colors"
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmittingLogin}
            variant="outline"
            className="w-full min-h-12 flex items-center justify-center gap-2 border-white/20 hover:bg-white hover:text-black transition-all duration-500 uppercase tracking-widest text-[10px] px-8 py-3"
          >
            <LogIn size={16} aria-hidden />
            {isSubmittingLogin ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    );
  }

  const categoryOptionsDisabled = categories.length === 0;

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8 md:space-y-12">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:pb-8">
        <h1 className="text-2xl sm:text-3xl font-light tracking-[0.25em] sm:tracking-[0.3em] uppercase">
          Cyan Admin
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCategoriesModalOpen(true)}
            className="min-h-11 flex items-center gap-2 border-white/20 uppercase tracking-widest text-[10px] text-white/80 hover:bg-white/10 hover:text-white"
          >
            <Tags size={16} aria-hidden />
            Categories
          </Button>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="min-h-11 flex items-center gap-2 text-white/40 hover:text-white uppercase tracking-widest text-[10px]"
            type="button"
          >
            <LogOut size={16} aria-hidden />
            Sign out
          </Button>
        </div>
      </div>

      <CategoriesManageDialog
        open={categoriesModalOpen}
        onOpenChange={setCategoriesModalOpen}
        categories={categories}
        loading={isLoadingCategories}
        isCreating={isSavingCategory}
        onCreate={createCategoryFromLabel}
        onDelete={(cat) => void handleDeleteCategory(cat)}
      />

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-sm font-light uppercase tracking-[0.3em] text-white/60">Add New Item</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleAdd}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-5 md:gap-6 items-end"
          >
            <div className="space-y-3 lg:col-span-2">
              <Label htmlFor="add-image-file" className="text-[10px] uppercase tracking-widest text-white/40">
                Image
              </Label>
              <div className="flex flex-col gap-2">
                <input
                  ref={imageFileInputRef}
                  id="add-image-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  required
                  className="min-h-11 w-full text-[11px] text-white/70 file:mr-2 file:cursor-pointer file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2.5 file:text-[10px] file:font-medium file:uppercase file:tracking-widest file:text-white/90 hover:file:bg-white/15"
                  aria-label="Upload image from device"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setUploadDraftFile(f);
                  }}
                />
                {uploadDraftFile ? (
                  <p className="flex items-center gap-1 text-[10px] text-white/45">
                    <Upload size={12} className="shrink-0 opacity-70" aria-hidden />
                    <span className="truncate">{uploadDraftFile.name}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-white/35">JPEG, PNG, WebP, or GIF (max 8MB).</p>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="title" className="text-[10px] uppercase tracking-widest text-white/40">Title</Label>
              <Input
                id="title"
                value={newPhoto.title}
                onChange={(e) => setNewPhoto({ ...newPhoto, title: e.target.value })}
                placeholder="Project Name"
                required
                className="min-h-11 text-base sm:text-sm bg-black/40 border-white/10 focus:border-white/40 transition-colors"
              />
            </div>
            <CategoryPicker
              id="add-item-category"
              label="Category"
              categories={categories}
              value={newPhoto.categoryId}
              onChange={(categoryId) => setNewPhoto({ ...newPhoto, categoryId })}
              onCreate={createCategoryFromLabel}
              disabled={categoryOptionsDisabled}
              isCreating={isSavingCategory}
              className="min-w-0 lg:col-span-1"
            />
            <div className="space-y-3">
              <Label htmlFor="order" className="text-[10px] uppercase tracking-widest text-white/40">Order</Label>
              <Input
                id="order"
                type="number"
                value={newPhoto.order}
                onChange={(e) => setNewPhoto({ ...newPhoto, order: parseInt(e.target.value, 10) })}
                required
                className="min-h-11 text-base sm:text-sm bg-black/40 border-white/10 focus:border-white/40 transition-colors"
              />
            </div>
            <Button
              type="submit"
              disabled={categoryOptionsDisabled || isUploadingImage || !uploadDraftFile}
              className="w-full min-h-11 flex items-center justify-center gap-2 bg-white text-black hover:bg-white/80 transition-colors uppercase tracking-widest text-[10px] md:w-auto lg:col-span-1"
            >
              <Plus size={16} aria-hidden />
              {isUploadingImage ? 'Uploading…' : 'Add Item'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <CardHeader className="flex flex-col gap-4 border-b border-white/5 sm:flex-row sm:items-start sm:justify-between">
          <CardTitle className="text-sm font-light uppercase tracking-[0.3em] text-white/60">Current Items</CardTitle>
          {somePhotosSelected && (
            <div
              className="flex w-full flex-col gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3 sm:px-4"
              role="region"
              aria-label="Batch actions for selected photos"
            >
              <span className="shrink-0 text-[10px] uppercase tracking-widest text-white/50">
                {selectedPhotoIds.length} selected
              </span>
              <div className="w-full min-w-0 sm:min-w-48 sm:flex-1 sm:max-w-xs">
                <CategoryPicker
                  id="batch-category"
                  label="Category"
                  categories={categories}
                  value={batchCategoryId}
                  onChange={setBatchCategoryId}
                  onCreate={createCategoryFromLabel}
                  disabled={categoryOptionsDisabled}
                  isCreating={isSavingCategory}
                  className="[&_label]:sr-only"
                />
              </div>
              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
                <Button
                  type="button"
                  size="sm"
                  disabled={isBatchUpdating || isBatchDeleting || categoryOptionsDisabled}
                  onClick={() => void handleBatchSetCategory()}
                  className="col-span-2 min-h-11 bg-white text-black hover:bg-white/90 uppercase tracking-widest text-[10px] sm:col-span-1 sm:w-auto"
                >
                  {isBatchUpdating ? 'Applying…' : 'Set category'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isBatchDeleting || isBatchUpdating}
                  onClick={() => void handleBatchDelete()}
                  className="min-h-11 border-red-500/40 text-red-400 hover:border-red-500/60 hover:bg-red-500/10 uppercase tracking-widest text-[10px]"
                >
                  <Trash2 size={14} className="mr-1 inline" aria-hidden />
                  {isBatchDeleting ? 'Deleting…' : 'Delete'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isBatchDeleting || isBatchUpdating}
                  onClick={handleClearSelection}
                  className="min-h-11 text-[10px] uppercase tracking-widest text-white/50"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingPhotos ? (
            <p className="p-6 text-sm text-white/40 uppercase tracking-widest text-center">Loading…</p>
          ) : photos.length === 0 ? (
            <p className="p-6 text-sm text-white/40 uppercase tracking-widest text-center">
              No photos yet. Add one above.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-white/10 bg-black/20 px-3 py-2.5 md:hidden">
                <input
                  ref={selectAllMobileRef}
                  type="checkbox"
                  checked={allPhotosSelected}
                  onChange={handleToggleAllPhotos}
                  disabled={photos.length === 0}
                  className="h-5 w-5 shrink-0 rounded border-white/30 bg-black/40 accent-white"
                  aria-label="Select all photos"
                />
                <span className="text-[10px] uppercase tracking-widest text-white/50">Select all</span>
              </div>

              <div className="p-2 sm:p-3 md:hidden">
                <div className="grid grid-cols-2 gap-2">
                  {photos.map((photo) => {
                    const selected = selectedPhotoIds.includes(photo.id);
                    return (
                      <article
                        key={photo.id}
                        className={`relative aspect-3/4 overflow-hidden rounded-lg border bg-black/40 transition-colors ${
                          selected ? 'border-white/40 ring-1 ring-white/30' : 'border-white/10'
                        }`}
                      >
                        <img
                          src={photo.url}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div
                          className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-black/20"
                          aria-hidden
                        />
                        <label className="absolute left-1 top-1 z-10 flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => handleTogglePhoto(photo.id)}
                            className="h-5 w-5 rounded border-white/40 bg-black/60 accent-white"
                            aria-label={`Select ${photo.title}`}
                          />
                        </label>
                        <div className="absolute right-0.5 top-1 z-10 flex flex-col gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => handleOpenDetails(photo)}
                            className="size-10 min-h-11 min-w-11 text-white/90 hover:bg-white/15 hover:text-white"
                            aria-label={`Edit title and category for ${photo.title}`}
                          >
                            <FilePenLine size={18} aria-hidden />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => setEditingPhotoUrl(photo.url)}
                            className="size-10 min-h-11 min-w-11 text-white/90 hover:bg-white/15 hover:text-white"
                            aria-label={`Open image editor for ${photo.title}`}
                          >
                            <Pencil size={18} aria-hidden />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => void handleDelete(photo.id)}
                            className="size-10 min-h-11 min-w-11 text-white/90 hover:bg-red-500/20 hover:text-red-300"
                            aria-label={`Delete ${photo.title}`}
                          >
                            <Trash2 size={18} aria-hidden />
                          </Button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 z-10 p-2 pt-6">
                          <p className="line-clamp-2 text-[10px] font-light uppercase leading-tight tracking-wider text-white drop-shadow-md">
                            {photo.title}
                          </p>
                          <p className="mt-0.5 truncate text-[9px] uppercase tracking-wider text-white/75 drop-shadow">
                            {photo.categoryLabel}
                          </p>
                          <p className="mt-0.5 font-mono text-[9px] text-white/55 drop-shadow">#{photo.order}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="w-10 text-[10px] uppercase tracking-widest text-white/40">
                        <span className="sr-only">Select row</span>
                        <input
                          ref={selectAllRef}
                          type="checkbox"
                          checked={allPhotosSelected}
                          onChange={handleToggleAllPhotos}
                          disabled={photos.length === 0}
                          className="h-4 w-4 rounded border-white/30 bg-black/40 accent-white"
                          aria-label="Select all photos"
                        />
                      </TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest text-white/40">Preview</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest text-white/40">Title</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest text-white/40">Category</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest text-white/40">Order</TableHead>
                      <TableHead className="text-right text-[10px] uppercase tracking-widest text-white/40">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {photos.map((photo) => (
                      <TableRow key={photo.id} className="border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedPhotoIds.includes(photo.id)}
                            onChange={() => handleTogglePhoto(photo.id)}
                            className="h-4 w-4 rounded border-white/30 bg-black/40 accent-white"
                            aria-label={`Select ${photo.title}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="w-16 h-10 overflow-hidden rounded bg-black/40">
                            <img
                              src={photo.url}
                              alt=""
                              className="w-full h-full object-cover opacity-80"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-light tracking-wide uppercase text-sm">{photo.title}</TableCell>
                        <TableCell className="text-xs text-white/50">{photo.categoryLabel}</TableCell>
                        <TableCell className="font-mono text-xs text-white/40">{photo.order}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => handleOpenDetails(photo)}
                            className="text-white/20 hover:text-white transition-colors"
                            aria-label={`Edit title and category for ${photo.title}`}
                          >
                            <FilePenLine size={16} aria-hidden />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => setEditingPhotoUrl(photo.url)}
                            className="text-white/20 hover:text-white transition-colors"
                            aria-label={`Open image editor for ${photo.title}`}
                          >
                            <Pencil size={16} aria-hidden />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => void handleDelete(photo.id)}
                            className="text-white/20 hover:text-red-500 transition-colors"
                            aria-label={`Delete ${photo.title}`}
                          >
                            <Trash2 size={16} aria-hidden />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsPhoto !== null} onOpenChange={(open) => !open && handleCloseDetails()}>
        <DialogContent
          className="max-h-[85dvh] overflow-y-auto overflow-x-hidden border-white/10 bg-neutral-950 text-white sm:max-w-md"
          showCloseButton
        >
          <form onSubmit={handleSaveDetails} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-light uppercase tracking-[0.2em] text-white">
                Edit details
              </DialogTitle>
              <DialogDescription className="text-white/50 text-xs uppercase tracking-widest">
                Title, category, and sort order. Use the pencil to edit the image.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="details-title" className="text-[10px] uppercase tracking-widest text-white/40">
                Title
              </Label>
              <Input
                id="details-title"
                value={detailsTitle}
                onChange={(e) => setDetailsTitle(e.target.value)}
                required
                className="border-white/10 bg-black/40 focus:border-white/40"
              />
            </div>
            <CategoryPicker
              id="details-category"
              label="Category"
              categories={categories}
              value={detailsCategoryId}
              onChange={setDetailsCategoryId}
              onCreate={createCategoryFromLabel}
              disabled={categoryOptionsDisabled}
              isCreating={isSavingCategory}
            />
            <div className="space-y-2">
              <Label htmlFor="details-order" className="text-[10px] uppercase tracking-widest text-white/40">
                Order
              </Label>
              <Input
                id="details-order"
                type="number"
                value={detailsOrder}
                onChange={(e) => setDetailsOrder(parseInt(e.target.value, 10) || 0)}
                required
                className="border-white/10 bg-black/40 focus:border-white/40"
              />
            </div>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                className="text-white/60 hover:text-white"
                onClick={handleCloseDetails}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingDetails}
                className="bg-white text-black hover:bg-white/90"
              >
                {isSavingDetails ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {editingPhotoUrl && (
        <PhotoEditor
          imageUrl={editingPhotoUrl}
          onClose={() => setEditingPhotoUrl(null)}
        />
      )}
    </div>
  );
};
