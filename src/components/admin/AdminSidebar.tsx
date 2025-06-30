import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Settings,
  Zap,
  Menu,
  X,
  ListPlus,
  ListTodo,
  UserCog,
  Palette,
  Plug,
  Link,
  FileText,
  Layout,
  Newspaper,
  FolderOpen,
  Tag,
  Tags,
  Coins,
  Server,
  LogOut,
} from "lucide-react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface AdminSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const getBaseSidebarItems = () => [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    id: "projects",
    label: "Projects",
    icon: ListTodo,
    submenu: [
      { id: "create-project", label: "Create Project", icon: ListPlus },
      { id: "project-list", label: "Project List", icon: ListTodo },
    ],
  },
  // { id: "hosting", label: "Hosting", icon: Server },
  // {
  //   id: "domains",
  //   label: "Domains",
  //   icon: Link,
  //   submenu: [{ id: "domain-management", label: "Domain Management", icon: Link }],
  // },
  // { id: "users", label: "Users", icon: Users },
  {
    id: "subadmin",
    label: "Sub Admin",
    icon: UserCog,
    submenu: [{ id: "manage-subadmin", label: "Manage", icon: UserCog }],
  },
  // { id: "themes", label: "Themes", icon: Palette },
  // { id: "plugins", label: "Plugins", icon: Plug },
  // { id: "credits", label: "Credits", icon: Coins },
  // { id: "settings", label: "Settings", icon: Settings },
];

const getContentManagementItems = () => [
  {
    id: "post-management",
    label: "Posts",
    icon: Newspaper,
    submenu: [
      { id: "posts", label: "All Posts", icon: Newspaper },
      { id: "post-categories", label: "Categories", icon: FolderOpen },
      { id: "post-subcategories", label: "Subcategories", icon: Tag },
      { id: "post-tags", label: "Tags", icon: Tags },
    ],
  },
  { id: "pages", label: "Pages", icon: Layout },
  { id: "website-generator", label: "Website Generator", icon: FileText },
];

export function AdminSidebar({ activeSection, setActiveSection }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);
  const [sidebarItems, setSidebarItems] = useState(getBaseSidebarItems());
  const navigate = useNavigate();

  // Logout handler using SweetAlert2 for confirmation and toast
  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, log out!",
    }).then((result) => {
      if (result.isConfirmed) {
        // Clear stored auth data
        localStorage.removeItem("token");
        localStorage.removeItem("Role");
        localStorage.removeItem("adminProfile");
        localStorage.clear();

        // Show a success toast
        Swal.fire({
          toast: true,
          icon: "success",
          title: "User logged out successfully!",
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });

        // Navigate to login after toast disappears
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    });
  };

  // Check if the website generator plugin is active
  useEffect(() => {
    const isPluginActive = localStorage.getItem("website-generator-plugin-active") === "true";

    if (isPluginActive) {
      // Insert content management items after "websites" (if it exists)
      const baseItems = getBaseSidebarItems();
      const websiteIndex = baseItems.findIndex((item) => item.id === "websites");

      if (websiteIndex !== -1) {
        const newItems = [...baseItems];
        const contentItems = getContentManagementItems();
        // Insert content items two positions after "websites"
        newItems.splice(websiteIndex + 2, 0, ...contentItems);
        setSidebarItems(newItems);
      }
    } else {
      // Reset to base items
      setSidebarItems(getBaseSidebarItems());
    }
  }, []);

  // Listen for storage events from other components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "website-generator-plugin-active") {
        const isPluginActive = e.newValue === "true";

        if (isPluginActive) {
          // Add content management items
          const baseItems = getBaseSidebarItems();
          const websiteIndex = baseItems.findIndex((item) => item.id === "websites");

          if (websiteIndex !== -1) {
            const newItems = [...baseItems];
            const contentItems = getContentManagementItems();
            newItems.splice(websiteIndex + 2, 0, ...contentItems);
            setSidebarItems(newItems);
          }
        } else {
          // Remove content management items
          setSidebarItems(getBaseSidebarItems());
        }
      }
    };

    // Also check for changes when component mounts
    const isPluginActive = localStorage.getItem("website-generator-plugin-active") === "true";
    if (isPluginActive) {
      const baseItems = getBaseSidebarItems();
      const websiteIndex = baseItems.findIndex((item) => item.id === "websites");

      if (websiteIndex !== -1) {
        const newItems = [...baseItems];
        const contentItems = getContentManagementItems();
        newItems.splice(websiteIndex + 2, 0, ...contentItems);
        setSidebarItems(newItems);
      }
    }

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const toggleSubmenu = (id: string) => {
    setExpandedSubmenu(expandedSubmenu === id ? null : id);
  };

  return (
    <div
      className={cn(
        "bg-gray-900 text-white transition-all duration-300 flex flex-col",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <Zap className="h-8 w-8 text-blue-400" />
            <span className="text-xl font-bold">WebGen.ai</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const hasSubmenu = item.submenu && item.submenu.length > 0;
          const isSubmenuOpen = expandedSubmenu === item.id;

          return (
            <div key={item.id} className="space-y-1">
              <button
                onClick={() => {
                  if (hasSubmenu) {
                    toggleSubmenu(item.id);
                  } else {
                    setActiveSection(item.id);
                  }
                }}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left",
                  activeSection === item.id ||
                    (hasSubmenu && item.submenu?.some((sub) => activeSection === sub.id))
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {hasSubmenu && (
                      <svg
                        className={`w-4 h-4 transition-transform ${isSubmenuOpen ? "rotate-180" : ""
                          }`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    )}
                  </>
                )}
              </button>

              {/* Submenu */}
              {!isCollapsed && hasSubmenu && isSubmenuOpen && (
                <div className="pl-11 space-y-1">
                  {item.submenu?.map((subItem) => {
                    const SubIcon = subItem.icon;
                    return (
                      <button
                        key={subItem.id}
                        onClick={() => setActiveSection(subItem.id)}
                        className={cn(
                          "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left",
                          activeSection === subItem.id
                            ? "bg-blue-600 text-white"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white"
                        )}
                      >
                        <SubIcon className="h-4 w-4 flex-shrink-0" />
                        <span>{subItem.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Logout Button (Professional placement) */}
        <div className="pt-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-xs font-semibold">A</span>
          </div>
          {!isCollapsed && (
            <div>
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-gray-400">admin@aiwebgen.com</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
