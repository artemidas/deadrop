import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import Sidebar from "./components/Sidebar";
import RequestEditor from "./components/RequestEditor";
import ResponseViewer from "./components/ResponseViewer";
import "./App.css";

export default function App() {
  const [requests, setRequests] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [name, setName] = useState("New Request");
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState([{ key: "", value: "" }]);
  const [body, setBody] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function loadRequests() {
    const list = await invoke("list_requests");
    setRequests(list);
  }

  useEffect(() => {
    loadRequests();
  }, []);

  function resetEditor() {
    setSelectedId(null);
    setName("New Request");
    setMethod("GET");
    setUrl("");
    setHeaders([{ key: "", value: "" }]);
    setBody("");
    setResponse(null);
    setError(null);
  }

  function selectRequest(req) {
    setSelectedId(req.id);
    setName(req.name);
    setMethod(req.method);
    setUrl(req.url);
    const h = Object.entries(req.headers).map(([key, value]) => ({ key, value }));
    setHeaders(h.length ? h : [{ key: "", value: "" }]);
    setBody(req.body || "");
    setResponse(null);
    setError(null);
  }

  function headersToMap() {
    const map = {};
    for (const h of headers) {
      if (h.key.trim()) map[h.key.trim()] = h.value;
    }
    return map;
  }

  async function saveRequest() {
    try {
      const args = {
        name,
        method,
        url,
        headers: headersToMap(),
        body: body || null,
      };
      if (selectedId) {
        await invoke("update_request", { id: selectedId, ...args });
      } else {
        const created = await invoke("create_request", args);
        setSelectedId(created.id);
      }
      await loadRequests();
    } catch (e) {
      setError(String(e));
    }
  }

  async function deleteRequest() {
    if (!selectedId) return;
    await invoke("delete_request", { id: selectedId });
    resetEditor();
    await loadRequests();
  }

  async function sendRequest() {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const resp = await invoke("execute_request", {
        method,
        url,
        headers: headersToMap(),
        body: body || null,
      });
      setResponse(resp);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  function updateHeader(index, field, value) {
    const next = headers.map((h, i) => (i === index ? { ...h, [field]: value } : h));
    setHeaders(next);
  }

  function addHeader() {
    setHeaders([...headers, { key: "", value: "" }]);
  }

  function removeHeader(index) {
    const next = headers.filter((_, i) => i !== index);
    setHeaders(next.length ? next : [{ key: "", value: "" }]);
  }

  return (
    <div className="flex h-screen overflow-hidden text-gray-200">
      <Sidebar
        requests={requests}
        selectedId={selectedId}
        onSelect={selectRequest}
        onNew={resetEditor}
      />

      <main className="flex-1 flex flex-col overflow-y-auto p-5 gap-4 bg-bg-primary">
        <RequestEditor
          selectedId={selectedId}
          name={name}
          setName={setName}
          method={method}
          setMethod={setMethod}
          url={url}
          setUrl={setUrl}
          headers={headers}
          body={body}
          setBody={setBody}
          loading={loading}
          onSave={saveRequest}
          onDelete={deleteRequest}
          onSend={sendRequest}
          onUpdateHeader={updateHeader}
          onAddHeader={addHeader}
          onRemoveHeader={removeHeader}
        />

        {error && (
          <div className="alert alert-error font-mono text-sm">
            {error}
          </div>
        )}

        <ResponseViewer response={response} />
      </main>
    </div>
  );
}
