import { useEffect, useRef, useState } from "react";
import {
  Switch,
  Route,
  Router as WouterRouter,
  useLocation,
  Redirect,
} from "wouter";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, useClerk } from "@clerk/react";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Shell } from "@/components/Shell";
import { Dashboard } from "@/pages/Dashboard";
import { Projects } from "@/pages/Projects";
import { ProjectDetail } from "@/pages/ProjectDetail";
import { StoryDetail } from "@/pages/StoryDetail";
import { Team } from "@/pages/Team";
import { Notifications } from "@/pages/Notifications";
import { Landing } from "@/pages/Landing";
import { Button } from "@/components/ui/button";
import { setBaseUrl } from "@workspace/api-client-react";
import { AppAuthProvider, useAppAuth } from "./lib/auth";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const rawBasePath = import.meta.env.BASE_URL ?? "/";
const basePath = rawBasePath.replace(/\/$/, "");
const hasClerk = Boolean(clerkPubKey);

// Set API base URL
setBaseUrl("http://localhost:3000");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(220 45% 35%)",
    colorForeground: "hsl(220 30% 20%)",
    colorMutedForeground: "hsl(220 20% 45%)",
    colorDanger: "hsl(0 65% 50%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(0 0% 100%)",
    colorInputForeground: "hsl(220 30% 20%)",
    colorNeutral: "hsl(160 10% 88%)",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox:
      "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-[hsl(160_10%_88%)]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[hsl(220_30%_20%)] font-semibold text-xl",
    headerSubtitle: "text-[hsl(220_20%_45%)] text-sm",
    socialButtonsBlockButtonText: "text-[hsl(220_30%_20%)] font-medium",
    formFieldLabel: "text-[hsl(220_30%_20%)] text-sm font-medium",
    footerActionLink: "text-[hsl(220_45%_35%)] font-medium hover:underline",
    footerActionText: "text-[hsl(220_20%_45%)] text-sm",
    dividerText: "text-[hsl(220_20%_45%)] text-xs uppercase tracking-wide",
    identityPreviewEditButton: "text-[hsl(220_45%_35%)]",
    formFieldSuccessText: "text-emerald-600",
    alertText: "text-[hsl(0_65%_50%)]",
    logoBox: "mb-2",
    logoImage: "h-10 w-10",
    socialButtonsBlockButton:
      "border border-[hsl(160_10%_88%)] hover:bg-[hsl(160_15%_96%)]",
    formButtonPrimary:
      "bg-[hsl(220_45%_35%)] hover:bg-[hsl(220_45%_30%)] text-white font-medium",
    formFieldInput:
      "border border-[hsl(160_10%_88%)] focus:border-[hsl(220_45%_35%)] focus:ring-2 focus:ring-[hsl(220_45%_35%)]/20",
    footerAction: "pt-2",
    dividerLine: "bg-[hsl(160_10%_88%)]",
    alert: "bg-red-50 border border-red-200 rounded-md",
    otpCodeFieldInput:
      "border border-[hsl(160_10%_88%)] focus:border-[hsl(220_45%_35%)]",
    formFieldRow: "gap-2",
    main: "gap-4",
  },
};

function FakeAuthForm({
  title,
  submitLabel,
}: {
  title: string;
  submitLabel: string;
}) {
  const auth = useAppAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("demo@sprint.local");
  const [fullName, setFullName] = useState("Demo User");

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[hsl(160_15%_98%)] px-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          auth.signIn(email.trim() || "demo@sprint.local", fullName.trim() || "Demo User");
          setLocation("/dashboard");
        }}
        className="w-full max-w-md rounded-3xl border border-[hsl(160_10%_88%)] bg-white p-8 shadow-xl"
      >
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Local authentication is enabled for development. No external Clerk account is required.
        </p>
        <label className="mt-6 block text-sm font-medium text-slate-700">
          Full name
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Email address
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          />
        </label>
        <Button type="submit" className="mt-6 w-full">
          {submitLabel}
        </Button>
      </form>
    </div>
  );
}

function SignInPage() {
  if (!hasClerk) {
    return <FakeAuthForm title="Local sign in" submitLabel="Continue" />;
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[hsl(160_15%_98%)] px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
      />
    </div>
  );
}

function SignUpPage() {
  if (!hasClerk) {
    return <FakeAuthForm title="Local sign up" submitLabel="Create account" />;
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[hsl(160_15%_98%)] px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
      />
    </div>
  );
}

function HomeRedirect() {
  const auth = useAppAuth();
  return auth.isSignedIn ? <Redirect to="/dashboard" /> : <Landing />;
}

function Protected({ children }: { children: React.ReactNode }) {
  const auth = useAppAuth();
  return auth.isSignedIn ? <Shell>{children}</Shell> : <Redirect to="/" />;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function AppRoutes() {
  const [, setLocation] = useLocation();

  const clerkConfig: any = {
    publishableKey: clerkPubKey,
    appearance: clerkAppearance,
    signInUrl: `${basePath}/sign-in`,
    signUpUrl: `${basePath}/sign-up`,
    localization: {
      signIn: {
        start: {
          title: "Welcome back to Sprint",
          subtitle: "Sign in to your workspace",
        },
      },
      signUp: {
        start: {
          title: "Create your Sprint account",
          subtitle: "Plan, ship, repeat — together.",
        },
      },
    },
    routerPush: (to: string) => setLocation(stripBase(to)),
    routerReplace: (to: string) => setLocation(stripBase(to), { replace: true }),
  };

  if (clerkProxyUrl) {
    clerkConfig.proxyUrl = clerkProxyUrl;
  }

  return (
    <AppAuthProvider enableClerk={hasClerk} clerkConfig={clerkConfig}>
      <QueryClientProvider client={queryClient}>
        {hasClerk ? <ClerkQueryClientCacheInvalidator /> : null}
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/dashboard">
              <Protected>
                <Dashboard />
              </Protected>
            </Route>
            <Route path="/projects">
              <Protected>
                <Projects />
              </Protected>
            </Route>
            <Route path="/projects/:projectId">
              <Protected>
                <ProjectDetail />
              </Protected>
            </Route>
            <Route path="/stories/:storyId">
              <Protected>
                <StoryDetail />
              </Protected>
            </Route>
            <Route path="/team">
              <Protected>
                <Team />
              </Protected>
            </Route>
            <Route path="/notifications">
              <Protected>
                <Notifications />
              </Protected>
            </Route>
            <Route>
              <Protected>
                <div className="p-8">
                  <h1 className="text-3xl font-bold">Not Found</h1>
                </div>
              </Protected>
            </Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AppAuthProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <AppRoutes />
    </WouterRouter>
  );
}

export default App;
