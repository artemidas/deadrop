<script setup>
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

defineProps({
  selectedId: String,
  name: String,
  method: String,
  url: String,
  loading: Boolean,
});

const emit = defineEmits([
  "update:name",
  "update:method",
  "update:url",
  "save",
  "delete",
  "send",
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
</template>
