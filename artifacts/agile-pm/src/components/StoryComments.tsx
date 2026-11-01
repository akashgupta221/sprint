import { useState } from "react";
import {
  useListStoryComments,
  getListStoryCommentsQueryKey,
  useCreateStoryComment,
  useDeleteComment,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { AtSign, Send, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type CommentRow = {
  id: number;
  authorName: string;
  body: string;
  createdAt: string | Date;
};

/**
 * Comments panel for a story. Typing @followed-by a member's first name
 * (e.g. @harsh) notifies that member through the durable outbox.
 */
export function StoryComments({
  storyId,
  members = [],
}: {
  storyId: number;
  members?: { id: number; name: string }[];
}) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [mentionOpen, setMentionOpen] = useState(false);

  const { data: comments = [] } = useListStoryComments(storyId, {
    query: {
      enabled: !!storyId,
      queryKey: getListStoryCommentsQueryKey(storyId),
    },
  });
  const createComment = useCreateStoryComment();
  const deleteComment = useDeleteComment();

  // Filter members by whatever is typed after the last "@", so the picker
  // narrows as the user types instead of only appearing on a bare "@".
  const mentionFragment = (body.match(/@(\w*)$/) ?? [])[1]?.toLowerCase() ?? "";
  const mentionMatches = members.filter((member) =>
    member.name.toLowerCase().replace(/\s+/g, "").startsWith(mentionFragment),
  );

  const submit = () => {
    const text = body.trim();
    if (!text) return;
    createComment.mutate(
      { storyId, data: { body: text } as any },
      {
        onSuccess: () => {
          setBody("");
          setMentionOpen(false);
          queryClient.invalidateQueries({
            queryKey: getListStoryCommentsQueryKey(storyId),
          });
        },
      },
    );
  };

  return (
    <section className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold tracking-tight">Comments</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Type <span className="font-mono">@</span> plus a teammate’s first name
        to notify them (e.g.{" "}
        <span className="font-mono">
          @{(members[0]?.name ?? "harsh").split(" ")[0].toLowerCase()}
        </span>
        ).
      </p>

      <div className="mt-4 space-y-3">
        {(comments as CommentRow[]).length === 0 && (
          <p className="rounded-lg border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
            No comments yet — start the conversation.
          </p>
        )}
        {(comments as CommentRow[]).map((comment) => (
          <article
            key={comment.id}
            className="group rounded-lg border border-border/70 bg-background/60 p-3"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 font-mono text-[10px] font-bold text-primary">
                  {comment.authorName
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <span className="text-sm font-medium">{comment.authorName}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </span>
              <button
                onClick={() =>
                  deleteComment.mutate(
                    { commentId: comment.id },
                    {
                      onSuccess: () =>
                        queryClient.invalidateQueries({
                          queryKey: getListStoryCommentsQueryKey(storyId),
                        }),
                    },
                  )
                }
                aria-label="Delete comment"
                className="cursor-pointer rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
              {comment.body.split(/(@[\w.+-]+)/g).map((part, index) =>
                part.startsWith("@") ? (
                  <span
                    key={index}
                    className="rounded bg-primary/10 px-1 font-medium text-primary"
                  >
                    {part}
                  </span>
                ) : (
                  <span key={index}>{part}</span>
                ),
              )}
            </p>
          </article>
        ))}
      </div>

      <div className="relative mt-4">
        <Textarea
          value={body}
          onChange={(event) => {
            const value = event.target.value;
            setBody(value);
            setMentionOpen(!!value.match(/@(\w*)$/));
          }}
          placeholder="Leave a comment… use @name to mention someone"
          rows={3}
          className="resize-none"
        />
        {mentionOpen && mentionMatches.length > 0 && (
          <div className="absolute bottom-14 left-2 z-10 w-56 rounded-lg border bg-popover p-1 shadow-md">
            {mentionMatches.slice(0, 5).map((member) => (
              <button
                key={member.id}
                onClick={() => {
                  setBody((current) => current + member.name.split(" ")[0].toLowerCase());
                  setMentionOpen(false);
                }}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <AtSign className="h-3.5 w-3.5 text-muted-foreground" />
                {member.name}
              </button>
            ))}
          </div>
        )}
        <div className="mt-2 flex justify-end">
          <Button size="sm" onClick={submit} disabled={!body.trim() || createComment.isPending}>
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Comment
          </Button>
        </div>
      </div>
    </section>
  );
}
