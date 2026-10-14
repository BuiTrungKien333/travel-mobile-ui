export const authEndpoints = {
  login: "/api/v1/auth/login",
  register: "/api/v1/auth/register",
  refresh: "/api/v1/auth/refresh",
  logout: "/api/v1/auth/logout",
  profile: "/api/v1/users/me",
  resendVerification: "/api/v1/auth/resend-verification",
  verifyEmail: "/api/v1/auth/verify-email",
  forgotPassword: "/api/v1/auth/forgot-password",
  resetPassword: "/api/v1/auth/reset-password",
  googleChallenge: "/api/v1/auth/google/challenge",
  googleLogin: "/api/v1/auth/google",
  googleVerifyLink: "/api/v1/auth/google/verify-link",
} as const;

export const publicAuthEndpoints: ReadonlySet<string> = new Set([
  authEndpoints.login,
  authEndpoints.register,
  authEndpoints.refresh,
  authEndpoints.logout,
  authEndpoints.resendVerification,
  authEndpoints.verifyEmail,
  authEndpoints.forgotPassword,
  authEndpoints.resetPassword,
  authEndpoints.googleChallenge,
  authEndpoints.googleLogin,
  authEndpoints.googleVerifyLink,
]);
