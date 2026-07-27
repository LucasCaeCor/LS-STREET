import {
  ArrowLeft,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MoveRight,
  UserRound,
} from "lucide-react";

import {
  useState,
  type FormEvent,
} from "react";

import {
  Link,
  Navigate,
  useNavigate,
  useSearchParams,
} from "react-router";

import {
  useAuth,
} from "../contexts/AuthContext";

import {
  ApiError,
} from "../lib/api";

function getSafeRedirect(
  redirect: string | null,
) {
  if (
    !redirect ||
    !redirect.startsWith("/") ||
    redirect.startsWith("//")
  ) {
    return "/minha-conta";
  }

  return redirect;
}

export function CustomerLoginPage() {
  const navigate =
    useNavigate();

  const [
    searchParams,
  ] = useSearchParams();

  const {
    user,
    loading,
    authenticated,
    login,
    logout,
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

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const redirectTo =
    getSafeRedirect(
      searchParams.get(
        "redirect",
      ),
    );

  if (loading) {
    return (
      <div className="customer-auth-loading">
        <LoaderCircle
          size={28}
          className="icon-spinning"
        />

        Verificando sua sessão...
      </div>
    );
  }

  if (
    authenticated &&
    user?.role === "CUSTOMER"
  ) {
    return (
      <Navigate
        to={redirectTo}
        replace
      />
    );
  }

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
          email:
            email
              .trim()
              .toLowerCase(),

          password,
        });

      if (
        authenticatedUser.role !==
        "CUSTOMER"
      ) {
        await logout();

        setError(
          "Esta entrada é exclusiva para clientes. Use o acesso administrativo.",
        );

        return;
      }

      navigate(
        redirectTo,
        {
          replace: true,
        },
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof
          ApiError
          ? caughtError.message
          : "Não foi possível entrar na sua conta.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="customer-auth-page">
      <div className="customer-auth-presentation">
        <Link
          to="/"
          className="customer-auth-back"
        >
          <ArrowLeft size={18} />
          Voltar para a loja
        </Link>

        <div>
          <span>
            LS STREET
          </span>

          <h1>
            Sua conta.
            Seu estilo.
          </h1>

          <p>
            Acesse seus pedidos,
            endereços, favoritos e
            acompanhe cada etapa das
            suas compras.
          </p>
        </div>
      </div>

      <div className="customer-auth-form-wrapper">
        <form
          className="customer-auth-card"
          onSubmit={handleSubmit}
        >
          <header>
            <div>
              <UserRound
                size={22}
              />
            </div>

            <span>
              BEM-VINDO DE VOLTA
            </span>

            <h2>
              Entrar na conta
            </h2>

            <p>
              Entre com seu e-mail e
              senha cadastrados.
            </p>
          </header>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <label>
            <span>E-mail</span>

            <div className="customer-auth-input">
              <Mail size={18} />

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target
                      .value,
                  )
                }
                placeholder="seu@email.com"
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label>
            <span>Senha</span>

            <div className="customer-auth-input">
              <LockKeyhole
                size={18}
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
                autoComplete="current-password"
                required
              />

              <button
                type="button"
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
                    size={17}
                  />
                ) : (
                  <Eye size={17} />
                )}
              </button>
            </div>
          </label>

          <button
            type="submit"
            className="customer-auth-submit"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <LoaderCircle
                  size={18}
                  className="icon-spinning"
                />

                Entrando...
              </>
            ) : (
              <>
                Entrar

                <MoveRight
                  size={18}
                />
              </>
            )}
          </button>

          <footer>
            <span>
              Ainda não possui uma
              conta?
            </span>

            <Link to="/conta/cadastro">
              Criar minha conta
            </Link>
          </footer>
        </form>
      </div>
    </section>
  );
}