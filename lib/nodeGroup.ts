type SceneLike = {
  name: string
}

export const groupCreatedNodes = (nodes: any[], groupName: string) => {
  if (nodes.length === 0) {
    return null
  }

  const group = mg.group(nodes)
  ;(group as SceneLike).name = groupName
  return group
}
