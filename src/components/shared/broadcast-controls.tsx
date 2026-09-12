"use client";

import type { ComponentProps } from "react";
import { TabsList as BaseTabsList, TabsTrigger as BaseTabsTrigger } from "@/components/ui/tabs";
import { SelectTrigger as BaseSelectTrigger, SelectContent as BaseSelectContent, SelectItem as BaseSelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export { Tabs, TabsContent } from "@/components/ui/tabs";
export { Select, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";

export function TabsList({ className, ...props }: ComponentProps<typeof BaseTabsList>) {
  return <BaseTabsList {...props} className={cn("rounded-none group-data-[orientation=horizontal]/tabs:h-auto", className)} />;
}
export function TabsTrigger({ className, ...props }: ComponentProps<typeof BaseTabsTrigger>) {
  return <BaseTabsTrigger {...props} className={cn("min-h-11 rounded-none focus-visible:outline-2 focus-visible:outline-offset-[-3px]", className)} />;
}
export function SelectTrigger({ className, ...props }: ComponentProps<typeof BaseSelectTrigger>) {
  return <BaseSelectTrigger {...props} className={cn("min-h-11 rounded-none text-base focus-visible:outline-2 focus-visible:outline-offset-2", className)} />;
}
export function SelectContent({ className, ...props }: ComponentProps<typeof BaseSelectContent>) {
  return <BaseSelectContent {...props} className={cn("rounded-none", className)} />;
}
export function SelectItem({ className, ...props }: ComponentProps<typeof BaseSelectItem>) {
  return <BaseSelectItem {...props} className={cn("min-h-11 rounded-none", className)} />;
}
