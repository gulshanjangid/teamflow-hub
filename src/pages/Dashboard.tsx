import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, ListChecks, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { format, isPast } from "date-fns";

type Stat = { totalProjects: number; totalTasks: number; completed: number; pending: number; overdue: number };
type MyTask = { id: string; title: string; status: string; priority: string; due_date: string | null; project_id: string; projects: { name: string } | null };

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stat>({ totalProjects: 0, totalTasks: 0, completed: 0, pending: 0, overdue: 0 });
  const [myTasks, setMyTasks] = useState<MyTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const [{ data: projects }, { data: tasks }, { data: assigned }] = await Promise.all([
        supabase.from("projects").select("id"),
        supabase.from("tasks").select("id,status,due_date"),
        supabase.from("tasks").select("id,title,status,priority,due_date,project_id, projects(name)").eq("assigned_to", user.id).order("due_date", { ascending: true, nullsFirst: false }).limit(8),
      ]);
      const t = tasks ?? [];
      setStats({
        totalProjects: projects?.length ?? 0,
        totalTasks: t.length,
        completed: t.filter((x) => x.status === "done").length,
        pending: t.filter((x) => x.status !== "done").length,
        overdue: t.filter((x) => x.status !== "done" && x.due_date && isPast(new Date(x.due_date))).length,
      });
      setMyTasks((assigned as any[]) ?? []);
      setLoading(false);
    };
    load();
  }, [user]);

  const cards = [
    { label: "Projects", value: stats.totalProjects, icon: FolderKanban, tone: "text-primary" },
    { label: "Total tasks", value: stats.totalTasks, icon: ListChecks, tone: "text-foreground" },
    { label: "Completed", value: stats.completed, icon: CheckCircle2, tone: "text-success" },
    { label: "Pending", value: stats.pending, icon: Clock, tone: "text-warning" },
    { label: "Overdue", value: stats.overdue, icon: AlertTriangle, tone: "text-destructive" },
  ];

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back. Here's what's on your plate.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <c.icon className={`h-4 w-4 ${c.tone}`} />
            </div>
            <div className="text-3xl font-bold tracking-tight">{loading ? "—" : c.value}</div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">My tasks</h2>
          <Link to="/tasks" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        {myTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No tasks assigned to you yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {myTasks.map((t) => {
              const overdue = t.due_date && t.status !== "done" && isPast(new Date(t.due_date));
              return (
                <Link key={t.id} to={`/projects/${t.project_id}`} className="flex items-center justify-between py-3 hover:bg-secondary/40 -mx-2 px-2 rounded-md transition">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{t.title}</div>
                    <div className="text-xs text-muted-foreground">{t.projects?.name}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {t.due_date && (
                      <span className={`text-xs ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                        {format(new Date(t.due_date), "MMM d")}
                      </span>
                    )}
                    <Badge variant="secondary" className="capitalize">{t.priority}</Badge>
                    <Badge variant="outline" className="capitalize">{t.status.replace("_", " ")}</Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </AppShell>
  );
};

export default Dashboard;
