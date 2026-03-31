<script setup>
import { ref, computed, watch, nextTick } from "vue";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

const props = defineProps({
  selectedId: String,
  name: String,
  method: String,
  url: String,
  params: Array,
  loading: Boolean,
});

const emit = defineEmits([
  "update:name",
  "update:method",
  "update:url",
  "update:params",
  "save",
  "delete",
  "send",
]);

const inputRef = ref(null);
const focused = ref(false);
const rawUrl = ref("");
// Guard to prevent watch from overwriting rawUrl while we're emitting from the URL bar
let syncingFromUrl = false;

function buildFullUrl() {
  const filledParams = props.params.filter((p) => p.key.trim());
  if (filledParams.length === 0) return props.url;
  const qs = filledParams
    .map((p) => `${p.key}=${p.value}`)
    .join("&");
  return props.url + "?" + qs;
}

// When params change externally (from the form), update the URL bar if not focused
watch(
  () => buildFullUrl(),
  (newUrl) => {
    if (!focused.value && !syncingFromUrl) {
      rawUrl.value = newUrl;
    }
  },
  { immediate: true }
);

function parseUrl(raw) {
  const qIndex = raw.indexOf("?");
  if (qIndex === -1) {
    return { base: raw, params: [] };
  }
  const base = raw.slice(0, qIndex);
  const qs = raw.slice(qIndex + 1);
  // Split only on & that have content before them (not trailing &)
  const parts = qs.split("&");
  const params = parts.map((pair) => {
    const eqIndex = pair.indexOf("=");
    if (eqIndex === -1) return { key: pair, value: "" };
    return {
      key: pair.slice(0, eqIndex),
      value: pair.slice(eqIndex + 1),
    };
  });
  return { base, params };
}

function syncToParams() {
  syncingFromUrl = true;
  const { base, params } = parseUrl(rawUrl.value);
  emit("update:url", base);
  emit("update:params", params.length ? params : [{ key: "", value: "" }]);
  nextTick(() => {
    syncingFromUrl = false;
  });
}

function onFocus() {
  focused.value = true;
  rawUrl.value = buildFullUrl();
}

function onInput(e) {
  rawUrl.value = e.target.value;
  // Live sync: update base url and params, but don't let the watch overwrite rawUrl
  syncToParams();
}

function onBlur() {
  focused.value = false;
  // Final sync and normalize the display
  syncToParams();
  rawUrl.value = buildFullUrl();
}

function onKeydown(e) {
  if (e.key === "Enter") {
    e.target.blur();
  }
}
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
      ref="inputRef"
      class="input input-bordered flex-1 bg-bg-input border-border-main text-gray-200 font-mono"
      :value="rawUrl"
      @focus="onFocus"
      @input="onInput"
      @blur="onBlur"
      @keydown="onKeydown"
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
