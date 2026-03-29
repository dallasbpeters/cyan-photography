import React, { useState, useEffect, useCallback } from 'react';
import { Photo } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Trash2, Plus, LogOut, LogIn, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { authApi, authStorage, portfolioService } from '../services/portfolioService';

export const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(authStorage.getToken()));
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [newPhoto, setNewPhoto] = useState({
    url: '',
    title: '',
    category: 'photography' as 'film' | 'photography',
    order: 0,
  });

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

  useEffect(() => {
    if (isAuthenticated) void loadPhotos();
  }, [isAuthenticated, loadPhotos]);

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
    toast.message('Signed out');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await portfolioService.addPhoto(newPhoto);
      await loadPhotos();
      portfolioService.notifyPhotosChanged();
      setNewPhoto({ url: '', title: '', category: 'photography', order: photos.length + 1 });
      toast.success('Photo added successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error adding photo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await portfolioService.deletePhoto(id);
      await loadPhotos();
      portfolioService.notifyPhotosChanged();
      toast.success('Photo deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error deleting photo');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="p-6 bg-white/5 rounded-full border border-white/10">
          <Shield size={48} className="text-white/20" aria-hidden />
        </div>
        <h2 className="text-2xl font-light tracking-[0.3em] uppercase">Admin Access</h2>
        <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] text-center max-w-sm">
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
              className="bg-black/40 border-white/10 focus:border-white/40 transition-colors"
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
              className="bg-black/40 border-white/10 focus:border-white/40 transition-colors"
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmittingLogin}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 border-white/20 hover:bg-white hover:text-black transition-all duration-500 uppercase tracking-widest text-[10px] px-8 py-6"
          >
            <LogIn size={16} aria-hidden />
            {isSubmittingLogin ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12">
      <div className="flex justify-between items-center border-b border-white/10 pb-8">
        <h1 className="text-3xl font-light tracking-[0.3em] uppercase">Cyan Admin</h1>
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="flex items-center gap-2 text-white/40 hover:text-white uppercase tracking-widest text-[10px]"
          type="button"
        >
          <LogOut size={16} aria-hidden />
          Sign out
        </Button>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-sm font-light uppercase tracking-[0.3em] text-white/60">Add New Item</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
            <div className="space-y-3">
              <Label htmlFor="url" className="text-[10px] uppercase tracking-widest text-white/40">Image URL</Label>
              <Input
                id="url"
                value={newPhoto.url}
                onChange={(e) => setNewPhoto({ ...newPhoto, url: e.target.value })}
                placeholder="https://..."
                required
                className="bg-black/40 border-white/10 focus:border-white/40 transition-colors"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="title" className="text-[10px] uppercase tracking-widest text-white/40">Title</Label>
              <Input
                id="title"
                value={newPhoto.title}
                onChange={(e) => setNewPhoto({ ...newPhoto, title: e.target.value })}
                placeholder="Project Name"
                required
                className="bg-black/40 border-white/10 focus:border-white/40 transition-colors"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="category" className="text-[10px] uppercase tracking-widest text-white/40">Category</Label>
              <select
                id="category"
                className="w-full h-10 px-3 rounded-md border border-white/10 bg-black/40 text-sm focus:border-white/40 transition-colors outline-none"
                value={newPhoto.category}
                onChange={(e) =>
                  setNewPhoto({ ...newPhoto, category: e.target.value as 'film' | 'photography' })
                }
              >
                <option value="photography">Photography</option>
                <option value="film">Film</option>
              </select>
            </div>
            <div className="space-y-3">
              <Label htmlFor="order" className="text-[10px] uppercase tracking-widest text-white/40">Order</Label>
              <Input
                id="order"
                type="number"
                value={newPhoto.order}
                onChange={(e) => setNewPhoto({ ...newPhoto, order: parseInt(e.target.value, 10) })}
                required
                className="bg-black/40 border-white/10 focus:border-white/40 transition-colors"
              />
            </div>
            <Button type="submit" className="flex items-center gap-2 bg-white text-black hover:bg-white/80 transition-colors uppercase tracking-widest text-[10px] h-10">
              <Plus size={16} aria-hidden />
              Add Item
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm font-light uppercase tracking-[0.3em] text-white/60">Current Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingPhotos ? (
            <p className="p-6 text-sm text-white/40 uppercase tracking-widest text-center">Loading…</p>
          ) : (
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-transparent">
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
                    <TableCell className="capitalize text-xs text-white/40">{photo.category}</TableCell>
                    <TableCell className="font-mono text-xs text-white/40">{photo.order}</TableCell>
                    <TableCell className="text-right">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};
