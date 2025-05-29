"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface UseSessionTimeoutProps {
  timeoutInMinutes?: number
  onTimeout?: () => void
  isActive?: boolean
}

export function useSessionTimeout({ timeoutInMinutes = 30, onTimeout, isActive = true }: UseSessionTimeoutProps = {}) {
  const [lastActivity, setLastActivity] = useState<number>(Date.now())
  const [showWarning, setShowWarning] = useState(false)
  const [remainingTime, setRemainingTime] = useState(timeoutInMinutes * 60)
  const router = useRouter()

  // Convert minutes to milliseconds
  const timeoutInMs = timeoutInMinutes * 60 * 1000
  const warningThresholdMs = 60 * 1000 // Show warning 1 minute before timeout

  // Reset the timer when user activity is detected
  const resetTimer = () => {
    setLastActivity(Date.now())
    setShowWarning(false)
  }

  // Handle session timeout
  const handleTimeout = () => {
    if (onTimeout) {
      onTimeout()
    } else {
      // Default behavior: redirect to login
      router.push("/login")
    }
  }

  useEffect(() => {
    if (!isActive) return

    // Set up event listeners for user activity
    const activityEvents = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"]

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer)
    })

    // Check for inactivity
    const intervalId = setInterval(() => {
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivity

      // Calculate remaining time
      const timeRemaining = Math.max(0, timeoutInMs - timeSinceLastActivity)
      setRemainingTime(Math.floor(timeRemaining / 1000))

      // Show warning if approaching timeout
      if (timeSinceLastActivity > timeoutInMs - warningThresholdMs && !showWarning) {
        setShowWarning(true)
      }

      // Timeout user if inactive for too long
      if (timeSinceLastActivity >= timeoutInMs) {
        handleTimeout()
      }
    }, 1000)

    // Clean up
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer)
      })
      clearInterval(intervalId)
    }
  }, [lastActivity, timeoutInMs, isActive, onTimeout])

  // Format remaining time as MM:SS
  const formatRemainingTime = () => {
    const minutes = Math.floor(remainingTime / 60)
    const seconds = remainingTime % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  return {
    showWarning,
    remainingTime: formatRemainingTime(),
    resetTimer,
  }
}
