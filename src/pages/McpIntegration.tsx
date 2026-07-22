import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import UnifiedLayout from '@/components/UnifiedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, ArrowLeft, ShieldAlert, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID as string;
const MCP_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/mcp`;
const AGENT_GUIDE_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/agent-guide?key=YOUR_MCP_ADMIN_KEY`;

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

const claudeConfig = `{
  "mcpServers": {
    "centervert": {
      "url": "${MCP_URL}",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_ADMIN_KEY"
      }
    }
  }
}`;

const curlExample = `curl -X POST '${MCP_URL}' \\
  -H 'Authorization: Bearer YOUR_MCP_ADMIN_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`;

export default function McpIntegration() {
  const navigate = useNavigate();

  const { data: logs, refetch, isFetching } = useQuery({
    queryKey: ['mcp_audit_log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mcp_audit_log' as never)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Array<{
        id: string;
        tool_name: string;
        success: boolean;
        error_message: string | null;
        actor_label: string | null;
        created_at: string;
        output_summary: string | null;
      }>;
    },
  });

  return (
    <UnifiedLayout>
      <div className="p-4 md:p-6 max-w-5xl space-y-6">
        <div>
          <Button variant="ghost" size="sm" className="mb-3 -ml-2" onClick={() => navigate('/settings')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Settings
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">MCP Integration</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect any MCP-compatible AI agent to read and modify your portal data.
          </p>
        </div>

            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Admin-level access</AlertTitle>
              <AlertDescription>
                Anyone with the MCP admin key has full read/write access to all portal data including
                HR and billing. Store the key securely and rotate it if exposed.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Endpoint</CardTitle>
                <CardDescription>Point your agent's MCP client at this URL.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-muted px-3 py-2 text-sm">{MCP_URL}</code>
                  <CopyButton value={MCP_URL} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agent operating guide (hidden)</CardTitle>
                <CardDescription>
                  A confidential HTML briefing that describes every tool, conventions, and safety
                  rules. Give this URL to your agent as its onboarding document — the page is served
                  only when the correct admin key is presented (bad keys return 404, not 401, so the
                  URL can't be fingerprinted). It's excluded from search engines and never cached.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-muted px-3 py-2 text-xs break-all">
                    {AGENT_GUIDE_URL}
                  </code>
                  <CopyButton value={AGENT_GUIDE_URL} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Replace <code>YOUR_MCP_ADMIN_KEY</code> with the same key your agent uses for MCP.
                  Treat the full URL as a secret — anyone who has it can read the guide.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuration examples</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="claude">
                  <TabsList>
                    <TabsTrigger value="claude">Claude / Cursor</TabsTrigger>
                    <TabsTrigger value="curl">curl test</TabsTrigger>
                  </TabsList>
                  <TabsContent value="claude">
                    <div className="flex items-start gap-2">
                      <pre className="flex-1 overflow-x-auto rounded bg-muted p-3 text-xs">
                        {claudeConfig}
                      </pre>
                      <CopyButton value={claudeConfig} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Replace <code>YOUR_MCP_ADMIN_KEY</code> with the key you set in Cloud secrets.
                    </p>
                  </TabsContent>
                  <TabsContent value="curl">
                    <div className="flex items-start gap-2">
                      <pre className="flex-1 overflow-x-auto rounded bg-muted p-3 text-xs">
                        {curlExample}
                      </pre>
                      <CopyButton value={curlExample} />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent activity</CardTitle>
                  <CardDescription>Last 50 tool calls by external agents.</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {!logs || logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No agent activity yet.</p>
                ) : (
                  <div className="divide-y">
                    {logs.map((log) => (
                      <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-medium">{log.tool_name}</code>
                            <Badge variant={log.success ? 'secondary' : 'destructive'}>
                              {log.success ? 'ok' : 'error'}
                            </Badge>
                            {log.actor_label && (
                              <span className="text-xs text-muted-foreground">
                                by {log.actor_label}
                              </span>
                            )}
                          </div>
                          {log.error_message && (
                            <p className="text-xs text-destructive mt-1 truncate">
                              {log.error_message}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rotate key</CardTitle>
                <CardDescription>
                  To rotate the admin key, update the <code>MCP_ADMIN_KEY</code> secret in your
                  Cloud backend settings, then update your agent config with the new value.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: 'Open Backend',
                      description: 'Use View Backend → Edge Functions → Secrets to update MCP_ADMIN_KEY.',
                    });
                  }}
                >
                  How to rotate
                </Button>
              </CardContent>
            </Card>
      </div>
    </UnifiedLayout>
  );
}