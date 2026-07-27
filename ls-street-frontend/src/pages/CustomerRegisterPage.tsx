import {
  ArrowLeft,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MoveRight,
  Phone,
  UserPlus,
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
} from "react-router";

import {
  useAuth,
} from "../contexts/AuthContext";

import {
  ApiError,
} from "../lib/api";

export function CustomerRegisterPage() {
  const navigate =
    useNavigate();

  const {
    user,
    loading,
    authenticated,
    register,
  } = useAuth();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    passwordConfirmation,
    setPasswordConfirmation,
  ] = useState("");

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
        to="/minha-conta"
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

  function validateForm() {
    const normalizedName =
      name.trim();

    if (
      normalizedName.length <
      3
    ) {
      return "Informe seu nome completo.";
    }

    const normalizedPhone =
      phone.trim();

    if (
      normalizedPhone &&
      normalizedPhone.length < 10
    ) {
      return "Informe um telefone válido.";
    }

    if (
      password.length < 8
    ) {
      return "A senha deve possuir pelo menos 8 caracteres.";
    }

    if (
      !/[a-z]/.test(password)
    ) {
      return "A senha deve conter uma letra minúscula.";
    }

    if (
      !/[A-Z]/.test(password)
    ) {
      return "A senha deve conter uma letra maiúscula.";
    }

    if (
      !/[0-9]/.test(password)
    ) {
      return "A senha deve conter um número.";
    }

    if (
      password !==
      passwordConfirmation
    ) {
      return "As senhas não são iguais.";
    }

    return null;
  }

  async function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setError(
        validationError,
      );

      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const normalizedPhone =
        phone.trim();

      await register({
        name: name.trim(),

        email:
          email
            .trim()
            .toLowerCase(),

        password,

        phone:
          normalizedPhone ||
          undefined,
      });

      navigate(
        "/minha-conta",
        {
          replace: true,
        },
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof
          ApiError
          ? caughtError.message
          : "Não foi possível criar sua conta.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="customer-auth-page">
      <div className="customer-auth-presentation customer-register-presentation">
        <Link
          to="/"
          className="customer-auth-back"
        >
          <ArrowLeft size={18} />
          Voltar para a loja
        </Link>

        <div>
          <span>
            FAÇA PARTE
          </span>

          <h1>
            Entre para a
            LS STREET.
          </h1>

          <p>
            Crie sua conta para
            comprar, salvar produtos
            e acompanhar seus pedidos.
          </p>
        </div>
      </div>

      <div className="customer-auth-form-wrapper">
        <form
          className="customer-auth-card customer-register-card"
          onSubmit={handleSubmit}
        >
          <header>
            <div>
              <UserPlus
                size={22}
              />
            </div>

            <span>
              NOVO CLIENTE
            </span>

            <h2>
              Criar minha conta
            </h2>

            <p>
              Preencha seus dados para
              começar.
            </p>
          </header>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <label>
            <span>Nome</span>

            <div className="customer-auth-input">
              <UserRound
                size={18}
              />

              <input
                value={name}
                onChange={(event) =>
                  setName(
                    event.target
                      .value,
                  )
                }
                minLength={3}
                maxLength={100}
                placeholder="Seu nome completo"
                autoComplete="name"
                required
              />
            </div>
          </label>

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
            <span>
              Telefone
              <small>
                opcional
              </small>
            </span>

            <div className="customer-auth-input">
              <Phone size={18} />

              <input
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(
                    event.target
                      .value,
                  )
                }
                maxLength={20}
                placeholder="(00) 00000-0000"
                autoComplete="tel"
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
                minLength={8}
                maxLength={72}
                placeholder="Crie uma senha"
                autoComplete="new-password"
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

          <label>
            <span>
              Confirmar senha
            </span>

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
                value={
                  passwordConfirmation
                }
                onChange={(event) =>
                  setPasswordConfirmation(
                    event.target
                      .value,
                  )
                }
                placeholder="Repita a senha"
                autoComplete="new-password"
                required
              />
            </div>
          </label>

          <div className="customer-password-rules">
            <span>
              A senha deve conter:
            </span>

            <ul>
              <li>
                no mínimo 8 caracteres;
              </li>

              <li>
                uma letra maiúscula;
              </li>

              <li>
                uma letra minúscula;
              </li>

              <li>
                pelo menos um número.
              </li>
            </ul>
          </div>

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

                Criando conta...
              </>
            ) : (
              <>
                Criar conta

                <MoveRight
                  size={18}
                />
              </>
            )}
          </button>

          <footer>
            <span>
              Já possui uma conta?
            </span>

            <Link to="/conta/entrar">
              Entrar agora
            </Link>
          </footer>
        </form>
      </div>
    </section>
  );
}