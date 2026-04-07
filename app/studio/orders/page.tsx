"use client"

import { useState, useEffect } from "react"
import type { Order } from "@/lib/types"
import { OrderCard } from "@/components/orders/order-card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Loader2 } from "lucide-react"

export default function StudioOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/orders")
      .then(res => res.json())
      .then(data => {
        if (data.orders) setOrders(data.orders)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const completedOrders = orders.filter((o) => o.status === "completed")
  const failedOrders = orders.filter((o) => o.status === "failed")
  const cancelledOrders = orders.filter((o) => o.status === "cancelled")
  const failedByMe = failedOrders.filter((o) => o.insufficientFundsEntity?.includes("studio"))

  const filterOrders = (orderList: Order[]) => {
    return orderList.filter(
      (o) =>
        o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
        o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        (o as any).userName?.toLowerCase().includes(search.toLowerCase())
    )
  }

  const OrderList = ({ orderList }: { orderList: Order[] }) => {
    const filtered = filterOrders(orderList)
    if (filtered.length === 0) {
      return <div className="py-12 text-center text-muted-foreground">No orders found.</div>
    }
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            showUser
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground">View order history from your streamers</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
          <TabsTrigger value="failed">Failed ({failedOrders.length})</TabsTrigger>
          <TabsTrigger value="failed-me">Failed - My Balance ({failedByMe.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({cancelledOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <OrderList orderList={orders} />
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          <OrderList orderList={completedOrders} />
        </TabsContent>
        <TabsContent value="failed" className="mt-6">
          <OrderList orderList={failedOrders} />
        </TabsContent>
        <TabsContent value="failed-me" className="mt-6">
          <OrderList orderList={failedByMe} />
        </TabsContent>
        <TabsContent value="cancelled" className="mt-6">
          <OrderList orderList={cancelledOrders} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
