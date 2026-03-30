<script setup>
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

const props = defineProps({
  selectedId: String,
  name: String,
  method: String,
  url: String,
  headers: Array,
  body: String,
  loading: Boolean,
});

const emit = defineEmits([
  "update:name",
  "update:method",
  "update:url",
  "update:body",
  "save",
  "delete",
  "send",
  "update-header",
  "add-header",
  "remove-header",
]);
</script>

<template>
  <!-- Request Name + Actions -->
  <div class="flex items-center gap-3">
    <input
      class="input input-bordered flex-1 bg-bg-input border-border-main text-gray-200 text-base font-semibold"
      :value="name"
      @input="emit('update:name', $event.target.value)"
      placeholder="Request name"
    />
    <div class="flex gap-2">
      <button class="btn btn-sm btn-outline btn-info" @click="emit('save')">Save</button>
      <button v-if="selectedId" class="btn btn-sm btn-outline btn-error" @click="emit('delete')">Delete</button>
    </div>
  </div>

  <!-- URL Bar -->
  <div class="flex gap-2">
    <select
      class="select select-bordered bg-bg-input border-border-main text-gray-200 font-bold font-mono"
      :value="method"
      @change="emit('update:method', $event.target.value)"
    >
      <option v-for="m in METHODS" :key="m" :value="m">{{ m }}</option>
    </select>
    <input
      class="input input-bordered flex-1 bg-bg-input border-border-main text-gray-200 font-mono"
      :value="url"
      @input="emit('update:url', $event.target.value)"
      placeholder="https://api.example.com/endpoint"
    />
    <button
      class="btn btn-error min-w-24"
      @click="emit('send')"
      :disabled="loading || !url"
    >
      <span v-if="loading" class="loading loading-spinner loading-sm" />
      <template v-else>Send</template>
    </button>
  </div>

  <!-- Headers -->
  <div class="space-y-2">
    <h3 class="text-xs uppercase tracking-wide text-gray-500">Headers</h3>
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

  <!-- Body (for non-GET/HEAD) -->
  <div v-if="method !== 'GET' && method !== 'HEAD'" class="space-y-2">
    <h3 class="text-xs uppercase tracking-wide text-gray-500">Body</h3>
    <textarea
      class="textarea textarea-bordered w-full bg-bg-input border-border-main text-gray-200 font-mono text-sm"
      :value="body"
      @input="emit('update:body', $event.target.value)"
      placeholder='{"key": "value"}'
      rows="6"
    />
  </div>
</template>
