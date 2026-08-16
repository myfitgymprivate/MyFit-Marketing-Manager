import Image from "next/image";

import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="login-page">
      <section className="login-card">
        <Image
          alt="MyFit Private Fitness"
          height={150}
          priority
          src="/brand/myfit-logo.svg"
          width={300}
        />
        <p className="eyebrow">Marketing Manager</p>
        <h1>Přihlášení do MyFit</h1>
        <p className="muted">Soukromý pracovní prostor pro marketing MyFit.</p>
        {params.error ? (
          <p className="login-error" role="alert">
            E-mail nebo heslo není správně.
          </p>
        ) : null}
        <form action={login} className="login-form">
          <label>
            E-mail
            <input autoComplete="email" name="email" required type="email" />
          </label>
          <label>
            Heslo
            <input
              autoComplete="current-password"
              minLength={8}
              name="password"
              required
              type="password"
            />
          </label>
          <button className="primary-button" type="submit">
            Přihlásit se
          </button>
        </form>
      </section>
    </main>
  );
}
