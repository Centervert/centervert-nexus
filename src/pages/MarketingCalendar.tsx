import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import UnifiedLayout from "@/components/UnifiedLayout";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { SocialCalendar } from "@/components/social/SocialCalendar";
import { SocialPostSheet } from "@/components/social/SocialPostSheet";
import { SOCIAL_PLATFORMS, SocialPost, toDateKey } from "@/lib/social";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function MarketingCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activePost, setActivePost] = useState<SocialPost | null>(null);
  const [defaultDate, setDefaultDate] = useState(toDateKey(today));

  const { data: userRole } = useUserRole();
  const canEdit = !!(userRole?.isAdmin || userRole?.isAgent || userRole?.isSalesAgent);

  const rangeStart = toDateKey(new Date(year, month - 1, 1));
  const rangeEnd = toDateKey(new Date(year, month + 2, 0));

  const { data: posts = [], refetch } = useQuery({
    queryKey: ["social-posts", rangeStart, rangeEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_posts")
        .select("*")
        .gte("scheduled_date", rangeStart)
        .lte("scheduled_date", rangeEnd)
        .order("scheduled_date");
      if (error) throw error;
      return (data ?? []) as SocialPost[];
    },
  });

  const filtered = useMemo(
    () => (platformFilter === "all" ? posts : posts.filter((p) => p.platforms?.includes(platformFilter))),
    [posts, platformFilter]
  );

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const openNew = (dateKey: string) => {
    if (!canEdit) return;
    setActivePost(null);
    setDefaultDate(dateKey);
    setSheetOpen(true);
  };

  const openPost = (post: SocialPost) => {
    setActivePost(post);
    setDefaultDate(post.scheduled_date);
    setSheetOpen(true);
  };

  const monthPosts = filtered.filter((p) => {
    const [y, m] = p.scheduled_date.split("-").map(Number);
    return y === year && m === month + 1;
  });

  return (
    <UnifiedLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Marketing Calendar</h1>
            <p className="text-muted-foreground">
              Plan social posts — copy, media and the profiles they go out on.
            </p>
          </div>
          {canEdit && (
            <Button onClick={() => openNew(toDateKey(new Date()))}>
              <Plus className="h-4 w-4 mr-2" />
              New post
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[170px] text-center text-lg font-semibold">
              {MONTHS[month]} {year}
            </div>
            <Button variant="outline" size="icon" onClick={() => shiftMonth(1)} aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setYear(today.getFullYear());
                setMonth(today.getMonth());
              }}
            >
              Today
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {monthPosts.length} post{monthPosts.length === 1 ? "" : "s"}
            </span>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All profiles</SelectItem>
                {SOCIAL_PLATFORMS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <SocialCalendar
          year={year}
          month={month}
          posts={filtered}
          onSelectDate={openNew}
          onSelectPost={openPost}
        />
      </div>

      <SocialPostSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        post={activePost}
        defaultDate={defaultDate}
        canEdit={canEdit}
        onSaved={refetch}
      />
    </UnifiedLayout>
  );
}
