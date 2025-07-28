import React, { useState, useEffect, createContext, useContext } from 'react';

import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import { LoadingProvider } from './contexts/LoadingContext';
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


const Payments = () => <PaymentProcessing />;
const PermitsComponent = () => <PermitManagement />;
const ReportsComponent = () => <Reports />;



const Settings = () => <Typography variant="h4" sx={{ p: 3 }}>Settings Content</Typography>;
const Login = () => <Typography variant="h4" sx={{ p: 3 }}>Login Page</Typography>;

// Material-UI Theme with Nigerian Government Colors (Green/White)
const theme = createTheme({
  palette: {
    primary: {
      main: '#008000', // Green - Agency color
      light: '#4caf50',
      dark: '#006400',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#008000', // Also green instead of default blue
      light: '#4caf50',
      dark: '#006400',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f0f0f0',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    h1: { fontFamily: '"Montserrat", sans-serif' },
    h2: { fontFamily: '"Montserrat", sans-serif' },
    h3: { fontFamily: '"Montserrat", sans-serif' },
    h4: { fontFamily: '"Montserrat", sans-serif' },
    h5: { fontFamily: '"Montserrat", sans-serif' },
    h6: { fontFamily: '"Montserrat", sans-serif' },
    body1: { fontFamily: '"Montserrat", sans-serif' },
    body2: { fontFamily: '"Montserrat", sans-serif' },
    button: { fontFamily: '"Montserrat", sans-serif' },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#008000', // Green app bar
          color: '#ffffff',
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
          fontFamily: '"Montserrat", sans-serif',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          backgroundColor: '#008000',
          color: '#ffffff',
          fontFamily: '"Montserrat", sans-serif',
          '&:hover': {
            backgroundColor: '#006400',
          },
        },
        outlinedPrimary: {
          borderColor: '#008000',
          color: '#008000',
          fontFamily: '"Montserrat", sans-serif',
          '&:hover': {
            borderColor: '#006400',
            backgroundColor: 'rgba(0, 128, 0, 0.04)',
          },
        },
        textPrimary: {
          color: '#008000',
          fontFamily: '"Montserrat", sans-serif',
          '&:hover': {
            backgroundColor: 'rgba(0, 128, 0, 0.04)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#008000',
          '&:hover': {
            backgroundColor: 'rgba(0, 128, 0, 0.04)',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: '"Montserrat", sans-serif',
          '&.Mui-selected': {
            color: '#008000',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#008000',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            fontFamily: '"Montserrat", sans-serif',
            '&.Mui-focused fieldset': {
              borderColor: '#008000',
            },
          },
          '& .MuiInputLabel-root': {
            fontFamily: '"Montserrat", sans-serif',
            '&.Mui-focused': {
              color: '#008000',
            },
          },
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          '& .MuiInputLabel-root': {
            fontFamily: '"Montserrat", sans-serif',
            '&.Mui-focused': {
              color: '#008000',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          fontFamily: '"Montserrat", sans-serif',
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#008000',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: '#008000',
          color: '#ffffff',
          fontFamily: '"Montserrat", sans-serif',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: 'rgba(0, 128, 0, 0.2)',
        },
        barColorPrimary: {
          backgroundColor: '#008000',
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        colorPrimary: {
          color: '#008000',
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        colorPrimary: {
          color: '#008000',
          '&.Mui-checked': {
            color: '#008000',
          },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        colorPrimary: {
          color: '#008000',
          '&.Mui-checked': {
            color: '#008000',
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        colorPrimary: {
          '& .MuiSwitch-thumb': {
            color: '#008000',
          },
          '& .MuiSwitch-track': {
            backgroundColor: 'rgba(0, 128, 0, 0.5)',
          },
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
      <LoadingProvider>
        <AppContent />
      </LoadingProvider>
    </Router>
  );
}

function AppContent() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState(null);

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
    { text: 'Login', icon: <LoginIcon />, path: '/login' },
  ];

  // Mobile Sidebar
  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2, color: 'primary.main' }}>
        UVWIE LGA
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
        {navItems.slice(5).map((item) => (
          <MenuItem
            key={item.text}
            onClick={handleMenuClose}
            component={Link}
            to={item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );

  const { isLoading } = useLoading();

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
            <Route path="/login" element={<Login />} />
          </Routes>
        </Box>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            p: 2,
            mt: 'auto',
            backgroundColor: 'primary.main',
            color: 'white',
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