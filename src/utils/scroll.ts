export function isNearBottom(el: HTMLElement, threshold = 80): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight < threshold
}

export function scrollToBottomIfNear(el: HTMLElement, threshold = 80): void {
  if (isNearBottom(el, threshold)) {
    el.scrollTop = el.scrollHeight
  }
}

export function scrollToBottom(el: HTMLElement): void {
  el.scrollTop = el.scrollHeight
}

export function scrollToFeedIndex(
  container: HTMLElement,
  messageEl: HTMLElement,
  align: 'end' | 'bottom' = 'end'
): void {
  if (align === 'bottom') {
    scrollToBottom(container)
    return
  }
  const containerRect = container.getBoundingClientRect()
  const messageRect = messageEl.getBoundingClientRect()
  const offset = messageRect.bottom - containerRect.bottom
  container.scrollTop += offset
}
