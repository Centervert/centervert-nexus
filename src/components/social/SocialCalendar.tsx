import { SocialPost, buildMonthGrid, toDateKey, statusTextClass, platformLabel } from "@/lib/social";
import { Image as ImageIcon } from "lucide-react";

interface Props {
  year: number;
  month: number;
  posts: SocialPost[];
  onSelectDate: (dateKey: string) => void;
  onSelectPost: (post: SocialPost) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function SocialCalendar({ year, month, posts, onSelectDate, onSelectPost }: Props) {
  const days = buildMonthGrid(year, month);
  const todayKey = toDateKey(new Date());

  const byDate = posts.reduce<Record<string, SocialPost[]>>((acc, p) => {
    (acc[p.scheduled_date] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2 py-2 text-xs font-medium text-muted-foreground text-center">
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d[0]}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = toDateKey(day);
          const inMonth = day.getMonth() === month;
          const dayPosts = (byDate[key] ?? []).sort((a, b) =>
            (a.scheduled_time ?? "").localeCompare(b.scheduled_time ?? "")
          );
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(key)}
              className={`min-h-[104px] border-b border-r p-1.5 text-left align-top transition-colors hover:bg-muted/50 ${
                inMonth ? "" : "bg-muted/20 text-muted-foreground"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-medium ${
                    key === todayKey
                      ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      : ""
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>
              <div className="mt-1 space-y-1">
                {dayPosts.slice(0, 3).map((post) => (
                  <div
                    key={post.id}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPost(post);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.stopPropagation();
                        onSelectPost(post);
                      }
                    }}
                    className="w-full rounded border bg-background px-1.5 py-1 text-left hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      {post.media_urls?.length > 0 && (
                        <ImageIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate text-[11px] font-medium">{post.title}</span>
                    </div>
                    <div className={`truncate text-[10px] ${statusTextClass(post.status)}`}>
                      {post.scheduled_time ? `${post.scheduled_time.slice(0, 5)} · ` : ""}
                      {post.platforms.map(platformLabel).join(", ") || "No profile"}
                    </div>
                  </div>
                ))}
                {dayPosts.length > 3 && (
                  <div className="px-1 text-[10px] text-muted-foreground">+{dayPosts.length - 3} more</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
