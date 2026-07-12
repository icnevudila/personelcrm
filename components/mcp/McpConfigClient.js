"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/formatRelativeTime";

export default function McpConfigClient() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyName, setKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("cursor");

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    try {
      const res = await fetch("/api/mcp/keys");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setKeys(data.keys || []);
    } catch (err) {
      toast.error("API Anahtarları yüklenemedi: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateKey(e) {
    e.preventDefault();
    if (!keyName.trim()) return;

    try {
      const res = await fetch("/api/mcp/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setGeneratedKey(data.key);
      setKeyName("");
      fetchKeys();
    } catch (err) {
      toast.error("Anahtar üretilemedi: " + err.message);
    }
  }

  async function handleDeleteKey(id) {
    if (!confirm("Bu anahtarı silmek istediğinizden emin misiniz? Bu anahtarı kullanan asistanların erişimi kesilecektir.")) return;

    try {
      const res = await fetch("/api/mcp/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Anahtar iptal edildi.");
      fetchKeys();
    } catch (err) {
      toast.error("Anahtar silinemedi: " + err.message);
    }
  }

  const cursorConfig = (key) => JSON.stringify({
    mcpServers: {
      "ai-product-os": {
        url: "https://personelcrm.vercel.app/api/mcp",
        headers: {
          Authorization: `Bearer ${key || "SENIN_KEY_BURAYA"}`
        }
      }
    }
  }, null, 2);

  const claudeConfig = (key) => JSON.stringify({
    mcpServers: {
      "ai-product-os": {
        command: "npx",
        args: ["-y", "mcp-remote", "https://personelcrm.vercel.app/api/mcp"],
        env: {
          MCP_REMOTE_AUTH: `Bearer ${key || "SENIN_KEY_BURAYA"}`
        }
      }
    }
  }, null, 2);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Kopyalandı!");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">AI Asistan Erişimi (MCP)</h1>
        <p className="text-sm text-zinc-500">
          Cursor, Claude Desktop, Windsurf, Codex veya Grok gibi asistanları bu sisteme bağlayarak kod yazarken proje verilerini otomatik güncelletin.
        </p>
      </div>

      {/* Info Banner */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Nasıl Çalışır?</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          AI Product OS, standart <strong>Model Context Protocol (MCP)</strong> sunmaktadır. Geliştirme yaptığınız editördeki AI asistanına aşağıdaki config'i verdiğinizde, AI asistanınız sizin adınıza bu siteye veri okuyup yazabilir.
        </p>
        <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Endpoint: <code className="bg-zinc-100 px-1.5 py-0.5 rounded font-mono dark:bg-zinc-850">https://personelcrm.vercel.app/api/mcp</code>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* API Keys */}
        <div className="md:col-span-5 space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold mb-4 text-zinc-900 dark:text-zinc-100">Kişisel Erişim Anahtarları</h2>

            {/* Form */}
            <form onSubmit={handleCreateKey} className="flex gap-2 mb-4">
              <input
                type="text"
                required
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Örn: Cursor Key, Home PC"
                className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
              />
              <button
                type="submit"
                className="rounded-lg bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Yeni Key
              </button>
            </form>

            {/* Generated Key Modal/Alert */}
            {generatedKey && (
              <div className="mb-4 rounded-lg bg-amber-50 p-4 border border-amber-200 text-xs dark:bg-amber-950/20 dark:border-amber-900/50 space-y-2">
                <p className="font-semibold text-amber-800 dark:text-amber-400">⚠️ Anahtarı Şimdi Kopyalayın!</p>
                <p className="text-zinc-600 dark:text-zinc-400">Bu anahtar güvenlik nedeniyle veritabanında şifrelenir ve <strong>bir daha gösterilmeyecektir</strong>.</p>
                <div className="flex items-center gap-1.5 bg-white p-2 rounded border border-amber-200 dark:bg-zinc-950 dark:border-zinc-800 font-mono text-zinc-800 dark:text-zinc-200 select-all overflow-x-auto">
                  <span className="flex-1 truncate">{generatedKey}</span>
                  <button
                    onClick={() => {
                      copyToClipboard(generatedKey);
                      setGeneratedKey(null); // Clear once copied to enforce safety
                    }}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 shrink-0"
                  >
                    Kopyala
                  </button>
                </div>
              </div>
            )}

            {/* Keys list */}
            {loading ? (
              <p className="text-xs text-zinc-400">Yükleniyor...</p>
            ) : keys.length === 0 ? (
              <p className="text-xs text-zinc-500">Henüz hiç erişim anahtarı oluşturulmamış.</p>
            ) : (
              <div className="space-y-2">
                {keys.map((k) => (
                  <div key={k.id} className="flex items-center justify-between p-2 rounded-lg border border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50 text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-800 dark:text-zinc-250 truncate">{k.name}</p>
                      <p className="font-mono text-zinc-400 mt-0.5">{k.key_prefix}...</p>
                      {k.last_used_at && (
                        <p className="text-[10px] text-zinc-400">Son kullanım: {formatRelativeTime(k.last_used_at)}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteKey(k.id)}
                      className="text-red-500 font-semibold hover:text-red-700 p-1"
                    >
                      İptal Et
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Configurations */}
        <div className="md:col-span-7 space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold mb-4 text-zinc-900 dark:text-zinc-100">AI Asistan Kurulumu</h2>

            {/* Tabs */}
            <div className="flex border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <button
                onClick={() => setActiveTab("cursor")}
                className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors ${activeTab === "cursor" ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100" : "border-transparent text-zinc-400"}`}
              >
                Cursor / Windsurf
              </button>
              <button
                onClick={() => setActiveTab("claude")}
                className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors ${activeTab === "claude" ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100" : "border-transparent text-zinc-400"}`}
              >
                Claude Desktop
              </button>
              <button
                onClick={() => setActiveTab("other")}
                className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors ${activeTab === "other" ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100" : "border-transparent text-zinc-400"}`}
              >
                Grok / Windsurf / Codex
              </button>
            </div>

            {/* Tab content */}
            {activeTab === "cursor" && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-500">
                  Cursor'da <strong>Settings &gt; Features &gt; MCP</strong> kısmına gidin ve yeni bir sunucu ekleyin veya projenizin <code>.cursor/mcp.json</code> dosyasına şu config'i yapıştırın:
                </p>
                <div className="relative group">
                  <pre className="bg-zinc-950 p-3 rounded-lg text-zinc-200 text-xs font-mono overflow-x-auto select-all max-h-[300px]">
                    {cursorConfig()}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(cursorConfig())}
                    className="absolute top-2 right-2 bg-zinc-800 text-zinc-300 text-[10px] font-semibold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-700"
                  >
                    Kopyala
                  </button>
                </div>
              </div>
            )}

            {activeTab === "claude" && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-500">
                  Claude Desktop config dosyanıza (<code>~/Library/Application Support/Claude/claude_desktop_config.json</code>) şu sunucuyu ekleyin:
                </p>
                <div className="relative group">
                  <pre className="bg-zinc-950 p-3 rounded-lg text-zinc-200 text-xs font-mono overflow-x-auto select-all max-h-[300px]">
                    {claudeConfig()}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(claudeConfig())}
                    className="absolute top-2 right-2 bg-zinc-800 text-zinc-300 text-[10px] font-semibold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-700"
                  >
                    Kopyala
                  </button>
                </div>
              </div>
            )}

            {activeTab === "other" && (
              <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-400">
                <p>Herhangi bir MCP uyumlu istemciye şu parametreleri verebilirsiniz:</p>
                <ul className="list-disc pl-4 space-y-1 font-sans">
                  <li><strong>Endpoint URL:</strong> <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">https://personelcrm.vercel.app/api/mcp</code></li>
                  <li><strong>Auth Yöntemi:</strong> Bearer token header'ı üzerinden</li>
                  <li><strong>Header Anahtarı:</strong> <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">Authorization: Bearer &lt;key&gt;</code></li>
                </ul>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-2">Kullanılabilir Araçlar (Tools):</p>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                  <div className="bg-zinc-50 p-1.5 rounded dark:bg-zinc-900">list_projects</div>
                  <div className="bg-zinc-50 p-1.5 rounded dark:bg-zinc-900">get_project</div>
                  <div className="bg-zinc-50 p-1.5 rounded dark:bg-zinc-900">add_todo</div>
                  <div className="bg-zinc-50 p-1.5 rounded dark:bg-zinc-900">complete_todo</div>
                  <div className="bg-zinc-50 p-1.5 rounded dark:bg-zinc-900">update_blueprint</div>
                  <div className="bg-zinc-50 p-1.5 rounded dark:bg-zinc-900">update_db_schema</div>
                  <div className="bg-zinc-50 p-1.5 rounded dark:bg-zinc-900">add_update</div>
                  <div className="bg-zinc-50 p-1.5 rounded dark:bg-zinc-900">set_live_url</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
