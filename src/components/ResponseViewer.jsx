function statusBadgeClass(code) {
  if (code < 300) return "badge-success";
  if (code < 400) return "badge-warning";
  return "badge-error";
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatBody(body) {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

export default function ResponseViewer({ response }) {
  if (!response) return null;

  return (
    <div className="space-y-4 border-t border-border-main pt-4">
      {/* Status bar */}
      <div className="flex items-center gap-4">
        <span className={`badge ${statusBadgeClass(response.status)} font-mono font-bold`}>
          {response.status} {response.status_text}
        </span>
        <span className="text-sm font-mono text-gray-500">{response.elapsed_ms} ms</span>
        <span className="text-sm font-mono text-gray-500">{formatBytes(response.size_bytes)}</span>
      </div>

      {/* Response Headers */}
      <div className="space-y-1">
        <h3 className="text-xs uppercase tracking-wide text-gray-500">Response Headers</h3>
        <div className="text-xs font-mono space-y-0.5">
          {Object.entries(response.headers).map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="text-accent min-w-44">{k}</span>
              <span className="text-gray-500 break-all">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Response Body */}
      <div className="space-y-1">
        <h3 className="text-xs uppercase tracking-wide text-gray-500">Response Body</h3>
        <pre className="bg-bg-input border border-border-main rounded-md p-3 font-mono text-sm overflow-auto max-h-96 whitespace-pre-wrap break-words">
          {formatBody(response.body)}
        </pre>
      </div>
    </div>
  );
}
