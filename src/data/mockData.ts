export interface User {
  id: number;
  username: string;
  name: string; // Full Name
  email: string;
  role: 'superadmin' | 'admin' | 'support' | 'client';
  status: 'Active' | 'Inactive';
  clientId?: number;
}

export interface Client {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  company_reg_no?: string;
  join_date: string;
  status: 'Active' | 'Inactive' | 'Suspended';
}

export interface HostingPackage {
    id: number;
    name: 'Starter' | 'Personal' | 'Business' | 'Enterprise';
    subtitle?: string;
    disk_space_gb: number;
    inodes_limit: number;
    monthly_price_idr: number;
    features: string[];
}

export interface Website {
  id: number;
  client_id: number;
  package_id: number;
  domain_name: string;
  disk_usage_mb: number;
  inodes: number;
  expiry_date: string; // Keep for invoice logic
  last_modified: string; // For folder view
  wp_url?: string;
  wp_user?: string;
  wp_pass_encrypted?: string; // Storing as "encrypted"
  parentId?: number;
  total_disk_usage_mb?: number;
  total_inodes?: number;
}

export interface Invoice {
    id: number;
    invoice_number: string;
    website_id: number;
    client_id: number;
    domain_name: string;
    hosting_amount: number;
    domain_amount: number;
    tax_amount: number;
    total_amount: number;
    due_date: string;
    status: 'Paid' | 'Unpaid' | 'Pending';
    payment_proof_url?: string; // Base64 string for the uploaded image
}

export interface InvoiceTemplate {
    companyName: string;
    companyAddress: string;
    companyEmail: string;
    companyPhone: string;
    companyLogo: string | null; // Base64 string for the logo
    openingText: string;
    closingText: string;
    paymentInfo: string;
    signatureImage: string | null; // For QR or scanned signature
    signatureName: string;
    signatureTitle: string;
}

export interface Registration {
    id: number;
    fullName: string;
    email: string;
    desiredDomain: string;
    packageId: number;
    registrationDate: string;
    status: 'Pending Review' | 'Contacted' | 'Converted' | 'Rejected';
}

interface NavLinkItem {
    text: string;
    url: string;
}

interface FooterLinkColumn {
    title: string;
    links: NavLinkItem[];
}

// FIX: Add FaqItem interface for packages page FAQ
interface FaqItem {
    q: string;
    a: string;
}

export interface SiteSettings {
    general: {
        siteName: string;
        heroTitle: string;
        heroSubtitle: string;
        heroButtonText: string;
    };
    navigation: {
        headerLinks: NavLinkItem[];
    };
    contact: {
        whatsappNumber: string;
        whatsappDefaultMessage: string;
    };
    footer: {
        slogan: string;
        copyrightName: string;
        linkColumns: FooterLinkColumn[];
    };
    // FIX: Add packagesPage settings
    packagesPage: {
        title: string;
        subtitle: string;
        faq: FaqItem[];
    };
    // FIX: Add company property to SiteSettings to fix type errors in public components
    company: {
        companyName: string;
        companyAddress: string;
        companyEmail: string;
        companyPhone: string;
        companyLogo: string | null;
    };
    invoiceTemplate: InvoiceTemplate;
}

// Data mock tidak lagi diekspor dari file ini.
// Data sekarang diambil dari backend API.
// Data statis berikut dipertahankan untuk bagian yang belum terhubung ke DB.

export let mockInvoiceTemplate: InvoiceTemplate = {
    companyName: 'Indikrea Group',
    companyAddress: 'Jl. Digital No. 1, Jakarta, Indonesia',
    companyEmail: 'support@indikrea.id',
    companyPhone: '+62 123 4567 890',
    companyLogo: null,
    openingText: 'Terima kasih telah memilih layanan kami. Berikut adalah rincian tagihan untuk perpanjangan layanan Anda:',
    closingText: 'Pembayaran yang melewati tanggal jatuh tempo akan dikenakan denda keterlambatan.',
    paymentInfo: 'Mohon lakukan pembayaran ke:\nBank Indikrea\nNo. Rek: 123-456-7890\na/n Indikrea Group',
    signatureImage: null,
    signatureName: 'Rois Syarif',
    signatureTitle: 'CEO, Indikrea Group'
};

export let mockRegistrations: Registration[] = [
    { 
        id: 1,
        fullName: 'Budi Darmawan',
        email: 'budi.darmawan@example.com',
        desiredDomain: 'budicorp.com',
        packageId: 3,
        registrationDate: '2024-07-20T10:00:00Z',
        status: 'Pending Review'
    },
    { 
        id: 2,
        fullName: 'Citra Kirana',
        email: 'citra.kirana@example.com',
        desiredDomain: 'citraphotography.id',
        packageId: 2,
        registrationDate: '2024-07-19T15:30:00Z',
        status: 'Contacted'
    },
];

export let mockSiteSettings: SiteSettings = {
    general: {
        siteName: 'Insan Dinamis Kreatif',
        heroTitle: 'Reliable Hosting, [highlight]Simplified.[/highlight]',
        heroSubtitle: 'Powerful, secure, and easy-to-manage web hosting solutions designed for businesses of all sizes. Get started in minutes.',
        heroButtonText: 'View Our Plans',
    },
    navigation: {
        headerLinks: [
            { text: 'Home', url: '/' },
            { text: 'Packages', url: '/packages' },
            { text: 'Client Login', url: '/login/client' },
        ],
    },
    contact: {
        whatsappNumber: '6281234567890',
        whatsappDefaultMessage: 'Halo, saya butuh bantuan terkait layanan hosting Indikrea.',
    },
    footer: {
        slogan: 'Providing reliable and scalable hosting solutions for your business needs.',
        copyrightName: 'Indikrea Group',
        linkColumns: [
            {
                title: 'Services',
                links: [
                    { text: 'Shared Hosting', url: '/packages' },
                    { text: 'WordPress Hosting', url: '/packages' },
                    { text: 'Domain Registration', url: '/packages' },
                ]
            },
            {
                title: 'Company',
                links: [
                    { text: 'About Us', url: '/' },
                    { text: 'Contact', url: '/' },
                    { text: 'Admin Portal', url: '/login/admin' },
                    { text: 'Server Status', url: 'status.php' },
                ]
            },
            {
                title: 'Legal',
                links: [
                    { text: 'Terms of Service', url: '/' },
                    { text: 'Privacy Policy', url: '/' },
                ]
            }
        ]
    },
    // FIX: Add data for packagesPage
    packagesPage: {
        title: "Choose The Perfect Plan",
        subtitle: "Scalable plans that grow with your business. All plans include free web development.",
        faq: [
            {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards, PayPal, and bank transfers for your convenience."
            },
            {
                q: "Can I upgrade my plan later?",
                a: "Absolutely! You can easily upgrade your hosting plan from your client dashboard at any time as your website grows."
            },
            {
                q: "Do you offer a money-back guarantee?",
                a: "Yes, we offer a 30-day money-back guarantee on all our hosting plans. If you're not satisfied, we'll refund your payment."
            }
        ]
    },
    // FIX: Add company property to mockSiteSettings object to align with the updated interface
    company: {
        companyName: 'Indikrea Group',
        companyAddress: 'Jl. Digital No. 1, Jakarta, Indonesia',
        companyEmail: 'support@indikrea.id',
        companyPhone: '+62 123 4567 890',
        companyLogo: null,
    },
    invoiceTemplate: mockInvoiceTemplate
};
