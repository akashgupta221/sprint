import { useState } from "react";
import { Link } from "wouter";
import { useListProjects, useCreateProject, getListProjectsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  key: z.string().min(1, "Key is required").max(10, "Key is too long").toUpperCase(),
  description: z.string().optional(),
});

export function Projects() {
  const queryClient = useQueryClient();
  const { data: projects, isLoading } = useListProjects();
  const createProject = useCreateProject();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", key: "", description: "" }
  });

  function onSubmit(values: z.infer<typeof projectSchema>) {
    createProject.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        toast.success("Project created successfully");
        setIsDialogOpen(false);
        form.reset();
      },
      onError: (error) => {
        toast.error(error.error || "Failed to create project");
      }
    });
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading projects...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage your team's initiatives.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Project</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl><Input placeholder="E.g. Website Redesign" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Key</FormLabel>
                      <FormControl><Input placeholder="E.g. WEB" {...field} onChange={e => field.onChange(e.target.value.toUpperCase())} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl><Textarea placeholder="Optional" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={createProject.isPending} className="w-full">
                  {createProject.isPending ? "Creating..." : "Create Project"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects?.map(project => (
          <Link key={project.id} href={`/projects/${project.id}`} className="block">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-5 h-5 text-primary" />
                    <CardTitle className="text-xl">{project.name}</CardTitle>
                  </div>
                  <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>{project.status}</Badge>
                </div>
                <CardDescription className="mt-2 line-clamp-2">{project.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <div className="flex justify-between items-center text-sm text-muted-foreground pt-4 border-t">
                  <div className="flex gap-4">
                    <span><strong className="text-foreground">{project.storyCount}</strong> stories</span>
                    <span><strong className="text-foreground">{project.taskCount}</strong> tasks</span>
                  </div>
                  <span>{format(new Date(project.updatedAt), 'MMM d')}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      
      {(!projects || projects.length === 0) && (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg text-muted-foreground">
          <FolderKanban className="w-12 h-12 mb-4 text-muted" />
          <h3 className="text-lg font-medium text-foreground">No projects yet</h3>
          <p className="mb-4 text-center max-w-sm">Create your first project to start organizing stories and tasks.</p>
          <Button onClick={() => setIsDialogOpen(true)} variant="outline">Create Project</Button>
        </div>
      )}
    </div>
  );
}
