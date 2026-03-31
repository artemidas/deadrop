<script setup>
import { ref, onMounted } from "vue";
import { invoke } from "@tauri-apps/api/core";
import Sidebar from "./components/Sidebar.vue";
import RequestUrlBar from "./components/RequestUrlBar.vue";
import RequestEditor from "./components/RequestEditor.vue";
import ResponseViewer from "./components/ResponseViewer.vue";
import "./App.css";

const requests = ref([]);
const selectedId = ref(null);
const name = ref("New Request");
const method = ref("GET");
const url = ref("");
const headers = ref([{ key: "", value: "" }]);
const params = ref([{ key: "", value: "" }]);
const body = ref("");
const response = ref(null);
const loading = ref(false);
const error = ref(null);

async function loadRequests() {
  const list = await invoke("list_requests");
  requests.value = list;
}

onMounted(() => {
  loadRequests();
});

function resetEditor() {
  selectedId.value = null;
  name.value = "New Request";
  method.value = "GET";
  url.value = "";
  headers.value = [{ key: "", value: "" }];
  params.value = [{ key: "", value: "" }];
  body.value = "";
  response.value = null;
  error.value = null;
}

function newRequest() {
  resetEditor();
  saveRequest();
}

function selectRequest(req) {
  selectedId.value = req.id;
  name.value = req.name;
  method.value = req.method;
  url.value = req.url;
  const h = Object.entries(req.headers).map(([key, value]) => ({ key, value }));
  headers.value = h.length ? h : [{ key: "", value: "" }];
  const p = Object.entries(req.params).map(([key, value]) => ({ key, value }));
  params.value = p.length ? p : [{ key: "", value: "" }];
  body.value = req.body || "";  
  response.value = req.last_response || null;
  error.value = null;
}

function headersToMap() {
  const map = {};
  for (const h of headers.value) {
    if (h.key.trim()) map[h.key.trim()] = h.value;
  }
  return map;
}

function paramsToMap() {
  const map = {};
  for (const p of params.value) {
    map[p.key] = p.value;
  }
  return map;
}

async function saveRequest() {
  try {
    const args = {
      name: name.value,
      method: method.value,
      url: url.value,
      headers: headersToMap(),
      params: paramsToMap(),
      body: body.value || null,
    };
    if (selectedId.value) {
      await invoke("update_request", { id: selectedId.value, ...args });
    } else {
      const created = await invoke("create_request", args);
      selectedId.value = created.id;
    }
    await loadRequests();
  } catch (e) {
    error.value = String(e);
  }
}

async function deleteRequest() {
  if (!selectedId.value) return;
  await invoke("delete_request", { id: selectedId.value });
  resetEditor();
  await loadRequests();
}

async function sendRequest() {
  loading.value = true;
  error.value = null;
  response.value = null;
  try {
    const resp = await invoke("execute_request", {
      id: selectedId.value || null,
      method: method.value,
      url: url.value,
      headers: headersToMap(),
      params: paramsToMap(),
      body: body.value || null,
    });
    response.value = resp;
  } catch (e) {
    error.value = String(e);
  } finally {
    loading.value = false;
  }
}

function updateParam(index, field, value) {
  params.value[index][field] = value;
}

function addParam() {
  params.value.push({ key: "", value: "" });
}

function removeParam(index) {
  params.value.splice(index, 1);
}

function updateHeader(index, field, value) {
  headers.value[index][field] = value;
}

function addHeader() {
  headers.value.push({ key: "", value: "" });
}

function removeHeader(index) {
  headers.value.splice(index, 1);
  if (headers.value.length === 0) {
    headers.value.push({ key: "", value: "" });
  }
}
</script>

<template>
  <div class="flex h-screen overflow-hidden text-gray-200">
    <Sidebar
      :requests="requests"
      :selectedId="selectedId"
      @select="selectRequest"
      @new="newRequest"
    />

    <main class="flex-1 flex flex-col overflow-hidden p-5 gap-4 bg-bg-primary">
      <!-- URL bar spanning full width -->
      <RequestUrlBar
        :selectedId="selectedId"
        v-model:name="name"
        v-model:method="method"
        v-model:url="url"
        v-model:params="params"
        :loading="loading"
        @save="saveRequest"
        @delete="deleteRequest"
        @send="sendRequest"
      />

      <div v-if="error" class="alert alert-error font-mono text-sm shrink-0">
        {{ error }}
      </div>

      <!-- Split pane: request left, response right -->
      <div class="flex-1 flex gap-4 overflow-hidden min-h-0">
        <div class="flex-1 min-w-0 overflow-hidden">
          <RequestEditor
            :method="method"
            :headers="headers"
            :params="params"
            v-model:body="body"
            @update-header="updateHeader"
            @add-header="addHeader"
            @remove-header="removeHeader"
            @update-param="updateParam"
            @add-param="addParam"
            @remove-param="removeParam"
          />
        </div>
        <div class="flex-1 min-w-0 overflow-hidden border-l border-border-main pl-4">
          <ResponseViewer :response="response" />
        </div>
      </div>
    </main>
  </div>
</template>
