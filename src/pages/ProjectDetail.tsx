import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2, ArrowLeft, UserPlus, Crown } from "lucide-react";
import { toast } from "sonner";
import { format, isPast } from "date-fns";

type Task = { id: string; title: string; description: string | null; status: "todo" | "in_progress" | "done"; priority: "low" | "medium" | "high"; due_date: string | null; assigned_to: string | null; created_by: string };
type Member = { id: string; user_id: string; role: "admin" | "member"; profiles: { name: string | null; email: string | null } | null };
type Project = { id: string; name: string; description: string | null; created_by: string };

const taskSchema = z.object({
  title: z.string().trim().min(1, "Title required").max(200),
  description: z.string().trim().max(2000).optional(),
});

const STATUSES: Task["status"][] = ["todo", "in_progress", "done"];
const STATUS_LABEL: Record<Task["status"], string> = { todo: "To do", in_progress: "In progress", done: "Done" };
const PRIORITY_VARIANT: Record<Task["priority"], "secondary" | "default" | "destructive"> = { low: "secondary", medium: "default", destructive: "destructive" } as any;

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskOpen, setTaskOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);

  // task form
  const [tTitle, setTTitle] = useState("");
  const [tDesc, setTDesc] = useState("");
  const [tPriority, setTPriority] = useState<Task["priority"]>("medium");
  const [tStatus, setTStatus] = useState<Task["status"]>("todo");
  const [tAssignee, setTAssignee] = useState<string>("none");
  const [tDue, setTDue] = useState("");
  const [tBusy, setTBusy] = useState(false);

  // member form
  const [mEmail, setMEmail] = useState("");
  const [mRole, setMRole] = useState<"admin" | "member">("member");
  const [mBusy, setMBusy] = useState(false);

  const isAdmin = members.find((m) => m.user_id === user?.id)?.role === "admin";

  const load = async () => {
    if (!id) return;
    const [{ data: p }, { data: ts }, { data: ms }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).maybeSingle(),
      supabase.from("tasks").select("*").eq("project_id", id).order("created_at", { ascending: false }),
      supabase.from("project_members").select("id,user_id,role, profiles(name,email)").eq("project_id", id),
    ]);
    setProject(p as any);
    setTasks((ts as any) ?? []);
    setMembers((ms as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = taskSchema.safeParse({ title: tTitle, description: tDesc });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!user || !id) return;
    setTBusy(true);
    const { error } = await supabase.from("tasks").insert({
      project_id: id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      priority: tPriority,
      status: tStatus,
      assigned_to: tAssignee === "none" ? null : tAssignee,
      due_date: tDue ? new Date(tDue).toISOString() : null,
      created_by: user.id,
    });
    setTBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Task created");
    setTTitle(""); setTDesc(""); setTPriority("medium"); setTStatus("todo"); setTAssignee("none"); setTDue("");
    setTaskOpen(false);
    load();
  };

  const updateStatus = async (task: Task, status: Task["status"]) => {
    const { error } = await supabase.from("tasks").update({ status }).eq("id", task.id);
    if (error) { toast.error(error.message); return; }
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) { toast.error(error.message); return; }
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    toast.success("Task deleted");
  };

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setMBusy(true);
    const { data: prof, error: pErr } = await supabase.from("profiles").select("id").eq("email", mEmail.trim().toLowerCase()).maybeSingle();
    if (pErr || !prof) { setMBusy(false); toast.error("No user found with that email"); return; }
    const { error } = await supabase.from("project_members").insert({ project_id: id, user_id: prof.id, role: mRole });
    setMBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Member added");
    setMEmail(""); setMRole("member"); setMemberOpen(false);
    load();
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase.from("project_members").delete().eq("id", memberId);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const deleteProject = async () => {
    if (!id || !confirm("Delete this project and all its tasks?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Project deleted");
    window.location.href = "/projects";
  };

  if (loading) return <AppShell><p className="text-muted-foreground">Loading…</p></AppShell>;
  if (!project) return <AppShell><p>Project not found.</p></AppShell>;

  const memberName = (uid: string | null) => {
    if (!uid) return "Unassigned";
    const m = members.find((x) => x.user_id === uid);
    return m?.profiles?.name || m?.profiles?.email || "Member";
  };

  return (
    <AppShell>
      <Link to="/projects" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" />Back to projects
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          {project.description && <p className="text-muted-foreground mt-1 max-w-2xl">{project.description}</p>}
        </div>
        <div className="flex gap-2">
          <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />New task</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New task</DialogTitle></DialogHeader>
              <form onSubmit={createTask} className="space-y-4">
                <div className="space-y-2"><Label>Title</Label><Input value={tTitle} onChange={(e) => setTTitle(e.target.value)} /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={tDesc} onChange={(e) => setTDesc(e.target.value)} rows={3} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={tPriority} onValueChange={(v: any) => setTPriority(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={tStatus} onValueChange={(v: any) => setTStatus(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Assignee</Label>
                    <Select value={tAssignee} onValueChange={setTAssignee}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Unassigned</SelectItem>
                        {members.map((m) => (
                          <SelectItem key={m.user_id} value={m.user_id}>{m.profiles?.name || m.profiles?.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Due date</Label><Input type="date" value={tDue} onChange={(e) => setTDue(e.target.value)} /></div>
                </div>
                <DialogFooter><Button type="submit" disabled={tBusy}>{tBusy ? "Creating…" : "Create"}</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          {isAdmin && (
            <Button variant="outline" onClick={deleteProject}><Trash2 className="h-4 w-4" /></Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-6">
          <div className="grid md:grid-cols-3 gap-4">
            {STATUSES.map((status) => {
              const col = tasks.filter((t) => t.status === status);
              return (
                <div key={status} className="bg-secondary/50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-sm font-semibold">{STATUS_LABEL[status]}</h3>
                    <span className="text-xs text-muted-foreground">{col.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[100px]">
                    {col.map((t) => {
                      const overdue = t.due_date && t.status !== "done" && isPast(new Date(t.due_date));
                      return (
                        <Card key={t.id} className="p-3 group">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="font-medium text-sm">{t.title}</div>
                            <button onClick={() => deleteTask(t.id)} className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {t.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{t.description}</p>}
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            <Badge variant={t.priority === "high" ? "destructive" : t.priority === "medium" ? "default" : "secondary"} className="text-[10px] capitalize px-1.5 py-0">{t.priority}</Badge>
                            {t.due_date && (
                              <span className={`text-[10px] ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                                {format(new Date(t.due_date), "MMM d")}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-muted-foreground truncate">{memberName(t.assigned_to)}</span>
                            <Select value={t.status} onValueChange={(v: any) => updateStatus(t, v)}>
                              <SelectTrigger className="h-7 text-xs w-auto"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Team members</h2>
              {isAdmin && (
                <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
                  <DialogTrigger asChild><Button size="sm"><UserPlus className="h-4 w-4 mr-1" />Add member</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add team member</DialogTitle></DialogHeader>
                    <form onSubmit={addMember} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={mEmail} onChange={(e) => setMEmail(e.target.value)} placeholder="user@team.com" />
                        <p className="text-xs text-muted-foreground">User must already have an account.</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={mRole} onValueChange={(v: any) => setMRole(v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter><Button type="submit" disabled={mBusy}>{mBusy ? "Adding…" : "Add"}</Button></DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <div className="divide-y divide-border">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium text-sm flex items-center gap-2">
                      {m.profiles?.name || m.profiles?.email}
                      {m.role === "admin" && <Crown className="h-3.5 w-3.5 text-warning" />}
                    </div>
                    <div className="text-xs text-muted-foreground">{m.profiles?.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{m.role}</Badge>
                    {isAdmin && m.user_id !== project.created_by && (
                      <Button variant="ghost" size="sm" onClick={() => removeMember(m.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
};

export default ProjectDetail;
