import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Project = { id: string; name: string; description: string | null; created_at: string; created_by: string };

const projectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z.string().trim().max(500).optional(),
});

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setProjects(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = projectSchema.safeParse({ name, description });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("projects").insert({ name: parsed.data.name, description: parsed.data.description || null, created_by: user.id });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Project created");
    setName(""); setDescription(""); setOpen(false);
    load();
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Workspaces where your team collaborates.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />New project</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create project</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pname">Name</Label>
                <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Marketing site redesign" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdesc">Description</Label>
                <Textarea id="pdesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" rows={3} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : projects.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderKanban className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">No projects yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first project to start tracking tasks.</p>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />New project</Button>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`}>
              <Card className="p-5 h-full hover:border-primary/40 hover:shadow-[var(--shadow-md)] transition">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground shrink-0">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{p.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.description || "No description"}</p>
                    <p className="text-xs text-muted-foreground mt-3">Created {format(new Date(p.created_at), "MMM d, yyyy")}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
};

export default Projects;
