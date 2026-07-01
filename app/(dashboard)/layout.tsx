"use client";

import * as React from "react";
import { Box, Drawer, AppBar, Toolbar, List, ListItemButton, ListItemText, IconButton, Avatar, ListItemIcon, Divider, Badge } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useRouter, usePathname } from "next/navigation";
import { Home, Receipt, Wallet, Settings, LogOut, Bell, Search, ChevronRight, TrendingUp } from "lucide-react";
import ProtectedRoute from "@/components/protectedroute";

const drawerWidth = 248;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const menuItems = [
    { label: "Dashboard",    path: "/",             icon: Home,    section: "main" },
    { label: "Transactions", path: "/transactions", icon: Receipt, section: "main" },
    { label: "Accounts",     path: "/accounts",     icon: Wallet,  section: "main" },
    { label: "Settings",     path: "/settings",     icon: Settings, section: "other" },
  ];

  const mainItems  = menuItems.filter(i => i.section === "main");
  const otherItems = menuItems.filter(i => i.section === "other");

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

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
            My-Finance
          </p>
          <p style={{ fontSize: 11, color: "#64748b", margin: 0, letterSpacing: "0.05em" }}>
            Personal Finance
          </p>
        </Box>
      </Box>

      <Divider sx={{ borderColor: "#1e293b" }} />

      {/* Nav — main */}
      <Box sx={{ px: 2, pt: 3, flexGrow: 1 }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", paddingLeft: 8, marginBottom: 8 }}>
          Main Menu
        </p>
        <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {mainItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <ListItemButton
                key={item.path}
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
                {/* Active accent bar */}
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
  slotProps={{
    primary: {
      sx: {
        fontSize: 14,
        fontWeight: active ? 600 : 400,
      },
    },
  }}
/>
                {active && <ChevronRight size={14} color="#6366f1" />}
              </ListItemButton>
            );
          })}
        </List>

        {/* Nav — other */}
        <p style={{ fontSize: 10, fontWeight: 600, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", paddingLeft: 8, marginBottom: 8, marginTop: 24 }}>
          Other
        </p>
        <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {otherItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <ListItemButton
                key={item.path}
                onClick={() => { router.push(item.path); setMobileOpen(false); }}
                sx={{
                  borderRadius: 2, py: 1.25, px: 1.5,
                  backgroundColor: active ? "#1e293b" : "transparent",
                  color: active ? "#fff" : "#94a3b8",
                  "&:hover": { backgroundColor: "#1e293b", color: "#fff" },
                  transition: "all 0.15s ease",
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: active ? "#818cf8" : "inherit" }}>
                  <Icon size={18} />
                </ListItemIcon>
                <ListItemText
  primary={item.label}
  slotProps={{
    primary: {
      sx: {
        fontSize: 14,
        fontWeight: active ? 600 : 400,
      },
    },
  }}
/>
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      <Divider sx={{ borderColor: "#1e293b" }} />

      {/* User footer */}
      <Box sx={{ px: 2, py: 2 }}>
        {/* User card */}
        <Box sx={{
          display: "flex", alignItems: "center", gap: 1.5,
          bgcolor: "#1e293b", borderRadius: 2, px: 1.5, py: 1.25, mb: 1,
        }}>
          <Avatar sx={{
            width: 32, height: 32, fontSize: 13, fontWeight: 700,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          }}>
            C
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0, lineHeight: 1.3 }}>User</p>
            <p style={{ fontSize: 11, color: "#64748b", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              user@email.com
            </p>
          </Box>
        </Box>

        {/* Logout */}
        <ListItemButton
          onClick={() => console.log("Logout")}
          sx={{
            borderRadius: 2, py: 1.25, px: 1.5,
            color: "#ef4444",
            "&:hover": { bgcolor: "rgba(239,68,68,0.1)" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
            <LogOut size={18} />
          </ListItemIcon>
          {/* <ListItemText primary="Sign out" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} /> */}
        </ListItemButton>
      </Box>
    </Box>
  );

  // Page title map
  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    "/":             { title: "Dashboard",    subtitle: "Overview of your finances" },
    "/transactions": { title: "Transactions", subtitle: "All your transaction activity" },
    "/accounts":     { title: "Accounts",     subtitle: "Manage your bank accounts" },
    "/settings":     { title: "Settings",     subtitle: "Account preferences" },
  };

  const currentPage = pageTitles[pathname] ?? { title: "My-Finance", subtitle: "" };

  return (
    <ProtectedRoute>
      <Box sx={{ display: "flex" }}>

        {/* ── App Bar ── */}
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

            {/* Left: hamburger (mobile) + page title */}
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
                <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>My-Finance</span>
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

            {/* Right: search + notifications + avatar */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>

              {/* Search — desktop only */}
              <Box sx={{
                display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 1.5,
                bgcolor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 2,
                px: 2, py: 1, cursor: "text", minWidth: 200,
              }}>
                <Search size={15} color="#9ca3af" />
                <span style={{ fontSize: 13, color: "#9ca3af" }}>Search…</span>
                <Box sx={{
                  ml: "auto", bgcolor: "#e5e7eb", borderRadius: 1,
                  px: 0.75, py: 0.25,
                }}>
                  <span style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace" }}>⌘K</span>
                </Box>
              </Box>

              {/* Notifications */}
              <IconButton sx={{ color: "#374151", bgcolor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 2, p: 1 }}>
                <Badge
                  badgeContent={3}
                  sx={{
                    "& .MuiBadge-badge": {
                      bgcolor: "#6366f1", color: "#fff", fontSize: 9, minWidth: 16, height: 16,
                    }
                  }}
                >
                  <Bell size={18} />
                </Badge>
              </IconButton>

              {/* Avatar */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }}>
                <Avatar sx={{
                  width: 36, height: 36, fontSize: 13, fontWeight: 700,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                }}>
                  C
                </Avatar>
                <Box sx={{ display: { xs: "none", sm: "block" } }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0, lineHeight: 1.2 }}>User</p>
                  <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>Free plan</p>
                </Box>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        {/* ── Desktop Sidebar ── */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth, boxSizing: "border-box", border: "none",
              boxShadow: "1px 0 0 #1e293b",
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* ── Mobile Sidebar ── */}
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

        {/* ── Main Content ── */}
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
    </ProtectedRoute>
  );
}