export function resetDocumentState(state) {
  state.doc.fileHandle = null
  state.doc.fileName = null
  state.doc.content = ''
  state.doc.domain = null
  state.doc.persona = null
  state.doc.domainQuestions = []
  state.doc.bubbles = []
  state.activeBubbleId.value = null
  state.previewBubbleId.value = null
  state.settings.model = state.MODELS[0].id
}
