import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { 
  useGetProject, 
  getGetProjectQueryKey,
  useUpdateProject,
  useDeleteProject,
  useCreateStory,
  getListProjectsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Edit, Trash2, Plus, LayoutList, ChevronRight, AlertCircle } from "lucide-react";

const storySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  acceptanceCriteria: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  storyPoints: z.coerce.number().min(0).optional().or(z.literal("")),
});

const projectUpdateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.enum(["active", "completed", "archived"])
});

export function ProjectDetail() {
  const [, params] = useRoute("/projects/:projectId");
  const projectId = Number(params?.projectId);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [isStoryDialogOpen, setIsStoryDialogOpen] = useState(false);
  const [isEditProjectDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: project, isLoading } = useGetProject(projectId, { 
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) } 
  });

  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const createStory = useCreateStory();

  const storyForm = useForm<z.infer<typeof storySchema>>({
    resolver: zodResolver(storySchema),
    defaultValues: { title: "", description: "", acceptanceCriteria: "", priority: "medium", storyPoints: "" }
  });

  const projectForm = useForm<z.infer<typeof projectUpdateSchema>>({
    resolver: zodResolver(projectUpdateSchema),
    defaultValues: { name: "", description: "", status: "active" }
  });

  // Init project form when data loads
  if (project && projectForm.getValues("name") === "" && !isEditProjectDialogOpen) {
    projectForm.reset({
      name: project.name,
      description: project.description || "",
      status: project.status as any
    });
  }

  function onStorySubmit(values: z.infer<typeof storySchema>) {
    createStory.mutate({ 
      projectId, 
      data: {
        ...values,
        storyPoints: values.storyPoints === "" ? null : Number(values.storyPoints)
      } 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
        toast.success("Story created successfully");
        setIsStoryDialogOpen(false);
        storyForm.reset();
      },
      onError: (error) => {
        toast.error(error.error || "Failed to create story");
      }
    });
  }

  function onProjectSubmit(values: z.infer<typeof projectUpdateSchema>) {
    updateProject.mutate({ projectId, data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        toast.success("Project updated successfully");
        setIsEditDialogOpen(false);
      },
      onError: (error) => {
        toast.error(error.error || "Failed to update project");
      }
    });
  }

  function handleDeleteProject() {
    deleteProject.mutate({ projectId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        toast.success("Project deleted");
        setLocation("/projects");
      },
      onError: (error) => {
        toast.error(error.error || "Failed to delete project");
      }
    });
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading project...</div>;
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-10 w-10 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
        <Button onClick={() => setLocation("/projects")} variant="outline">Back to Projects</Button>
      </div>
    );
  }

  const storiesByStatus = {
    backlog: project.stories.filter(s => s.status === 'backlog'),
    ready: project.stories.filter(s => s.status === 'ready'),
    in_progress: project.stories.filter(s => s.status === 'in_progress'),
    review: project.stories.filter(s => s.status === 'review'),
    done: project.stories.filter(s => s.status === 'done'),
  };

  const priorityColors = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-secondary text-secondary-foreground",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    urgent: "bg-destructive text-destructive-foreground",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/projects" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to projects
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="font-mono">{project.key}</Badge>
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>{project.status}</Badge>
            </div>
            <p className="text-muted-foreground max-w-2xl">{project.description || "No description provided."}</p>
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <span>Owner:</span>
              <span className="font-medium text-foreground">{project.owner?.name || "Unassigned"}</span>
              <span className="mx-2">•</span>
              <span>Created {format(new Date(project.createdAt), 'MMM d, yyyy')}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={isEditProjectDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Project</DialogTitle>
                </DialogHeader>
                <Form {...projectForm}>
                  <form onSubmit={projectForm.handleSubmit(onProjectSubmit)} className="space-y-4">
                    <FormField control={projectForm.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Project Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={projectForm.control} name="description" render={({ field }) => (
                      <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={projectForm.control} name="status" render={({ field }) => (
                      <FormItem><FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      <FormMessage /></FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={updateProject.isPending}>Save Changes</Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete the project, all its stories, and tasks.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDeleteProject} disabled={deleteProject.isPending}>Delete Project</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Stories Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">User Stories</h2>
          <Dialog open={isStoryDialogOpen} onOpenChange={setIsStoryDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> New Story</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Story</DialogTitle>
              </DialogHeader>
              <Form {...storyForm}>
                <form onSubmit={storyForm.handleSubmit(onStorySubmit)} className="space-y-4">
                  <FormField control={storyForm.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Story Title</FormLabel><FormControl><Input placeholder="As a user, I want..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={storyForm.control} name="priority" render={({ field }) => (
                      <FormItem><FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      <FormMessage /></FormItem>
                    )} />
                    <FormField control={storyForm.control} name="storyPoints" render={({ field }) => (
                      <FormItem><FormLabel>Story Points</FormLabel><FormControl><Input type="number" min="0" placeholder="e.g. 3" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={storyForm.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Details..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={storyForm.control} name="acceptanceCriteria" render={({ field }) => (
                    <FormItem><FormLabel>Acceptance Criteria</FormLabel><FormControl><Textarea placeholder="Given... When... Then..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={createStory.isPending}>Create Story</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {project.stories.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg text-muted-foreground">
            <LayoutList className="w-12 h-12 mb-4 text-muted" />
            <h3 className="text-lg font-medium text-foreground">No stories yet</h3>
            <p className="mb-4 text-center max-w-sm">Create user stories to break down this project into deliverable features.</p>
            <Button onClick={() => setIsStoryDialogOpen(true)} variant="outline">Create Story</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(storiesByStatus).map(([status, stories]) => {
              if (stories.length === 0) return null;
              const formattedStatus = status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
              
              return (
                <div key={status} className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {formattedStatus} <Badge variant="secondary" className="rounded-full">{stories.length}</Badge>
                  </h3>
                  <div className="grid gap-3">
                    {stories.map(story => (
                      <Link key={story.id} href={`/stories/${story.id}`}>
                        <Card className="hover:border-primary transition-colors cursor-pointer border-l-4" style={{
                          borderLeftColor: 
                            story.status === 'done' ? 'hsl(var(--chart-3))' :
                            story.status === 'in_progress' ? 'hsl(var(--primary))' :
                            story.status === 'review' ? 'hsl(var(--chart-5))' :
                            'hsl(var(--muted-foreground))'
                        }}>
                          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-base">{story.title}</span>
                                <Badge className={priorityColors[story.priority as keyof typeof priorityColors]} variant="secondary">
                                  {story.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-1">{story.description || "No description"}</p>
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                              <div className="flex flex-col sm:items-end">
                                <span className="text-muted-foreground">Points</span>
                                <span className="font-medium">{story.storyPoints ?? '-'}</span>
                              </div>
                              <div className="flex flex-col sm:items-end min-w-[80px]">
                                <span className="text-muted-foreground">Tasks</span>
                                <span className="font-medium">{story.tasks.filter(t => t.status === 'done').length} / {story.tasks.length}</span>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground hidden sm:block" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
