import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as tokens from "../src/theme/tokens.ts";
import type {
  AuthStatus,
  AuthUser,
} from "../src/features/auth/types/auth-types.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

type Element = { type: unknown; props: Record<string, unknown> };
function nodes(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Element;
  return [node, ...nodes(node.props.children)];
}
function press(element: Element | undefined) {
  assert.ok(element);
  assert.equal(typeof element.props.onPress, "function");
  return (element.props.onPress as () => unknown)();
}
function button(tree: Element, text: string) {
  return nodes(tree).find(
    (node) =>
      node.type === "AppButton" &&
      (node.props.children === text ||
        nodes(node.props.children).some(
          (child) => child.props.children === text,
        )),
  );
}
const user: AuthUser = {
  id: "00000000-0000-4000-8000-000000000001",
  fullName: "Nguyễn An — Demo",
  email: "an@example.com",
  role: "USER",
};

function harness() {
  const state = {
    status: "authenticated" as AuthStatus,
    version: 1,
    revoked: true,
    logoutCalls: 0,
    registerResets: 0,
    refreshes: 0,
    restoreCalls: 0,
  };
  const navigation: unknown[] = [];
  const profile = {
    data: user as AuthUser | undefined,
    isLoading: false,
    isError: false,
    isFetching: false,
    error: null as unknown,
    refetch: async () => {
      state.refreshes++;
    },
  };
  const logout = {
    isPending: false,
    mutateAsync: async () => {
      state.logoutCalls++;
      state.version++;
      state.status = "anonymous";
      return state.revoked;
    },
  };
  const values = {
    fullName: user.fullName,
    email: user.email,
    password: "valid-password",
  };
  const register = {
    isPending: false,
    error: null,
    reset: () => {
      state.registerResets++;
    },
    mutateAsync: async () => ({ resendAfterSeconds: 60 }),
  };
  const states: unknown[] = [];
  let cursor = 0;
  let notice: unknown;
  const load = tripModuleLoader({
    react: {
      useRef: (current: unknown) => ({ current }),
      useState: (initial: unknown) => {
        const index = cursor++;
        if (!(index in states)) states[index] = initial;
        return [
          states[index],
          (next: unknown) => {
            states[index] = next;
          },
        ];
      },
    },
    "react/jsx-runtime": {
      jsx: (type: unknown, props: Element["props"]) => ({ type, props }),
      jsxs: (type: unknown, props: Element["props"]) => ({ type, props }),
    },
    "react-native": {
      View: "View",
      ScrollView: "ScrollView",
      Pressable: "Pressable",
      ActivityIndicator: "ActivityIndicator",
      TextInput: "TextInput",
      Keyboard: { dismiss: () => {} },
      StyleSheet: { create: (value: unknown) => value, hairlineWidth: 1 },
    },
    "expo-image": { Image: "Image" },
    "react-native-reanimated": {
      __esModule: true,
      default: { View: "AnimatedView" },
      useAnimatedStyle: () => ({}),
    },
    "@/hooks/use-ambient-motion": {
      useAmbientMotion: () => ({ get: () => 0 }),
    },
    "expo-router": {
      router: {
        push: (value: unknown) => navigation.push(value),
        replace: (value: unknown) => navigation.push(value),
      },
      useLocalSearchParams: () => ({ notice }),
    },
    "expo-router/js-tabs": { useBottomTabBarHeight: () => 96 },
    "@/hooks/use-app-theme": {
      useAppTheme: () => ({
        ...tokens,
        colors: new Proxy({}, { get: () => "color" }),
      }),
    },
    "@/hooks/use-i18n": {
      useI18n: () => ({ t: (key: string) => key, locale: "vi" }),
    },
    "@/store/use-auth-store": {
      useAuthStore: (select: (value: typeof state) => unknown) => select(state),
    },
    "../hooks/use-auth": {
      useProfile: () => profile,
      useLogout: () => logout,
      useRegister: () => register,
      useLogin: () => ({ isPending: false, error: null }),
    },
    "../hooks/use-google-login": {
      useGoogleLogin: () => ({ isPending: false, reset: () => {} }),
    },
    "../services/auth-session": {
      authSession: {
        getVersion: () => state.version,
        getRestoreError: () => null,
        restore: async () => { state.restoreCalls++; },
      },
    },
    "../utils/auth-error-message": { authErrorMessage: () => "safe-error" },
    "react-hook-form": {
      Controller: "Controller",
      useForm: () => ({
        control: {},
        formState: { isSubmitting: false },
        handleSubmit: (action: (value: typeof values) => Promise<void>) => () =>
          action(values),
        reset: () => {},
        setError: () => {},
        clearErrors: () => {},
      }),
    },
    "@hookform/resolvers/zod": { zodResolver: () => ({}) },
    "../components/check-email": { CheckEmail: "CheckEmail" },
    "../components/google-feedback": { GoogleFeedback: "GoogleFeedback" },
    ...Object.fromEntries(
      [
        ["@/components/common/screen-safe-area", "ScreenSafeArea"],
        ["@/components/common/glass-backdrop", "GlassBackdrop"],
        ["@/components/common/language-switcher", "LanguageSwitcher"],
        ["@/components/ui/app-button", "AppButton"],
        ["@/components/ui/app-text", "AppText"],
        ["@/components/ui/app-icon", "AppIcon"],
        ["@/components/ui/app-input", "AppInput"],
        ["@/features/auth/components/auth-scaffold", "AuthScaffold"],
        ["@/features/auth/components/auth-footer-link", "AuthFooterLink"],
        ["@/features/auth/components/auth-divider", "AuthDivider"],
        ["@/features/auth/components/google-button", "GoogleButton"],
      ].map(([path, name]) => [path, { [name]: name }]),
    ),
  });
  const render = (screen: () => Element) => {
    cursor = 0;
    return screen();
  };
  return {
    load,
    render,
    state,
    navigation,
    profile,
    logout,
    setNotice: (value: unknown) => {
      notice = value;
    },
  };
}

