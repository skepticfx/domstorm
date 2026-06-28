const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=60"
};

const SECURITY_HEADERS = {
  "content-security-policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "frame-src 'self' blob:",
    "worker-src 'self'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join("; "),
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()"
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({
        ok: true,
        app: "DOM Lab",
        edge: "cloudflare-workers"
      });
    }

    if (url.pathname === "/api/modules") {
      return serveSeedModules(request, env);
    }

    const legacyRedirect = getLegacyRedirect(url);
    if (legacyRedirect) {
      return Response.redirect(`${url.origin}${legacyRedirect}`, 308);
    }

    const response = await env.ASSETS.fetch(request);
    return withSecurityHeaders(response);
  }
};

async function serveSeedModules(request, env) {
  const assetUrl = new URL("/data/modules.json", request.url);
  const response = await env.ASSETS.fetch(new Request(assetUrl, request));

  if (!response.ok) {
    return json({ modules: [] }, { status: 503 });
  }

  const modules = await response.json();
  return json(modules, { headers: JSON_HEADERS });
}

function getLegacyRedirect(url) {
  if (url.pathname === "/modules/run") {
    const id = url.searchParams.get("id");
    return id ? `/runner/${encodeURIComponent(id)}` : "/modules";
  }

  if (url.pathname === "/modules") {
    const id = url.searchParams.get("id");
    return id ? `/module/${encodeURIComponent(id)}` : "/modules";
  }

  if (url.pathname === "/mymodules") return "/modules?filter=local";
  if (url.pathname === "/helper") return "/about";
  if (url.pathname === "/search") {
    const query = url.searchParams.get("q");
    return query ? `/modules?q=${encodeURIComponent(query)}` : "/modules";
  }

  return null;
}

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...JSON_HEADERS,
      ...(init.headers || {}),
      ...SECURITY_HEADERS
    }
  });
}

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }

  if (headers.get("content-type")?.includes("text/html")) {
    headers.set("cache-control", "public, max-age=0, must-revalidate");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
