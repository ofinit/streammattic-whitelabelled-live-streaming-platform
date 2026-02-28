"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Package,
  Calendar,
  Wallet,
  ShoppingCart,
  Settings,
  RefreshCw,
  DollarSign,
  CreditCard,
  Receipt,
  Plug,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { BrandedLogo } from "@/components/branding/branded-logo"

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Users, label: "Resellers", href: "/admin/resellers" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: Package, label: "Packages", href: "/admin/packages" },
  { icon: Calendar, label: "Calendar", href: "/admin/calendar" },
  { icon: ShoppingCart, label: "Orders", href: "/admin/orders" },
  { icon: Wallet, label: "Wallets", href: "/admin/wallets" },
  { icon: CreditCard, label: "Payments", href: "/admin/payments" },
  { icon: RefreshCw, label: "Refunds", href: "/admin/refunds" },
  { icon: DollarSign, label: "Wallet Adjustments", href: "/admin/wallet-adjustments" },
  { icon: Receipt, label: "GST Settings", href: "/admin/settings/gst" },
  { icon: Plug, label: "Integrations", href: "/admin/settings/integrations" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-4">
          <BrandedLogo size="sm" showText />
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
