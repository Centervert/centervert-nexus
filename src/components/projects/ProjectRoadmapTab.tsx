import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Calendar, Layers } from "lucide-react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, differenceInDays, isWithinInterval, parseISO, min, max } from "date-fns";

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

  // Show 3 months at a time
  const monthsToShow = 3;

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

  // Calculate the timeline range
  const timelineData = useMemo(() => {
    const viewEndDate = endOfMonth(addMonths(viewStartDate, monthsToShow - 1));
    const totalDays = differenceInDays(viewEndDate, viewStartDate) + 1;

    // Generate month labels
    const months: { date: Date; label: string; days: number }[] = [];
    for (let i = 0; i < monthsToShow; i++) {
      const monthDate = addMonths(viewStartDate, i);
      const monthEnd = endOfMonth(monthDate);
      const monthStart = startOfMonth(monthDate);
      months.push({
        date: monthDate,
        label: format(monthDate, "MMM yyyy"),
        days: differenceInDays(monthEnd, monthStart) + 1
      });
    }

    // Calculate feature bars
    const featureBars = features.map(feature => {
      // Use created_at as start if no explicit start, target_date as end
      const featureStart = feature.created_at ? parseISO(feature.created_at) : viewStartDate;
      const featureEnd = feature.target_date ? parseISO(feature.target_date) : addMonths(featureStart, 1);

      // Calculate position within the visible range
      const visibleStart = max([featureStart, viewStartDate]);
      const visibleEnd = min([featureEnd, viewEndDate]);

      const isVisible = isWithinInterval(visibleStart, { start: viewStartDate, end: viewEndDate }) ||
                        isWithinInterval(visibleEnd, { start: viewStartDate, end: viewEndDate }) ||
                        (featureStart <= viewStartDate && featureEnd >= viewEndDate);

      if (!isVisible) {
        return { ...feature, left: 0, width: 0, isVisible: false };
      }

      const startOffset = Math.max(0, differenceInDays(visibleStart, viewStartDate));
      const endOffset = Math.min(totalDays, differenceInDays(visibleEnd, viewStartDate) + 1);

      const left = (startOffset / totalDays) * 100;
      const width = ((endOffset - startOffset) / totalDays) * 100;

      return {
        ...feature,
        left,
        width,
        isVisible: true,
        startsBeforeView: featureStart < viewStartDate,
        endsAfterView: featureEnd > viewEndDate
      };
    });

    return { months, totalDays, featureBars, viewEndDate };
  }, [features, viewStartDate, monthsToShow]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "in_progress": return "bg-blue-500";
      case "planned": return "bg-slate-400";
      case "blocked": return "bg-red-500";
      default: return "bg-slate-400";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Completed</Badge>;
      case "in_progress": return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">In Progress</Badge>;
      case "planned": return <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/20">Planned</Badge>;
      case "blocked": return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Blocked</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityIndicator = (priority: string | null) => {
    switch (priority) {
      case "critical": return "border-l-4 border-l-red-500";
      case "high": return "border-l-4 border-l-orange-500";
      case "medium": return "border-l-4 border-l-yellow-500";
      case "low": return "border-l-4 border-l-green-500";
      default: return "";
    }
  };

  const navigatePrevious = () => {
    setViewStartDate(prev => subMonths(prev, 1));
  };

  const navigateNext = () => {
    setViewStartDate(prev => addMonths(prev, 1));
  };

  const navigateToday = () => {
    setViewStartDate(startOfMonth(new Date()));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  const visibleFeatures = timelineData.featureBars.filter(f => f.isVisible);
  const hiddenFeatures = timelineData.featureBars.filter(f => !f.isVisible);

  return (
    <div className="space-y-6">
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
          <span className="text-sm font-medium min-w-[140px] text-center">
            {format(viewStartDate, "MMM yyyy")} - {format(timelineData.viewEndDate, "MMM yyyy")}
          </span>
          <Button variant="outline" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-muted-foreground">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-muted-foreground">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-slate-400" />
          <span className="text-muted-foreground">Planned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-muted-foreground">Blocked</span>
        </div>
      </div>

      {/* Timeline */}
      <Card>
        <CardContent className="p-0">
          {/* Month Headers */}
          <div className="flex border-b">
            {timelineData.months.map((month, idx) => (
              <div 
                key={idx} 
                className="flex-1 px-4 py-2 text-sm font-medium text-center border-r last:border-r-0 bg-muted/50"
              >
                {month.label}
              </div>
            ))}
          </div>

          {/* Features Timeline */}
          <div className="relative min-h-[300px]">
            {/* Grid lines for months */}
            <div className="absolute inset-0 flex pointer-events-none">
              {timelineData.months.map((_, idx) => (
                <div 
                  key={idx} 
                  className="flex-1 border-r last:border-r-0 border-dashed border-muted-foreground/20"
                />
              ))}
            </div>

            {/* Today marker */}
            {(() => {
              const today = new Date();
              const totalDays = timelineData.totalDays;
              const daysFromStart = differenceInDays(today, viewStartDate);
              if (daysFromStart >= 0 && daysFromStart <= totalDays) {
                const position = (daysFromStart / totalDays) * 100;
                return (
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                    style={{ left: `${position}%` }}
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded">
                      Today
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Feature bars */}
            <div className="relative p-4 space-y-2">
              {visibleFeatures.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No features in this time range</p>
                  <p className="text-sm">Navigate to a different time period or add target dates to features</p>
                </div>
              ) : (
                visibleFeatures.map((feature, index) => (
                  <TooltipProvider key={feature.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className="relative h-10 group cursor-pointer"
                          style={{ marginBottom: "4px" }}
                        >
                          {/* Feature name label */}
                          <div className="absolute left-0 top-0 h-full flex items-center text-sm font-medium truncate max-w-[200px] pr-2 z-10">
                            {feature.name}
                          </div>
                          
                          {/* Bar */}
                          <div
                            className={`absolute h-8 top-1 rounded-md transition-all group-hover:shadow-md ${getStatusColor(feature.status)} ${getPriorityIndicator(feature.priority)}`}
                            style={{
                              left: `calc(210px + ${feature.left}% * (100% - 210px) / 100)`,
                              width: `calc(${feature.width}% * (100% - 210px) / 100)`,
                              minWidth: "8px"
                            }}
                          >
                            {/* Bar content */}
                            <div className="h-full flex items-center px-2 text-white text-xs truncate opacity-90">
                              {feature.target_date && format(parseISO(feature.target_date), "MMM d")}
                            </div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[300px]">
                        <div className="space-y-1">
                          <p className="font-medium">{feature.name}</p>
                          {feature.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{feature.description}</p>
                          )}
                          <div className="flex items-center gap-2 pt-1">
                            {getStatusBadge(feature.status)}
                            {feature.priority && (
                              <Badge variant="outline" className="text-xs capitalize">{feature.priority}</Badge>
                            )}
                          </div>
                          {feature.target_date && (
                            <p className="text-xs text-muted-foreground">
                              Target: {format(parseISO(feature.target_date), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features outside visible range */}
      {hiddenFeatures.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Features outside this time range ({hiddenFeatures.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {hiddenFeatures.map(feature => (
                <Badge key={feature.id} variant="outline" className="text-xs">
                  {feature.name}
                  {feature.target_date && ` • ${format(parseISO(feature.target_date), "MMM yyyy")}`}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
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
