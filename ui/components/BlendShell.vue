<template>
  <main class="window">
    <section class="panel">
      <slot name="header" />

      <div class="content">
        <slot />
      </div>

      <slot name="footer" />
    </section>
  </main>
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family:
    Inter,
    "Noto Sans SC",
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.92), transparent 34%),
    linear-gradient(180deg, #f3f4f6 0%, #eceff3 100%);
  color: #20242b;
}

:global(*) {
  box-sizing: border-box;
}

.window {
  min-height: 100vh;
  padding: 0;
}

.panel {
  min-height: 100vh;
  border-radius: 0;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(17, 24, 39, 0.08);
  box-shadow:
    0 14px 40px rgba(15, 23, 42, 0.12),
    0 2px 8px rgba(15, 23, 42, 0.04);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
