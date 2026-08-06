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
import { useAuth } from "@/lib/auth-context"

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Calendar, label: "All Events", href: "/admin/events" },
  { icon: Users, label: "Studios", href: "/admin/studios" },
  { icon: Users, label: "Streamers", href: "/admin/streamers" },
  { icon: Package, label: "Pricing", href: "/admin/packages" },
  { icon: Calendar, label: "Calendar", href: "/admin/create-events" },
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
  const { user } = useAuth()
  const isOperator =
    user?.role === "elive_operator" ||
    user?.role === "rtmp_operator" ||
    user?.email?.toLowerCase() === "pbollapragada@gmail.com"

  const activeMenuItems = isOperator
    ? [{ icon: Calendar, label: "eLive RTMP Events", href: "/admin/events" }]
    : menuItems

  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-4">
          <BrandedLogo size="sm" showText />
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {activeMenuItems.map((item) => (
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
