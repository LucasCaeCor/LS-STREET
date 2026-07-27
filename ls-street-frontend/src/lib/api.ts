const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:3333";

const ACCESS_TOKEN_KEY =
  "ls_street_access_token";

export interface ApiErrorBody {
  statusCode?: number;
  code?: string;
  message?: string;
  errors?: unknown;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  errors?: unknown;

  constructor(
    message: string,
    status: number,
    code?: string,
    errors?: unknown,
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

export function getAccessToken() {
  return localStorage.getItem(
    ACCESS_TOKEN_KEY,
  );
}

export function setAccessToken(
  token: string,
) {
  localStorage.setItem(
    ACCESS_TOKEN_KEY,
    token,
  );
}

export function removeAccessToken() {
  localStorage.removeItem(
    ACCESS_TOKEN_KEY,
  );
}

interface RequestOptions
  extends RequestInit {
  retryOnUnauthorized?: boolean;
}

let refreshPromise:
  Promise<string | null> | null =
  null;

async function executeRefreshSession():
  Promise<string | null> {
  const response = await fetch(
  `${API_URL}/auth/refresh`,
  {
    method: "POST",

    headers: {
      "Content-Type":
        "application/json",
    },

    body: JSON.stringify({}),

    credentials: "include",
  },
);

  if (!response.ok) {
    removeAccessToken();

    return null;
  }

  const result =
    await response.json();

  const token =
    result?.data?.accessToken;

  if (
    typeof token !== "string"
  ) {
    removeAccessToken();

    return null;
  }

  setAccessToken(token);

  return token;
}

async function refreshSession():
  Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise =
    executeRefreshSession()
      .finally(() => {
        refreshPromise = null;
      });

  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    retryOnUnauthorized = true,
    headers,
    ...fetchOptions
  } = options;

  const accessToken =
    getAccessToken();

  const requestHeaders =
    new Headers(headers);

  if (
    fetchOptions.body &&
    !requestHeaders.has(
      "Content-Type",
    ) &&
    !(fetchOptions.body instanceof FormData)
  ) {
    requestHeaders.set(
      "Content-Type",
      "application/json",
    );
  }

  if (accessToken) {
    requestHeaders.set(
      "Authorization",
      `Bearer ${accessToken}`,
    );
  }

  let response = await fetch(
    `${API_URL}${path}`,
    {
      ...fetchOptions,
      headers: requestHeaders,
      credentials: "include",
    },
  );

  if (
    response.status === 401 &&
    retryOnUnauthorized
  ) {
    const refreshedToken =
      await refreshSession();

    if (refreshedToken) {
      requestHeaders.set(
        "Authorization",
        `Bearer ${refreshedToken}`,
      );

      response = await fetch(
        `${API_URL}${path}`,
        {
          ...fetchOptions,
          headers: requestHeaders,
          credentials: "include",
        },
      );
    }
  }

  if (!response.ok) {
    let body: ApiErrorBody;

try {
  body =
    (await response.json()) as
      ApiErrorBody;
} catch {
  body = {};
}

    throw new ApiError(
      body.message ??
        "Não foi possível concluir a solicitação.",
      response.status,
      body.code,
      body.errors,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}