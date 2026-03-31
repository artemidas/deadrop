<script setup>
import { ref, computed } from "vue";
import SecurityScanner from "./SecurityScanner.vue";
import hljs from "highlight.js/lib/core";
import json from "highlight.js/lib/languages/json";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";

hljs.registerLanguage("json", json);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("javascript", javascript);

const props = defineProps({
  response: Object,
});

const activeTab = ref("body");

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

const highlightedBody = computed(() => {
  if (!props.response) return "";
  const formatted = formatBody(props.response.body);
  try {
    const result = hljs.highlightAuto(formatted);
    return result.value;
  } catch {
    return formatted;
  }
});
</script>

<template>
  <div v-if="response" class="flex flex-col h-full overflow-hidden">
    <!-- Tabs -->
    <div class="flex gap-1 border-b border-border-main">
      <div class="flex-1">
        <button
          :class="['px-3 py-1.5 text-xs uppercase tracking-wide transition-colors', activeTab === 'body' ? 'text-accent border-b-2 border-accent' : 'text-gray-500 hover:text-gray-300']"
          @click="activeTab = 'body'"
        >Body</button>
        <button
          :class="['px-3 py-1.5 text-xs uppercase tracking-wide transition-colors', activeTab === 'headers' ? 'text-accent border-b-2 border-accent' : 'text-gray-500 hover:text-gray-300']"
          @click="activeTab = 'headers'"
        >Headers</button>
        <button
          :class="['px-3 py-1.5 text-xs uppercase tracking-wide transition-colors', activeTab === 'security' ? 'text-accent border-b-2 border-accent' : 'text-gray-500 hover:text-gray-300']"
          @click="activeTab = 'security'"
        >Security</button>
      </div>
      <!-- Status bar -->
      <div class="flex items-center gap-4 mb-3">
        <span :class="['badge font-mono font-bold', statusBadgeClass(response.status)]">
          {{ response.status }} {{ response.status_text }}
        </span>
        <span class="text-sm font-mono text-gray-500">{{ response.elapsed_ms }} ms</span>
        <span class="text-sm font-mono text-gray-500">{{ formatBytes(response.size_bytes) }}</span>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="flex-1 overflow-y-auto mt-3">
      <!-- Body -->
      <pre v-if="activeTab === 'body'" class="hljs bg-bg-input border border-border-main rounded-md p-3 font-mono text-sm overflow-auto whitespace-pre-wrap break-words h-full"><code v-html="highlightedBody"></code></pre>

      <!-- Headers -->
      <div v-if="activeTab === 'headers'" class="text-xs font-mono space-y-0.5">
        <table class="table table-sm table-bordered">
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(v, k) in response.headers" :key="k">
              <td class="text-accent min-w-44">{{ k }}</td>
              <td class="text-gray-500 break-all">{{ v }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Security -->
      <SecurityScanner v-if="activeTab === 'security'" :headers="response.headers" />
    </div>
  </div>

  <div v-else class="flex items-center justify-center h-full text-gray-600 text-sm italic">
    Send a request to see the response
  </div>
</template>
