<script setup>
import { computed } from "vue";

const props = defineProps({
  headers: Object,
});

const SEVERITY = { high: "high", medium: "medium", low: "low", info: "info" };

const SEVERITY_COLORS = {
  high: "text-red-400",
  medium: "text-orange-400",
  low: "text-yellow-400",
  info: "text-blue-400",
};

const SEVERITY_BADGE = {
  high: "badge-error",
  medium: "badge-warning",
  low: "badge-warning",
  info: "badge-info",
};

function h(name) {
  if (!props.headers) return null;
  // Response headers are lowercase from reqwest
  return props.headers[name.toLowerCase()] ?? null;
}

const findings = computed(() => {
  if (!props.headers) return [];
  const results = [];

  // Strict-Transport-Security
  const hsts = h("strict-transport-security");
  if (!hsts) {
    results.push({
      severity: SEVERITY.high,
      header: "Strict-Transport-Security",
      status: "Missing",
      detail: "HSTS not set. Browsers will allow plain HTTP connections, enabling man-in-the-middle attacks.",
      current: hsts,
      fix: "strict-transport-security: max-age=31536000; includeSubDomains; preload",
    });
  } else {
    const maxAge = hsts.match(/max-age=(\d+)/i);
    if (maxAge && parseInt(maxAge[1]) < 31536000) {
      results.push({
        severity: SEVERITY.medium,
        header: "Strict-Transport-Security",
        status: "Weak",
        detail: `max-age is ${maxAge[1]}s (${Math.round(parseInt(maxAge[1]) / 86400)} days). Recommended minimum is 1 year (31536000s).`,
        current: hsts,
        fix: "strict-transport-security: max-age=31536000; includeSubDomains",
      });
    } else {
      results.push({
        severity: SEVERITY.info,
        header: "Strict-Transport-Security",
        status: "Present",
        detail: hsts,
        current: hsts,
      });
    }
  }

  // Content-Security-Policy
  const csp = h("content-security-policy");
  if (!csp) {
    results.push({
      severity: SEVERITY.high,
      header: "Content-Security-Policy",
      status: "Missing",
      detail: "No CSP header. The application is more vulnerable to XSS and data injection attacks.",
      fix: "content-security-policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
      current: csp,
    });
  } else {
    const issues = [];
    if (csp.includes("unsafe-inline") && csp.includes("script-src")) {
      issues.push("script-src allows 'unsafe-inline'");
    }
    if (csp.includes("unsafe-eval")) {
      issues.push("allows 'unsafe-eval'");
    }
    if (csp.includes("*")) {
      issues.push("contains wildcard source (*)");
    }
    if (issues.length > 0) {
      results.push({
        severity: SEVERITY.medium,
        header: "Content-Security-Policy",
        status: "Weak",
        detail: `CSP present but: ${issues.join(", ")}.`,
        current: csp,
      });
    } else {
      results.push({
        severity: SEVERITY.info,
        header: "Content-Security-Policy",
        status: "Present",
        detail: csp.length > 80 ? csp.slice(0, 80) + "..." : csp,
        current: csp,
      });
    }
  }

  // X-Content-Type-Options
  const xcto = h("x-content-type-options");
  if (!xcto) {
    results.push({
      severity: SEVERITY.medium,
      header: "X-Content-Type-Options",
      status: "Missing",
      detail: "Browser may MIME-sniff responses, potentially executing content as a different type than declared.",
      fix: "x-content-type-options: nosniff",
      current: xcto,
    });
  } else if (xcto.toLowerCase() !== "nosniff") {
    results.push({
      severity: SEVERITY.medium,
      header: "X-Content-Type-Options",
      status: "Invalid",
      detail: `Value "${xcto}" is not valid. Only "nosniff" is recognized.`,
      fix: "x-content-type-options: nosniff",
      current: xcto,
    });
  } else {
    results.push({
      severity: SEVERITY.info,
      header: "X-Content-Type-Options",
      status: "Present",
      detail: xcto,
      current: xcto,
    });
  }

  // X-Frame-Options
  const xfo = h("x-frame-options");
  if (!xfo) {
    results.push({
      severity: SEVERITY.medium,
      header: "X-Frame-Options",
      status: "Missing",
      detail: "Page can be embedded in iframes, making it vulnerable to clickjacking attacks.",
      fix: "x-frame-options: DENY",
      current: xfo,
    });
  } else {
    const val = xfo.toLowerCase();
    if (val !== "deny" && val !== "sameorigin") {
      results.push({
        severity: SEVERITY.low,
        header: "X-Frame-Options",
        status: "Unusual",
        detail: `Value "${xfo}" — expected DENY or SAMEORIGIN.`,
        current: xfo,
      });
    } else {
      results.push({
        severity: SEVERITY.info,
        header: "X-Frame-Options",
        status: "Present",
        detail: xfo,
        current: xfo,
      });
    }
  }

  // Referrer-Policy
  const rp = h("referrer-policy");
  if (!rp) {
    results.push({
      severity: SEVERITY.low,
      header: "Referrer-Policy",
      status: "Missing",
      detail: "Browser uses default referrer behavior, which may leak URLs to third-party sites.",
      fix: "referrer-policy: strict-origin-when-cross-origin",
      current: rp,
    });
  } else {
    results.push({
      severity: SEVERITY.info,
      header: "Referrer-Policy",
      status: "Present",
      detail: rp,
      current: rp,
    });
  }

  // Permissions-Policy
  const pp = h("permissions-policy");
  if (!pp) {
    results.push({
      severity: SEVERITY.low,
      header: "Permissions-Policy",
      status: "Missing",
      detail: "No restrictions on browser features (camera, microphone, geolocation, etc.).",
      fix: "permissions-policy: camera=(), microphone=(), geolocation=()",
      current: pp,
    });
  } else {
    results.push({
      severity: SEVERITY.info,
      header: "Permissions-Policy",
      status: "Present",
      detail: pp.length > 80 ? pp.slice(0, 80) + "..." : pp,
      current: pp,
    });
  }

  // Cache-Control
  const cc = h("cache-control");
  if (!cc) {
    results.push({
      severity: SEVERITY.low,
      header: "Cache-Control",
      status: "Missing",
      detail: "No cache directives. Sensitive responses may be cached by browsers or proxies.",
      fix: "cache-control: no-store",
      current: cc,
    });
  } else if (!cc.includes("no-store") && !cc.includes("private")) {
    results.push({
      severity: SEVERITY.low,
      header: "Cache-Control",
      status: "Weak",
      detail: `Value "${cc}" — consider no-store for sensitive endpoints.`,
      current: cc,
    });
  } else {
    results.push({
      severity: SEVERITY.info,
      header: "Cache-Control",
      status: "Present",
      detail: cc,
      current: cc,
    });
  }

  // Server header (information disclosure)
  const server = h("server");
  if (server) {
    const hasVersion = /\/[\d.]+/.test(server);
    if (hasVersion) {
      results.push({
        severity: SEVERITY.medium,
        header: "Server",
        status: "Verbose",
        detail: `"${server}" discloses server software and version — useful for targeted exploits.`,
        fix: "Remove or genericize the Server header.",
        current: server,
      });
    } else {
      results.push({
        severity: SEVERITY.low,
        header: "Server",
        status: "Present",
        detail: `"${server}" — consider removing to reduce fingerprinting surface.`,
        current: server,
      });
    }
  }

  // X-Powered-By (information disclosure)
  const xpb = h("x-powered-by");
  if (xpb) {
    results.push({
      severity: SEVERITY.medium,
      header: "X-Powered-By",
      status: "Present",
      detail: `"${xpb}" discloses backend technology — remove to reduce fingerprinting.`,
      fix: "Remove the X-Powered-By header.",
      current: xpb,
    });
  }

  // Sort: issues first (high → low), then info
  const order = { high: 0, medium: 1, low: 2, info: 3 };
  results.sort((a, b) => order[a.severity] - order[b.severity]);

  return results;
});

