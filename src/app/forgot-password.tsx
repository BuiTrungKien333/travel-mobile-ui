import { EmailRequestScreen } from "@/features/auth/screens/email-request-screen";

export default function ForgotPasswordRoute() {
  return <EmailRequestScreen purpose="reset" />;
}
