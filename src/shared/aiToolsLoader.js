let aiToolsModulePromise;

export function loadAiToolsModule() {
  if (!aiToolsModulePromise) {
    aiToolsModulePromise = import('../data/aiTools');
  }
  return aiToolsModulePromise;
}
