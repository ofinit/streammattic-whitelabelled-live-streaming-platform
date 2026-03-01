"use client"

import { useState } from "react"
import { mockOrders } from "@/lib/mock-data"
import type { Order } from "@/lib/types"
import { OrderCard } from "@/components/orders/order-card"
import { RejectDialog } from "@/components/orders/reject-dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"
import { toast } from "sonner"

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState(mockOrders)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [rejectOrder, setRejectOrder] = useState<Order | null>(null)

  const pendingOrders = orders.filter((o) => o.status === "pending")
  const approvedOrders = orders.filter((o) => o.status === "approved")
  const rejectedOrders = orders.filter((o) => o.status === "rejected")
  const completedOrders = orders.filter((o) => o.status === "completed")
  const failedOrders = orders.filter((o) => o.status === "failed")

  const filterOrders = (orderList: Order[]) => {
    return orderList.filter((o) => {
      const matchesSearch =
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.user?.name?.toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilter === "all" || o.orderType === typeFilter
      return matchesSearch && matchesType
    })
  }

  const handleApprove = (order: Order) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: "approved" as const, approvedAt: new Date() } : o)),
    )
    toast.success(`Order ${order.orderNumber} approved`)
  }

  const handleReject = (orderId: string, reason: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: "rejected" as const,
              rejectedAt: new Date(),
              rejectionReason: reason,
            }
          : o,
      ),
    )
    toast.success("Order rejected")
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
            onApprove={order.status === "pending" ? handleApprove : undefined}
            onReject={order.status === "pending" ? () => setRejectOrder(order) : undefined}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Manage and approve package orders from all streamers</p>
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
            <SelectItem value="package">Package</SelectItem>
            <SelectItem value="validity">Validity</SelectItem>
            <SelectItem value="addon">Addon</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingOrders.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedOrders.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedOrders.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
          <TabsTrigger value="failed">Failed ({failedOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <OrderList orderList={pendingOrders} />
        </TabsContent>
        <TabsContent value="approved" className="mt-6">
          <OrderList orderList={approvedOrders} />
        </TabsContent>
        <TabsContent value="rejected" className="mt-6">
          <OrderList orderList={rejectedOrders} />
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          <OrderList orderList={completedOrders} />
        </TabsContent>
        <TabsContent value="failed" className="mt-6">
          <OrderList orderList={failedOrders} />
        </TabsContent>
      </Tabs>

      <RejectDialog
        open={!!rejectOrder}
        onOpenChange={(open) => !open && setRejectOrder(null)}
        order={rejectOrder}
        onConfirm={handleReject}
      />
    </div>
  )
}
