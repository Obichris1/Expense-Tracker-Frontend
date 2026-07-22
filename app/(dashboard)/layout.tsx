"use client";

import * as React from "react";
import {
  Box, Drawer, AppBar, Toolbar, List, ListItemButton,
  ListItemText, IconButton, Avatar, ListItemIcon, Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useRouter, usePathname } from "next/navigation";
import {
  Home, Receipt, Wallet, Settings,
  LogOut, ChevronRight, TrendingUp, ChevronDown, User,
} from "lucide-react";
import ProtectedRoute from "@/components/protectedroute";
import { useLogout } from "@/hooks/use-logout";
import AIAssistant from "@/components/AIassistant";


const drawerWidth = 248;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = React.useState(false);
  const avatarRef = React.useRef<HTMLDivElement>(null);

  const { mutate: logoutMutate, isPending: isLoggingOut } = useLogout();

  const handleLogout = () => {
    logoutMutate(undefined, {
      onSuccess: () => router.push("/login"),
    });
  };

  // Close avatar dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    { label: "Dashboard",    path: "/",             icon: Home,     section: "main" },
    { label: "Transactions", path: "/transactions", icon: Receipt,  section: "main" },
    { label: "Accounts",     path: "/accounts",     icon: Wallet,   section: "main" },
    { label: "Settings",     path: "/settings",     icon: Settings, section: "other" },
  ];

  const mainItems  = menuItems.filter(i => i.section === "main");
  const otherItems = menuItems.filter(i => i.section === "other");

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  const NavItem = ({ item }: { item: typeof menuItems[0] }) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    return (
      <ListItemButton
        onClick={() => { router.push(item.path); setMobileOpen(false); }}
        sx={{
          borderRadius: 2, py: 1.25, px: 1.5,
          backgroundColor: active ? "#1e293b" : "transparent",
          color: active ? "#fff" : "#94a3b8",
          position: "relative",
          "&:hover": { backgroundColor: "#1e293b", color: "#fff" },
          transition: "all 0.15s ease",
        }}
      >
        {active && (
          <Box sx={{
            position: "absolute", left: 0, top: "20%", bottom: "20%",
            width: 3, borderRadius: 4,
            background: "linear-gradient(180deg, #6366f1, #8b5cf6)",
          }} />
        )}
        <ListItemIcon sx={{ minWidth: 36, color: active ? "#818cf8" : "inherit" }}>
          <Icon size={18} />
        </ListItemIcon>
        <ListItemText
          primary={item.label}
          slotProps={{ primary: { sx: { fontSize: 14, fontWeight: active ? 600 : 400 } } }}
        />
        {active && <ChevronRight size={14} color="#6366f1" />}
      </ListItemButton>
    );
  };

  const sectionLabel = (text: string) => (
    <p style={{
      fontSize: 10, fontWeight: 600, color: "#475569",
      letterSpacing: "0.1em", textTransform: "uppercase",
      paddingLeft: 8, marginBottom: 8,
    }}>
      {text}
    </p>
  );

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "#0f172a" }}>

      {/* Brand */}
      <Box sx={{ px: 3, py: 3.5, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: 2,
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <TrendingUp size={18} color="white" />
        </Box>
        <Box>
          <p style={{ fontWeight: 700, fontSize: 15, color: "#fff", margin: 0, lineHeight: 1.2 }}>
            Pocket Wallet
          </p>
          <p style={{ fontSize: 11, color: "#64748b", margin: 0, letterSpacing: "0.05em" }}>
            Personal Finance
          </p>
        </Box>
      </Box>

      <Divider sx={{ borderColor: "#1e293b" }} />

      {/* Nav */}
      <Box sx={{ px: 2, pt: 3, flexGrow: 1 }}>
        {sectionLabel("Main Menu")}
        <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {mainItems.map(item => <NavItem key={item.path} item={item} />)}
        </List>

        <Box sx={{ mt: 3 }}>
          {sectionLabel("Other")}
          <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {otherItems.map(item => <NavItem key={item.path} item={item} />)}
          </List>
        </Box>
      </Box>

      <Divider sx={{ borderColor: "#1e293b" }} />

      {/* User footer */}
      <Box sx={{ px: 2, py: 2 }}>
        <Box sx={{
          display: "flex", alignItems: "center", gap: 1.5,
          bgcolor: "#1e293b", borderRadius: 2, px: 1.5, py: 1.25, mb: 1,
        }}>
          <Avatar sx={{
            width: 32, height: 32, fontSize: 13, fontWeight: 700,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          }}>
            <User size={16} />
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0, lineHeight: 1.3 }}>
              My Account
            </p>
            <p style={{ fontSize: 11, color: "#64748b", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Personal plan
            </p>
          </Box>
        </Box>

        {/* Logout button */}
        <ListItemButton
          onClick={handleLogout}
          disabled={isLoggingOut}
          sx={{
            borderRadius: 2, py: 1.25, px: 1.5,
            color: "#ef4444",
            "&:hover": { bgcolor: "rgba(239,68,68,0.1)" },
            "&.Mui-disabled": { opacity: 0.5 },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
            <LogOut size={18} />
          </ListItemIcon>
          <ListItemText
            primary={isLoggingOut ? "Signing out…" : "Sign out"}
            slotProps={{ primary: { sx: { fontSize: 14, fontWeight: 500 } } }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    "/":             { title: "Dashboard",    subtitle: "Overview of your finances" },
    "/transactions": { title: "Transactions", subtitle: "All your transaction activity" },
    "/accounts":     { title: "Accounts",     subtitle: "Manage your bank accounts" },
    "/settings":     { title: "Settings",     subtitle: "Account preferences" },
  };

  const currentPage = pageTitles[pathname] ?? { title: "Pocket Wallet", subtitle: "" };

  return (
    <ProtectedRoute>
      <Box sx={{ display: "flex" }}>

        {/* App Bar */}
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backgroundColor: "#fff",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <Toolbar sx={{ justifyContent: "space-between", px: { xs: 2, md: 3 }, minHeight: "64px !important" }}>

            {/* Left */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton
                onClick={() => setMobileOpen(!mobileOpen)}
                sx={{ display: { md: "none" }, color: "#374151", p: 1 }}
              >
                <MenuIcon />
              </IconButton>

              {/* Mobile logo */}
              <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", gap: 1 }}>
                <Box sx={{
                  width: 32, height: 32, borderRadius: 1.5,
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <TrendingUp size={16} color="white" />
                </Box>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>
                  Pocket Wallet
                </span>
              </Box>

              {/* Desktop page title */}
              <Box sx={{ display: { xs: "none", md: "block" } }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0, lineHeight: 1.2 }}>
                  {currentPage.title}
                </p>
                {currentPage.subtitle && (
                  <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
                    {currentPage.subtitle}
                  </p>
                )}
              </Box>
            </Box>

            {/* Right — avatar with dropdown */}
            <Box ref={avatarRef} sx={{ position: "relative" }}>
              <Box
                onClick={() => setAvatarMenuOpen(prev => !prev)}
                sx={{
                  display: "flex", alignItems: "center", gap: 1,
                  cursor: "pointer", borderRadius: 2, px: 1, py: 0.75,
                  "&:hover": { bgcolor: "#f9fafb" },
                  transition: "background 0.15s",
                  border: "1px solid transparent",
                  ...(avatarMenuOpen && { bgcolor: "#f9fafb", borderColor: "#e5e7eb" }),
                }}
              >
                <Avatar sx={{
                  width: 36, height: 36,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                }}>
                  <User size={18} color="white" />
                </Avatar>
                <Box sx={{ display: { xs: "none", sm: "block" } }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0, lineHeight: 1.2 }}>
                    My Account
                  </p>
                  <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>Personal plan</p>
                </Box>
                <ChevronDown
                  size={15}
                  color="#6b7280"
                  style={{
                    transition: "transform 0.2s",
                    transform: avatarMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </Box>

              {/* Dropdown */}
              {avatarMenuOpen && (
                <Box sx={{
                  position: "absolute", top: "calc(100% + 8px)", right: 0,
                  bgcolor: "#fff", border: "1px solid #e5e7eb",
                  borderRadius: 2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                  minWidth: 180, overflow: "hidden", zIndex: 1400,
                }}>
                  {/* Profile row */}
                  <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid #f3f4f6" }}>
                    <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Signed in as</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>
                      My Account
                    </p>
                  </Box>

                  {/* Settings link */}
                  <Box
                    onClick={() => { router.push("/settings"); setAvatarMenuOpen(false); }}
                    sx={{
                      display: "flex", alignItems: "center", gap: 1.5,
                      px: 2, py: 1.25, cursor: "pointer",
                      "&:hover": { bgcolor: "#f9fafb" },
                      borderBottom: "1px solid #f3f4f6",
                    }}
                  >
                    <Settings size={15} color="#6b7280" />
                    <span style={{ fontSize: 13, color: "#374151" }}>Settings</span>
                  </Box>

                  {/* Logout */}
                  <Box
                    onClick={() => { setAvatarMenuOpen(false); handleLogout(); }}
                    sx={{
                      display: "flex", alignItems: "center", gap: 1.5,
                      px: 2, py: 1.25, cursor: "pointer",
                      "&:hover": { bgcolor: "#fef2f2" },
                    }}
                  >
                    <LogOut size={15} color="#ef4444" />
                    <span style={{ fontSize: 13, color: "#ef4444", fontWeight: 500 }}>
                      {isLoggingOut ? "Signing out…" : "Sign out"}
                    </span>
                  </Box>
                </Box>
              )}
            </Box>
          </Toolbar>
        </AppBar>

        {/* Desktop Sidebar */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            width: drawerWidth, flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth, boxSizing: "border-box",
              border: "none", boxShadow: "1px 0 0 #1e293b",
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Mobile Sidebar */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box", border: "none" },
          }}
        >
          {drawer}
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { md: `calc(100% - ${drawerWidth}px)` },
            backgroundColor: "#f8fafc",
            minHeight: "100vh",
          }}
        >
          <Toolbar sx={{ minHeight: "64px !important" }} />
          {children}
        </Box>
      </Box>
      <AIAssistant />

    </ProtectedRoute>
  );
}