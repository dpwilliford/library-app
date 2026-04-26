import { loginAction } from "./actions";
import { demoUsers } from "@/lib/demoUsers";
import { roleLabels } from "@library-app/shared";

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="auth-page">
      <section className="auth-card stack">
        <div>
          <p className="eyebrow">Private library workspace</p>
          <h1>Library Collection Intelligence</h1>
          <p className="muted">A role-based workspace for media arts collection development.</p>
        </div>
        {searchParams.error ? <p className="error">Invalid login.</p> : null}
        <form action={loginAction} className="stack">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required />
          </div>
          <button className="button" type="submit">
            Log in
          </button>
        </form>
        <div className="demo-list">
          <h2>Demo logins</h2>
          <p className="muted">All demo users use password <code>demo123</code>.</p>
          <ul>
            {demoUsers.map((user) => (
              <li key={user.email}>
                <strong>{roleLabels[user.role]}</strong>: <code>{user.email}</code>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
