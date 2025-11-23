"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "@/context/ThemeContext"
import { Toaster as Sonner } from "sonner";

const Toaster = ({
  ...props
}) => {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        style: {
          background: theme === 'dark' ? 'rgb(33, 33, 33)' : 'rgb(255, 255, 255)',
          color: theme === 'dark' ? 'rgb(231, 231, 231)' : 'rgb(17, 24, 39)',
          border: `1px solid ${theme === 'dark' ? 'rgb(42, 42, 42)' : 'rgb(229, 231, 235)'}`,
        },
      }}
      {...props} />
  );
}

export { Toaster }
