import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
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
  IconButton
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StoreIcon from '@mui/icons-material/Store';
import PaymentIcon from '@mui/icons-material/Payment';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import LoginIcon from '@mui/icons-material/Login';

// Dummy Components for Routes
const Dashboard = () => <Typography variant="h4" sx={{ p: 3 }}>Dashboard Content</Typography>;
const Shops = () => <Typography variant="h4" sx={{ p: 3 }}>Shop Registration Content</Typography>;
const Payments = () => <Typography variant="h4" sx={{ p: 3 }}>Payment Processing Content</Typography>;
const Permits = () => <Typography variant="h4" sx={{ p: 3 }}>Permit Management Content</Typography>;
const Reports = () => <Typography variant="h4" sx={{ p: 3 }}>Reports Content</Typography>;
const Settings = () => <Typography variant="h4" sx={{ p: 3 }}>Settings Content</Typography>;
const Login = () => <Typography variant="h4" sx={{ p: 3 }}>Login Page</Typography>;

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
    fontFamily: 'Roboto, sans-serif',
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#008000', // Green app bar
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

// Loading Context
const LoadingContext = createContext();

const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
          <Typography variant="h5" gutterBottom>Oops! Something went wrong.</Typography>
          <Typography variant="body1">We're sorry for the inconvenience. Please try again later.</Typography>
          {this.state.error && (
            <Box sx={{ mt: 2, p: 2, border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>
                {this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawerWidth = 240;

  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Shop Registration', icon: <StoreIcon />, path: '/shops' },
    { text: 'Payment Processing', icon: <PaymentIcon />, path: '/payments' },
    { text: 'Permit Management', icon: <AssignmentIcon />, path: '/permits' },
    { text: 'Reports', icon: <BarChartIcon />, path: '/reports' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    { text: 'Login', icon: <LoginIcon />, path: '/login' },
  ];

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

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoadingProvider>
          <ErrorBoundary>
            <Box sx={{ display: 'flex' }}>
              <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                  <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={handleDrawerToggle}
                    sx={{ mr: 2, display: { sm: 'none' } }}
                  >
                    <MenuIcon />
                  </IconButton>
                  <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                    UVWIE LGA - Shop Revenue Management System
                  </Typography>
                </Toolbar>
              </AppBar>
              <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                aria-label="mailbox folders"
              >
                {/* The implementation can be swapped with js to avoid SEO duplication of the drawer. */}
                <Drawer
                  variant="temporary"
                  open={mobileOpen}
                  onClose={handleDrawerToggle}
                  ModalProps={{
                    keepMounted: true, // Better open performance on mobile.
                  }}
                  sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                  }}
                >
                  {drawer}
                </Drawer>
                <Drawer
                  variant="permanent"
                  sx={{
                    display: { xs: 'none', sm: 'block' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                  }}
                  open
                >
                  {drawer}
                </Drawer>
              </Box>
              <Box
                component="main"
                sx={{
                  flexGrow: 1,
                  p: 3,
                  width: { sm: `calc(100% - ${drawerWidth}px)` },
                  mt: '64px', // AppBar height
                }}
              >
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/shops" element={<Shops />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/permits" element={<Permits />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/login" element={<Login />} />
                </Routes>
              </Box>
            </Box>
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
          </ErrorBoundary>
        </LoadingProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;