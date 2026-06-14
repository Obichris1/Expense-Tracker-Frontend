"use client";

import * as React from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  Avatar,
  ListItemIcon,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useRouter, usePathname } from "next/navigation";
import { Home, Receipt, Wallet, Settings, LogOut } from "lucide-react";
import ProtectedRoute from "@/components/protectedroute";

const drawerWidth = 240;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { label: "Dashboard", path: "/", icon: Home },
    { label: "Transactions", path: "/transactions", icon: Receipt },
    { label: "Accounts", path: "/accounts", icon: Wallet },
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Wallet size={20} color="white" />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            My-Finance
          </Typography>
        </Box>
      </Toolbar>

      <List sx={{ px: 2, py: 3, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <ListItemButton
              key={item.path}
              selected={pathname === item.path}
              onClick={() => router.push(item.path)}
              sx={{
                borderRadius: 2,
                mb: 1,
                py: 1.5,
                "&.Mui-selected": {
                  backgroundColor: "#1a1a1a",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "#2a2a2a",
                  },
                },
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                <Icon size={20} />
              </ListItemIcon>
              <ListItemText 
                primary={item.label} 
                // primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Divider />

      <List sx={{ px: 2, py: 2 }}>
        <ListItemButton
          onClick={() => {
            // Add logout logic here
            console.log("Logout clicked");
          }}
          sx={{
            borderRadius: 2,
            py: 1.5,
            color: "#dc2626",
            "&:hover": {
              backgroundColor: "#fee2e2",
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
            <LogOut size={20} />
          </ListItemIcon>
          <ListItemText 
            primary="Logout" 
            // primaryTypographyProps={{ fontWeight: 500 }}
          />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <ProtectedRoute>
    <Box sx={{ display: "flex" }}>
      {/* Top App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: "white",
          color: "#1a1a1a",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { md: "none" } }}
            >
              <MenuIcon />
            </IconButton>

            {/* Logo - visible on mobile when sidebar is closed */}
            <Box
              sx={{
                display: { xs: "flex", md: "none" },
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Wallet size={18} color="white" />
              </Box>
              <Typography sx={{ fontWeight: 600 }} >
                My-Finance
              </Typography>
            </Box>
          </Box>

          {/* Avatar */}
          <IconButton
            onClick={() => {
              // Add profile click handler
              console.log("Profile clicked");
            }}
            sx={{ p: 0 }}
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
                cursor: "pointer",
              }}
            >
              C
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Sidebar (Desktop) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: drawerWidth,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid #e5e7eb",
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Sidebar (Mobile) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: "#fafafa",
          minHeight: "100vh",
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
    </ProtectedRoute>
  );
}