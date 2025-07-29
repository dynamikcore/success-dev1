import React, { useState, useEffect, createContext, useContext } from 'react';

import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import { LoadingProvider } from './contexts/LoadingContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useLoading } from './contexts/LoadingContext';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline, 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  IconButton,
  useTheme,
  useMediaQuery,
  Button,
  Menu,
  MenuItem
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StoreIcon from '@mui/icons-material/Store';
import PaymentIcon from '@mui/icons-material/Payment';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import LoginIcon from '@mui/icons-material/Login';

import Dashboard from './pages/Dashboard';
import ShopRegistrationForm from './components/ShopRegistrationForm';
import PaymentForm from './components/PaymentForm';
import PaymentProcessing from './pages/PaymentProcessing';
import Reports from './pages/Reports';
import PermitManagement from './pages/PermitManagement';
import ShopManagement from './pages/ShopManagement';
import Login from './components/login';


const Payments = () => <PaymentProcessing />;
const PermitsComponent = () => <PermitManagement />;
const ReportsComponent = () => <Reports />;



const Settings = () => <Typography variant="h4" sx={{ p: 3 }}>Settings Content</Typography>;

// Material-UI Theme with Nigerian Government Colors (Green/White)
const theme = createTheme({
  palette: {
    primary: {
      main: '#008000', // Green
    },
    secondary: {
      main: '#FFFFFF', // White
    },
    background: {
      default: '#f0f0f0',
    },
  },
  typography: {
    fontFamily: 'Montserrat, sans-serif',
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#008000 !important', // Force green app bar
          color: '#ffffff !important',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF', // White drawer background
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: '#008000', // Green text for list items
        },
      },
    },
  },
});



function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
        <AppContent />
    </Router>
  );
}

function AppContent() {
  // Move ALL hooks to the top before any conditional logic
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout, loading } = useAuth();
  const { isLoading } = useLoading();

  // Now handle conditional returns AFTER all hooks are called
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const drawerWidth = 240;

  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Shop Management', icon: <StoreIcon />, path: '/shop-management' },
    { text: 'Payment Processing', icon: <PaymentIcon />, path: '/payments' },
    { text: 'Permit Management', icon: <AssignmentIcon />, path: '/permits' },
    { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  // Mobile Sidebar
  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2, color: 'primary.main' }}>
        UVWIE LGA
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        Welcome, {user.name}
      </Typography>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton component={Link} to={item.path}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem disablePadding>
          <ListItemButton onClick={logout}>
            <ListItemIcon><LoginIcon /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  // Desktop Header Navigation
  const desktopNav = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {navItems.slice(0, 5).map((item) => (
        <Button
          key={item.text}
          color="inherit"
          component={Link}
          to={item.path}
          startIcon={item.icon}
          sx={{ textTransform: 'none' }}
        >
          {item.text}
        </Button>
      ))}
      <IconButton color="inherit" onClick={handleMenuClick}>
        <SettingsIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose} component={Link} to="/settings">
          <ListItemIcon><SettingsIcon /></ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); logout(); }}>
          <ListItemIcon><LoginIcon /></ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
      </Menu>
      <Typography variant="body2" sx={{ ml: 2 }}>
        Welcome, {user.name}
      </Typography>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {isLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: (theme) => theme.zIndex.drawer + 2,
            pointerEvents: 'none',
          }}
        >
          <Box sx={{ pointerEvents: 'auto' }}>
            <CircularProgress />
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: isMobile ? 1 : 0, mr: 4 }}>
              UVWIE LGA - Shop Revenue Management System
            </Typography>
            {!isMobile && desktopNav}
          </Toolbar>
        </AppBar>

        {/* Mobile Navigation Drawer */}
        {isMobile && (
          <Box
            component="nav"
            sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            aria-label="navigation"
          >
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{
                keepMounted: true,
              }}
              sx={{
                display: { xs: 'block', md: 'none' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
              }}
            >
              {drawer}
            </Drawer>
          </Box>
        )}

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            mt: '64px',
            width: '100%',
            overflow: 'auto',
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/shop-management" element={<ShopManagement />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/permits" element={<PermitsComponent />} />
            <Route path="/reports" element={<ReportsComponent />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Box>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            p: 2,
            mt: 'auto',
            backgroundColor: '#008000 !important', // Force green color
            color: 'white !important',
            textAlign: 'center',
            width: '100%',
          }}
        >
          <Typography variant="body2">
            © {new Date().getFullYear()} Uvwie Local Government Area. All rights reserved.
          </Typography>
          <Typography variant="body2">
            Developed by Your Company Name
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;