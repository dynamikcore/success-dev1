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
    if (window.confirm(`Are you sure you want to delete shop ${shopId}?`)) {
      try {
        await deleteShop(shopId);
        loadShops(); // Reload shops after deletion
      } catch (error) {
        console.error('Failed to delete shop:', error);
        alert('Failed to delete shop.');
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Shop Management</Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <TextField
            label="Search Shops"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenRegistrationForm}>
            Register New Shop
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Shop ID</TableCell>
                  <TableCell>Business Name</TableCell>
                  <TableCell>Owner Name</TableCell>
                  <TableCell>Business Type</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Ward</TableCell>
                  <TableCell>Compliance</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shops.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">No shops found.</TableCell>
                  </TableRow>
                ) : (
                  shops.map((shop) => (
                    <TableRow key={shop.id}>
                      <TableCell>{shop.id}</TableCell>
                      <TableCell>{shop.businessName}</TableCell>
                      <TableCell>{shop.ownerName}</TableCell>
                      <TableCell>{shop.businessType}</TableCell>
                      <TableCell>{shop.shopSize}</TableCell>
                      <TableCell>{shop.ward}</TableCell>
                      <TableCell>
                        <Chip label={shop.complianceStatus} color={getComplianceChipColor(shop.complianceStatus)} size="small" />
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