import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
  Autocomplete,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';

// Dummy API functions (replace with actual API calls)
const fetchShops = async (query) => {
  console.log(`Fetching shops with query: ${query}`);
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  const dummyShops = [
    { id: 'S001', businessName: 'Mama Ngozi Provisions', ownerName: 'Ngozi Okoro' },
    { id: 'S002', businessName: 'Chukwudi Electronics', ownerName: 'Chukwudi Eze' },
    { id: 'S003', businessName: 'Grace Boutique', ownerName: 'Grace Adebayo' },
    { id: 'S004', businessName: 'Uvwie Fast Food', ownerName: 'Ahmed Musa' },
  ];
  return dummyShops.filter(
    (shop) =>
      shop.businessName.toLowerCase().includes(query.toLowerCase()) ||
      shop.ownerName.toLowerCase().includes(query.toLowerCase()) ||
      shop.id.toLowerCase().includes(query.toLowerCase())
  );
};

const fetchRevenueTypes = async () => {
  console.log('Fetching revenue types');
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  return [
    { id: 'RT001', name: 'Business Premises Permit', description: 'Annual permit for business operations', amount: 15000 },
    { id: 'RT002', name: 'Waste Management Levy', description: 'Monthly levy for waste collection', amount: 2500 },
    { id: 'RT003', name: 'Signage Fee', description: 'Annual fee for business signage', amount: 5000 },
  ];
};

const processPayment = async (paymentData) => {
  console.log('Processing payment:', paymentData);
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  // Simulate success or failure
  if (Math.random() > 0.1) {
    return { success: true, receiptId: 'REC' + Date.now(), message: 'Payment processed successfully.' };
  } else {
    throw new Error('Payment processing failed. Please try again.');
  }
};

const calculatePenalty = (amountDue, paymentDate) => {
  const dueDate = dayjs().subtract(1, 'month'); // Example: due a month ago
  if (dayjs(paymentDate).isAfter(dueDate, 'day')) {
    return 0; // No penalty if paid on time or early
  }
  const daysOverdue = dayjs(paymentDate).diff(dueDate, 'days');
  // Example penalty: 1% per day overdue
  return amountDue * 0.01 * daysOverdue;
};

const schema = yup.object().shape({
  shop: yup.object().nullable().required('Shop is required'),
  revenueType: yup.object().nullable().required('Revenue type is required'),
  assessmentYear: yup.number().required('Assessment year is required'),
  amountPaid: yup.number().required('Amount paid is required').min(0, 'Amount paid cannot be negative'),
  paymentMethod: yup.string().required('Payment method is required'),
  paymentDate: yup.object().nullable().required('Payment date is required'),
  receiptRequired: yup.boolean(),
  description: yup.string().optional(),
});

