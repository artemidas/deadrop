const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

export default function RequestEditor({
  selectedId,
  name,
  setName,
  method,
  setMethod,
  url,
  setUrl,
  headers,
  body,
  setBody,
  loading,
  onSave,
  onDelete,
  onSend,
  onUpdateHeader,
  onAddHeader,
  onRemoveHeader,
}) {
  return (
    <>
      {/* Request Name + Actions */}
      <div className="flex items-center gap-3">
        <input
          className="input input-bordered flex-1 bg-bg-input border-border-main text-gray-200 text-base font-semibold"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Request name"
        />
        <div className="flex gap-2">
          <button className="btn btn-sm btn-outline btn-info" onClick={onSave}>Save</button>
          {selectedId && (
            <button className="btn btn-sm btn-outline btn-error" onClick={onDelete}>Delete</button>
          )}
        </div>
      </div>

      {/* URL Bar */}
      <div className="flex gap-2">
        <select
          className="select select-bordered bg-bg-input border-border-main text-gray-200 font-bold font-mono"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          {METHODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input
          className="input input-bordered flex-1 bg-bg-input border-border-main text-gray-200 font-mono"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/endpoint"
        />
        <button
          className="btn btn-error min-w-24"
          onClick={onSend}
          disabled={loading || !url}
        >
          {loading ? <span className="loading loading-spinner loading-sm" /> : "Send"}
        </button>
      </div>

      {/* Headers */}
      <div className="space-y-2">
        <h3 className="text-xs uppercase tracking-wide text-gray-500">Headers</h3>
        {headers.map((h, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              className="input input-sm input-bordered flex-1 bg-bg-input border-border-main text-gray-200 font-mono"
              placeholder="Key"
              value={h.key}
              onChange={(e) => onUpdateHeader(i, "key", e.target.value)}
            />
            <input
              className="input input-sm input-bordered flex-1 bg-bg-input border-border-main text-gray-200 font-mono"
              placeholder="Value"
              value={h.value}
              onChange={(e) => onUpdateHeader(i, "value", e.target.value)}
            />
            <button className="btn btn-sm btn-ghost text-gray-500 hover:text-red-400" onClick={() => onRemoveHeader(i)}>
              &times;
            </button>
          </div>
        ))}
        <button className="btn btn-xs btn-ghost text-gray-500" onClick={onAddHeader}>+ Add Header</button>
      </div>

      {/* Body (for non-GET/HEAD) */}
      {method !== "GET" && method !== "HEAD" && (
        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-wide text-gray-500">Body</h3>
          <textarea
            className="textarea textarea-bordered w-full bg-bg-input border-border-main text-gray-200 font-mono text-sm"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder='{"key": "value"}'
            rows={6}
          />
        </div>
      )}
    </>
  );
}
