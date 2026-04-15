import { computed, ref } from 'vue'

import BlendWorkspace from '../pages/BlendWorkspace.vue'
import LoopWorkspace from '../pages/LoopWorkspace.vue'
import CopyRotateWorkspace from '../pages/CopyRotateWorkspace.vue'

type ToolTabKey = 'blend' | 'loop' | 'copyRotate'

type ToolTab = {
  key: ToolTabKey
  label: string
}

const tabs: ToolTab[] = [
  { key: 'loop', label: '循环' },
  { key: 'copyRotate', label: '旋转复制' },
  { key: 'blend', label: '混合' },
]

const pageMap = {
  blend: BlendWorkspace,
  loop: LoopWorkspace,
  copyRotate: CopyRotateWorkspace,
} as const

export const useToolTabs = () => {
  const activeTab = ref<ToolTabKey>('loop')

  const activePage = computed(() => pageMap[activeTab.value])

  return {
    tabs,
    activeTab,
    activePage,
    activePageProps: {},
  }
}

export type { ToolTabKey, ToolTab }
