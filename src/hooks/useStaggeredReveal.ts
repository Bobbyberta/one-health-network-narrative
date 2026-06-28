import { useEffect, useRef, useState } from 'react'

export interface StaggerItem {
  delay_ms: number
}

export function useStaggeredReveal<T extends StaggerItem>(
  items: T[],
  onReveal: (item: T, index: number) => void,
  onComplete: () => void,
  active: boolean
) {
  const [isRevealing, setIsRevealing] = useState(false)
  const [revealedCount, setRevealedCount] = useState(0)
  const cancelRef = useRef<(() => void) | null>(null)
  const onRevealRef = useRef(onReveal)
  const onCompleteRef = useRef(onComplete)

  onRevealRef.current = onReveal
  onCompleteRef.current = onComplete

  useEffect(() => {
    cancelRef.current?.()
    cancelRef.current = null

    if (!active || items.length === 0) {
      setIsRevealing(false)
      setRevealedCount(0)
      if (active && items.length === 0) {
        onCompleteRef.current()
      }
      return
    }

    setIsRevealing(true)
    setRevealedCount(0)

    const timeouts: ReturnType<typeof setTimeout>[] = []
    let cumulativeDelay = 0

    items.forEach((item, index) => {
      cumulativeDelay += item.delay_ms
      const timeout = setTimeout(() => {
        onRevealRef.current(item, index)
        setRevealedCount(index + 1)
        if (index === items.length - 1) {
          setIsRevealing(false)
          onCompleteRef.current()
        }
      }, cumulativeDelay)
      timeouts.push(timeout)
    })

    cancelRef.current = () => {
      timeouts.forEach(clearTimeout)
      setIsRevealing(false)
    }

    return () => {
      cancelRef.current?.()
      cancelRef.current = null
    }
  }, [active, items])

  return { isRevealing, revealedCount }
}

export function runStaggeredSequence<T extends StaggerItem>(
  items: T[],
  onReveal: (item: T, index: number) => void,
  onComplete: () => void
): () => void {
  if (items.length === 0) {
    onComplete()
    return () => undefined
  }

  const timeouts: ReturnType<typeof setTimeout>[] = []
  let cumulativeDelay = 0

  items.forEach((item, index) => {
    cumulativeDelay += item.delay_ms
    const timeout = setTimeout(() => {
      onReveal(item, index)
      if (index === items.length - 1) {
        onComplete()
      }
    }, cumulativeDelay)
    timeouts.push(timeout)
  })

  return () => timeouts.forEach(clearTimeout)
}
