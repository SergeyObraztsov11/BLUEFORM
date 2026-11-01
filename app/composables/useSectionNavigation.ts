export function scrollToSection(hash: string) {
  if (import.meta.server) return
  void navigateTo({ path: '/', hash })
}
