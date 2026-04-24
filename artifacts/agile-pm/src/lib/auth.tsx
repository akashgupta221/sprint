import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ClerkProvider, useClerk, useUser } from "@clerk/react";

type AppUser = {
  id: string;
  fullName: string;
  email: string;
  imageUrl?: string;
};

type AuthContextValue = {
  user: AppUser | null;
  signIn: (email: string, fullName: string) => void;
  signOut: () => void;
  isSignedIn: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "sprint-auth-user";

function getStoredUser(): AppUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AppUser;
  } catch {
    return null;
  }
}

function useFakeAuth(): AuthContextValue {
  const [user, setUser] = useState<AppUser | null>(() => getStoredUser());

  useEffect(() => {
    if (user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const signIn = (email: string, fullName: string) => {
    setUser({ id: "local-user", fullName, email });
  };

  const signOut = () => {
    setUser(null);
  };

  return useMemo(
    () => ({ user, signIn, signOut, isSignedIn: Boolean(user) }),
    [user],
  );
}

function useClerkAuth(): AuthContextValue {
  const clerkUser = useUser();
  const { signOut } = useClerk();

  const user = useMemo<AppUser | null>(() => {
    if (!clerkUser.user) {
      return null;
    }

    return {
      id: clerkUser.user.id,
      fullName:
        clerkUser.user.fullName ||
        clerkUser.user.primaryEmailAddress?.emailAddress ||
        "User",
      email: clerkUser.user.primaryEmailAddress?.emailAddress || "",
      imageUrl: clerkUser.user.imageUrl,
    };
  }, [clerkUser.user]);

  return useMemo(
    () => ({
      user,
      signIn: () => {
        throw new Error("Clerk sign-in should be handled by Clerk UI");
      },
      signOut: () => signOut({ redirectUrl: "/" }),
      isSignedIn: Boolean(user),
    }),
    [signOut, user],
  );
}

function ClerkAuthContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useClerkAuth();
  return (
    <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
  );
}

function FakeAuthContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useFakeAuth();
  return (
    <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
  );
}

export function AppAuthProvider({
  enableClerk,
  clerkConfig,
  children,
}: {
  enableClerk: boolean;
  clerkConfig?: Record<string, unknown>;
  children: React.ReactNode;
}) {
  if (enableClerk) {
    return (
      <ClerkProvider {...clerkConfig}>
        <ClerkAuthContextProvider>{children}</ClerkAuthContextProvider>
      </ClerkProvider>
    );
  }

  return <FakeAuthContextProvider>{children}</FakeAuthContextProvider>;
}

export function useAppAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAppAuth must be used inside AppAuthProvider");
  }
  return context;
}
