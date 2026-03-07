"use client"

import { useState } from "react"
import { mockOrders } from "@/lib/mock-data"
import type { Order } from "@/lib/types"
import { OrderCard } from "@/components/orders/order-card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search } from "lucide-react"

export default function UserOrdersPage() {
  const [orders] = useState(mockOrders.filter((o) => o.userId === "user-1"))
  const [search, setSearch] = useState("")

  const completedOrders = orders.filter((o) => o.status === "completed")
  const failedOrders = orders.filter((o) => o.status === "failed")
  const cancelledOrders = orders.filter((o) => o.status === "cancelled")

  const filterOrders = (orderList: Order[]) => {
    return orderList.filter((o) => o.orderNumber.toLowerCase().includes(search.toLowerCase()))
  }

  const OrderList = ({ orderList }: { orderList: Order[] }) => {
    const filtered = filterOrders(orderList)
    if (filtered.length === 0) {
      return <div className="py-12 text-center text-muted-foreground">No orders found.</div>
    }
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="text-muted-foreground">Track your package orders and their status</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="completed">
        <TabsList>
          <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
          <TabsTrigger value="failed">Failed ({failedOrders.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({cancelledOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="completed" className="mt-6">
          <OrderList orderList={completedOrders} />
        </TabsContent>
        <TabsContent value="failed" className="mt-6">
          <OrderList orderList={failedOrders} />
        </TabsContent>
        <TabsContent value="cancelled" className="mt-6">
          <OrderList orderList={cancelledOrders} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
