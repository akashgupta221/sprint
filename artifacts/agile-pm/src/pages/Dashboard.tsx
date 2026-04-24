import { Link } from "wouter";
import { 
  useGetDashboardSummary, 
  useGetRecentActivity,
  useListProjects
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FolderKanban, Users, LayoutList, CheckSquare, Activity, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: activity, isLoading: isActivityLoading } = useGetRecentActivity();
  const { data: projects, isLoading: isProjectsLoading } = useListProjects();

  if (isSummaryLoading || isActivityLoading || isProjectsLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading dashboard...</div>;
  }

  if (!summary) return null;

  const tasksData = [
    { name: 'To Do', value: summary.tasksByStatus.todo, color: 'hsl(var(--muted-foreground))' },
    { name: 'In Progress', value: summary.tasksByStatus.in_progress, color: 'hsl(var(--primary))' },
    { name: 'Blocked', value: summary.tasksByStatus.blocked, color: 'hsl(var(--destructive))' },
    { name: 'Done', value: summary.tasksByStatus.done, color: 'hsl(var(--chart-3))' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your team's sprint.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-chart-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.projectCount}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-chart-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stories</CardTitle>
            <LayoutList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.storyCount}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-chart-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.taskCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.tasksByStatus.done} completed
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Notifications</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary.notificationsFailed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.notificationsPending} pending
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Task Status</CardTitle>
            <CardDescription>Breakdown of all tasks by current status</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tasksData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {tasksData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates across your workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activity?.slice(0, 6).map((event) => (
                <div key={event.id} className="flex items-start gap-4">
                  <div className="mt-1 bg-muted p-1.5 rounded-full">
                    <Activity className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{event.message}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(event.createdAt), 'MMM d, h:mm a')}</p>
                  </div>
                </div>
              ))}
              {(!activity || activity.length === 0) && (
                <div className="text-sm text-muted-foreground py-4 text-center">No recent activity</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects?.map(project => (
              <Link key={project.id} href={`/projects/${project.id}`} className="block group">
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:border-primary transition-colors">
                  <div>
                    <h3 className="font-semibold text-primary group-hover:underline">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">{project.description || "No description"}</p>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex flex-col items-end">
                      <span className="font-medium text-foreground">{project.storyCount}</span>
                      <span>Stories</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-medium text-foreground">{project.taskCount}</span>
                      <span>Tasks</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {(!projects || projects.length === 0) && (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                No projects yet. Get started by creating one.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