const summary = computed(() => {
  const counts = { high: 0, medium: 0, low: 0, info: 0 };
  for (const f of findings.value) {
    counts[f.severity]++;
  }
  return counts;
});

const score = computed(() => {
  const total = findings.value.length;
  if (total === 0) return null;
  const issues = findings.value.filter((f) => f.severity !== "info").length;
  return Math.round(((total - issues) / total) * 100);
});

const scoreColor = computed(() => {
  if (score.value >= 80) return "text-green-400";
  if (score.value >= 50) return "text-yellow-400";
  return "text-red-400";
});
</script>

<template>
  <div class="space-y-3">
    <!-- Score summary -->
    <div class="flex items-center gap-4">
      <span :class="['text-2xl font-bold font-mono', scoreColor]">{{ score }}%</span>
      <div class="flex gap-2 text-xs">
        <span v-if="summary.high" class="badge badge-error badge-sm font-mono">{{ summary.high }} high</span>
        <span v-if="summary.medium" class="badge badge-warning badge-sm font-mono">{{ summary.medium }} medium</span>
        <span v-if="summary.low" class="badge badge-warning badge-sm font-mono opacity-70">{{ summary.low }} low</span>
        <span class="badge badge-info badge-sm font-mono">{{ summary.info }} pass</span>
      </div>
    </div>

    <!-- Findings -->
    <div v-for="(finding, i) in findings" :key="i" class="border border-border-main rounded-md p-3 space-y-1">
      <div class="flex items-center gap-2">
        <span :class="['badge badge-sm font-mono', SEVERITY_BADGE[finding.severity]]">{{ finding.severity }}</span>
        <span class="font-mono text-sm text-gray-200">{{ finding.header }}</span>
        <span :class="['text-xs font-mono ml-auto', SEVERITY_COLORS[finding.severity]]">{{ finding.status }}</span>
      </div>
      <p class="gap-2 text-xs text-gray-400">{{ finding.detail }}</p>
      <p class="text-xs text-gray-400">
        Current:<code class="font-mono text-gray-400 bg-bg-input px-2 py-0.5 rounded">{{ finding.current || 'Not set' }}</code>
      </p>
      <div v-if="finding.fix" class="text-xs flex items-center text-gray-400">
        Desired:<code class="font-mono text-green-400 bg-bg-input px-2 py-0.5 rounded">{{ finding.fix }}</code>
      </div>
    </div>
  </div>
</template>
