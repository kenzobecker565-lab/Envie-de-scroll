import type { VariantProps } from 'class-variance-authority'
import { motion, type HTMLMotionProps } from 'motion/react'
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'
import { createContext, useContext, type ComponentProps } from 'react'
import { toggleVariants } from '@/components/ui/toggle'
import { cn } from '@/lib/utils'

/**
 * Groupe de choix shadcn/ui (un seul, ou plusieurs). Chaque élément est un
 * bouton Framer Motion : il s'enfonce légèrement au toucher et peut avoir
 * sa propre animation d'entrée.
 */
const ToggleGroupContext = createContext<VariantProps<typeof toggleVariants>>({ variant: 'chip' })

function ToggleGroup({ className, variant, children, ...props }: ComponentProps<typeof ToggleGroupPrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return (
    <ToggleGroupPrimitive.Root data-slot="toggle-group" data-variant={variant} className={cn('flex flex-wrap gap-2', className)} {...props}>
      <ToggleGroupContext.Provider value={{ variant }}>{children}</ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

type MotionOptions = Pick<HTMLMotionProps<'button'>, 'initial' | 'animate' | 'transition' | 'whileTap'>

function ToggleGroupItem({
  className,
  children,
  variant,
  initial,
  animate,
  transition,
  whileTap = { scale: 0.96 },
  ...props
}: Omit<ComponentProps<typeof ToggleGroupPrimitive.Item>, 'asChild'> & VariantProps<typeof toggleVariants> & MotionOptions) {
  const context = useContext(ToggleGroupContext)
  return (
    <ToggleGroupPrimitive.Item asChild {...props}>
      <motion.button
        data-slot="toggle-group-item"
        className={cn(toggleVariants({ variant: context.variant ?? variant }), className)}
        initial={initial}
        animate={animate}
        transition={transition}
        whileTap={props.disabled ? undefined : whileTap}
      >
        {children}
      </motion.button>
    </ToggleGroupPrimitive.Item>
  )
}

export { ToggleGroup, ToggleGroupItem }
