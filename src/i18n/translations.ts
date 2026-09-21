export const translations = {
  vi: {
    "common.email": "Email",
    "common.password": "Mật khẩu",
    "common.or": "hoặc",
    "common.continueWithGoogle": "Tiếp tục với Google",
    "common.showPassword": "Hiện mật khẩu",
    "common.hidePassword": "Ẩn mật khẩu",
    "common.logoAccessibility": "Logo Tripzy",
    "language.selectorLabel": "Chọn ngôn ngữ",
    "language.vi": "Tiếng Việt",
    "language.en": "Tiếng Anh",
    "auth.login.title": "Chào mừng bạn trở lại",
    "auth.login.subtitle": "Đăng nhập để tiếp tục hành trình của bạn.",
    "auth.login.passwordPlaceholder": "Nhập mật khẩu",
    "auth.login.forgotPassword": "Quên mật khẩu?",
    "auth.login.submit": "Đăng nhập",
    "auth.login.noAccount": "Chưa có tài khoản?",
    "auth.login.register": "Đăng ký",
    "auth.register.title": "Tạo tài khoản",
    "auth.register.subtitle": "Bắt đầu lên kế hoạch cho hành trình của bạn.",
    "auth.register.fullName": "Họ và tên",
    "auth.register.fullNamePlaceholder": "Nguyễn Văn An",
    "auth.register.passwordPlaceholder": "Tạo mật khẩu",
    "auth.register.passwordHelper": "Sử dụng ít nhất 8 ký tự.",
    "auth.register.submit": "Tạo tài khoản",
    "auth.register.termsPrefix": "Bằng việc tạo tài khoản, bạn đồng ý với",
    "auth.register.terms": "Điều khoản sử dụng",
    "auth.register.termsJoin": "và",
    "auth.register.privacy": "Chính sách quyền riêng tư",
    "auth.register.hasAccount": "Đã có tài khoản?",
    "auth.register.login": "Đăng nhập",
    "validation.emailRequired": "Vui lòng nhập email.",
    "validation.emailInvalid": "Email chưa đúng định dạng.",
    "validation.passwordRequired": "Vui lòng nhập mật khẩu.",
    "validation.fullNameRequired": "Vui lòng nhập họ và tên.",
    "validation.passwordMin": "Mật khẩu phải có ít nhất 8 ký tự.",
  },
  en: {
    "common.email": "Email",
    "common.password": "Password",
    "common.or": "or",
    "common.continueWithGoogle": "Continue with Google",
    "common.showPassword": "Show password",
    "common.hidePassword": "Hide password",
    "common.logoAccessibility": "Tripzy logo",
    "language.selectorLabel": "Choose language",
    "language.vi": "Vietnamese",
    "language.en": "English",
    "auth.login.title": "Welcome back",
    "auth.login.subtitle": "Sign in to continue your journey.",
    "auth.login.passwordPlaceholder": "Enter your password",
    "auth.login.forgotPassword": "Forgot password?",
    "auth.login.submit": "Sign in",
    "auth.login.noAccount": "Don't have an account?",
    "auth.login.register": "Sign up",
    "auth.register.title": "Create an account",
    "auth.register.subtitle": "Start planning your journey.",
    "auth.register.fullName": "Full name",
    "auth.register.fullNamePlaceholder": "John Smith",
    "auth.register.passwordPlaceholder": "Create a password",
    "auth.register.passwordHelper": "Use at least 8 characters.",
    "auth.register.submit": "Create account",
    "auth.register.termsPrefix": "By creating an account, you agree to the",
    "auth.register.terms": "Terms of Use",
    "auth.register.termsJoin": "and",
    "auth.register.privacy": "Privacy Policy",
    "auth.register.hasAccount": "Already have an account?",
    "auth.register.login": "Sign in",
    "validation.emailRequired": "Please enter your email.",
    "validation.emailInvalid": "Enter a valid email address.",
    "validation.passwordRequired": "Please enter your password.",
    "validation.fullNameRequired": "Please enter your full name.",
    "validation.passwordMin": "Password must contain at least 8 characters.",
  },
} as const;

export type AppLocale = keyof typeof translations;
export type TranslationKey = keyof (typeof translations)["vi"];

export function translate(locale: AppLocale, key: TranslationKey): string {
  return translations[locale][key];
}

export function translateError(
  locale: AppLocale,
  message: string | undefined,
): string | undefined {
  if (!message || !Object.hasOwn(translations.vi, message)) {
    return message;
  }

  return translate(locale, message as TranslationKey);
}
