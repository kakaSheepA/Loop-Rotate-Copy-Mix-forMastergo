<template>
  <BlendShell>
    <ToolTabs
      v-model="activeTab"
      :tabs="tabs"
    />

    <component
      :is="activePage"
      v-bind="activePageProps"
    />
  </BlendShell>
</template>

<script lang="ts" setup>
import BlendShell from './components/BlendShell.vue'
import ToolTabs from './components/ToolTabs.vue'
import { useToolTabs } from './composables/useToolTabs'

const { tabs, activeTab, activePage, activePageProps } = useToolTabs()
</script>
