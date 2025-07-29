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
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { fetchShops, fetchRevenueTypes, createPayment } from '../services/api';

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
  revenueType: yup.string().required('Revenue type is required'),
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
      shop: null,
      revenueType: '', // Changed from null to empty string
      assessmentYear: dayjs().year(),
      amountPaid: 0,
      paymentMethod: '',
      paymentDate: dayjs(),
      receiptRequired: true,
      description: '',
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

  // Find the actual revenue type object from the string ID with safety checks
  const revenueTypeObject = (Array.isArray(revenueTypes) && selectedRevenueType)
    ? revenueTypes.find(type => type.id === selectedRevenueType)
    : null;
  const amountDue = revenueTypeObject ? (revenueTypeObject.amount || 0) : 0;
  const penalty = calculatePenalty(amountDue, paymentDate);
  const totalAmountDue = amountDue + penalty;

  useEffect(() => {
    const loadRevenueTypes = async () => {
      setRevenueTypeLoading(true);
      try {
        const response = await fetchRevenueTypes();
        console.log('Revenue types response:', response);

        // Handle different response formats
        let types = [];
        if (Array.isArray(response)) {
          types = response;
        } else if (response && Array.isArray(response.data)) {
          types = response.data;
        } else if (response && Array.isArray(response.revenueTypes)) {
          types = response.revenueTypes;
        }

        console.log('Processed revenue types:', types);
        setRevenueTypes(types);

        if (types.length === 0) {
          console.warn('No revenue types found');
        }
      } catch (error) {
        console.error('Failed to fetch revenue types:', error);
        setRevenueTypes([]);
      } finally {
        setRevenueTypeLoading(false);
      }
    };
    loadRevenueTypes();
  }, []);

  const handleShopSearch = async (event, value) => {
    if (!value || typeof value !== 'string' || value.length < 2) {
      setShops([]);
      return;
    }
    setShopSearchLoading(true);
    try {
      const response = await fetchShops(value);
      console.log('Shops response:', response);

      // Handle different response formats
      let shopsData = [];
      if (Array.isArray(response)) {
        shopsData = response;
      } else if (response && Array.isArray(response.shops)) {
        shopsData = response.shops;
      } else if (response && Array.isArray(response.data)) {
        shopsData = response.data;
      }

      setShops(shopsData);
    } catch (error) {
      console.error('Failed to search shops:', error);
      setShops([]);
    } finally {
      setShopSearchLoading(false);
    }
  };

  const handleConfirmPayment = (data) => {
    const revenueTypeObj = Array.isArray(revenueTypes)
      ? revenueTypes.find(type => type.id === data.revenueType)
      : null;

    if (!revenueTypeObj) {
      setPaymentError('Please select a valid revenue type');
      return;
    }

    setPaymentSummary({
      ...data,
      revenueType: revenueTypeObj,
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

  const onSubmit = async (data) => {
    setLoading(true);
    setPaymentError('');
    setPaymentSuccess(null);

    try {
      const paymentData = {
        shopId: data.shop.shopId,
        revenueTypeId: data.revenueType,
        amount: parseFloat(data.amountPaid),
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate.format('YYYY-MM-DD'),
        collectedBy: 'System Administrator', // TODO: Get from auth context
        notes: data.description || '',
      };

      const result = await createPayment(paymentData);

      if (result.success) {
        setPaymentSuccess({
          receiptId: result.payment.receiptNumber,
          amount: result.payment.amount
        });

        // Generate and download PDF receipt
        await generatePDFReceipt(result.payment, data.shop);

        // Reset form
        reset();
        setShops([]);

        if (onPaymentSuccess) {
          onPaymentSuccess(result.payment);
        }
      }
    } catch (error) {
      console.error('Payment submission error:', error);
      setPaymentError(error.message || 'Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generatePDFReceipt = async (paymentData, shopData) => {
    try {
      // Import jsPDF dynamically to avoid SSR issues
      const { jsPDF } = await import('jspdf');

      const doc = new jsPDF();

      // Header
      doc.setFontSize(18);
      doc.text('Uvwie Local Government Area', 105, 20, null, null, 'center');
      doc.setFontSize(14);
      doc.text('Official Payment Receipt', 105, 30, null, null, 'center');
      doc.line(20, 35, 190, 35);

      // Receipt details
      doc.setFontSize(12);
      doc.text(`Receipt Number: ${paymentData.receiptNumber}`, 20, 50);
      doc.text(`Date: ${new Date(paymentData.paymentDate).toLocaleDateString()}`, 20, 60);
      doc.text(`Amount: ₦${parseFloat(paymentData.amount).toLocaleString()}`, 20, 70);
      doc.text(`Payment Method: ${paymentData.paymentMethod}`, 20, 80);

      // Shop details
      doc.text('Shop Information:', 20, 100);
      doc.setFontSize(10);
      doc.text(`Business Name: ${shopData.businessName}`, 20, 110);
      doc.text(`Owner: ${shopData.ownerName}`, 20, 120);
      doc.text(`Address: ${shopData.shopAddress}`, 20, 130);
      doc.text(`Shop ID: ${shopData.shopId}`, 20, 140);

      // Footer
      doc.setFontSize(8);
      doc.text('This is an official receipt from Uvwie Local Government Area', 105, 200, null, null, 'center');
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 210, null, null, 'center');

      // Download the PDF
      doc.save(`Uvwie-Receipt-${paymentData.receiptNumber}.pdf`);

    } catch (error) {
      console.error('Error generating PDF receipt:', error);
      alert('Payment successful, but receipt generation failed. Please contact support.');
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
                    getOptionLabel={(option) => option && option.businessName ? `${option.businessName} (${option.ownerName} - ${option.shopId})` : ''}
                    isOptionEqualToValue={(option, value) => {
                      if (!option || !value) return option === value;
                      return option.shopId === value.shopId;
                    }}
                    onInputChange={handleShopSearch}
                    onChange={(event, newValue) => {
                      field.onChange(newValue);
                    }}
                    value={field.value || null}
                    loading={!!shopSearchLoading}
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
                      value={field.value || ''}
                      onChange={(event) => {
                        field.onChange(event.target.value);
                      }}
                    >
                      <MenuItem value=""><em>Select revenue type</em></MenuItem>
                      {revenueTypeLoading ? (
                        <MenuItem disabled>
                          <CircularProgress size={20} sx={{ mr: 1 }} /> Loading...
                        </MenuItem>
                      ) : (
                        Array.isArray(revenueTypes) && revenueTypes.length > 0 ? (
                          revenueTypes.map((type) => (
                            <MenuItem key={type.id} value={type.id}>
                              {type.name} (₦{(type.amount || 0).toLocaleString()})
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem disabled>No revenue types available</MenuItem>
                        )
                      )}
                    </Select>
                    {errors.revenueType && (
                      <Typography color="error" variant="caption" sx={{ mt: 0.5, ml: 1.5 }}>
                        {errors.revenueType.message}
                      </Typography>
                    )}
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
                      value={field.value || ''} // Added fallback for Select
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
                      value={field.value || ''}
                    >
                      <MenuItem value="">Select Payment Method</MenuItem>
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="pos">POS</MenuItem>
                      <MenuItem value="transfer">Transfer</MenuItem>
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
                    value={field.value || null} // Changed to null for DatePicker
                    onChange={(newValue) => field.onChange(newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.paymentDate,
                        helperText: errors.paymentDate?.message
                      }
                    }}
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

            {/* Add error alerts */}
            {revenueTypes.length === 0 && !revenueTypeLoading && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  No revenue types available. Please contact administrator.
                </Alert>
              </Grid>
            )}

            {paymentError && (
              <Grid item xs={12}>
                <Alert severity="error">
                  {paymentError}
                </Alert>
              </Grid>
            )}

          </Grid>
        </Box>

        {/* Payment Confirmation Dialog */}
        <Dialog open={confirmDialogOpen} onClose={handleCloseConfirmDialog}>
          <DialogTitle>Confirm Payment</DialogTitle>
          <DialogContent>
            {paymentSummary && (
              <DialogContentText component="div">
                <Typography component="span">Shop: {paymentSummary.shop?.businessName}</Typography><br/>
                <Typography component="span">Revenue Type: {paymentSummary.revenueType?.name}</Typography><br/>
                <Typography component="span">Assessment Year: {paymentSummary.assessmentYear}</Typography><br/>
                <Typography component="span">Amount Due: ₦{paymentSummary.amountDue.toLocaleString()}</Typography><br/>
                {paymentSummary.penalty > 0 && <Typography component="span" color="error">Penalty: ₦{paymentSummary.penalty.toLocaleString()}</Typography>}<br/>
                <Typography component="span">Total Amount Due: ₦{paymentSummary.totalAmountDue.toLocaleString()}</Typography>
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
          <Alert severity="success" sx={{ mt: 2 }}>
            Payment successful! Receipt ID: {paymentSuccess.receiptId}
          </Alert>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default PaymentForm;