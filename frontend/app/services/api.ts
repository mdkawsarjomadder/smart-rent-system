const BASE_URL = 'http://127.0.0.1:5075/api';

// Point 1: Flats Model & Fetch API
export interface Flat {
  id: number;
  flatNumber: string;
  floor: number;
  baseRent: number;
  bedrooms: number;
  bathrooms: number;
  status: number;
  currentTenantName?: string | null;
}

export const getFlats = async (): Promise<Flat[]> => {
  const res = await fetch(`${BASE_URL}/flats`);
  if (!res.ok) {
    throw new Error('Failed to fetch flats');
  }
  return res.json();
};

// Point 2: Create Flat
export interface CreateFlatInput {
  flatNumber: string;
  floor: number;
  baseRent: number;
  bedrooms: number;
  bathrooms: number;
  status?: number;
}

export const createFlat = async (data: CreateFlatInput): Promise<Flat> => {
  const res = await fetch(`${BASE_URL}/flats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...data, status: data.status ?? 0 }),
  });

  if (!res.ok) {
    throw new Error('Failed to create new flat');
  }

  return res.json();
};

// Point 2.1: Vacate Flat (যোগ করা হয়েছে)
export const vacateFlat = async (id: number): Promise<void> => {
  const res = await fetch(`${BASE_URL}/flats/${id}/vacate`, {
    method: 'POST',
  });

  if (!res.ok) {
    throw new Error('Failed to vacate flat');
  }
};

// Point 3: Tenants API -------------------|
export interface Tenant {
  id: number;
  fullName: string;
  phoneNumber: string;
  nidNumber: string;
  securityDeposit: number;
  moveInDate: string;
  isActive: boolean;
  flatId: number;
  flatNumber?: string | null;
}

export interface CreateTenantInput {
  fullName: string;
  phoneNumber: string;
  nidNumber: string;
  securityDeposit: number;
  flatId: number;
}

export const getTenants = async (): Promise<Tenant[]> => {
  const res = await fetch(`${BASE_URL}/tenants`);
  if (!res.ok) throw new Error('Failed to fetch tenants');
  return res.json();
};

export const createTenant = async (data: CreateTenantInput): Promise<Tenant> => {
  const res = await fetch(`${BASE_URL}/tenants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error('Failed to assign tenant');
  }

  return res.json();
};

// Point 4: Invoices API -------------------
export interface Invoice {
  id: number;
  flatId: number;
  flatNumber: string;
  tenantName: string;
  billingMonth: string;
  baseRent: number;
  electricityBill: number;
  gasBill: number;
  waterBill: number;
  totalAmount: number;
  isPaid: boolean;
  dueDate: string;
  paidDate?: string | null;
}

export interface GenerateInvoiceInput {
  flatId: number;
  billingMonth: string;
  electricityBill: number;
  gasBill: number;
  waterBill: number;
  dueDate: string;
}

export const getInvoices = async (): Promise<Invoice[]> => {
  const res = await fetch(`${BASE_URL}/invoices`);
  if (!res.ok) throw new Error('Failed to fetch invoices');
  return res.json();
};

export const generateInvoice = async (data: GenerateInvoiceInput): Promise<Invoice> => {
  const res = await fetch(`${BASE_URL}/invoices/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Failed to generate invoice');
  return res.json();
};

export const payInvoice = async (id: number): Promise<void> => {
  const res = await fetch(`${BASE_URL}/invoices/${id}/pay`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    // যদি PATCH কাজ না করে, PUT ট্রাই করবে
    const fallbackRes = await fetch(`${BASE_URL}/invoices/${id}/pay`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!fallbackRes.ok) {
      const errorData = await fallbackRes.text();
      console.error(`Pay Invoice Failed (${fallbackRes.status}):`, errorData);
      throw new Error(`Error ${fallbackRes.status}: ${errorData || fallbackRes.statusText}`);
    }
  }
};


export interface BulkGenerateInvoiceInput {
  billingMonth: string;
  defaultElectricityBill: number;
  defaultGasBill: number;
  defaultWaterBill: number;
  dueDate: string;
}

export interface BulkGenerateResult {
  totalGenerated: number;
  totalSkipped: number;
  message: string;
}

export const generateBulkInvoices = async (data: BulkGenerateInvoiceInput): Promise<BulkGenerateResult> => {
  const res = await fetch(`${BASE_URL}/invoices/generate-bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorMsg = await res.text();
    throw new Error(errorMsg || 'Failed to generate bulk invoices');
  }

  return res.json();
};


// Basara Details
export interface FlatDetails {
  id: number;
  flatNumber: string;
  floor: number;
  baseRent: number;
  status: string;
  currentTenant: {
    id: number;
    fullName: string;
    phoneNumber: string;
    nidNumber: string;
    moveInDate: string;
    securityDeposit: number;
  } | null;
  tenantHistory: Array<{
    id: number;
    fullName: string;
    phoneNumber: string;
    moveInDate: string;
    isActive: boolean;
  }>;
  billingHistory: Array<{
    id: number;
    invoiceNumber: string;
    billingMonth: string;
    totalAmount: number;
    dueDate: string;
    paidDate: string | null;
    isPaid: boolean;
  }>;
}

export const getFlatDetails = async (id: number): Promise<FlatDetails> => {
  const res = await fetch(`${BASE_URL}/flats/${id}/details`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Failed to fetch flat details');
  }
  return res.json();
};


//Update cerate Dto

export interface UpdateFlatInput {
  flatNumber: string;
  floor: number;
  bedrooms: number;
  bathrooms: number;
  baseRent: number;
}

export const updateFlat = async (id: number, data: UpdateFlatInput): Promise<Flat> => {
  const res = await fetch(`${BASE_URL}/flats/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error('Failed to update flat details');
  }

  return res.json();
};