import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Download, Eye, Edit3, Save, X } from 'lucide-react';

const PurchaseOrderApp = () => {
  const [currentView, setCurrentView] = useState('list');
  const [editingPO, setEditingPO] = useState(null);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [formData, setFormData] = useState({
    companyName: '',
    companyAddress: '',
    companyContact: '',
    companyPhone: '',
    companyEmail: '',
    poNumber: '',
    poDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    paymentTerms: 'net-30',
    expenseCategory: 'office-supplies',
    vendorName: '',
    vendorAddress: '',
    vendorContact: '',
    vendorPhone: '',
    vendorEmail: '',
    vendorTaxId: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
    subtotal: 0,
    taxRate: 0,
    taxAmount: 0,
    shipping: 0,
    totalAmount: 0,
    specialInstructions: '',
    requestedBy: '',
    approvedBy: '',
    approvalDate: new Date().toISOString().split('T')[0],
    budgetCode: '',
    orderStatus: 'draft',
    receivedDate: '',
    invoiceNumber: '',
    invoiceDate: '',
    signedDocumentName: '',
    notes: ''
  });

  // Load saved POs on component mount
  useEffect(() => {
    const savedPOs = JSON.parse(localStorage.getItem('purchaseOrders') || '[]');
    setPurchaseOrders(savedPOs);
    
    const nextPONumber = `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    setFormData(prev => ({ ...prev, poNumber: nextPONumber }));
  }, []);

  // Save POs to localStorage whenever purchaseOrders changes
  useEffect(() => {
    localStorage.setItem('purchaseOrders', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  const getExpenseCategoryDisplay = (category) => {
    const categoryMap = {
      'office-supplies': 'Office Supplies',
      'equipment': 'Equipment',
      'services': 'Professional Services',
      'software': 'Software & Licenses',
      'inventory': 'Inventory',
      'travel': 'Travel & Entertainment',
      'marketing': 'Marketing',
      'other': 'Other'
    };
    return categoryMap[category] || category;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    }
    
    setFormData(prev => ({ ...prev, items: newItems }));
    calculateTotals(newItems);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]
    }));
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: newItems }));
    calculateTotals(newItems);
  };

  const calculateTotals = (items = formData.items) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = subtotal * (formData.taxRate / 100);
    const totalAmount = subtotal + taxAmount + formData.shipping;
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      totalAmount
    }));
  };

  const savePO = async () => {
    // First save locally
    if (editingPO) {
      setPurchaseOrders(prev => 
        prev.map(po => po.id === editingPO.id ? { ...formData, id: editingPO.id } : po)
      );
    } else {
      const newPO = {
        ...formData,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };
      setPurchaseOrders(prev => [...prev, newPO]);
      
      // Try to sync with backend
      try {
        await fetch('/api/purchase-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPO)
        });
      } catch (error) {
        console.log('Backend not available, saved locally only');
      }
    }
    
    resetForm();
    setCurrentView('list');
    setEditingPO(null);
  };

  const resetForm = () => {
    const nextPONumber = `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    setFormData({
      companyName: '',
      companyAddress: '',
      companyContact: '',
      companyPhone: '',
      companyEmail: '',
      poNumber: nextPONumber,
      poDate: new Date().toISOString().split('T')[0],
      deliveryDate: '',
      paymentTerms: 'net-30',
      expenseCategory: 'office-supplies',
      vendorName: '',
      vendorAddress: '',
      vendorContact: '',
      vendorPhone: '',
      vendorEmail: '',
      vendorTaxId: '',
      items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
      subtotal: 0,
      taxRate: 0,
      taxAmount: 0,
      shipping: 0,
      totalAmount: 0,
      specialInstructions: '',
      requestedBy: '',
      approvedBy: '',
      approvalDate: new Date().toISOString().split('T')[0],
      budgetCode: '',
      orderStatus: 'draft',
      receivedDate: '',
      invoiceNumber: '',
      invoiceDate: '',
      signedDocumentName: '',
      notes: ''
    });
  };

  const viewPO = (po) => {
    setFormData(po);
    setCurrentView('view');
  };

  const editPO = (po) => {
    setFormData(po);
    setEditingPO(po);
    setCurrentView('create');
  };

  const deletePO = (id) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      setPurchaseOrders(prev => prev.filter(po => po.id !== id));
    }
  };

  const exportToSnowflake = async () => {
    try {
      const response = await fetch('/api/export-to-snowflake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseOrders })
      });
      
      if (response.ok) {
        alert('Successfully exported to Snowflake!');
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      // Fallback for demo purposes
      const dataToExport = purchaseOrders.map(po => ({
        po_number: po.poNumber,
        po_date: po.poDate,
        vendor_name: po.vendorName,
        vendor_tax_id: po.vendorTaxId,
        total_amount: po.totalAmount,
        status: po.orderStatus,
        expense_category: po.expenseCategory,
        requested_by: po.requestedBy,
        approved_by: po.approvedBy,
        created_at: po.createdAt
      }));
      
      console.log('Data ready for Snowflake:', dataToExport);
      alert('Backend not connected. Check console for export data structure.');
    }
  };

  // List View
  if (currentView === 'list') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentView('create')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={20} />
                  New PO
                </button>
                <button
                  onClick={exportToSnowflake}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Download size={20} />
                  Export to Snowflake
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {po.poNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {po.poDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {po.vendorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${po.totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          po.orderStatus === 'draft' ? 'bg-gray-100 text-gray-800' :
                          po.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          po.orderStatus === 'approved' ? 'bg-green-100 text-green-800' :
                          po.orderStatus === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          po.orderStatus === 'received' ? 'bg-green-100 text-green-800' :
                          po.orderStatus === 'completed' ? 'bg-purple-100 text-purple-800' :
                          po.orderStatus === 'paid' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {po.orderStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => viewPO(po)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => editPO(po)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => deletePO(po.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {purchaseOrders.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No purchase orders yet. Create your first PO to get started.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create/Edit Form View
  if (currentView === 'create') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {editingPO ? 'Edit Purchase Order' : 'Create Purchase Order'}
              </h1>
              <div className="flex gap-3">
                <button
                  onClick={() => { setCurrentView('list'); setEditingPO(null); }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
                >
                  <X size={20} />
                  Cancel
                </button>
                <button
                  onClick={savePO}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save size={20} />
                  Save PO
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Company Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-4">Company Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                    <textarea
                      value={formData.companyAddress}
                      onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={formData.companyContact}
                      onChange={(e) => handleInputChange('companyContact', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* PO Details */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-4">Purchase Order Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PO Number *</label>
                    <input
                      type="text"
                      value={formData.poNumber}
                      onChange={(e) => handleInputChange('poNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PO Date *</label>
                    <input
                      type="date"
                      value={formData.poDate}
                      onChange={(e) => handleInputChange('poDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expense Category *</label>
                    <select
                      value={formData.expenseCategory}
                      onChange={(e) => handleInputChange('expenseCategory', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="office-supplies">Office Supplies</option>
                      <option value="equipment">Equipment</option>
                      <option value="services">Professional Services</option>
                      <option value="software">Software & Licenses</option>
                      <option value="inventory">Inventory</option>
                      <option value="travel">Travel & Entertainment</option>
                      <option value="marketing">Marketing</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Vendor Information */}
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold mb-4">Vendor Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name *</label>
                  <input
                    type="text"
                    value={formData.vendorName}
                    onChange={(e) => handleInputChange('vendorName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID/EIN</label>
                  <input
                    type="text"
                    value={formData.vendorTaxId}
                    onChange={(e) => handleInputChange('vendorTaxId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Address *</label>
                  <textarea
                    value={formData.vendorAddress}
                    onChange={(e) => handleInputChange('vendorAddress', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Items/Services</h2>
                <button
                  onClick={addItem}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Description *</th>
                      <th className="px-4 py-2 text-left">Qty</th>
                      <th className="px-4 py-2 text-left">Unit Price</th>
                      <th className="px-4 py-2 text-left">Total</th>
                      <th className="px-4 py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                            placeholder="Item description"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                            min="1"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                            step="0.01"
                            min="0"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <span className="font-medium">${item.total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </td>
                        <td className="px-4 py-2">
                          {formData.items.length > 1 && (
                            <button
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="bg-yellow-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                  <textarea
                    value={formData.specialInstructions}
                    onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">${formData.subtotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tax Rate (%):</span>
                    <input
                      type="number"
                      value={formData.taxRate}
                      onChange={(e) => {
                        handleInputChange('taxRate', Number(e.target.value));
                        calculateTotals();
                      }}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="flex justify-between">
                    <span>Tax Amount:</span>
                    <span className="font-medium">${formData.taxAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Shipping:</span>
                    <input
                      type="number"
                      value={formData.shipping}
                      onChange={(e) => {
                        handleInputChange('shipping', Number(e.target.value));
                        calculateTotals();
                      }}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>${formData.totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Approval Section with Status and Document Upload */}
            <div className="bg-red-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Approval & Authorization</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Requested By *</label>
                  <select
                    value={formData.requestedBy}
                    onChange={(e) => handleInputChange('requestedBy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Requester</option>
                    <option value="David Torres - Director of Operations">David Torres - Director of Operations</option>
                    <option value="Dr. Joshua Ortiz-Guzman - Chief Scientific Officer">Dr. Joshua Ortiz-Guzman - Chief Scientific Officer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Approved By *</label>
                  <select
                    value={formData.approvedBy}
                    onChange={(e) => handleInputChange('approvedBy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Approver</option>
                    <option value="David Torres - Director of Operations">David Torres - Director of Operations</option>
                    <option value="Dr. Joshua Ortiz-Guzman - Chief Scientific Officer">Dr. Joshua Ortiz-Guzman - Chief Scientific Officer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select
                    value={formData.orderStatus}
                    onChange={(e) => handleInputChange('orderStatus', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending">Pending Approval</option>
                    <option value="approved">Approved</option>
                    <option value="sent">Sent to Vendor</option>
                    <option value="confirmed">Confirmed by Vendor</option>
                    <option value="partial">Partially Received</option>
                    <option value="received">Fully Received</option>
                    <option value="invoiced">Invoiced</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed (Signed)</option>
                  </select>
                </div>
              </div>
              
              {/* File Upload Section for Completed Documents */}
              {(formData.orderStatus === 'completed' || formData.orderStatus === 'approved') && (
                <div className="mt-4 p-3 bg-blue-50 rounded border">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Signed Document (Optional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        // In a real app, you'd upload this to cloud storage
                        handleInputChange('signedDocumentName', file.name);
                        console.log('File selected:', file.name);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload the final signed PDF from Adobe Sign
                  </p>
                  {formData.signedDocumentName && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ Uploaded: {formData.signedDocumentName}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // View PO (Read-only)
  if (currentView === 'view') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex justify-between items-center mb-8 print:mb-4">
              <h1 className="text-3xl font-bold text-gray-900 print:text-2xl">PURCHASE ORDER</h1>
              <div className="flex gap-3 print:hidden">
                <button
                  onClick={() => setCurrentView('list')}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  Back to List
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Print
                </button>
              </div>
            </div>

            {/* Company Header with Logo */}
            <div className="border-b-2 border-gray-300 pb-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Logo placeholder - replace src with your actual logo URL */}
                  <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    PC
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Prodigy Cells</h2>
                    <p className="text-gray-600">Regenerative Medicine</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Purchase Order</p>
                  <p className="text-lg font-semibold">{formData.poNumber}</p>
                  <p className="text-sm text-gray-600">Date: {formData.poDate}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-lg font-semibold mb-3">From:</h2>
                <div className="text-gray-700">
                  <div className="font-medium">{formData.companyName}</div>
                  <div className="whitespace-pre-line">{formData.companyAddress}</div>
                  <div>{formData.companyContact}</div>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-3">PO Details:</h2>
                <div className="text-gray-700">
                  <div><strong>PO Number:</strong> {formData.poNumber}</div>
                  <div><strong>Date:</strong> {formData.poDate}</div>
                  <div><strong>Category:</strong> {getExpenseCategoryDisplay(formData.expenseCategory)}</div>
                  <div><strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 text-xs rounded ${
                      formData.orderStatus === 'draft' ? 'bg-gray-100 text-gray-800' :
                      formData.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      formData.orderStatus === 'approved' ? 'bg-green-100 text-green-800' :
                      formData.orderStatus === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      formData.orderStatus === 'received' ? 'bg-green-100 text-green-800' :
                      formData.orderStatus === 'completed' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {formData.orderStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-3">To:</h2>
              <div className="bg-green-50 p-4 rounded">
                <div className="font-medium">{formData.vendorName}</div>
                <div className="whitespace-pre-line">{formData.vendorAddress}</div>
                {formData.vendorTaxId && <div>Tax ID: {formData.vendorTaxId}</div>}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-3">Items:</h2>
              <table className="w-full border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left border-b">Description</th>
                    <th className="px-4 py-2 text-left border-b">Quantity</th>
                    <th className="px-4 py-2 text-left border-b">Unit Price</th>
                    <th className="px-4 py-2 text-left border-b">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2">{item.description}</td>
                      <td className="px-4 py-2 text-center">{item.quantity}</td>
                      <td className="px-4 py-2 text-right">${item.unitPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td className="px-4 py-2 text-right font-medium">${item.total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                {formData.specialInstructions && (
                  <div>
                    <h3 className="font-semibold mb-2">Special Instructions:</h3>
                    <div className="text-gray-700 whitespace-pre-line">{formData.specialInstructions}</div>
                  </div>
                )}
              </div>
              <div className="bg-yellow-50 p-4 rounded print:bg-white print:border print:border-gray-300">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${formData.subtotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  {formData.taxRate > 0 && (
                    <div className="flex justify-between">
                      <span>Tax ({formData.taxRate}%):</span>
                      <span>${formData.taxAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                  )}
                  {formData.shipping > 0 && (
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>${formData.shipping.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>${formData.totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Simplified Single Line Signature Section */}
            <div className="mt-12 print:mt-16">
              <h3 className="text-lg font-semibold mb-8 text-center">AUTHORIZATION & APPROVAL</h3>
              
              <div className="space-y-8">
                {/* Requested By Single Line */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">REQUESTED BY:</p>
                  <p className="font-semibold text-gray-900 mb-4">{formData.requestedBy}</p>
                  <div>
                    <div className="border-b-2 border-gray-900 mb-2 h-12 w-full"></div>
                    <p className="text-sm text-gray-600">Signature and Date</p>
                  </div>
                </div>
                
                {/* Approved By Single Line */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">APPROVED BY:</p>
                  <p className="font-semibold text-gray-900 mb-4">{formData.approvedBy}</p>
                  <div>
                    <div className="border-b-2 border-gray-900 mb-2 h-12 w-full"></div>
                    <p className="text-sm text-gray-600">Signature and Date</p>
                  </div>
                </div>
              </div>
              
              {/* Footer for printed version */}
              <div className="mt-8 pt-4 border-t border-gray-300 print:block hidden">
                <div className="text-center text-xs text-gray-500">
                  <p>This Purchase Order is subject to the terms and conditions agreed upon between Prodigy Cells and the vendor.</p>
                  <p className="mt-1">Questions? Contact: {formData.companyEmail || 'info@prodigycells.com'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default PurchaseOrderApp;