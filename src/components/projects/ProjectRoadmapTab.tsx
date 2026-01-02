import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Calendar, Layers } from "lucide-react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, differenceInDays, eachDayOfInterval, eachWeekOfInterval, startOfWeek, parseISO, addDays } from "date-fns";

interface Feature {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string | null;
  target_date: string | null;
  created_at: string | null;
}

interface ProjectRoadmapTabProps {
  projectId: string;
  projectStartDate?: string | null;
  projectEndDate?: string | null;
}

export function ProjectRoadmapTab({ projectId, projectStartDate, projectEndDate }: ProjectRoadmapTabProps) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewStartDate, setViewStartDate] = useState(() => {
    if (projectStartDate) {
      return startOfMonth(parseISO(projectStartDate));
    }
    return startOfMonth(new Date());
  });

  const monthsToShow = 4;
  const dayWidth = 28; // pixels per day

  useEffect(() => {
    loadFeatures();
  }, [projectId]);

  const loadFeatures = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("project_features")
      .select("*")
      .eq("project_id", projectId)
      .order("position", { ascending: true });

    if (!error) {
      setFeatures(data || []);
    }
    setLoading(false);
  };

  const timelineData = useMemo(() => {
    const viewEndDate = endOfMonth(addMonths(viewStartDate, monthsToShow - 1));
    const totalDays = differenceInDays(viewEndDate, viewStartDate) + 1;

    // Generate month data
    const months: { date: Date; label: string; days: number; startDay: number }[] = [];
    let dayCounter = 0;
    for (let i = 0; i < monthsToShow; i++) {
      const monthDate = addMonths(viewStartDate, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
      months.push({
        date: monthDate,
        label: format(monthDate, "MMMM yyyy"),
        days: daysInMonth,
        startDay: dayCounter
      });
      dayCounter += daysInMonth;
    }

    // Generate weeks for grid
    const weeks = eachWeekOfInterval({ start: viewStartDate, end: viewEndDate }, { weekStartsOn: 1 });

    // Calculate feature bars
    const featureBars = features.map(feature => {
      const featureStart = feature.created_at ? parseISO(feature.created_at) : viewStartDate;
      const featureEnd = feature.target_date ? parseISO(feature.target_date) : addDays(featureStart, 14);

      // Clamp to visible range
      const clampedStart = featureStart < viewStartDate ? viewStartDate : featureStart;
      const clampedEnd = featureEnd > viewEndDate ? viewEndDate : featureEnd;

      const isVisible = clampedStart <= viewEndDate && clampedEnd >= viewStartDate;

      const startDay = Math.max(0, differenceInDays(clampedStart, viewStartDate));
      const endDay = Math.min(totalDays, differenceInDays(clampedEnd, viewStartDate) + 1);
      const duration = endDay - startDay;

      return {
        ...feature,
        startDay,
        duration,
        isVisible,
        extendsLeft: featureStart < viewStartDate,
        extendsRight: featureEnd > viewEndDate
      };
    });

    // Today position
    const today = new Date();
    const todayPosition = differenceInDays(today, viewStartDate);
    const showToday = todayPosition >= 0 && todayPosition <= totalDays;

    return { months, weeks, totalDays, featureBars, viewEndDate, todayPosition, showToday };
  }, [features, viewStartDate, monthsToShow]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-500";
      case "in_progress": return "bg-blue-500";
      case "planned": return "bg-slate-400";
      case "blocked": return "bg-red-500";
      default: return "bg-slate-400";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">Completed</Badge>;
      case "in_progress": return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs">In Progress</Badge>;
      case "planned": return <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/20 text-xs">Planned</Badge>;
      case "blocked": return <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-xs">Blocked</Badge>;
      default: return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "critical": return "ring-2 ring-red-400";
      case "high": return "ring-2 ring-orange-400";
      default: return "";
    }
  };

  const navigatePrevious = () => setViewStartDate(prev => subMonths(prev, 1));
  const navigateNext = () => setViewStartDate(prev => addMonths(prev, 1));
  const navigateToday = () => setViewStartDate(startOfMonth(new Date()));

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  const visibleFeatures = timelineData.featureBars.filter(f => f.isVisible);
  const totalWidth = timelineData.totalDays * dayWidth;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Roadmap</h2>
          <Badge variant="outline" className="ml-2">
            {features.length} features
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={navigateToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={navigatePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[180px] text-center">
            {format(viewStartDate, "MMM yyyy")} – {format(timelineData.viewEndDate, "MMM yyyy")}
          </span>
          <Button variant="outline" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span className="text-muted-foreground">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-blue-500" />
          <span className="text-muted-foreground">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-slate-400" />
          <span className="text-muted-foreground">Planned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-red-500" />
          <span className="text-muted-foreground">Blocked</span>
        </div>
      </div>

      {/* Gantt Chart */}
      <Card className="overflow-hidden">
        <div className="flex">
          {/* Fixed Feature Names Column */}
          <div className="flex-shrink-0 w-64 border-r bg-muted/30">
            {/* Header */}
            <div className="h-14 border-b bg-muted/50 flex items-center px-4">
              <span className="font-medium text-sm">Feature</span>
            </div>
            {/* Feature rows */}
            <div>
              {visibleFeatures.length === 0 ? (
                <div className="h-20 flex items-center justify-center text-muted-foreground text-sm">
                  No features to display
                </div>
              ) : (
                visibleFeatures.map((feature, idx) => (
                  <div 
                    key={feature.id}
                    className={`h-12 flex items-center px-4 border-b ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm font-medium truncate cursor-default">
                            {feature.name}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p className="font-medium">{feature.name}</p>
                          {feature.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{feature.description}</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Scrollable Timeline */}
          <ScrollArea className="flex-1">
            <div style={{ width: totalWidth, minWidth: '100%' }}>
              {/* Month Headers */}
              <div className="h-8 flex border-b bg-muted/50">
                {timelineData.months.map((month, idx) => (
                  <div
                    key={idx}
                    className="border-r last:border-r-0 flex items-center justify-center text-sm font-medium"
                    style={{ width: month.days * dayWidth }}
                  >
                    {month.label}
                  </div>
                ))}
              </div>

              {/* Week Headers */}
              <div className="h-6 flex border-b">
                {timelineData.weeks.map((week, idx) => {
                  const weekStart = week;
                  const weekEnd = addDays(week, 6);
                  const weekLabel = format(weekStart, "MMM d");
                  return (
                    <div
                      key={idx}
                      className="border-r last:border-r-0 flex items-center justify-center text-xs text-muted-foreground bg-muted/30"
                      style={{ width: 7 * dayWidth }}
                    >
                      {weekLabel}
                    </div>
                  );
                })}
              </div>

              {/* Timeline Grid with Bars */}
              <div className="relative">
                {/* Grid background */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {timelineData.months.map((month, idx) => (
                    <div
                      key={idx}
                      className="border-r last:border-r-0 border-dashed"
                      style={{ width: month.days * dayWidth }}
                    />
                  ))}
                </div>

                {/* Today line */}
                {timelineData.showToday && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-primary z-20"
                    style={{ left: timelineData.todayPosition * dayWidth }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded font-medium">
                      Today
                    </div>
                  </div>
                )}

                {/* Feature Bars */}
                {visibleFeatures.length === 0 ? (
                  <div className="h-20 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Layers className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No features in this time range</p>
                    </div>
                  </div>
                ) : (
                  visibleFeatures.map((feature, idx) => (
                    <div 
                      key={feature.id}
                      className={`h-12 relative border-b ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`absolute top-2 h-8 rounded-md cursor-pointer transition-all hover:brightness-110 hover:shadow-lg ${getStatusColor(feature.status)} ${getPriorityColor(feature.priority)}`}
                              style={{
                                left: feature.startDay * dayWidth,
                                width: Math.max(feature.duration * dayWidth, 24),
                                borderTopLeftRadius: feature.extendsLeft ? 0 : undefined,
                                borderBottomLeftRadius: feature.extendsLeft ? 0 : undefined,
                                borderTopRightRadius: feature.extendsRight ? 0 : undefined,
                                borderBottomRightRadius: feature.extendsRight ? 0 : undefined,
                              }}
                            >
                              <div className="h-full flex items-center px-2 overflow-hidden">
                                <span className="text-white text-xs font-medium truncate drop-shadow-sm">
                                  {feature.target_date && format(parseISO(feature.target_date), "MMM d")}
                                </span>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="space-y-2">
                              <p className="font-semibold">{feature.name}</p>
                              {feature.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">{feature.description}</p>
                              )}
                              <div className="flex items-center gap-2">
                                {getStatusBadge(feature.status)}
                                {feature.priority && (
                                  <Badge variant="outline" className="text-xs capitalize">{feature.priority}</Badge>
                                )}
                              </div>
                              {feature.target_date && (
                                <p className="text-xs">
                                  <span className="text-muted-foreground">Target:</span>{" "}
                                  {format(parseISO(feature.target_date), "MMMM d, yyyy")}
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ))
                )}
              </div>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-emerald-600">
              {features.filter(f => f.status === "completed").length}
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">
              {features.filter(f => f.status === "in_progress").length}
            </div>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-slate-600">
              {features.filter(f => f.status === "planned").length}
            </div>
            <p className="text-xs text-muted-foreground">Planned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">
              {features.filter(f => f.status === "blocked").length}
            </div>
            <p className="text-xs text-muted-foreground">Blocked</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
