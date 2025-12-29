import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Target, 
  AlertTriangle, 
  FileText, 
  Clock, 
  Users
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  status: string;
  health: string | null;
  phase_target: string | null;
}

interface TeamMember {
  id: string;
  role: string;
  user_id: string;
  full_name: string | null;
  email: string;
}

interface Feature {
  id: string;
  name: string;
  status: string;
  priority: string | null;
}

interface Risk {
  id: string;
  title: string;
  severity: string;
  status: string;
}

interface Decision {
  id: string;
  title: string;
  status: string;
  decision_date: string | null;
}

interface Deliberation {
  id: string;
  title: string;
  status: string;
}

interface ProjectOverviewTabProps {
  project: Project;
  teamMembers: TeamMember[];
  onRefresh: () => void;
}

export function ProjectOverviewTab({ project, teamMembers, onRefresh }: ProjectOverviewTabProps) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [deliberations, setDeliberations] = useState<Deliberation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadFeatures(),
        loadRisks(),
        loadDecisions(),
        loadDeliberations()
      ]);
      setLoading(false);
    };
    loadData();
  }, [project.id]);

  const loadFeatures = async () => {
    const { data } = await supabase
      .from("project_features")
      .select("id, name, status, priority")
      .eq("project_id", project.id)
      .order("position", { ascending: true });
    setFeatures(data || []);
  };

  const loadRisks = async () => {
    const { data } = await supabase
      .from("project_risks")
      .select("id, title, severity, status")
      .eq("project_id", project.id)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(5);
    setRisks(data || []);
  };

  const loadDecisions = async () => {
    const { data } = await supabase
      .from("project_decisions")
      .select("id, title, status, decision_date")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .limit(5);
    setDecisions(data || []);
  };

  const loadDeliberations = async () => {
    const { data } = await supabase
      .from("project_deliberations")
      .select("id, title, status")
      .eq("project_id", project.id)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(5);
    setDeliberations(data || []);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
      case "on_track":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">On Track</Badge>;
      case "at_risk":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">At Risk</Badge>;
      case "off_track":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Off Track</Badge>;
      case "completed":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const liveFeatures = features.filter(f => f.status === "completed" || f.status === "in_progress");
  const upcomingFeatures = features.filter(f => f.status === "planned" || f.status === "backlog");
  const openRisks = risks.filter(r => r.status === "open");
  const recentDecisions = decisions.filter(d => d.status === "approved" || d.status === "decided");
  const openDeliberations = deliberations.filter(d => d.status === "open");

  return (
    <div className="space-y-6">
      {/* Status Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Project Status</p>
                <div className="mt-2">
                  {getStatusBadge(project.health || project.status)}
                </div>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Phase Target</p>
                <p className="text-lg font-semibold mt-1">
                  {project.phase_target || "Not set"}
                </p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              What's Live Now
            </CardTitle>
          </CardHeader>
          <CardContent>
            {liveFeatures.length === 0 ? (
              <p className="text-sm text-muted-foreground">No features live yet</p>
            ) : (
              <ul className="space-y-2">
                {liveFeatures.slice(0, 5).map((feature) => (
                  <li key={feature.id} className="text-sm flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    {feature.name}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Next 2 Weeks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingFeatures.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming features planned</p>
            ) : (
              <ul className="space-y-2">
                {upcomingFeatures.slice(0, 4).map((feature) => (
                  <li key={feature.id} className="text-sm flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    {feature.name}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Risks & Decisions Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Top Risks ({openRisks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {openRisks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open risks</p>
            ) : (
              <ul className="space-y-2">
                {openRisks.map((risk) => (
                  <li key={risk.id} className="text-sm flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">•</span>
                    {risk.title}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Recent Decisions ({recentDecisions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentDecisions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent decisions</p>
            ) : (
              <ul className="space-y-2">
                {recentDecisions.map((decision) => (
                  <li key={decision.id} className="text-sm flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    {decision.title}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Deliberations & Stakeholders Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Open Deliberations ({openDeliberations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {openDeliberations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open deliberations</p>
            ) : (
              <ul className="space-y-2">
                {openDeliberations.map((deliberation) => (
                  <li key={deliberation.id} className="text-sm flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    {deliberation.title}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Key Stakeholders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No team members assigned</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {teamMembers.slice(0, 6).map((member) => (
                  <div key={member.id} className="text-sm">
                    <span className="font-medium">{member.full_name || member.email.split('@')[0]}</span>
                    <span className="text-muted-foreground"> – {member.role}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
