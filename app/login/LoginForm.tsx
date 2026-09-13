"use client";

import { FormEvent, useState } from "react";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.location.href = "/api/auth/login";
  }

  return (
    <>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-label" htmlFor="email">
          Email
        </label>
        <input
          className="auth-input"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="student@university.edu"
          required
        />

        <div className="auth-label-row">
          <label className="auth-label" htmlFor="password">
            Password
          </label>
          <button
            className="auth-text-button"
            type="button"
            onClick={() => window.location.href = "/api/auth/login?connection=email&prompt=login"}
          >
            Forgot password?
          </button>
        </div>
        <div className="auth-password-field">
          <input
            className="auth-input"
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            required
          />
          <button
            className="auth-password-toggle"
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((visible) => !visible)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <label className="auth-remember">
          <input name="remember" type="checkbox" />
          <span>Remember me</span>
        </label>

        <button className="auth-submit" type="submit">
          Log in
        </button>
      </form>

      <p className="auth-signup">
        New to Campus Quest?{" "}
        <button
          className="auth-text-button"
          type="button"
          onClick={() => window.location.href = "/api/auth/signup"}
        >
          Create an account
        </button>
      </p>
    </>
  );
}
