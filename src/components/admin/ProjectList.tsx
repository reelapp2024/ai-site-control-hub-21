
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, ExternalLink, Pencil, Search, Server, Trash, Plus, Zap, Globe, Laptop, Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import '@fortawesome/fontawesome-free/css/all.min.css';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { httpFile } from "../../config.js";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export function ProjectList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(6); // Fixed items per page
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const [projects, setProjects] = useState([]);
  const [Activeprojects, setActiveProjects] = useState([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch projects from API with pagination and search
useEffect(() => {
  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "No authentication token found",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const params = {
        page: currentPage,
        limit,
        ...(searchTerm && { search: searchTerm }),
      };

      const res = await httpFile.post(
        "getUserProjects",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }
      );

      if (res.status === 401) {
        // Clear any stored credentials
        localStorage.clear();

        // Let the user know their session has expired
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });

        // Redirect to login
        navigate("/login");
        return;
      }

      if (res.status === 400) {
        toast({
          title: "Request Error",
          description: res.data.message || "Invalid request",
          variant: "destructive",
        });
        return;
      }

      if (res.status === 404) {
        toast({
          title: "User Not Found",
          description: res.data.message || "User not found",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      setProjects(res.data.data || []);
      setActiveProjects(res.data.totalActiveProjects || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalProjects(res.data.total || 0);
    } catch (err) {
      if (err.response?.status === 401) {
        // Handle thrown 401
        localStorage.clear();
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: err.response?.data?.message || "Failed to fetch projects",
          variant: "destructive",
        });
      }
      navigate("/login");
    }
  };

  fetchProjects();
}, [navigate, currentPage, limit, searchTerm, toast]);


  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle search input
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const getBadgeVariant = (status) => {
    switch (status) {
      case 2:
        return "bg-green-100 text-green-800 border-green-200";
      case 0:
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Action handlers
  const handleVisitLocalSite = (id) => {
    window.open(`http://localhost:8081/?siteId=${id}`, "_blank");
  };

  const handleVisitLiveSite = (id) => {
    window.open(`https://aisite.todaystrends.site//?siteId=${id}`, "_blank");
  };

  const handleVisitServices = (id) => {
    // Store the project ID in localStorage so the services page knows which project
    localStorage.setItem("currentProjectId", id);
    navigate(`/services/${id}`);
  };

  const handleUpdateProject = (id) => {
    navigate(`/admin/project/${id}/details`);
  };

  return (
    <div className="space-y-6 font-poppins">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-600 text-white">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                Project Management
              </h1>
              <p className="text-sm text-purple-600 dark:text-purple-300">
                Manage and monitor your projects
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search projects..."
              className="pl-10 pr-4 w-full sm:w-[250px] h-10"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <Button className="h-10 px-4 bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => navigate("/admin/create-project")}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-600">Total Projects</p>
                <p className="text-2xl font-bold text-purple-900">{totalProjects}</p>
              </div>
              <div className="p-2 bg-purple-600 rounded-lg">
                <Zap className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-600">Active Projects</p>
                <p className="text-2xl font-bold text-green-900">
                  {Activeprojects}
                </p>
              </div>
              <div className="p-2 bg-green-600 rounded-lg">
                <Eye className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600">Total Images</p>
                <p className="text-2xl font-bold text-blue-900">
                  {projects.reduce((sum, p) => sum + (p.images?.length || 0), 0)}
                </p>
              </div>
              <div className="p-2 bg-blue-600 rounded-lg">
                <Server className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project._id} className="hover:shadow-lg transition-shadow duration-200 border border-gray-200">
            <CardContent className="p-6">
              {/* Header with delete button */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <i className={`fas fa-${project.defaultFasFaIcon} text-2xl`}></i>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{project.projectName}</h3>
                    <p className="text-xs text-gray-500">{project.serviceType}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <Badge className={`text-xs px-2 py-1 ${getBadgeVariant(project.status)}`}>
                    {project.status === 2 ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Created</span>
                  <span className="text-xs text-gray-700">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-gray-500">Images</span>
                  <Badge className="bg-purple-100 text-purple-700 text-xs px-2 py-1">
                    {project.images?.length || 0}
                  </Badge>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => handleVisitLocalSite(project._id)}
                    >
                      <Laptop className="h-3 w-3 mr-1" />
                      Local Site
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => handleVisitLiveSite(project._id)}
                    >
                      <Globe className="h-3 w-3 mr-1" />
                      Live Site
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => handleVisitServices(project._id)}
                    >
                      <Wrench className="h-3 w-3 mr-1" />
                      Services
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 text-blue-600 hover:text-blue-700"
                      onClick={() => handleUpdateProject(project._id)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Update
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {projects.length === 0 && (
        <Card className="py-16">
          <CardContent className="text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 rounded-full bg-purple-100">
                <Search className="h-8 w-8 text-purple-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">No projects found</h3>
                <p className="text-sm text-gray-500">Try adjusting your search terms or create a new project</p>
              </div>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => navigate("/admin/create-project")}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Project
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalProjects > 0 && (
        <div className="flex items-center justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationLink
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="cursor-pointer"
                  >
                    {currentPage - 1}
                  </PaginationLink>
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationLink
                  isActive={true}
                  onClick={() => handlePageChange(currentPage)}
                  className="cursor-pointer"
                >
                  {currentPage}
                </PaginationLink>
              </PaginationItem>

              {currentPage < totalPages && (
                <PaginationItem>
                  <PaginationLink
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="cursor-pointer"
                  >
                    {currentPage + 1}
                  </PaginationLink>
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
