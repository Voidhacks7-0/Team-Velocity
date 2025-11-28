import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Calendar, MapPin, ShieldCheck, ClipboardList, Layers, ClipboardEdit, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";

type ResourceRequestStatus = "pending" | "approved" | "rejected" | "issued" | "returned";

const statusBadges: Record<ResourceRequestStatus, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  approved: "outline",
  rejected: "destructive",
  issued: "default",
  returned: "secondary",
};

export default function Resources() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const canRequestBooking = !isAdmin;

  const [resources, setResources] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [adminResources, setAdminResources] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [requestStatusFilter, setRequestStatusFilter] = useState<ResourceRequestStatus | "all">("pending");

  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [newResource, setNewResource] = useState({
    name: "",
    description: "",
    categoryId: "",
    location: "",
    totalQuantity: 1,
    status: "available",
    allowBooking: true,
  });

  const fetchResources = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiRequest<any[]>("/common/resources", { token });
      setResources(data);
    } catch (error) {
      console.error("Failed to load resources", error);
    }
  }, [token]);

  const fetchMyBookings = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiRequest<any[]>("/common/bookings", { token });
      setBookings(data);
    } catch (error) {
      console.error("Failed to load bookings", error);
    }
  }, [token]);

  const fetchAdminResources = useCallback(async () => {
    if (!token || !isAdmin) return;
    try {
      const data = await apiRequest<any[]>("/admin/resources", { token });
      setAdminResources(data);
    } catch (error) {
      console.error("Failed to load admin resources", error);
    }
  }, [token, isAdmin]);

  const fetchCategories = useCallback(async () => {
    if (!token || !isAdmin) return;
    try {
      const data = await apiRequest<any[]>("/admin/resource-categories", { token });
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  }, [token, isAdmin]);

  const fetchRequests = useCallback(async () => {
    if (!token || !isAdmin) return;
    try {
      const query = requestStatusFilter && requestStatusFilter !== "all" ? `?status=${requestStatusFilter}` : "";
      const data = await apiRequest<any[]>(`/admin/resource-requests${query}`, { token });
      setRequests(data);
    } catch (error) {
      console.error("Failed to load requests", error);
    }
  }, [token, isAdmin, requestStatusFilter]);

  useEffect(() => {
    fetchResources();
    fetchMyBookings();
  }, [fetchResources, fetchMyBookings]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchAdminResources();
    fetchCategories();
    fetchRequests();
  }, [isAdmin, fetchAdminResources, fetchCategories, fetchRequests]);

  const handleBook = async (resourceId: string) => {
    try {
      if (!canRequestBooking) {
        throw new Error("Admins manage bookings instead of requesting them.");
      }
      if (!token) {
        throw new Error("Missing session. Please sign in again.");
      }
      await apiRequest("/common/bookings", {
        method: "POST",
        token,
        body: {
          resourceId,
          purpose: "General use",
        },
      });
      toast({ title: "Success", description: "Booking request submitted" });
      fetchMyBookings();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) {
      toast({ variant: "destructive", title: "Name required" });
      return;
    }
    try {
      await apiRequest("/admin/resource-categories", {
        method: "POST",
        token,
        body: newCategory,
      });
      setNewCategory({ name: "", description: "" });
      toast({ title: "Category created" });
      fetchCategories();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResource.name.trim() || !newResource.categoryId) {
      toast({ variant: "destructive", title: "Fill required fields" });
      return;
    }
    try {
      await apiRequest("/admin/resources", {
        method: "POST",
        token,
        body: {
          ...newResource,
          totalQuantity: Number(newResource.totalQuantity) || 1,
        },
      });
      toast({ title: "Resource added" });
      setNewResource({
        name: "",
        description: "",
        categoryId: "",
        location: "",
        totalQuantity: 1,
        status: "available",
        allowBooking: true,
      });
      fetchAdminResources();
      fetchResources();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleToggleAllowBooking = async (resourceId: string, allowBooking: boolean) => {
    try {
      if (!token) {
        throw new Error("Missing session. Please sign in again.");
      }
      await apiRequest(`/admin/resources/${resourceId}`, {
        method: "PATCH",
        token,
        body: { allowBooking },
      });
      toast({
        title: allowBooking ? "Requests enabled" : "Requests paused",
        description: allowBooking
          ? "Students and faculty can request this resource."
          : "Requests turned off until you re-enable them.",
      });
      fetchAdminResources();
      fetchResources();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error updating resource", description: error.message });
    }
  };

  const handleRequestStatusChange = async (id: string, status: "approved" | "rejected") => {
    try {
      const adminNote = window.prompt("Add note (optional)") || undefined;
      await apiRequest(`/admin/resource-requests/${id}/status`, {
        method: "PATCH",
        token,
        body: { status, adminNote },
      });
      toast({ title: `Request ${status}` });
      fetchRequests();
      fetchMyBookings();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleIssueRequest = async (id: string) => {
    try {
      const expectedReturnDate = window.prompt("Expected return date (YYYY-MM-DD)") || undefined;
      await apiRequest(`/admin/resource-requests/${id}/issue`, {
        method: "PATCH",
        token,
        body: { expectedReturnDate },
      });
      toast({ title: "Resource issued" });
      fetchRequests();
      fetchAdminResources();
      fetchMyBookings();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleReturnRequest = async (id: string) => {
    try {
      const conditionOnReturn = window.prompt("Condition on return", "Good");
      const penaltyInput = window.prompt("Penalty (leave blank for 0)", "0");
      const penalty = penaltyInput ? parseFloat(penaltyInput) : 0;
      await apiRequest(`/admin/resource-requests/${id}/return`, {
        method: "PATCH",
        token,
        body: { conditionOnReturn, penalty },
      });
      toast({ title: "Marked as returned" });
      fetchRequests();
      fetchAdminResources();
      fetchMyBookings();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const resourceCategories = useMemo(() => {
    if (!isAdmin) {
      const unique = new Map();
      resources.forEach((resource) => {
        const key = resource.category?.name || "General";
        if (!unique.has(key)) {
          unique.set(key, key);
        }
      });
      return Array.from(unique.keys());
    }
    return categories.map((c) => c.name);
  }, [resources, categories, isAdmin]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Resources</h1>
        <p className="text-muted-foreground mt-1">Book campus resources and equipment</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <Card key={resource._id} className="transition-smooth hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <Badge variant="outline">{resource.category?.name || "General"}</Badge>
              </div>
              <CardTitle>{resource.name}</CardTitle>
              <CardDescription className="line-clamp-2">{resource.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {resource.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-4">
                  <MapPin className="h-4 w-4" />
                  {resource.location}
                </p>
              )}
              <div className="flex items-center justify-between mb-3 text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={resource.status === "available" ? "default" : "secondary"}>
                  {resource.status}
                </Badge>
              </div>
              <Button
                onClick={() => {
                  if (isAdmin) {
                    handleToggleAllowBooking(resource._id, !resource.allowBooking);
                  } else {
                    handleBook(resource._id);
                  }
                }}
                className="w-full"
                disabled={!isAdmin && resource.availableQuantity === 0}
                variant={isAdmin ? "outline" : "default"}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {isAdmin
                  ? resource.allowBooking
                    ? "Pause bookings"
                    : "Allow bookings"
                  : resource.availableQuantity === 0
                  ? "Unavailable"
                  : "Request Booking"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {canRequestBooking && (
        <Card>
          <CardHeader>
            <CardTitle>My Bookings</CardTitle>
            <CardDescription>Your resource booking history</CardDescription>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings yet</p>
            ) : (
              <div className="space-y-2">
                {bookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{booking.resource?.name}</p>
                      <p className="text-sm text-muted-foreground">{booking.purpose}</p>
                    </div>
                    <Badge variant={statusBadges[booking.status as ResourceRequestStatus] || "secondary"}>
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {isAdmin && (
        <>
          <Separator className="my-10" />
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Admin Controls
              </h2>
              <p className="text-muted-foreground mt-1">
                Manage inventory, categories, and allocation workflow directly from here.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Resource Categories</CardTitle>
                  <CardDescription>Organize your inventory by category.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleCreateCategory} className="space-y-3">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={newCategory.name}
                        onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Photography Equipment"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={newCategory.description}
                        onChange={(e) => setNewCategory((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional"
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      <Layers className="mr-2 h-4 w-4" />
                      Add Category
                    </Button>
                  </form>

                  <Separator />

                  <div>
                    <p className="font-medium mb-2">Existing Categories</p>
                    {categories.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No categories yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                          <Badge key={category._id} variant={category.isActive ? "outline" : "secondary"}>
                            {category.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Add Resource</CardTitle>
                  <CardDescription>Create inventory items that can be reserved.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateResource} className="space-y-3">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={newResource.name}
                        onChange={(e) => setNewResource((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="4K Projector"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={newResource.description}
                        onChange={(e) => setNewResource((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional details"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={newResource.categoryId}
                        onValueChange={(value) => setNewResource((prev) => ({ ...prev, categoryId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category._id} value={category._id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        value={newResource.location}
                        onChange={(e) => setNewResource((prev) => ({ ...prev, location: e.target.value }))}
                        placeholder="Innovation Lab"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Total Quantity</Label>
                        <Input
                          type="number"
                          min={1}
                          value={newResource.totalQuantity}
                          onChange={(e) => setNewResource((prev) => ({ ...prev, totalQuantity: Number(e.target.value) }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={newResource.status}
                          onValueChange={(value) => setNewResource((prev) => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="unavailable">Unavailable</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button type="submit" className="w-full">
                      <ClipboardEdit className="mr-2 h-4 w-4" />
                      Create Resource
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Inventory Overview</CardTitle>
                <CardDescription>Track availability across all resources.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {adminResources.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No resources yet.</p>
                ) : (
                  <div className="space-y-2">
                    {adminResources.map((resource) => (
                      <div
                        key={resource._id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium">{resource.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {resource.availableQuantity}/{resource.totalQuantity} available • {resource.status}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={resource.allowBooking ? "outline" : "secondary"}>
                            {resource.allowBooking ? "Requests open" : "Requests paused"}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleAllowBooking(resource._id, !resource.allowBooking)}
                          >
                            {resource.allowBooking ? "Pause bookings" : "Allow bookings"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Requests Workflow</CardTitle>
                <CardDescription>Approve, issue, and close resource allocations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label>Status filter</Label>
                  <Select value={requestStatusFilter} onValueChange={(value) => setRequestStatusFilter(value as ResourceRequestStatus | "all")}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="issued">Issued</SelectItem>
                      <SelectItem value="returned">Returned</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={fetchRequests}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                {requests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No requests for this filter.</p>
                ) : (
                  <div className="space-y-3">
                    {requests.map((request) => (
                      <div key={request._id} className="rounded-lg border p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-medium">{request.resource?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Requested by {request.requester?.name} • {request.purpose}
                            </p>
                          </div>
                          <Badge variant={statusBadges[request.status as ResourceRequestStatus] || "secondary"}>
                            {request.status}
                          </Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {request.status === "pending" && (
                            <>
                              <Button size="sm" onClick={() => handleRequestStatusChange(request._id, "approved")}>
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRequestStatusChange(request._id, "rejected")}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {request.status === "approved" && (
                            <Button size="sm" onClick={() => handleIssueRequest(request._id)}>
                              Issue Resource
                            </Button>
                          )}
                          {request.status === "issued" && (
                            <Button size="sm" variant="outline" onClick={() => handleReturnRequest(request._id)}>
                              Mark Returned
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
