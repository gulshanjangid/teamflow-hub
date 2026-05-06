import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isPast } from "date-fns";
import { toast } from "sonner";

type Task = { id: string; title: string; status: "todo" | "in_progress" | "done"; priority: string; due_date: string | null; project_id: string; projects: { name: string } | null };

const MyTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("tasks")
      .select("id,title,status,priority,due_date,project_id, projects(name)")
      .eq("assigned_to", user.id)
      .order("due_date", { ascending: true, nullsFirst: false });
    setTasks((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const updateStatus = async (id: string, status: Task["status"]) => {
    const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const filtered = tasks.filter((t) => filter === "all" || t.status === filter);

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My tasks</h1>
          <p className="text-muted-foreground mt-1">Tasks assigned to you across all projects.</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="todo">To do</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="divide-y divide-border">
        {loading ? (
          <p className="p-6 text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="p-12 text-center text-muted-foreground">No tasks here.</p>
        ) : (
          filtered.map((t) => {
            const overdue = t.due_date && t.status !== "done" && isPast(new Date(t.due_date));
            return (
              <div key={t.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <Link to={`/projects/${t.project_id}`} className="font-medium hover:underline">{t.title}</Link>
                  <div className="text-xs text-muted-foreground">{t.projects?.name}</div>
                </div>
                {t.due_date && (
                  <span className={`text-xs ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                    Due {format(new Date(t.due_date), "MMM d")}
                  </span>
                )}
                <Badge variant="secondary" className="capitalize">{t.priority}</Badge>
                <Select value={t.status} onValueChange={(v: any) => updateStatus(t.id, v)}>
                  <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To do</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          })
        )}
      </Card>
    </AppShell>
  );
};

export default MyTasks;
