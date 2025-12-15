"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Menu
} from "lucide-react"

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items?: {
    href: string
    title: string
    icon: React.ReactNode
  }[]
}

export function Sidebar({ className, ...props }: SidebarNavProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)

  const defaultItems = [
    {
      href: "/dashboard",
      title: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      href: "/products",
      title: "Products",
      icon: <Package className="h-4 w-4" />,
    },
    {
      href: "/rfq",
      title: "RFQs",
      icon: <ShoppingCart className="h-4 w-4" />,
    },
    {
      href: "/suppliers",
      title: "Suppliers",
      icon: <Users className="h-4 w-4" />,
    },
    {
      href: "/settings",
      title: "Settings",
      icon: <Settings className="h-4 w-4" />,
    },
  ]

  const items = props.items || defaultItems

  return (
    <nav
      className={cn(
        "relative flex flex-col gap-4 border-r bg-background pb-10 pt-6 transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between px-4 mb-4">
        {!collapsed && <span className="text-xl font-bold text-primary">GreenChainz</span>}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="ml-auto">
            <Menu className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-1 px-2">
        {items.map((item) => {
           const isActive = pathname === item.href
           return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.title : undefined}
            >
              {item.icon}
              {!collapsed && <span>{item.title}</span>}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
