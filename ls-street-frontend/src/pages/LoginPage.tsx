import {
  useState,
  type FormEvent,
} from "react";

import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MoveRight,
} from "lucide-react";

import {
  Navigate,
  useNavigate,
} from "react-router";

import {
  useAuth,
} from "../contexts/AuthContext";

import {
  ApiError,
} from "../lib/api";

export function LoginPage() {
  const navigate =
    useNavigate();

  const {
    login,
    authenticated,
    user,
  } = useAuth();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  if (
    authenticated &&
    user?.role === "ADMIN"
  ) {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  async function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const authenticatedUser =
        await login({
          email,
          password,
        });

      if (
        authenticatedUser.role !==
        "ADMIN"
      ) {
        setError(
          "Este painel é exclusivo para administradores.",
        );

        return;
      }

      navigate(
        "/admin",
        {
          replace: true,
        },
      );
    } catch (caughtError) {
      if (
        caughtError instanceof
        ApiError
      ) {
        setError(
          caughtError.message,
        );
      } else {
        setError(
          "Não foi possível realizar o login.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-presentation">
        <div className="login-logo">
          LS
        </div>

        <div className="login-copy">
          <span className="eyebrow">
            LS STREET ADMIN
          </span>

          <h1>
            Controle sua loja em
            um só lugar.
          </h1>

          <p>
            Gerencie pedidos,
            pagamentos, produtos,
            estoque e campanhas
            com rapidez.
          </p>
        </div>

        <div className="login-decoration">
          <div />
          <div />
          <div />
        </div>
      </section>

      <section className="login-form-section">
        <form
          className="login-card"
          onSubmit={
            handleSubmit
          }
        >
          <header>
            <span className="eyebrow">
              BEM-VINDO
            </span>

            <h2>
              Acessar painel
            </h2>

            <p>
              Entre com sua conta
              administrativa.
            </p>
          </header>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <label>
            <span>E-mail</span>

            <div className="input-wrapper">
              <Mail size={19} />

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target
                      .value,
                  )
                }
                placeholder="admin@lsstreet.com"
                required
                autoComplete="email"
              />
            </div>
          </label>

          <label>
            <span>Senha</span>

            <div className="input-wrapper">
              <LockKeyhole
                size={19}
              />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target
                      .value,
                  )
                }
                placeholder="Sua senha"
                required
                autoComplete="current-password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(
                    (current) =>
                      !current,
                  )
                }
                aria-label={
                  showPassword
                    ? "Ocultar senha"
                    : "Mostrar senha"
                }
              >
                {showPassword ? (
                  <EyeOff
                    size={18}
                  />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </label>

          <button
            type="submit"
            className="primary-button"
            disabled={submitting}
          >
            {submitting
              ? "Entrando..."
              : "Entrar"}

            {!submitting && (
              <MoveRight
                size={19}
              />
            )}
          </button>
        </form>
      </section>
    </main>
  );
}