const PaymentForm = () => {
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      assessmentYear: dayjs().year(),
      amountPaid: 0,
      paymentDate: dayjs(),
      receiptRequired: true,
      description: '',
      shop: null,
      revenueType: null,
      paymentMethod: '',
    },
  });

  const [shops, setShops] = useState([]);
  const [revenueTypes, setRevenueTypes] = useState([]);
  const [shopSearchLoading, setShopSearchLoading] = useState(false);
  const [revenueTypeLoading, setRevenueTypeLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState(null);

  const selectedShop = watch('shop');
  const selectedRevenueType = watch('revenueType');
  const amountPaid = watch('amountPaid');
  const paymentDate = watch('paymentDate');

  const amountDue = selectedRevenueType ? selectedRevenueType.amount : 0;
  const penalty = calculatePenalty(amountDue, paymentDate);
  const totalAmountDue = amountDue + penalty;

  useEffect(() => {
    const loadRevenueTypes = async () => {
      setRevenueTypeLoading(true);
      try {
        const types = await fetchRevenueTypes();
        setRevenueTypes(types);
      } catch (error) {
        console.error('Failed to fetch revenue types:', error);
      } finally {
        setRevenueTypeLoading(false);
      }
    };
    loadRevenueTypes();
  }, []);

  const handleShopSearch = async (event, value) => {
    if (value.length < 2) {
      setShops([]);
      return;
    }
    setShopSearchLoading(true);
    try {
      const results = await fetchShops(value);
      setShops(results);
    } catch (error) {
      console.error('Failed to search shops:', error);
    } finally {
      setShopSearchLoading(false);
    }
  };

  const handleConfirmPayment = (data) => {
    setPaymentSummary({
      ...data,
      amountDue,
      penalty,
      totalAmountDue,
    });
    setConfirmDialogOpen(true);
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setPaymentSummary(null);
  };

  const handleFinalizePayment = async () => {
    setPaymentProcessing(true);
    setPaymentError('');
    setPaymentSuccess(false);
    try {
      const result = await processPayment(paymentSummary);
      if (result.success) {
        setPaymentSuccess(true);
        // Optionally reset form or navigate
      } else {
        setPaymentError(result.message || 'Payment failed.');
      }
    } catch (error) {
      setPaymentError(error.message || 'An unexpected error occurred.');
    } finally {
      setPaymentProcessing(false);
      setConfirmDialogOpen(false);
    }
  };

  const currentYear = dayjs().year();
  const assessmentYears = Array.from({ length: 5 }, (_, i) => currentYear - i); // Current year and 4 previous years

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Record Shop Revenue Payment</Typography>
        <Box component="form" onSubmit={handleSubmit(handleConfirmPayment)} sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="shop"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    options={shops}
                    getOptionLabel={(option) => option.businessName ? `${option.businessName} (${option.ownerName} - ${option.id})` : ''}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onInputChange={handleShopSearch}
                    loading={shopSearchLoading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search Shop (ID, Business Name, Owner)"
                        error={!!errors.shop}
                        helperText={errors.shop?.message}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {shopSearchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="revenueType"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.revenueType}>
                    <InputLabel>Revenue Type</InputLabel>
                    <Select
                      {...field}
                      label="Revenue Type"
                      loading={revenueTypeLoading}
                    >
                      {revenueTypeLoading ? (
                        <MenuItem disabled>
                          <CircularProgress size={20} /> Loading...
                        </MenuItem>
                      ) : (
                        revenueTypes.map((type) => (
                          <MenuItem key={type.id} value={type}>
                            {type.name} (₦{type.amount.toLocaleString()})
                          </MenuItem>
                        ))
                      )}
                    </Select>
                    {errors.revenueType && <Typography color="error" variant="caption">{errors.revenueType.message}</Typography>}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="assessmentYear"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.assessmentYear}>
                    <InputLabel>Assessment Year</InputLabel>
                    <Select
                      {...field}
                      label="Assessment Year"
                    >
                      {assessmentYears.map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.assessmentYear && <Typography color="error" variant="caption">{errors.assessmentYear.message}</Typography>}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Amount Due"
                value={`₦${amountDue.toLocaleString()}`}
                InputProps={{ readOnly: true }}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              {penalty > 0 && (
                <Typography variant="body2" color="error" sx={{ mt: -1, mb: 2 }}>
                  Penalty for overdue payment: ₦{penalty.toLocaleString()}
                </Typography>
              )}
              <TextField
                fullWidth
                label="Total Amount Due"
                value={`₦${totalAmountDue.toLocaleString()}`}
                InputProps={{ readOnly: true }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="amountPaid"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Amount Paid"
                    type="number"
                    inputProps={{ step: '0.01' }}
                    error={!!errors.amountPaid}
                    helperText={errors.amountPaid?.message}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>₦</Typography>,
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.paymentMethod}>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      {...field}
                      label="Payment Method"
                    >
                      <MenuItem value="Cash">Cash</MenuItem>
                      <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                      <MenuItem value="POS">POS</MenuItem>
                      <MenuItem value="Online">Online</MenuItem>
                      <MenuItem value="Cheque">Cheque</MenuItem>
                    </Select>
                    {errors.paymentMethod && <Typography color="error" variant="caption">{errors.paymentMethod.message}</Typography>}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="paymentDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Payment Date"
                    value={field.value}
                    onChange={(newValue) => field.onChange(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        error={!!errors.paymentDate}
                        helperText={errors.paymentDate?.message}
                      />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="receiptRequired"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Receipt Required"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Description/Notes (Optional)"
                    multiline
                    rows={4}
                    variant="outlined"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary" size="large" disabled={paymentProcessing}>
                {paymentProcessing ? <CircularProgress size={24} /> : 'Confirm Payment'}
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Payment Confirmation Dialog */}
        <Dialog open={confirmDialogOpen} onClose={handleCloseConfirmDialog}>
          <DialogTitle>Confirm Payment</DialogTitle>
          <DialogContent>
            {paymentSummary && (
              <DialogContentText>
                <Typography>Shop: {paymentSummary.shop?.businessName}</Typography>
                <Typography>Revenue Type: {paymentSummary.revenueType?.name}</Typography>
                <Typography>Assessment Year: {paymentSummary.assessmentYear}</Typography>
                <Typography>Amount Due: ₦{paymentSummary.amountDue.toLocaleString()}</Typography>
                {paymentSummary.penalty > 0 && <Typography color="error">Penalty: ₦{paymentSummary.penalty.toLocaleString()}</Typography>}
                <Typography>Total Amount Due: ₦{paymentSummary.totalAmountDue.toLocaleString()}</Typography>
                <Typography>Amount Paid: ₦{paymentSummary.amountPaid.toLocaleString()}</Typography>
                <Typography>Payment Method: {paymentSummary.paymentMethod}</Typography>
                <Typography>Payment Date: {dayjs(paymentSummary.paymentDate).format('YYYY-MM-DD')}</Typography>
                <Typography>Receipt Required: {paymentSummary.receiptRequired ? 'Yes' : 'No'}</Typography>
                {paymentSummary.description && <Typography>Notes: {paymentSummary.description}</Typography>}
                <Typography variant="h6" sx={{ mt: 2 }}>
                  {paymentSummary.amountPaid < paymentSummary.totalAmountDue
                    ? `Partial Payment: ₦${(paymentSummary.totalAmountDue - paymentSummary.amountPaid).toLocaleString()} remaining.`
                    : 'Payment will cover the full amount due.'}
                </Typography>
              </DialogContentText>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConfirmDialog} color="secondary">Cancel</Button>
            <Button onClick={handleFinalizePayment} color="primary" disabled={paymentProcessing}>
              {paymentProcessing ? <CircularProgress size={24} /> : 'Finalize Payment'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Payment Status Feedback */}
        {paymentSuccess && (
          <Typography color="success" sx={{ mt: 2 }}>
            Payment successful! Receipt ID: {paymentSuccess.receiptId}
          </Typography>
        )}
        {paymentError && (
          <Typography color="error" sx={{ mt: 2 }}>
            Error: {paymentError}
          </Typography>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default PaymentForm;