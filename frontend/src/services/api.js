const API_URL = "https://pg-management-system-5twy.onrender.com";


async function authFetch(url, options = {}) {
  const token = localStorage.getItem("token");

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";

    throw new Error("Session expired. Please login again.");
  }

  return response;
}


// ================= DASHBOARD =================

export async function getDashboard() {
  const response = await authFetch(
    `${API_URL}/api/pg/${getCurrentPgId()}/dashboard`,
    {
      method: "GET",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load dashboard");
  }

  return data;
}


// ================= TENANTS =================

export async function getTenants() {
  const response = await authFetch(
    `${API_URL}/api/pg/${getCurrentPgId()}/tenants`,
    {
      method: "GET",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load tenants");
  }

  return data;
}


// ================= BEDS =================

export async function getBeds() {
  const response = await authFetch(
    `${API_URL}/api/pg/${getCurrentPgId()}/beds`,
    {
      method: "GET",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load beds");
  }

  return data;
}

// ================= ROOMS & BEDS =================

export async function getRooms() {
  const response = await authFetch(
    `${API_URL}/api/pg/${getCurrentPgId()}/rooms`,
    {
      method: "GET",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load rooms and beds");
  }

  return data;
}


// ================= REGISTER TENANT USER =================

export async function registerTenant(formData) {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/api/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to register tenant");
  }

  return data;
}


// ================= CREATE TENANT PROFILE =================

export async function createTenant({
  userId,
  joiningDate,
  monthlyRent,
  emergencyContact,
}) {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/api/tenants`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId,
        pgId: getCurrentPgId(),
        joiningDate,
        monthlyRent: Number(monthlyRent),
        emergencyContact,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create tenant");
  }

  return data;
}


// ================= ASSIGN BED =================

export async function assignBed(tenantId, bedId) {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/api/tenants/${tenantId}/assign-bed`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        bedId,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to assign bed");
  }

  return data;
}

// ================= PAYMENT OVERVIEW =================

export async function getPaymentsOverview(month) {
  const response = await authFetch(
    `${API_URL}/api/pg/${getCurrentPgId()}/payments-overview?month=${month}`,
    {
      method: "GET",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to load payment overview"
    );
  }

  return data;
}

// ================= COLLECT PAYMENT =================

export async function collectPayment({
  tenantId,
  paymentMethod,
  month,
  transactionId,
  notes,
}) {
  const response = await authFetch(
    `${API_URL}/api/payments`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tenantId,
        paymentMethod,
        month,
        transactionId,
        notes,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to collect payment"
    );
  }

  return data;
}

// ================= PAYMENT HISTORY =================

export async function getPaymentHistory({ month, type = "all" } = {}) {
  let url = `${API_URL}/api/pg/${getCurrentPgId()}/payments`;

  const params = new URLSearchParams();

  if (month) {
    params.append("month", month);
  }

  if (type && type !== "all") {
    params.append("type", type);
  }

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const response = await authFetch(url, {
    method: "GET",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to load payment history"
    );
  }

  return data;
}



// ================= GET SINGLE TENANT DETAILS =================

export async function getTenantDetails(tenantId) {
  const response = await authFetch(
    `${API_URL}/api/tenants/${tenantId}`,
    {
      method: "GET",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to load tenant details"
    );
  }

  return data;
}

// update tenant details //
export async function updateTenant(tenantId, tenantData) {
  const response = await authFetch(
    `${API_URL}/api/tenants/${tenantId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tenantData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update tenant");
  }

  return data;
}

// ================= GIVE TENANT NOTICE =================

export async function giveTenantNotice(tenantId, checkoutDate) {
  const response = await authFetch(
    `${API_URL}/api/tenants/${tenantId}/notice`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        checkoutDate,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to give notice");
  }

  return data;
}

// ================= CANCEL TENANT NOTICE =================

export async function cancelTenantNotice(tenantId) {
  const response = await authFetch(
    `${API_URL}/api/tenants/${tenantId}/cancel-notice`,
    {
      method: "PATCH",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to cancel tenant notice"
    );
  }

  return data;
}

//**************** EXTEND CHECKOUT DATE ******************//
export async function extendCheckoutDate(tenantId, checkoutDate) {
  const response = await authFetch(
    `${API_URL}/api/tenants/${tenantId}/extend-checkout`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        checkoutDate,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to extend checkout date"
    );
  }

  return data;
}

//**************** COMPLETE CHECKOUT ******************//
export async function completeTenantCheckout(tenantId) {
  const response = await authFetch(
    `${API_URL}/api/tenants/${tenantId}/complete-checkout`,
    {
      method: "PATCH",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to complete tenant checkout"
    );
  }

  return data;
}

//**************** CHECKOUT SUMMMARY ******************//
export async function getCheckoutSummary(tenantId) {
  const response = await authFetch(
    `${API_URL}/api/tenants/${tenantId}/checkout-summary`,
    {
      method: "GET",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to get checkout summary"
    );
  }

  return data;
}

export async function getUsers() {
  const response = await authFetch(
    `${API_URL}/api/users`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch users");
  }

  return data;
}



export async function updateUserRole(userId, role) {
  const response = await authFetch(
    `${API_URL}/api/users/${userId}/role`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update user role"
    );
  }

  return data;
}

export function getCurrentPgId() {
  const pg = JSON.parse(localStorage.getItem("pg") || "null");

  return pg?.id || null;
}