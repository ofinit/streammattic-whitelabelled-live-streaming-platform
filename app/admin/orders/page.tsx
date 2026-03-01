"use client"

import { useState } from "react"
import { mockOrders } from "@/lib/mock-data"
import type { Order } from "@/lib/types"
import { OrderCard } from "@/components/orders/order-card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"

export default function AdminOrdersPage() {
  const [orders] = useState(mockOrders)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const completedOrders = orders.filter((o) => o.status === "completed")
  const failedOrders = orders.filter((o) => o.status === "failed")
  const cancelledOrders = orders.filter((o) => o.status === "cancelled")

  const filterOrders = (orderList: Order[]) => {
    return orderList.filter((o) => {
      const matchesSearch =
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.user?.name?.toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilter === "all" || o.orderType === typeFilter
      return matchesSearch && matchesType
    })
  }

  const OrderList = ({ orderList }: { orderList: Order[] }) => {
    const filtered = filterOrders(orderList)
    if (filtered.length === 0) {
      return <div className="py-12 text-center text-muted-foreground">No orders found.</div>
    }
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        <p className="text-muted-foreground">View all credit purchases, wallet recharges, and service charges</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order # or streamer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="credit_purchase">Credit Purchase</SelectItem>
            <SelectItem value="wallet_recharge">Wallet Recharge</SelectItem>
            <SelectItem value="validity_extension">Validity Extension</SelectItem>
            <SelectItem value="service_charge">Service Charge</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
          <TabsTrigger value="failed">Failed ({failedOrders.length})</TabsTrigger>
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
        <TabsContent value="cancelled" className="mt-6">
          <OrderList orderList={cancelledOrders} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
