<script setup>
import { ref, computed, watch } from "vue";
import hljs from "highlight.js/lib/core";
import json from "highlight.js/lib/languages/json";
import xml from "highlight.js/lib/languages/xml";
import javascript from "highlight.js/lib/languages/javascript";

hljs.registerLanguage("json", json);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("javascript", javascript);

const props = defineProps({
  method: String,
  url: String,
  headers: Array,
  body: String,
});

const emit = defineEmits([
  "update:body",
  "update-header",
  "add-header",
  "remove-header",
]);

const activeTab = ref("headers");

watch(() => props.method, () => {
  if (activeTab.value === "body" && (props.method === "GET" || props.method === "HEAD")) {
    activeTab.value = "headers";
  }
});
const backdropRef = ref(null);

const highlightedBody = computed(() => {
  if (!props.body) return "";
  try {
    return hljs.highlightAuto(props.body).value;
  } catch {
    return props.body;
  }
});

function syncScroll(e) {
  if (backdropRef.value) {
    backdropRef.value.scrollTop = e.target.scrollTop;
    backdropRef.value.scrollLeft = e.target.scrollLeft;
  }
}
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Tabs -->
    <div class="flex gap-1 border-b border-border-main shrink-0">
      <button
        :class="['px-3 py-1.5 text-xs uppercase tracking-wide transition-colors', activeTab === 'params' ? 'text-accent border-b-2 border-accent' : 'text-gray-500 hover:text-gray-300']"
        @click="activeTab = 'params'"
      >Params</button>
      <button
        :class="['px-3 py-1.5 text-xs uppercase tracking-wide transition-colors', activeTab === 'headers' ? 'text-accent border-b-2 border-accent' : 'text-gray-500 hover:text-gray-300']"
        @click="activeTab = 'headers'"
      >Headers</button>
      <button
        v-if="method !== 'GET' && method !== 'HEAD'"
        :class="['px-3 py-1.5 text-xs uppercase tracking-wide transition-colors', activeTab === 'body' ? 'text-accent border-b-2 border-accent' : 'text-gray-500 hover:text-gray-300']"
        @click="activeTab = 'body'"
      >Body</button>
    </div>

    <!-- Tab Content -->
    <div class="flex-1 overflow-y-auto pt-3">
      <!-- Params -->
      <div v-if="activeTab === 'params'" class="space-y-2 text-sm text-gray-500">
        <div v-if="url && url.includes('?')" class="text-xs font-mono space-y-0.5">
          <div v-for="param in url.split('?')[1]?.split('&') || []" :key="param" class="flex gap-2">
            <span class="text-accent">{{ param.split('=')[0] }}</span>
            <span class="text-gray-400">{{ decodeURIComponent(param.split('=')[1] || '') }}</span>
          </div>
        </div>
        <p v-else class="text-xs italic">No query parameters</p>
      </div>

      <!-- Headers -->
      <div v-if="activeTab === 'headers'" class="space-y-2">
        <div v-for="(h, i) in headers" :key="i" class="flex gap-2 items-center">
          <input
            class="input input-sm input-bordered flex-1 bg-bg-input border-border-main text-gray-200 font-mono"
            placeholder="Key"
            :value="h.key"
            @input="emit('update-header', i, 'key', $event.target.value)"
          />
          <input
            class="input input-sm input-bordered flex-1 bg-bg-input border-border-main text-gray-200 font-mono"
            placeholder="Value"
            :value="h.value"
            @input="emit('update-header', i, 'value', $event.target.value)"
          />
          <button class="btn btn-sm btn-ghost text-gray-500 hover:text-red-400" @click="emit('remove-header', i)">
            &times;
          </button>
        </div>
        <button class="btn btn-xs btn-ghost text-gray-500" @click="emit('add-header')">+ Add Header</button>
      </div>

      <!-- Body -->
      <div v-if="activeTab === 'body'" class="h-full min-h-48 relative">
        <pre
          ref="backdropRef"
          class="hljs absolute inset-0 bg-bg-input border border-border-main rounded-lg p-3 font-mono text-sm overflow-auto whitespace-pre-wrap break-words pointer-events-none"
          aria-hidden="true"
        ><code v-html="highlightedBody || '&nbsp;'"></code></pre>
        <textarea
          class="absolute inset-0 w-full h-full bg-transparent text-transparent caret-gray-200 border border-border-main rounded-lg p-3 font-mono text-sm overflow-auto whitespace-pre-wrap break-words resize-none outline-none"
          :value="body"
          @input="emit('update:body', $event.target.value)"
          @scroll="syncScroll"
          placeholder='{"key": "value"}'
          spellcheck="false"
        />
      </div>
    </div>
  </div>
</template>
