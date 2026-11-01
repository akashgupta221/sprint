import { useMemo, useState } from "react";
import { useRoute, Link } from "wouter";
import {
  useListStories,
  getListStoriesQueryKey,
  useListSprints,
  getListSprintsQueryKey,
  useCreateSprint,
  useDeleteSprint,
  useStartSprint,
  useCompleteSprint,
  useAddStoriesToSprint,
  useRemoveStoriesFromSprint,
  useListEpics,
  getListEpicsQueryKey,
  useCreateEpic,
  useUpdateStory,
  getGetStoryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Flag,
  Layers,
  Play,
  CheckCircle2,
  Trash2,
  Plus,
  Target,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const sprintSchema = z.object({
  name: z.string().min(1, "Name is required"),
  goal: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const epicSchema = z.object({
  title: z.string().min(1, "Title is required"),
  summary: z.string().optional(),
});

type StoryRow = {
  id: number;
  title: string;
  type: string;
  status: string;
  storyPoints: number | null;
  sprintId: number | null;
  labels: string[];
};

export function Backlog() {
  const [, params] = useRoute("/projects/:projectId/backlog");
  const projectId = Number(params?.projectId);
  const queryClient = useQueryClient();
  const [dragId, setDragId] = useState<number | null>(null);
  const [overZone, setOverZone] = useState<string | null>(null);
  const [isSprintDialogOpen, setIsSprintDialogOpen] = useState(false);
  const [isEpicDialogOpen, setIsEpicDialogOpen] = useState(false);

  const { data: stories = [] } = useListStories(projectId, {
    query: {
      enabled: !!projectId,
      queryKey: getListStoriesQueryKey(projectId),
    },
  });
  const { data: sprints = [] } = useListSprints(projectId, {
    query: {
      enabled: !!projectId,
      queryKey: getListSprintsQueryKey(projectId),
    },
  });
  const { data: epics = [] } = useListEpics(projectId, {
    query: {
      enabled: !!projectId,
      queryKey: getListEpicsQueryKey(projectId),
    },
  });

  const createSprint = useCreateSprint();
  const deleteSprint = useDeleteSprint();
  const startSprint = useStartSprint();
  const completeSprint = useCompleteSprint();
  const addStories = useAddStoriesToSprint();
  const removeStories = useRemoveStoriesFromSprint();
  const createEpic = useCreateEpic();
  const updateStory = useUpdateStory();

  const sprintForm = useForm<z.infer<typeof sprintSchema>>({
    resolver: zodResolver(sprintSchema),
    defaultValues: { name: "", goal: "", startDate: "", endDate: "" },
  });
  const epicForm = useForm<z.infer<typeof epicSchema>>({
    resolver: zodResolver(epicSchema),
    defaultValues: { title: "", summary: "" },
  });

  const backlog = (stories as StoryRow[]).filter((s) => s.sprintId == null);
  const plannedSprints = (sprints as any[]).filter(
    (s) => s.status === "planned",
  );
  const activeSprint = (sprints as any[]).find((s) => s.status === "active");
  const completedSprints = (sprints as any[]).filter(
    (s) => s.status === "completed",
  );

  const sprintStories = useMemo(() => {
    const map = new Map<number, StoryRow[]>();
    for (const sprint of sprints as any[]) {
      map.set(
        sprint.id,
        (stories as StoryRow[]).filter((s) => s.sprintId === sprint.id),
      );
    }
    return map;
  }, [stories, sprints]);

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: getListSprintsQueryKey(projectId),
    });
    queryClient.invalidateQueries({
      queryKey: getListStoriesQueryKey(projectId),
    });
    queryClient.invalidateQueries({ queryKey: getListEpicsQueryKey(projectId) });
  };

  const moveToSprint = (storyId: number, sprintId: number | null) => {
    if (sprintId == null) {
      removeStories.mutate(
        { sprintId: findSprintForStory(storyId), data: { storyIds: [storyId] } },
        { onSuccess: invalidate, onError: () => toast.error("Move failed") },
      );
    } else {
      addStories.mutate(
        { sprintId, data: { storyIds: [storyId] } },
        { onSuccess: invalidate, onError: () => toast.error("Move failed") },
      );
    }
    setDragId(null);
    setOverZone(null);
  };

  const findSprintForStory = (storyId: number): number => {
    for (const sprint of sprints as any[]) {
      if ((sprintStories.get(sprint.id) ?? []).some((s) => s.id === storyId)) {
        return sprint.id;
      }
    }
    return 0;
  };

  const toggleEpic = (storyId: number, epicId: number | null) => {
    updateStory.mutate(
      { storyId, data: { epicId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetStoryQueryKey(storyId),
          });
          invalidate();
        },
      },
    );
  };

  const submitSprint = sprintForm.handleSubmit((values) => {
    createSprint.mutate(
      {
        projectId,
        data: {
          name: values.name,
          goal: values.goal || null,
          startDate: values.startDate
            ? new Date(values.startDate).toISOString()
            : null,
          endDate: values.endDate
            ? new Date(values.endDate).toISOString()
            : null,
        } as any,
      },
      {
        onSuccess: () => {
          toast.success("Sprint created");
          setIsSprintDialogOpen(false);
          sprintForm.reset();
          invalidate();
        },
        onError: () => toast.error("Couldn't create the sprint"),
      },
    );
  });

  const submitEpic = epicForm.handleSubmit((values) => {
    createEpic.mutate(
      { projectId, data: { title: values.title, summary: values.summary || null } as any },
      {
        onSuccess: () => {
          toast.success("Epic created");
          setIsEpicDialogOpen(false);
          epicForm.reset();
          invalidate();
        },
        onError: () => toast.error("Couldn't create the epic"),
      },
    );
  });

  if (!projectId) return null;

  const renderStoryCard = (story: StoryRow, zone: string) => (
    <article
      key={story.id}
      draggable
      onDragStart={() => setDragId(story.id)}
      onDragEnd={() => setDragId(null)}
      className={`cursor-grab rounded-xl border border-[hsl(160_10%_88%)] bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing ${
        dragId === story.id ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
          {story.type}
        </span>
        <div className="flex items-center gap-1.5">
          {(story.labels ?? []).slice(0, 2).map((label) => (
            <span
              key={label}
              className="rounded bg-[hsl(220_45%_96%)] px-1.5 py-0.5 text-[10px] text-[hsl(220_45%_35%)]"
            >
              {label}
            </span>
          ))}
          {story.storyPoints != null && (
            <span className="font-mono text-[10px] text-slate-400">
              {story.storyPoints} pt
            </span>
          )}
        </div>
      </div>
      <Link href={`/stories/${story.id}`}>
        <p className="mt-1 text-sm font-medium leading-5 text-slate-900 hover:underline">
          {story.title}
        </p>
      </Link>
      <div className="mt-2 flex items-center gap-1.5">
        <select
          value=""
          onChange={(e) => toggleEpic(story.id, Number(e.target.value) || null)}
          className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-500"
          aria-label="Attach to epic"
        >
          <option value="">＋ epic…</option>
          {(epics as any[]).map((epic) => (
            <option key={epic.id} value={epic.id}>
              {epic.title}
            </option>
          ))}
        </select>
      </div>
      {zone !== "backlog" && (
        <button
          onClick={() => moveToSprint(story.id, null)}
          className="mt-1.5 text-[10px] text-slate-400 hover:text-slate-700"
        >
          ← back to backlog
        </button>
      )}
    </article>
  );

  const dropZone = (zone: string, sprintId: number | null, extraClass = "") => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setOverZone(zone);
    },
    onDragLeave: () => setOverZone((z) => (z === zone ? null : z)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (dragId != null) moveToSprint(dragId, sprintId);
    },
    className: `flex min-h-40 flex-col gap-2 rounded-2xl border p-3 transition-colors ${
      overZone === zone
        ? "border-[hsl(220_45%_35%)] bg-[hsl(220_45%_97%)]"
        : "border-[hsl(160_10%_88%)] bg-[hsl(160_15%_99%)]"
    } ${extraClass}`,
  });

  return (
    <div className="min-h-[100dvh] bg-[hsl(160_15%_98%)]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href={`/projects/${projectId}`}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" /> Back to project
            </Link>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">
              Backlog & sprints
            </h1>
            <p className="text-sm text-slate-500">
              Plan sprints, move stories in, start and close them — Jira-style.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeSprint && (
              <Link href={`/projects/${projectId}/board`}>
                <Button variant="outline">Open board</Button>
              </Link>
            )}
            <Dialog open={isEpicDialogOpen} onOpenChange={setIsEpicDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Layers className="mr-1.5 h-4 w-4" /> New epic
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New epic</DialogTitle>
                  <DialogDescription>
                    Epics group related stories under one umbrella.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={submitEpic} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="epic-title">Title</Label>
                    <Input id="epic-title" {...epicForm.register("title")} />
                    {epicForm.formState.errors.title && (
                      <p className="text-xs text-red-500">
                        {epicForm.formState.errors.title.message}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="epic-summary">Summary</Label>
                    <Textarea
                      id="epic-summary"
                      rows={2}
                      {...epicForm.register("summary")}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit">Create epic</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={isSprintDialogOpen} onOpenChange={setIsSprintDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-1.5 h-4 w-4" /> New sprint
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New sprint</DialogTitle>
                  <DialogDescription>
                    Plan it now, start it when the team is ready.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={submitSprint} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="sprint-name">Name</Label>
                    <Input
                      id="sprint-name"
                      placeholder="Sprint 14"
                      {...sprintForm.register("name")}
                    />
                    {sprintForm.formState.errors.name && (
                      <p className="text-xs text-red-500">
                        {sprintForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sprint-goal">Sprint goal</Label>
                    <Textarea
                      id="sprint-goal"
                      rows={2}
                      {...sprintForm.register("goal")}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="sprint-start">Start date</Label>
                      <Input
                        id="sprint-start"
                        type="date"
                        {...sprintForm.register("startDate")}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="sprint-end">End date</Label>
                      <Input
                        id="sprint-end"
                        type="date"
                        {...sprintForm.register("endDate")}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Create sprint</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Active sprint */}
        {activeSprint && (
          <Card className="mt-6 border-[hsl(220_45%_80%)]">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <Badge className="border-0 bg-[hsl(220_45%_35%)] text-white">
                  ACTIVE
                </Badge>
                <CardTitle className="mt-2 text-lg">{activeSprint.name}</CardTitle>
                {activeSprint.goal && (
                  <p className="mt-1 text-sm text-slate-500">{activeSprint.goal}</p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold text-slate-900">
                    {(activeSprint as any).donePoints}/
                    {(activeSprint as any).totalPoints} pts
                  </p>
                  <p className="text-xs text-slate-400">
                    {(activeSprint as any).storyCount} {(activeSprint as any).storyCount === 1 ? "story" : "stories"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    completeSprint.mutate(
                      { sprintId: activeSprint.id },
                      {
                        onSuccess: () => {
                          toast.success("Sprint completed");
                          invalidate();
                        },
                        onError: () => toast.error("Couldn't complete sprint"),
                      },
                    )
                  }
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" /> Complete
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div {...dropZone(`active-${activeSprint.id}`, activeSprint.id)}>
                {(sprintStories.get(activeSprint.id) ?? []).length === 0 ? (
                  <p className="p-4 text-center text-xs text-slate-400">
                    Drag stories from the backlog into the active sprint
                  </p>
                ) : (
                  (sprintStories.get(activeSprint.id) ?? []).map((story) =>
                    renderStoryCard(story, `active-${activeSprint.id}`),
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Planned sprints */}
        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Planned sprints
        </h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {plannedSprints.length === 0 && (
            <p className="text-sm text-slate-400">
              No planned sprints — create one and drag stories in.
            </p>
          )}
          {plannedSprints.map((sprint) => (
            <Card key={sprint.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">{sprint.name}</CardTitle>
                  <p className="text-xs text-slate-400">
                    {(sprint as any).storyCount} {(sprint as any).storyCount === 1 ? "story" : "stories"} ·{" "}
                    {(sprint as any).totalPoints} pts
                    {sprint.startDate &&
                      ` · ${format(new Date(sprint.startDate), "MMM d")}`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    onClick={() =>
                      startSprint.mutate(
                        { sprintId: sprint.id },
                        {
                          onSuccess: () => {
                            toast.success("Sprint started");
                            invalidate();
                          },
                          onError: (error: any) =>
                            toast.error(
                              error?.message ?? "Couldn't start sprint",
                            ),
                        },
                      )
                    }
                  >
                    <Play className="mr-1 h-3.5 w-3.5" /> Start
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      deleteSprint.mutate(
                        { sprintId: sprint.id },
                        {
                          onSuccess: () => {
                            toast.success("Sprint deleted, stories back to backlog");
                            invalidate();
                          },
                        },
                      )
                    }
                    aria-label={`Delete ${sprint.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-slate-400" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div {...dropZone(`planned-${sprint.id}`, sprint.id)}>
                  {(sprintStories.get(sprint.id) ?? []).length === 0 ? (
                    <p className="p-3 text-center text-xs text-slate-400">
                      Drop stories here
                    </p>
                  ) : (
                    (sprintStories.get(sprint.id) ?? []).map((story) =>
                      renderStoryCard(story, `planned-${sprint.id}`),
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Backlog */}
        <h2 className="mt-8 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
          <Target className="h-4 w-4" /> Backlog ({backlog.length})
        </h2>
        <div {...dropZone("backlog", null, "mt-3")}>
          {backlog.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
              The backlog is empty — create stories from the project page.
            </p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {backlog.map((story) => renderStoryCard(story, "backlog"))}
            </div>
          )}
        </div>

        {/* Epics */}
        {(epics as any[]).length > 0 && (
          <>
            <h2 className="mt-8 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
              <Flag className="h-4 w-4" /> Epics
            </h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {(epics as any[]).map((epic) => (
                <Card key={epic.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">
                        {epic.title}
                      </CardTitle>
                      <Badge variant="outline">{epic.status}</Badge>
                    </div>
                    {epic.summary && (
                      <p className="text-xs text-slate-500">{epic.summary}</p>
                    )}
                  </CardHeader>
                  <CardContent className="text-xs text-slate-400">
                    {epic.storyCount} {epic.storyCount === 1 ? "story" : "stories"} · {epic.storyPoints} pts ·{" "}
                    {epic.storiesDone} done
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Completed sprints */}
        {completedSprints.length > 0 && (
          <>
            <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Completed sprints
            </h2>
            <div className="mt-3 space-y-2">
              {completedSprints.map((sprint) => (
                <div
                  key={sprint.id}
                  className="flex items-center justify-between rounded-xl border border-[hsl(160_10%_88%)] bg-white px-4 py-2.5"
                >
                  <span className="text-sm text-slate-700">{sprint.name}</span>
                  <span className="font-mono text-xs text-slate-400">
                    {(sprint as any).donePoints}/
                    {(sprint as any).totalPoints} pts done
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
