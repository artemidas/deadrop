const METHOD_COLORS = {
  GET: "text-blue-400",
  POST: "text-green-400",
  PUT: "text-orange-400",
  PATCH: "text-teal-400",
  DELETE: "text-red-400",
  HEAD: "text-purple-400",
  OPTIONS: "text-sky-400",
};

export default function Sidebar({ requests, selectedId, onSelect, onNew }) {
  return (
    <aside className="w-64 min-w-64 bg-bg-secondary border-r border-border-main flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border-main">
        <h2 className="text-lg font-bold text-accent">Deadrop</h2>
        <button className="btn btn-xs btn-error" onClick={onNew}>+ New</button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {requests.map((req) => (
          <div
            key={req.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors hover:bg-bg-tertiary ${
              selectedId === req.id ? "bg-bg-tertiary border-l-3 border-accent" : ""
            }`}
            onClick={() => onSelect(req)}
          >
            <span className={`text-xs font-bold font-mono min-w-12 ${METHOD_COLORS[req.method] || "text-gray-400"}`}>
              {req.method}
            </span>
            <span className="truncate text-sm text-gray-400">
              {req.name}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}
