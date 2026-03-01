"use client"

import { useState } from "react"
import { mockOrders } from "@/lib/mock-data"
import type { Order } from "@/lib/types"
import { OrderCard } from "@/components/orders/order-card"
import { RejectDialog } from "@/components/orders/reject-dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search } from "lucide-react"
import { toast } from "sonner"

export default function ResellerOrdersPage() {
  // Reseller sees their own orders
  const [orders, setOrders] = useState(mockOrders.filter((o) => o.resellerId === "reseller-1"))
  const [search, setSearch] = useState("")
  const [rejectOrder, setRejectOrder] = useState<Order | null>(null)

  const pendingOrders = orders.filter((o) => o.status === "pending")
  const approvedOrders = orders.filter((o) => o.status === "approved")
  const rejectedOrders = orders.filter((o) => o.status === "rejected")
  const completedOrders = orders.filter((o) => o.status === "completed")
  const failedOrders = orders.filter((o) => o.status === "failed")
  const failedByMe = failedOrders.filter((o) => o.insufficientFundsEntity?.includes("reseller"))

  const filterOrders = (orderList: Order[]) => {
    return orderList.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.user?.name?.toLowerCase().includes(search.toLowerCase()),
    )
  }

  const handleApprove = (order: Order) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id ? { ...o, status: "approved" as const, approvedAt: new Date(), approverId: "reseller-1" } : o,
      ),
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
      <div className="grid gap-4 md:grid-cols-2">
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
        <p className="text-muted-foreground">Manage and approve orders from your users</p>
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
          <TabsTrigger value="pending">Pending ({pendingOrders.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedOrders.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedOrders.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
          <TabsTrigger value="failed">All Failed ({failedOrders.length})</TabsTrigger>
          <TabsTrigger value="failed-me">Failed - My Insufficient Funds ({failedByMe.length})</TabsTrigger>
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
        <TabsContent value="failed-me" className="mt-6">
          <OrderList orderList={failedByMe} />
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
