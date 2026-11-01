import { useMemo, useState } from "react";
import { useRoute, Link } from "wouter";
import {
  useGetSprint,
  getGetSprintQueryKey,
  useListSprints,
  getListSprintsQueryKey,
  useUpdateStory,
  getGetStoryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bug,
  Flame,
  Search,
  Sparkles,
  CircleDot,
  Gauge,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const BOARD_COLUMNS = [
  { status: "ready", label: "Ready" },
  { status: "in_progress", label: "In progress" },
  { status: "review", label: "Review" },
  { status: "done", label: "Done" },
] as const;

const WIP_LIMIT = 6;

type BoardStory = {
  id: number;
  title: string;
  type: string;
  status: string;
  priority: string;
  storyPoints: number | null;
  labels: string[];
  assignee: { name: string } | null;
};

const typeIcon = (type: string) => {
  if (type === "bug") return <Bug className="h-3.5 w-3.5 text-red-500" />;
  if (type === "spike") return <Sparkles className="h-3.5 w-3.5 text-violet-500" />;
  return <CircleDot className="h-3.5 w-3.5 text-[hsl(220_45%_35%)]" />;
};

const priorityTone: Record<string, string> = {
  urgent: "bg-red-100 text-red-700",
  high: "bg-amber-100 text-amber-700",
  medium: "bg-slate-100 text-slate-600",
  low: "bg-emerald-100 text-emerald-700",
};

export function Board() {
  const [, params] = useRoute("/projects/:projectId/board");
  const projectId = Number(params?.projectId);
  const queryClient = useQueryClient();
  const [dragId, setDragId] = useState<number | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: sprints = [], isError: sprintsError } = useListSprints(projectId, {
    query: {
      enabled: !!projectId,
      queryKey: getListSprintsQueryKey(projectId),
    },
  });
  const activeSprint = sprints.find((s: any) => s.status === "active");

  const { data: sprint, isLoading, isError: sprintError } = useGetSprint(activeSprint?.id ?? 0, {
    query: {
      enabled: !!activeSprint?.id,
      queryKey: getGetSprintQueryKey(activeSprint?.id ?? 0),
    },
  });

  const updateStory = useUpdateStory();

  const stories = ((sprint as any)?.stories ?? []) as BoardStory[];

  const assignees = useMemo(() => {
    const map = new Map<number, string>();
    for (const story of stories) {
      if (story.assignee) map.set(story.assignee as any, story.assignee.name);
    }
    return [...map.entries()];
  }, [stories]);

  const visible = stories.filter((story) => {
    if (assigneeFilter !== "all") {
      const id = Number(assigneeFilter);
      if (!story.assignee || (story.assignee as any).id !== id) return false;
    }
    if (typeFilter !== "all" && story.type !== typeFilter) return false;
    if (search && !story.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const moveStory = (storyId: number, status: string) => {
    updateStory.mutate(
      { storyId, data: { status: status as any } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetSprintQueryKey(activeSprint?.id ?? 0),
          });
          queryClient.invalidateQueries({
            queryKey: getGetStoryQueryKey(storyId),
          });
        },
        onError: () => toast.error("Couldn't move the story — try again"),
      },
    );
  };

  if (!projectId) return null;

  return (
    <div className="min-h-[100dvh] bg-[hsl(160_15%_98%)]">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href={`/projects/${projectId}`}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" /> Back to project
            </Link>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">
              Sprint board
            </h1>
            <p className="text-sm text-slate-500">
              {activeSprint
                ? `${activeSprint.name}${activeSprint.goal ? ` — ${activeSprint.goal}` : ""}`
                : "No active sprint — start one from the backlog"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stories"
                className="w-44 pl-8"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="story">Story</SelectItem>
                <SelectItem value="bug">Bug</SelectItem>
                <SelectItem value="spike">Spike</SelectItem>
              </SelectContent>
            </Select>
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone</SelectItem>
                {assignees.map(([id, name]) => (
                  <SelectItem key={id} value={String(id)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {sprintsError || sprintError ? (
          <Card className="mt-8">
            <CardContent className="py-10 text-center">
              <p className="font-medium text-red-600">Couldn't load the board</p>
              <p className="mt-1 text-sm text-slate-500">
                The API didn't respond properly. Refresh to retry — if the API
                was idle it may need a few seconds to wake up.
              </p>
              <Button className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <p className="mt-10 text-center text-slate-400">Loading board…</p>
        ) : !activeSprint ? (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Gauge className="h-10 w-10 text-slate-300" />
              <p className="font-medium text-slate-700">No active sprint</p>
              <p className="max-w-md text-sm text-slate-500">
                Head to the backlog, plan a sprint with stories, and start it —
                the board will fill up with your sprint work.
              </p>
              <Link href={`/projects/${projectId}/backlog`}>
                <Button>Open backlog</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {BOARD_COLUMNS.map((column) => {
              const columnStories = visible.filter(
                (s) => s.status === column.status,
              );
              const overWip =
                column.status === "in_progress" &&
                columnStories.length > WIP_LIMIT;
              return (
                <div
                  key={column.status}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOverColumn(column.status);
                  }}
                  onDragLeave={() =>
                    setOverColumn((c) => (c === column.status ? null : c))
                  }
                  onDrop={(e) => {
                    e.preventDefault();
                    setOverColumn(null);
                    if (dragId != null) moveStory(dragId, column.status);
                    setDragId(null);
                  }}
                  className={`flex min-h-72 flex-col gap-3 rounded-2xl border bg-white/70 p-3 transition-colors ${
                    overColumn === column.status
                      ? "border-[hsl(220_45%_35%)] bg-[hsl(220_45%_97%)]"
                      : "border-[hsl(160_10%_88%)]"
                  }`}
                >
                  <div className="flex items-center justify-between px-1 pt-1">
                    <span className="text-sm font-semibold text-slate-800">
                      {column.label}
                    </span>
                    <span className="flex items-center gap-1.5">
                      {overWip && (
                        <Badge
                          variant="outline"
                          className="gap-1 border-amber-300 bg-amber-50 text-amber-700"
                        >
                          <Flame className="h-3 w-3" /> WIP over {WIP_LIMIT}
                        </Badge>
                      )}
                      <span className="font-mono text-[10px] text-slate-400">
                        {columnStories.length}
                      </span>
                    </span>
                  </div>

                  {columnStories.length === 0 && (
                    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-400">
                      Drop stories here
                    </div>
                  )}

                  {columnStories.map((story) => (
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
                        <span className="flex items-center gap-1.5">
                          {typeIcon(story.type)}
                          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                            {story.type}
                          </span>
                        </span>
                        <Badge
                          className={`${priorityTone[story.priority] ?? "bg-slate-100 text-slate-600"} border-0`}
                        >
                          {story.priority}
                        </Badge>
                      </div>
                      <Link href={`/stories/${story.id}`} className="mt-1.5 block">
                        <p className="text-sm font-medium leading-5 text-slate-900 hover:underline">
                          {story.title}
                        </p>
                      </Link>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          {(story.labels ?? []).slice(0, 2).map((label) => (
                            <span
                              key={label}
                              className="rounded bg-[hsl(220_45%_96%)] px-1.5 py-0.5 text-[10px] text-[hsl(220_45%_35%)]"
                            >
                              {label}
                            </span>
                          ))}
                        </span>
                        <span className="flex items-center gap-2">
                          {story.assignee && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(220_45%_90%)] font-mono text-[9px] font-bold text-[hsl(220_45%_35%)]">
                              {story.assignee.name
                                .split(" ")
                                .map((part) => part[0])
                                .slice(0, 2)
                                .join("")}
                            </span>
                          )}
                          {story.storyPoints != null && (
                            <span className="font-mono text-[10px] text-slate-400">
                              {story.storyPoints} pt
                            </span>
                          )}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
