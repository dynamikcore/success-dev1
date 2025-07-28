import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, InputAdornment, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ShopRegistrationForm from '../components/ShopRegistrationForm';

// Dummy API functions (replace with actual API calls)
const fetchShops = async (query = '') => {
  console.log(`Fetching shops with query: ${query}`);
  await new Promise((resolve) => setTimeout(resolve, 500));
  const dummyShops = [
    { id: 'UVW/SHOP/001/2024', businessName: 'Mama Ngozi Provisions', ownerName: 'Ngozi Okoro', businessType: 'Retail', shopSize: 'Small', ward: 'Effurun', complianceStatus: 'Compliant' },
    { id: 'UVW/SHOP/002/2024', businessName: 'Chukwudi Electronics', ownerName: 'Chukwudi Eze', businessType: 'Electronics', shopSize: 'Medium', ward: 'Ekpan', complianceStatus: 'Defaulter' },
    { id: 'UVW/SHOP/003/2024', businessName: 'Grace Boutique', ownerName: 'Grace Adebayo', businessType: 'Fashion', shopSize: 'Small', ward: 'Uvwie', complianceStatus: 'Compliant' },
    { id: 'UVW/SHOP/004/2024', businessName: 'Uvwie Fast Food', ownerName: 'Ahmed Musa', businessType: 'Food Service', shopSize: 'Medium', ward: 'Jeddo', complianceStatus: 'New' },
    { id: 'UVW/SHOP/005/2024', businessName: 'Local Pharmacy', ownerName: 'Blessing Nwachukwu', businessType: 'Pharmacy', shopSize: 'Small', ward: 'Kokori', complianceStatus: 'Compliant' },
  ];
  return dummyShops.filter(
    (shop) =>
      shop.businessName.toLowerCase().includes(query.toLowerCase()) ||
      shop.ownerName.toLowerCase().includes(query.toLowerCase()) ||
      shop.id.toLowerCase().includes(query.toLowerCase())
  );
};

const deleteShop = async (shopId) => {
  console.log(`Deleting shop: ${shopId}`);
  await new Promise((resolve) => setTimeout(resolve, 500));
  // In a real app, you'd send a DELETE request to your API
  return { success: true };
};

const ShopManagement = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openRegistrationForm, setOpenRegistrationForm] = useState(false);
  const [editingShop, setEditingShop] = useState(null);

  const loadShops = async () => {
    setLoading(true);
    try {
      const data = await fetchShops(searchQuery);
      setShops(data);
    } catch (error) {
      console.error('Failed to fetch shops:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShops();
  }, [searchQuery]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleOpenRegistrationForm = () => {
    setEditingShop(null);
    setOpenRegistrationForm(true);
  };

  const handleCloseRegistrationForm = () => {
    setOpenRegistrationForm(false);
    loadShops(); // Reload shops after form submission
  };

  const handleEditShop = (shop) => {
    setEditingShop(shop);
    setOpenRegistrationForm(true);
  };

  const handleDeleteShop = async (shopId) => {
    const shop = shops.find(s => s.id === shopId);
    if (window.confirm(`Are you sure you want to delete "${shop?.businessName}"? This action cannot be undone.`)) {
      try {
        await deleteShop(shopId);
        alert('Shop deleted successfully');
        loadShops(); // Reload shops after deletion
      } catch (error) {
        console.error('Failed to delete shop:', error);
        alert('Failed to delete shop. Please try again.');
      }
    }
  };

  const getComplianceChipColor = (status) => {
    switch (status) {
      case 'Compliant': return 'success';
      case 'Defaulter': return 'error';
      case 'New': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
        Shop Management
      </Typography>

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          mb: 2,
          gap: { xs: 2, sm: 0 }
        }}>
          <TextField
            label="Search Shops"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenRegistrationForm}
            fullWidth={window.innerWidth < 600}
            size="small"
          >
            Register New Shop
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 650, sm: 750 } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Shop ID</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Business Name</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Owner Name</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Business Type</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Size</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Ward</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Compliance</TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shops.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>No shops found.</TableCell>
                  </TableRow>
                ) : (
                  shops.map((shop) => (
                    <TableRow key={shop.id}>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{shop.id}</TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{shop.businessName}</TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{shop.ownerName}</TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{shop.businessType}</TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{shop.shopSize}</TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{shop.ward}</TableCell>
                      <TableCell>
                        <Chip
                          label={shop.complianceStatus}
                          color={getComplianceChipColor(shop.complianceStatus)}
                          size="small"
                          sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleEditShop(shop)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteShop(shop.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={openRegistrationForm} onClose={handleCloseRegistrationForm} maxWidth="md" fullWidth>
        <DialogTitle>{editingShop ? 'Edit Shop Details' : 'Register New Shop'}</DialogTitle>
        <DialogContent>
          <ShopRegistrationForm shopData={editingShop} onSubmitSuccess={handleCloseRegistrationForm} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRegistrationForm}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShopManagement;