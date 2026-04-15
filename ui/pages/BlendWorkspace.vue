<template>
  <section class="workspace">
    <BlendIterationsField v-model="intermediateCount" />
    <BlendStatus
      :status="status"
      :status-type="statusType"
    />

    <footer class="footer">
      <BlendFooter
        :label="createButtonLabel"
        :disabled="!canCreate"
        @create="createBlend"
      />
    </footer>
  </section>
</template>

<script lang="ts" setup>
import BlendFooter from '../components/BlendFooter.vue'
import BlendIterationsField from '../components/BlendIterationsField.vue'
import BlendStatus from '../components/BlendStatus.vue'
import { useBlendTool } from '../composables/useBlendTool'

const { intermediateCount, status, statusType, createBlend, canCreate, createButtonLabel } = useBlendTool()
</script>

<style scoped>
.workspace {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100%;
}

.footer {
  margin-top: auto;
}
</style>
