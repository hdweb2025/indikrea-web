import { User, Website, Client, Invoice, HostingPackage, Registration, SiteSettings } from '../data/mockData';
export const API_BASE_URL = 'https://api.indikrea.id/api';

export interface ApiResponseData {
    websites: Website[];
    clients: Client[];
    invoices: Invoice[];
    hostingPackages: HostingPackage[];
    registrations: Registration[];
    settings: SiteSettings;
    users?: User[];
}

export interface PublicApiResponseData {
    hostingPackages: HostingPackage[];
    settings: SiteSettings;
}

export const fetchPublicData = async (): Promise<PublicApiResponseData> => {
    // No user object is needed for public data
    const response = await fetch(`${API_BASE_URL}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_public_data' }),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch public data from server. Status: ' + response.status);
    }

    const result = await response.json();
    if (!result.success) {
        throw new Error(result.message || 'An API error occurred');
    }

    return result.data;
}


const getAuthenticatedUser = (): User => {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
        window.location.href = '/#/login/client';
        throw new Error('User not authenticated');
    }
    return JSON.parse(userJson);
};

export const fetchDashboardData = async (): Promise<ApiResponseData> => {
    const user = getAuthenticatedUser();

    const response = await fetch(`${API_BASE_URL}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, action: 'get_dashboard_data' }),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch data from server. Status: ' + response.status);
    }

    const result = await response.json();
    if (!result.success) {
        throw new Error(result.message || 'An API error occurred');
    }

    return result.data;
};


// --- UPDATE FUNCTIONS ---

const updateData = async (action: string, payload: any) => {
    const user = getAuthenticatedUser();
    
    // Server-side will perform the real permission checks (superadmin/admin/support).
    // Client does not block actions here to keep UI consistent with server policy.

    const response = await fetch(`${API_BASE_URL}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, action, payload }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update data.');
    }
    return result;
}

export const updateClient = async (clientData: Partial<Client>) => {
    return await updateData('update_client', clientData);
};

export const updateSiteSettings = async (settingsData: SiteSettings) => {
     return await updateData('update_site_settings', settingsData);
};

export const updateUser = async (userData: Partial<User>) => {
    return await updateData('update_user', userData);
};

export const updatePassword = async (targetId: number, newPassword: string, oldPassword?: string) => {
    const payload: any = { id: targetId, newPassword };
    if (oldPassword) payload.oldPassword = oldPassword;
    return await updateData('update_password', payload);
};

export const updateInvoiceStatus = async (invoiceId: number, status: 'Paid' | 'Unpaid' | 'Pending') => {
    return await updateData('update_invoice_status', { id: invoiceId, status });
};

export const updateWebsiteUsage = async (websiteId: number, changes: Partial<Pick<Website, 'disk_usage_mb' | 'inodes' | 'expiry_date'>>) => {
    const payload: any = { id: websiteId };
    if (typeof changes.disk_usage_mb !== 'undefined') payload.disk_usage_mb = changes.disk_usage_mb;
    if (typeof changes.inodes !== 'undefined') payload.inodes = changes.inodes;
    if (typeof changes.expiry_date !== 'undefined') payload.expiry_date = changes.expiry_date;
    return await updateData('update_website_usage', payload);
};

export const createInvoiceForClient = async (clientId: number) => {
    return await updateData('create_invoice', { client_id: clientId });
};

export const deleteClientById = async (clientId: number) => {
    return await updateData('delete_client', { client_id: clientId });
};

export const updateHostingPackage = async (pkg: Partial<HostingPackage>) => {
    const payload: any = {
        id: typeof pkg.id !== 'undefined' ? pkg.id : undefined,
        name: pkg.name,
        subtitle: pkg.subtitle,
        disk_space_gb: pkg.disk_space_gb,
        inodes_limit: pkg.inodes_limit,
        monthly_price_idr: pkg.monthly_price_idr,
        features: pkg.features || []
    };
    return await updateData('update_hosting_package', payload);
};
