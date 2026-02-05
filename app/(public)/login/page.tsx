import { redirect } from "next/navigation";

// Redirect to the proper auth login page
export default function LoginPage() {
  redirect("/auth/login");
}
