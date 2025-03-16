/**
 * Textarea.tsx
 * 
 * Componente de área de texto
 * Responsável por:
 * - Entrada de texto multilinha
 * - Redimensionamento automático
 * - Estados de foco e hover
 * - Acessibilidade
 */

import * as React from "react"

import { cn } from "@/lib/utils"

// Interface de propriedades do componente
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

// Componente de área de texto
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
