import { Suspense } from "react";
import LoginForm from "@/components/login-form";
import DevAdminLogin from "@/components/dev-admin-login";
import DevClientLogin from "@/components/dev-client-login";

export default function Login() {
  return <main className="login-page" dir="rtl">
    <section className="login-content">
      <header className="login-heading">
        <span className="eyebrow">خوش آمدید</span>
        <h1>ورود به Fit Pro</h1>
        <p className="muted">با شماره همراه وارد شوید و مسیرتان را ادامه دهید.</p>
      </header>
      <Suspense fallback={<div className="login-loading" role="status">در حال آماده‌سازی فرم ورود…</div>}>
        <div className="login-card">
          <LoginForm />
          {process.env.NODE_ENV === "development" && <><DevAdminLogin /><DevClientLogin /></>}
        </div>
      </Suspense>
    </section>
  </main>;
}
