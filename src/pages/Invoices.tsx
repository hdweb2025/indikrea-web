import React, { useState, useMemo, useEffect } from 'react';
import { User, Invoice, Client, Website, mockInvoiceTemplate } from '../data/mockData';
import Modal from '../components/Modal';
import { fetchDashboardData, API_BASE_URL } from '../utils/api';


declare global {
    interface Window {
        jspdf: any;
    }
}

interface InvoicesProps {
    user: User;
}

const Invoices: React.FC<InvoicesProps> = ({ user }) => {
    // FIX: fetch invoices and clients from API instead of using mock data
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [websites, setWebsites] = useState<Website[]>([]);
    const [loading, setLoading] = useState(true);

    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Unpaid' | 'Pending'>('All');
    
    // State for modals
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const [isReviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [paymentProof, setPaymentProof] = useState<string | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [confirmAction, setConfirmAction] = useState<(() => Promise<void> | void) | null>(null);
    const [isViewModalOpen, setViewModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [editStatus, setEditStatus] = useState<'Paid' | 'Unpaid'>('Unpaid');
    const [editHosting, setEditHosting] = useState<number>(0);
    const [editDomain, setEditDomain] = useState<number>(0);
    const [editTax, setEditTax] = useState<number>(0);
    const [editTotal, setEditTotal] = useState<number>(0);
    const [editDueDate, setEditDueDate] = useState<string>('');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const data = await fetchDashboardData();
                setInvoices(data.invoices);
                setClients(data.clients);
                setWebsites(data.websites);
            } catch (error) {
                console.error("Failed to fetch invoices data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const userInvoices = useMemo(() => {
        const websiteMap = new Map<number, string>(websites.map(w => [w.id, w.domain_name]));
        let filteredInvoices = ['superadmin', 'admin', 'support'].includes(user.role)
            ? invoices
            : invoices.filter(i => i.client_id === user.clientId);

        if (statusFilter !== 'All') {
            filteredInvoices = filteredInvoices.filter(i => i.status === statusFilter);
        }

        const f = filter.toLowerCase();
        return filteredInvoices.filter(invoice => {
            const dn = (invoice.domain_name || websiteMap.get(invoice.website_id) || '');
            return dn.toLowerCase().includes(f) ||
                   (invoice.invoice_number || '').toLowerCase().includes(f);
        });
    }, [user, filter, statusFilter, invoices, websites]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const handleGeneratePdf = (invoice: Invoice) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add company logo/header
        doc.setFontSize(20);
        doc.text('Indikrea Hosting', 20, 20);
        doc.setFontSize(10);
        doc.text('Jl. Digital No. 1, Jakarta', 20, 25);
        doc.text('Phone: +62 123 4567 890', 20, 30);

        // Invoice Title
        doc.setFontSize(16);
        doc.text('INVOICE', 150, 20);
        doc.setFontSize(10);
        doc.text(`No: ${invoice.invoice_number}`, 150, 27);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 32);
        doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 150, 37);

        // Bill To
        const client = clients.find(c => c.id === invoice.client_id);
        doc.text('Bill To:', 20, 50);
        doc.setFont('helvetica', 'bold');
        doc.text(client ? client.name : 'Client Name', 20, 55);
        doc.setFont('helvetica', 'normal');
        doc.text(client ? (client.address || 'Address not set') : 'Address', 20, 60);

        // Table
        const tableColumn = ["Description", "Amount"];
        const tableRows = [
            [`Hosting Service - ${invoice.domain_name}`, formatCurrency(invoice.hosting_amount)],
            [`Domain Registration - ${invoice.domain_name}`, formatCurrency(invoice.domain_amount)],
            [`Tax (11%)`, formatCurrency(invoice.tax_amount)],
            [`Total`, formatCurrency(invoice.total_amount)]
        ];

        (doc as any).autoTable({
            startY: 70,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            styles: { fontSize: 10, cellPadding: 2 },
            headStyles: { fillColor: [66, 66, 66] },
            columnStyles: { 1: { halign: 'right' } }
        });

        // Payment Info
        const finalY = (doc as any).lastAutoTable.finalY + 20;
        doc.text('Payment Information:', 20, finalY);
        doc.setFont('helvetica', 'bold');
        doc.text('Bank BCA: 123-456-7890', 20, finalY + 5);
        doc.text('A.N. Indikrea Group', 20, finalY + 10);

        doc.save(`Invoice-${invoice.invoice_number}.pdf`);
    };
    
    // --- Upload Proof Logic ---
    const openUploadModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setPaymentProof(null);
        setUploadModalOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => setPaymentProof(reader.result as string);
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmitProof = async () => {
        if (!selectedInvoice || !paymentProof) return;
        setConfirmMessage('Submit payment proof for this invoice?');
        setConfirmAction(() => async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/update_invoice.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: selectedInvoice.id,
                        action: 'upload_proof',
                        proof: paymentProof
                    })
                });
                const result = await response.json();
                
                if (result.success) {
                    setInvoices(prev => prev.map(inv => 
                        inv.id === selectedInvoice.id 
                            ? { ...inv, status: 'Pending', payment_proof_url: paymentProof } 
                            : inv
                    ));
                    setUploadModalOpen(false);
                } else {
                    alert('Failed to upload proof: ' + (result.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error uploading proof:', error);
                alert('Failed to connect to server.');
            }
        });
        setConfirmOpen(true);
    };

    // --- Review Proof Logic (Admin) ---
    const openReviewModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setReviewModalOpen(true);
    };
    
    const handlePaymentAction = async (invoiceId: number, action: 'approve' | 'reject') => {
        const msg = action === 'approve' ? 'Approve this payment?' : 'Reject this payment?';
        setConfirmMessage(msg);
        setConfirmAction(() => async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/update_invoice.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: invoiceId, action })
                });
                const result = await response.json();
    
                if (result.success) {
                    setInvoices(prev => prev.map(inv => {
                        if (inv.id === invoiceId) {
                            if (action === 'approve') return { ...inv, status: 'Paid' };
                            if (action === 'reject') return { ...inv, status: 'Unpaid', payment_proof_url: undefined };
                        }
                        return inv;
                    }));
                    setReviewModalOpen(false);
                } else {
                    alert('Action failed: ' + (result.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error processing payment action:', error);
                alert('Failed to connect to server.');
            }
        });
        setConfirmOpen(true);
    };

    const openViewModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setViewModalOpen(true);
    };

    const openEditModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setEditStatus(invoice.status === 'Paid' ? 'Paid' : 'Unpaid');
        const h = Number(invoice.hosting_amount || 0);
        const d = Number(invoice.domain_amount || 0);
        const t = Math.round((h + d) * 0.11);
        const tot = h + d + t;
        setEditHosting(h);
        setEditDomain(d);
        setEditTax(Number(invoice.tax_amount || t));
        setEditTotal(Number(invoice.total_amount || tot));
        const ddRaw = String(invoice.due_date || '');
        let dd = '';
        const parsed = Date.parse(ddRaw);
        if (!Number.isNaN(parsed)) dd = new Date(parsed).toISOString().slice(0,10);
        else if (/^\d{4}-\d{2}-\d{2}$/.test(ddRaw)) dd = ddRaw;
        setEditDueDate(dd);
        setEditModalOpen(true);
    };

    const handleEditSave = async () => {
        if (!selectedInvoice) return;
        setConfirmMessage(`Save status as ${editStatus}?`);
        setConfirmAction(() => async () => {
            try {
                const result = await fetch(`${API_BASE_URL}/update_invoice.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        id: selectedInvoice.id, 
                        status: editStatus, 
                        hosting_amount: editHosting,
                        domain_amount: editDomain,
                        tax_amount: editTax,
                        total_amount: editTotal,
                        due_date: editDueDate,
                        action: 'update_fields' 
                    })
                }).then(res => res.json());
                if (result.success) {
                    setInvoices(prev => prev.map(inv => inv.id === selectedInvoice.id ? { 
                        ...inv, 
                        status: editStatus,
                        hosting_amount: editHosting,
                        domain_amount: editDomain,
                        tax_amount: editTax,
                        total_amount: editTotal,
                        due_date: editDueDate || inv.due_date
                    } : inv));
                    setEditModalOpen(false);
                } else {
                    alert('Failed to update status: ' + (result.message || 'Unknown error'));
                }
            } catch (error) {
                alert('Failed to connect to server.');
            }
        });
        setConfirmOpen(true);
    };

    const formatPhoneToWa = (phoneRaw?: string) => {
        const digits = String(phoneRaw || '').replace(/\D+/g, '');
        if (!digits) return '';
        if (digits.startsWith('0')) return '62' + digits.slice(1);
        if (digits.startsWith('62')) return digits;
        if (digits.startsWith('8')) return '62' + digits;
        return digits.replace(/^(\+?)/, '');
    };

    const openWhatsApp = (invoice: Invoice) => {
        const client = clients.find(c => c.id === invoice.client_id);
        const wa = formatPhoneToWa(client?.phone);
        if (!wa) { alert('Nomor WA klien tidak tersedia.'); return; }
        const text = `Halo, ini tagihan ${invoice.invoice_number} untuk ${invoice.domain_name} sebesar ${formatCurrency(Number(invoice.total_amount))}. Jatuh tempo: ${new Date(invoice.due_date).toLocaleDateString()}.`;
        const url = `https://wa.me/${wa}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };


    const getStatusChip = (status: Invoice['status']) => {
        const styles: Record<Invoice['status'], string> = {
            Paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            Unpaid: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            Pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        };
        return <span className={`px-3 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>{status}</span>;
    };
    
    // --- Manual Status Update Logic (Admin) ---
    const handleStatusUpdate = async (invoiceId: number, newStatus: 'Paid' | 'Unpaid') => {
        setConfirmMessage(`Are you sure you want to mark this invoice as ${newStatus}?`);
        setConfirmAction(() => async () => {
            try {
                const result = await fetch(`${API_BASE_URL}/update_invoice.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: invoiceId, status: newStatus, action: 'update_status' })
                }).then(res => res.json());
    
                if (result.success) {
                    setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status: newStatus } : inv));
                } else {
                    alert('Failed to update status: ' + (result.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error updating status:', error);
                alert('Failed to connect to server.');
            }
        });
        setConfirmOpen(true);
    };

    const renderActionButtons = (invoice: Invoice) => {
        const isAdmin = ['superadmin', 'admin'].includes(user.role);

        if (isAdmin) {
            return (
                <div className="flex space-x-2 justify-center">
                    <button onClick={() => openViewModal(invoice)} className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600" title="View">
                        <i className="fas fa-eye"></i>
                    </button>
                    <button onClick={() => openEditModal(invoice)} className="px-3 py-1 bg-indigo-500 text-white text-sm rounded-md hover:bg-indigo-600" title="Edit">
                        <i className="fas fa-edit"></i>
                    </button>
                    {invoice.status === 'Pending' && (
                        <button onClick={() => openReviewModal(invoice)} className="px-3 py-1 bg-yellow-500 text-white text-sm rounded-md hover:bg-yellow-600" title="Review Payment Proof">
                            <i className="fas fa-search-dollar"></i>
                        </button>
                    )}
                    {invoice.status !== 'Paid' && (
                        <button onClick={() => handleStatusUpdate(invoice.id, 'Paid')} className="px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600" title="Mark as Paid">
                            <i className="fas fa-check"></i>
                        </button>
                    )}
                    {invoice.status === 'Paid' && (
                        <button onClick={() => handleStatusUpdate(invoice.id, 'Unpaid')} className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600" title="Mark as Unpaid">
                            <i className="fas fa-times"></i>
                        </button>
                    )}
                    <button onClick={() => handleGeneratePdf(invoice)} className="px-3 py-1 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600" title="Download PDF">
                        <i className="fas fa-file-pdf"></i>
                    </button>
                    <button onClick={() => openWhatsApp(invoice)} className="px-3 py-1 bg-emerald-500 text-white text-sm rounded-md hover:bg-emerald-600" title="Send via WhatsApp">
                        <i className="fab fa-whatsapp"></i>
                    </button>
                </div>
            );
        } else { // Client view
            if (invoice.status === 'Unpaid') {
                return (
                    <div className="flex space-x-2 justify-center">
                        <button onClick={() => openViewModal(invoice)} className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600" title="View">
                            <i className="fas fa-eye"></i>
                        </button>
                        <button onClick={() => openUploadModal(invoice)} className="px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600" title="Upload Proof">
                            <i className="fas fa-upload"></i>
                        </button>
                        <button onClick={() => handleGeneratePdf(invoice)} className="px-3 py-1 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600" title="Download PDF">
                            <i className="fas fa-file-pdf"></i>
                        </button>
                        <button onClick={() => openWhatsApp(invoice)} className="px-3 py-1 bg-emerald-500 text-white text-sm rounded-md hover:bg-emerald-600" title="Send via WhatsApp">
                            <i className="fab fa-whatsapp"></i>
                        </button>
                    </div>
                );
            }
             if (invoice.status === 'Pending') {
                return (
                    <div className="flex space-x-2 justify-center">
                        <button onClick={() => openViewModal(invoice)} className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600" title="View">
                            <i className="fas fa-eye"></i>
                        </button>
                        <span className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-md">Proof Submitted</span>
                        <button onClick={() => handleGeneratePdf(invoice)} className="px-3 py-1 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600" title="Download PDF">
                            <i className="fas fa-file-pdf"></i>
                        </button>
                        <button onClick={() => openWhatsApp(invoice)} className="px-3 py-1 bg-emerald-500 text-white text-sm rounded-md hover:bg-emerald-600" title="Send via WhatsApp">
                            <i className="fab fa-whatsapp"></i>
                        </button>
                    </div>
                );
            }
        }

        // Default button for all roles
        return (
             <button onClick={() => handleGeneratePdf(invoice)} className="px-3 py-1 bg-primary-500 text-white text-sm rounded-md hover:bg-primary-600">
                <i className="fas fa-file-pdf mr-2"></i>PDF
            </button>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <i className="fas fa-spinner fa-spin text-primary-500 text-3xl"></i>
                <span className="ml-4 text-lg">Loading Invoices...</span>
            </div>
        );
    }

    return (
        <>
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Billing & Invoices</h1>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                         <input
                            type="text"
                            placeholder="Filter by domain or INV..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <i className="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Pending">Pending</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Invoice #</th>
                            <th className="p-4 font-semibold">Domain</th>
                            <th className="p-4 font-semibold text-right">Amount</th>
                            <th className="p-4 font-semibold">Due Date</th>
                            <th className="p-4 font-semibold text-center">Status</th>
                            <th className="p-4 font-semibold text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {userInvoices.map(invoice => (
                            <tr key={invoice.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-4 font-mono text-sm text-gray-500">{invoice.invoice_number}</td>
                                <td className="p-4 font-medium text-primary-600 dark:text-primary-400">{(invoice.domain_name || (websites.find(w => w.id === invoice.website_id)?.domain_name) || '')}</td>
                                <td className="p-4 text-right text-gray-600 dark:text-gray-300">{formatCurrency(invoice.total_amount)}</td>
                                <td className="p-4 text-gray-500 dark:text-gray-400">{new Date(invoice.due_date).toLocaleDateString()}</td>
                                <td className="p-4 text-center">{getStatusChip(invoice.status)}</td>
                                <td className="p-4 text-center">{renderActionButtons(invoice)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {userInvoices.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <i className="fas fa-file-excel text-4xl mb-3"></i>
                        <p>No invoices found matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
        {/* Upload Proof Modal */}
        <Modal isOpen={isUploadModalOpen} onClose={() => setUploadModalOpen(false)} title={`Upload Payment Proof for ${selectedInvoice?.invoice_number}`}>
            <div className="space-y-4">
                <p>Please upload a clear image of your payment receipt for the amount of <span className="font-bold">{formatCurrency(selectedInvoice?.total_amount || 0)}</span>.</p>
                <div>
                    <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Proof of Transfer</label>
                    <input id="file-upload" type="file" accept="image/*" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"/>
                </div>
                {paymentProof && (
                    <div>
                        <p className="text-sm font-medium mb-2">Preview:</p>
                        <img src={paymentProof} alt="Payment Proof Preview" className="rounded-lg max-h-64 w-auto mx-auto"/>
                    </div>
                )}
                <div className="flex justify-end pt-4 space-x-3">
                    <button onClick={() => setUploadModalOpen(false)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                        Cancel
                    </button>
                    <button onClick={handleSubmitProof} disabled={!paymentProof} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400">
                        Submit Proof
                    </button>
                </div>
            </div>
        </Modal>
        <Modal isOpen={isViewModalOpen} onClose={() => setViewModalOpen(false)} title={`Invoice ${selectedInvoice?.invoice_number}`}>
            <div className="space-y-3">
                <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Client</span>
                    <span className="text-sm font-medium">{clients.find(c => c.id === selectedInvoice?.client_id)?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Domain</span>
                    <span className="text-sm font-medium">{selectedInvoice?.domain_name || websites.find(w => w.id === (selectedInvoice?.website_id || 0))?.domain_name || '-'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Due Date</span>
                    <span className="text-sm font-medium">{selectedInvoice ? new Date(selectedInvoice.due_date).toLocaleDateString() : '-'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Hosting</span>
                    <span className="text-sm font-medium">{selectedInvoice ? formatCurrency(Number(selectedInvoice.hosting_amount)) : '-'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Domain</span>
                    <span className="text-sm font-medium">{selectedInvoice ? formatCurrency(Number(selectedInvoice.domain_amount)) : '-'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Tax</span>
                    <span className="text-sm font-medium">{selectedInvoice ? formatCurrency(Number(selectedInvoice.tax_amount)) : '-'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total</span>
                    <span className="text-sm font-semibold">{selectedInvoice ? formatCurrency(Number(selectedInvoice.total_amount)) : '-'}</span>
                </div>
            </div>
        </Modal>
        <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit Invoice ${selectedInvoice?.invoice_number}`}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Status</label>
                    <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)} className="mt-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                    </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Hosting Amount</label>
                        <input type="number" value={editHosting} onChange={(e) => { const v = Number(e.target.value || 0); setEditHosting(v); const t = Math.round((v + editDomain) * 0.11); setEditTax(t); setEditTotal(v + editDomain + t); }} className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Domain Amount</label>
                        <input type="number" value={editDomain} onChange={(e) => { const v = Number(e.target.value || 0); setEditDomain(v); const t = Math.round((editHosting + v) * 0.11); setEditTax(t); setEditTotal(editHosting + v + t); }} className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Tax (11%)</label>
                        <input type="number" value={editTax} readOnly className="mt-1 w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Total Amount</label>
                        <input type="number" value={editTotal} readOnly className="mt-1 w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none"/>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium">Due Date</label>
                    <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"/>
                </div>
                <div className="flex justify-end space-x-3">
                    <button onClick={() => setEditModalOpen(false)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                    <button onClick={handleEditSave} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Save</button>
                </div>
            </div>
        </Modal>
        <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm Action">
            <div className="space-y-4">
                <p>{confirmMessage}</p>
                <div className="flex justify-end space-x-3 pt-2">
                    <button onClick={() => setConfirmOpen(false)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                        Cancel
                    </button>
                    <button onClick={async () => { try { await confirmAction?.() } finally { setConfirmOpen(false) } }} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                        OK
                    </button>
                </div>
            </div>
        </Modal>
        {/* Review Proof Modal (Admin) */}
        <Modal isOpen={isReviewModalOpen} onClose={() => setReviewModalOpen(false)} title={`Review Payment for ${selectedInvoice?.invoice_number}`}>
            <div className="space-y-4">
                <p>Client <span className="font-bold">{clients.find(c=>c.id === selectedInvoice?.client_id)?.name}</span> has submitted payment proof for <span className="font-bold">{formatCurrency(selectedInvoice?.total_amount || 0)}</span>.</p>
                {selectedInvoice?.payment_proof_url ? (
                    <a href={selectedInvoice.payment_proof_url} target="_blank" rel="noopener noreferrer">
                         <img src={selectedInvoice.payment_proof_url} alt="Payment Proof" className="rounded-lg max-h-96 w-auto mx-auto border dark:border-gray-600 cursor-pointer"/>
                    </a>
                ) : (
                    <p className="text-red-500">No proof available.</p>
                )}
                <div className="flex justify-end space-x-4 pt-4">
                    <button onClick={() => handlePaymentAction(selectedInvoice!.id, 'reject')} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        Reject
                    </button>
                    <button onClick={() => handlePaymentAction(selectedInvoice!.id, 'approve')} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        Approve
                    </button>
                </div>
            </div>
        </Modal>
        </>
    );
};

export default Invoices;
