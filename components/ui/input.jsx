import * as React from "react"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ...props
}) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none",
        "bg-white dark:bg-[#1c1c1c] border-gray-300 dark:border-[#2a2a2a]",
        "text-gray-900 dark:text-[#e7e7e7]",
        "placeholder:text-gray-400 dark:placeholder:text-gray-600",
        "selection:bg-blue-500/20 selection:text-gray-900 dark:selection:bg-blue-500/30 dark:selection:text-[#e7e7e7]",
        "focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-900 dark:file:text-[#e7e7e7]",
        "md:text-sm",
        className
      )}
      {...props} />
  );
}

export { Input }
