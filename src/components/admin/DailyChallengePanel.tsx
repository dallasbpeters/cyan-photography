import React, { useCallback, useEffect, useState } from 'react';
import type { DailyChallengeInfo, DailyChallengeJournal } from '../../types';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Sparkles, Bell, BellOff, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { portfolioService } from '../../services/portfolioService';
import { cn } from '@/lib/utils';

const LS_NOTIFY = 'cyan_daily_challenge_notify';
const LS_LAST_NOTIFIED = 'cyan_daily_challenge_last_notify_date';

const canUseNotifications = (): boolean =>
  typeof window !== 'undefined' && 'Notification' in window && window.isSecureContext;

const maybeFireDailyNotification = (challenge: DailyChallengeInfo): void => {
  if (!canUseNotifications()) return;
  try {
    if (localStorage.getItem(LS_NOTIFY) !== '1') return;
    if (Notification.permission !== 'granted') return;
    const dateKey = challenge.challengeDate;
    const last = localStorage.getItem(LS_LAST_NOTIFIED);
    if (last === dateKey) return;
    new Notification("Today's photo challenge", {
      body: "Open Cyan Admin to see today's inspiration and jot your thoughts.",
      icon: '/icon512_rounded.png',
      tag: `cyan-challenge-${dateKey}`,
    });
    localStorage.setItem(LS_LAST_NOTIFIED, dateKey);
  } catch {
    /* ignore */
  }
};

export const DailyChallengePanel = () => {
  const [challenge, setChallenge] = useState<DailyChallengeInfo | null>(null);
  const [journal, setJournal] = useState<DailyChallengeJournal | null>(null);
  const [thoughts, setThoughts] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifyEnabled, setNotifyEnabled] = useState(() => {
    try {
      return localStorage.getItem(LS_NOTIFY) === '1';
    } catch {
      return false;
    }
  });
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>(() =>
    canUseNotifications() ? Notification.permission : 'unsupported',
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await portfolioService.getDailyChallenge();
      setChallenge(data.challenge);
      const j = data.journal;
      setJournal(j);
      setThoughts(j?.body ?? '');
      maybeFireDailyNotification(data.challenge);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load daily challenge');
      setChallenge(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!canUseNotifications()) return;
    const onVis = () => {
      if (document.visibilityState === 'visible' && challenge) {
        maybeFireDailyNotification(challenge);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [challenge]);

  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await portfolioService.saveDailyChallengeJournal(thoughts);
      setJournal(saved);
      toast.success('Journal saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotify = async () => {
    if (!canUseNotifications()) {
      toast.message('Notifications need HTTPS (or localhost) and a supported browser.');
      return;
    }
    if (notifyEnabled) {
      try {
        localStorage.removeItem(LS_NOTIFY);
      } catch {
        /* ignore */
      }
      setNotifyEnabled(false);
      toast.message('Daily reminders off');
      return;
    }
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p !== 'granted') {
      toast.error('Notification permission denied');
      return;
    }
    try {
      localStorage.setItem(LS_NOTIFY, '1');
    } catch {
      /* ignore */
    }
    setNotifyEnabled(true);
    toast.success('You’ll get a browser notification when a new day’s challenge loads (when you open Admin).');
    if (challenge) {
      maybeFireDailyNotification(challenge);
    }
  };

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="flex flex-col gap-3 border-b border-white/5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-sm font-light uppercase tracking-[0.3em] text-white/60">
            <Sparkles className="size-4 text-amber-200/80" aria-hidden />
            Daily challenge
          </CardTitle>
          <p className="text-[10px] uppercase tracking-widest text-white/35">
            Inspiration from Unsplash (UTC day). Your notes are private to your account.
          </p>
        </div>
        {canUseNotifications() && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleToggleNotify()}
            className="shrink-0 gap-2 border-white/20 text-[10px] uppercase tracking-widest text-white/80 hover:bg-white/10"
            aria-pressed={notifyEnabled}
          >
            {notifyEnabled ? <BellOff size={14} aria-hidden /> : <Bell size={14} aria-hidden />}
            {notifyEnabled ? 'Turn off alerts' : 'Notify me'}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        {loading && (
          <p className="text-center text-[10px] uppercase tracking-widest text-white/40">Loading…</p>
        )}
        {!loading && !challenge && (
          <p className="text-sm text-white/50">Could not load today’s challenge.</p>
        )}
        {!loading && challenge && (
          <>
            <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
              <div className="space-y-2">
                <a
                  href={challenge.unsplashHtmlLink ?? '#'}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group block overflow-hidden rounded-lg border border-white/10 bg-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  aria-label="Open photo on Unsplash"
                >
                  <img
                    src={challenge.imageUrl}
                    alt={challenge.altText || 'Daily challenge photo'}
                    className="aspect-4/3 w-full object-cover transition-opacity group-hover:opacity-95"
                    referrerPolicy="no-referrer"
                  />
                </a>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-white/45">
                  <span>
                    Photo by{' '}
                    {challenge.photographerUsername ? (
                      <a
                        href={`https://unsplash.com/@${challenge.photographerUsername}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-white/70 underline-offset-2 hover:text-white hover:underline"
                      >
                        {challenge.photographerName ?? challenge.photographerUsername}
                      </a>
                    ) : (
                      (challenge.photographerName ?? 'Unknown')
                    )}{' '}
                    on Unsplash
                  </span>
                  {challenge.unsplashHtmlLink && (
                    <a
                      href={challenge.unsplashHtmlLink}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-0.5 text-white/55 hover:text-white"
                    >
                      <ExternalLink size={12} aria-hidden />
                      View on Unsplash
                    </a>
                  )}
                </div>
              </div>
              <form onSubmit={(e) => void handleSaveJournal(e)} className="flex flex-col gap-3">
                <div className="space-y-2">
                  <Label htmlFor="challenge-journal" className="text-[10px] uppercase tracking-widest text-white/40">
                    Your thoughts
                  </Label>
                  <textarea
                    id="challenge-journal"
                    value={thoughts}
                    onChange={(e) => setThoughts(e.target.value)}
                    rows={8}
                    maxLength={20000}
                    placeholder="Lighting, composition, story, what you’d try in your own work…"
                    className={cn(
                      'w-full resize-y rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white',
                      'placeholder:text-white/30 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/15',
                    )}
                  />
                  <p className="text-[9px] text-white/30">
                    {thoughts.length.toLocaleString()} / 20,000
                    {journal?.updatedAt && (
                      <span className="ml-2 text-white/25">
                        · Saved {new Date(journal.updatedAt).toLocaleString()}
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={saving}
                  variant="outline"
                  className="w-full min-h-11 border-white/25 text-[10px] uppercase tracking-widest text-white hover:bg-white/10 sm:w-auto"
                >
                  {saving ? 'Saving…' : 'Save journal'}
                </Button>
              </form>
            </div>
            {perm === 'denied' && (
              <p className="text-[10px] text-amber-200/70">
                Notifications are blocked for this site. Enable them in browser settings if you want alerts.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
