import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

interface UseInViewOptions {
  threshold?: number
  root?: Element | null
  rootMargin?: string
}

interface UseInViewResult<T extends HTMLElement> {
  ref: RefObject<T | null>
  visible: boolean
}

export function useInView<T extends HTMLElement>(
  options: UseInViewOptions = {},
  once: boolean = true,
): UseInViewResult<T> {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            if (once) {
              observer.unobserve(entry.target)
            }
          } else if (!once) {
            setVisible(false)
          }
        })
      },
      {
        threshold: options.threshold ?? 0.15,
        root: options.root ?? null,
        rootMargin: options.rootMargin,
      },
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [once, options.root, options.rootMargin, options.threshold])

  return { ref, visible }
}
