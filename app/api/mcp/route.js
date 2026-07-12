import { NextResponse } from "next/server";
import { validateApiKey } from "@/lib/mcp/auth";
import { TOOL_DEFINITIONS, executeTool } from "@/lib/mcp/tools";

export const runtime = "nodejs";
export const maxDuration = 60;

const SERVER_INFO = {
  name: "ai-product-os",
  version: "1.0.0",
  description: "AI Product OS — manage your projects, todos, blueprints, DB schema and more",
};

function jsonRpcOk(id, result) {
  return NextResponse.json({ jsonrpc: "2.0", id, result });
}

function jsonRpcErr(id, code, message) {
  return NextResponse.json({ jsonrpc: "2.0", id, error: { code, message } });
}

export async function POST(request) {
  // Auth
  const authHeader = request.headers.get("authorization");
  const auth = await validateApiKey(authHeader);
  if (!auth) {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32001, message: "Unauthorized: invalid or missing API key" } },
      { status: 401 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonRpcErr(null, -32700, "Parse error");
  }

  const { method, params, id } = body;

  try {
    // ── initialize ──────────────────────────────────────────────────────────
    if (method === "initialize") {
      return jsonRpcOk(id, {
        protocolVersion: "2024-11-05",
        serverInfo: SERVER_INFO,
        capabilities: { tools: {} },
      });
    }

    // ── notifications/initialized ────────────────────────────────────────────
    if (method === "notifications/initialized") {
      return new NextResponse(null, { status: 204 });
    }

    // ── tools/list ──────────────────────────────────────────────────────────
    if (method === "tools/list") {
      return jsonRpcOk(id, { tools: TOOL_DEFINITIONS });
    }

    // ── tools/call ──────────────────────────────────────────────────────────
    if (method === "tools/call") {
      const { name, arguments: args = {} } = params || {};
      if (!name) return jsonRpcErr(id, -32602, "Missing tool name");

      const tool = TOOL_DEFINITIONS.find((t) => t.name === name);
      if (!tool) return jsonRpcErr(id, -32602, `Unknown tool: ${name}`);

      const result = await executeTool(name, args, auth.userId);

      return jsonRpcOk(id, {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      });
    }

    // ── ping ────────────────────────────────────────────────────────────────
    if (method === "ping") {
      return jsonRpcOk(id, {});
    }

    return jsonRpcErr(id, -32601, `Method not found: ${method}`);
  } catch (err) {
    console.error("[MCP]", err);
    return jsonRpcErr(id, -32603, err.message || "Internal error");
  }
}

// GET — returns server info + available tools (useful for debugging)
export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  const auth = await validateApiKey(authHeader);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  return NextResponse.json({
    server: SERVER_INFO,
    endpoint: `${appUrl}/api/mcp`,
    authenticated: !!auth,
    tools: auth ? TOOL_DEFINITIONS.map((t) => ({ name: t.name, description: t.description })) : [],
    cursor_config: auth
      ? {
          mcpServers: {
            "ai-product-os": {
              url: `${appUrl}/api/mcp`,
              headers: { Authorization: "Bearer YOUR_API_KEY_HERE" },
            },
          },
        }
      : null,
    claude_desktop_config: auth
      ? {
          mcpServers: {
            "ai-product-os": {
              command: "npx",
              args: ["-y", "mcp-remote", `${appUrl}/api/mcp`],
              env: { MCP_REMOTE_AUTH: "Bearer YOUR_API_KEY_HERE" },
            },
          },
        }
      : null,
  });
}
