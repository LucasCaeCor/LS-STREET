import {
  Link,
} from "react-router";

export function NotFoundPage() {
  return (
    <main className="not-found-page">
      <span>404</span>

      <h1>
        Página não encontrada
      </h1>

      <Link to="/admin">
        Voltar ao dashboard
      </Link>
    </main>
  );
}