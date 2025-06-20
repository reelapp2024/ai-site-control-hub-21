import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { httpFile } from "../../config.js";

type SubAdmin = {
  id: number | string;
  fullName: string;
  address: string;
  email: string;
  phone: string;
  type: number; // 0 = SubAdmin, 1 = Admin
};

export function SubAdminManagement() {
  const [view, setView] = useState<"list" | "add">("list");
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0); // 0-based index
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalSubAdmins, setTotalSubAdmins] = useState(0);
  const navigate = useNavigate();

  // Form state for adding new sub-admin
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    address: "",
  });

  // Fetch SubAdmins from API
  const fetchSubAdmins = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await httpFile.get(
        `/fetch_users?page=${page + 1}&limit=${rowsPerPage}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        toast({
          title: "Error",
          description: "Invalid token",
          variant: "destructive",
        });
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      const items = response.data.data || [];
      setSubAdmins(
        items.map((item: any, idx: number) => ({
          id: item.id || item._id || idx + 1,
          fullName: item.fullName,
          address: item.address || "",
          email: item.email,
          phone: item.phone,
          type: Number(item.type) || 0, // store numeric type
        }))
      );
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotalSubAdmins(response.data.pagination?.totalUsers || 0);
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast({
          title: "Error",
          description: "Token is not valid",
          variant: "destructive",
        });
        localStorage.removeItem("token");
        // Wipes out *all* stored data:
        localStorage.clear();

        navigate("/login");
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch SubAdmin data",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    fetchSubAdmins();
    // eslint-disable-next-line
  }, [page, rowsPerPage]);

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit new sub-admin to API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.password ||
      !formData.address
    ) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await httpFile.post(
        "/create_user",
        {
          ...formData,
          // ensure new user is created as SubAdmin (type 0)
          type: 0,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.status === 401) {
        toast({
          title: "Error",
          description: "Invalid token",
          variant: "destructive",
        });
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (res.status === 201) {
        toast({
          title: "Success",
          description: "SubAdmin created successfully!",
        });
        setView("list");
        fetchSubAdmins();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "An error occurred!";
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    }
  };

  // Filter for search
  const filteredSubAdmins = subAdmins.filter(
    (sa) =>
      sa.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sa.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sa.phone.includes(searchTerm) ||
      sa.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (view === "add") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Add SubAdmin</h1>
          <Button variant="outline" onClick={() => setView("list")}>
            Back to List
          </Button>
        </div>

        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <a
                href="#"
                onClick={() => setView("list")}
                className="text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                Home
              </a>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <a
                  href="#"
                  onClick={() => setView("list")}
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Manage SubAdmin
                </a>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-sm font-medium text-gray-500">
                  Add SubAdmin
                </span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6">Add SubAdmin</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Enter full name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium">
                  E-Mail
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium">
                  Phone
                </label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium">
                  Address
                </label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Enter address"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                className="mr-2"
                onClick={() => setView("list")}
              >
                Cancel
              </Button>
              <Button type="submit">Submit</Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage SubAdmin</h1>
        <Button onClick={() => setView("add")}>Add SubAdmin</Button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">SubAdmin Listing</h2>
          <div className="relative">
            <Input
              placeholder="Search..."
              className="pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Sr No</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubAdmins.length > 0 ? (
                filteredSubAdmins.map((subAdmin, idx) => (
                  <TableRow key={subAdmin.id}>
                    <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                    <TableCell>{subAdmin.fullName}</TableCell>
                    <TableCell>{subAdmin.address}</TableCell>
                    <TableCell>{subAdmin.email}</TableCell>
                    <TableCell>{subAdmin.phone}</TableCell>
                    <TableCell>
                      {subAdmin.type === 1 ? "Admin" : "SubAdmin"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    No sub-admins found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-between items-center my-4">
          <div>
            Page {page + 1} of {totalPages} | Total: {totalSubAdmins}
          </div>
          <div>
            <Button
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="mr-2"
            >
              Prev
            </Button>
            <Button
              variant="outline"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