test("Development auth is the default; fixture preview requires an explicit flag and is disabled in release", () => {
  const compiled = ts.transpileModule(
    readFileSync(
      new URL("../src/constants/development.ts", import.meta.url),
      "utf8",
    ),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  for (const [development, flag, expected] of [
    [true, undefined, false],
    [true, "false", false],
    [true, "true", true],
    [false, "true", false],
  ] as const) {
    const exports: Record<string, unknown> = {};
    runInNewContext(compiled, {
      exports,
      __DEV__: development,
      process: { env: { EXPO_PUBLIC_UI_PREVIEW: flag } },
    });
    assert.equal(exports.UI_PREVIEW_ENABLED, expected);
  }
});

test("Profile preserves the account name and routes password recovery to the existing flow", () => {
  const h = harness();
  const { ProfileScreen } = h.load<{ ProfileScreen: () => Element }>(
    "src/features/auth/screens/profile-screen.tsx",
  );
  const tree = h.render(ProfileScreen);
  assert.ok(nodes(tree).some((node) => node.props.children === user.fullName));
  assert.ok(
    nodes(tree).some(
      (node) => node.props.children === "auth.profile.memberRole",
    ),
  );
  press(
    nodes(tree).find(
      (node) => node.props.accessibilityLabel === "auth.profile.changePassword",
    ),
  );
  assert.deepEqual(h.navigation, ["/forgot-password"]);
});

test("Profile handles disabled preview queries without an endless spinner and retains language settings", () => {
  const h = harness();
  h.profile.data = undefined;
  h.state.status = "restoring";
  const { ProfileScreen } = h.load<{ ProfileScreen: () => Element }>(
    "src/features/auth/screens/profile-screen.tsx",
  );
  const tree = h.render(ProfileScreen);
  assert.equal(
    nodes(tree).some((node) => node.type === "ActivityIndicator"),
    false,
  );
  assert.ok(
    nodes(tree).some((node) => node.props.children === "auth.profile.empty"),
  );
  assert.ok(nodes(tree).some((node) => node.type === "LanguageSwitcher"));
  assert.equal(button(tree, "auth.session.logout"), undefined);
});

test("Profile errors remain actionable without hiding cached account data", async () => {
  const h = harness();
  h.profile.isError = true;
  const { ProfileScreen } = h.load<{ ProfileScreen: () => Element }>(
    "src/features/auth/screens/profile-screen.tsx",
  );
  const tree = h.render(ProfileScreen);
  assert.ok(
    nodes(tree).some((node) => node.props.accessibilityRole === "alert"),
  );
  assert.ok(nodes(tree).some((node) => node.props.children === user.fullName));
  await press(button(tree, "common.retry"));
  assert.equal(h.state.refreshes, 1);
});

test("Logout prevents duplicate submission and delivers local-only revocation feedback", async () => {
  const h = harness();
  h.state.revoked = false;
  const { ProfileScreen } = h.load<{ ProfileScreen: () => Element }>(
    "src/features/auth/screens/profile-screen.tsx",
  );
  h.logout.isPending = true;
  await press(button(h.render(ProfileScreen), "auth.session.logout"));
  assert.equal(h.state.logoutCalls, 0);
  h.logout.isPending = false;
  await press(button(h.render(ProfileScreen), "auth.session.logout"));
  assert.equal(h.state.logoutCalls, 1);
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(
    JSON.stringify(h.navigation[0]),
    JSON.stringify({
      pathname: "/(auth)/login",
      params: { notice: "local-logout" },
    }),
  );
});

test("A late failed revoke cannot redirect a newer login session", async () => {
  const h = harness();
  h.logout.mutateAsync = async () => {
    h.state.version += 2;
    return false;
  };
  const { ProfileScreen } = h.load<{ ProfileScreen: () => Element }>(
    "src/features/auth/screens/profile-screen.tsx",
  );
  await press(button(h.render(ProfileScreen), "auth.session.logout"));
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.deepEqual(h.navigation, []);
});

test("Registration's different-email action returns to a fresh form and clears the mutation", async () => {
  const h = harness();
  const { RegisterScreen } = h.load<{ RegisterScreen: () => Element }>(
    "src/features/auth/screens/register-screen.tsx",
  );
  await press(button(h.render(RegisterScreen), "auth.register.submit"));
  const pending = h.render(RegisterScreen);
  assert.equal(
    nodes(pending).find((node) => node.type === "CheckEmail")?.props.email,
    user.email,
  );
  press(button(pending, "auth.email.differentEmail"));
  assert.equal(h.state.registerResets, 1);
  assert.ok(button(h.render(RegisterScreen), "auth.register.submit"));
});

test("Account recovery returns authenticated users to Profile and anonymous users to the login gate", () => {
  const h = harness();
  const { AuthReturnButton } = h.load<{ AuthReturnButton: () => Element }>(
    "src/features/auth/components/auth-return-button.tsx",
  );
  press(h.render(AuthReturnButton));
  h.state.status = "anonymous";
  press(h.render(AuthReturnButton));
  assert.deepEqual(h.navigation, ["/tabs/profile", "/"]);
});

test("Login displays only the recognized local logout notice", () => {
  const h = harness();
  const { LoginScreen } = h.load<{ LoginScreen: () => Element }>(
    "src/features/auth/screens/login-screen.tsx",
  );
  for (const [notice, expected] of [
    ["local-logout", true],
    [["local-logout"], false],
    ["untrusted-copy", false],
  ] as const) {
    h.setNotice(notice);
    assert.equal(
      nodes(h.render(LoginScreen)).some(
        (node) => node.props.children === "auth.session.localLogout",
      ),
      expected,
    );
  }
});

test("Session recovery announces indeterminate loading and offers an explicit retry after failure", async () => {
  const h = harness();
  const { SessionGate } = h.load<{
    SessionGate: (props: { failed: boolean }) => Element;
  }>("src/features/auth/components/session-gate.tsx");
  const loading = h.render(() => SessionGate({ failed: false }));
  const progress = nodes(loading).find(
    (node) => node.props.accessibilityRole === "progressbar",
  );
  assert.ok(progress);
  assert.equal(progress.props.accessibilityLabel, "auth.session.restoring");
  assert.equal(
    (progress.props.accessibilityState as { busy: boolean }).busy,
    true,
  );
  assert.equal(progress.props.accessibilityValue, undefined);
  assert.equal(button(loading, "common.retry"), undefined);

  const failed = h.render(() => SessionGate({ failed: true }));
  assert.equal(
    nodes(failed).some((node) => node.props.accessibilityRole === "progressbar"),
    false,
  );
  assert.equal(
    nodes(failed).find((node) => node.props.accessibilityRole === "alert")?.props.children,
    "safe-error",
  );
  assert.equal(h.state.restoreCalls, 0);
  await press(button(failed, "common.retry"));
  assert.equal(h.state.restoreCalls, 1);
  assert.deepEqual(h.navigation, []);
});
