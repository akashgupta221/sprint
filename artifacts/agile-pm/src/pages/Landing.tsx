import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  GitBranch,
  Bell,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function Landing() {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[hsl(160_15%_98%)] to-white">
      <header className="border-b border-[hsl(160_10%_88%)] bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[hsl(220_45%_35%)] rounded-md flex items-center justify-center text-white font-bold">
              S
            </div>
            <span className="font-semibold text-lg tracking-tight">Sprint</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/sign-in">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-5xl font-bold tracking-tight text-[hsl(220_30%_20%)]">
            Plan, ship, repeat.
          </h1>
          <p className="mt-5 text-lg text-[hsl(220_20%_45%)]">
            Sprint is a lightweight agile workspace for small teams. Track
            projects, user stories, and tasks — and let the built-in async
            worker handle the email notifications.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2">
                Create your workspace
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline">
                Sign in
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: LayoutDashboard,
              title: "Project dashboard",
              body: "Velocity, open work, and recent activity at a glance.",
            },
            {
              icon: GitBranch,
              title: "Stories & tasks",
              body: "Hierarchical tracking from epics down to individual tasks.",
            },
            {
              icon: Bell,
              title: "Async notifications",
              body: "Assignments and status changes fan out via a retrying email worker.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="p-6 rounded-xl bg-white border border-[hsl(160_10%_88%)]"
            >
              <Icon className="w-6 h-6 text-[hsl(220_45%_35%)]" />
              <h3 className="mt-3 font-semibold text-[hsl(220_30%_20%)]">
                {title}
              </h3>
              <p className="mt-1 text-sm text-[hsl(220_20%_45%)]">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 max-w-3xl mx-auto p-6 rounded-xl bg-[hsl(160_15%_96%)] border border-[hsl(160_10%_88%)]">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[hsl(220_45%_35%)] mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-[hsl(220_30%_20%)]">
                Demo data is preloaded
              </p>
              <p className="mt-1 text-sm text-[hsl(220_20%_45%)]">
                After signing in you'll land on a dashboard with two example
                projects, four team members, and live notifications. Email
                addresses on the Team page are where assignment notifications
                are delivered.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[hsl(160_10%_88%)] bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6 text-sm text-[hsl(220_20%_45%)]">
          API docs at <code className="font-mono">{basePath || ""}/api/docs</code>
        </div>
      </footer>
    </div>
  );
}
