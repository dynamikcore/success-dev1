import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, InputAdornment, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Chip, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ShopRegistrationForm from '../components/ShopRegistrationForm';
import { fetchShops, deleteShop } from '../services/api';

const ShopManagement = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [openRegistrationForm, setOpenRegistrationForm] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  const loadShops = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchShops(searchQuery, page, 10);
      setShops(response.shops || []);
      setPagination({
        currentPage: response.currentPage || 1,
        totalPages: response.totalPages || 1,
        totalItems: response.totalItems || 0
      });
    } catch (error) {
      console.error('Failed to fetch shops:', error);
      setError('Failed to load shops. Please try again.');
      setShops([]);
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
    const shop = shops.find(s => s.shopId === shopId);
    if (window.confirm(`Are you sure you want to delete "${shop?.businessName}"? This action cannot be undone.`)) {
      try {
        await deleteShop(shopId);
        alert('Shop deleted successfully');
        loadShops(pagination.currentPage);
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

        {error && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

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
                    <TableRow key={shop.shopId}>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{shop.shopId}</TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{shop.businessName}</TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{shop.ownerName}</TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{shop.businessType}</TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{shop.shopSizeCategory}</TableCell>
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
                        <IconButton size="small" onClick={() => handleDeleteShop(shop.shopId)}>
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