<script setup>
defineProps({
  response: Object,
});

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
</script>

<template>
  <div v-if="response" class="space-y-4 border-t border-border-main pt-4">
    <!-- Status bar -->
    <div class="flex items-center gap-4">
      <span :class="['badge font-mono font-bold', statusBadgeClass(response.status)]">
        {{ response.status }} {{ response.status_text }}
      </span>
      <span class="text-sm font-mono text-gray-500">{{ response.elapsed_ms }} ms</span>
      <span class="text-sm font-mono text-gray-500">{{ formatBytes(response.size_bytes) }}</span>
    </div>

    <!-- Response Headers -->
    <div tabindex="0" class="collapse collapse-arrow">
      <div class="collapse-title px-0 text-xs uppercase tracking-wide text-gray-500">Response Headers</div>
      <div class="collapse-content ">
        <div class="text-xs font-mono space-y-0.5">
          <div v-for="(v, k) in response.headers" :key="k" class="flex gap-2">
            <span class="text-accent min-w-44">{{ k }}</span>
            <span class="text-gray-500 break-all">{{ v }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Response Body -->
    <div class="space-y-1">
      <h3 class="text-xs uppercase tracking-wide text-gray-500">Response Body</h3>
      <pre class="bg-bg-input border border-border-main rounded-md p-3 font-mono text-sm overflow-auto max-h-96 whitespace-pre-wrap break-words">
        {{ formatBody(response.body) }}
      </pre>
    </div>
  </div>
</template>
