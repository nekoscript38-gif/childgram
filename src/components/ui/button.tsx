import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-display font-bold cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-[2.5px] border-ink shadow-sticker hover:-translate-y-0.5 hover:shadow-sticker-lg active:translate-y-0.5 active:shadow-sticker-sm",
        sun: "bg-secondary text-secondary-foreground border-[2.5px] border-ink shadow-sticker hover:-translate-y-0.5 hover:shadow-sticker-lg active:translate-y-0.5 active:shadow-sticker-sm",
        mint: "bg-accent text-accent-foreground border-[2.5px] border-ink shadow-sticker hover:-translate-y-0.5 hover:shadow-sticker-lg active:translate-y-0.5 active:shadow-sticker-sm",
        sky: "bg-sky text-sky-foreground border-[2.5px] border-ink shadow-sticker hover:-translate-y-0.5 hover:shadow-sticker-lg active:translate-y-0.5 active:shadow-sticker-sm",
        heart:
          "bg-heart text-heart-foreground border-[2.5px] border-ink shadow-sticker hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-sticker-sm",
        destructive:
          "bg-destructive text-destructive-foreground border-[2.5px] border-ink shadow-sticker-sm hover:-translate-y-0.5",
        outline:
          "border-[2.5px] border-ink bg-card text-foreground shadow-sticker hover:-translate-y-0.5 hover:bg-muted active:translate-y-0.5 active:shadow-sticker-sm",
        secondary: "bg-muted text-foreground border-[2.5px] border-ink hover:bg-secondary",
        ghost: "hover:bg-muted text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 text-base",
        sm: "h-9 px-4 text-sm",
        lg: "h-14 px-8 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
