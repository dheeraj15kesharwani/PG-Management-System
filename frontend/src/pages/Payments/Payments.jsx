import { useEffect, useState } from "react";

import {
  getPaymentsOverview,
  collectPayment,
  getPaymentHistory,
} from "../../services/api";

function Payments() {
  const [paymentsData, setPaymentsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();

    return `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
  });

  const [selectedTenant, setSelectedTenant] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [transactionId, setTransactionId] = useState("");
  const [notes, setNotes] = useState("");
  const [collecting, setCollecting] = useState(false);

  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // ================= FETCH PAYMENTS =================

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getPaymentsOverview(selectedMonth);

      setPaymentsData(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= FETCH PAYMENT HISTORY =================

  const fetchPaymentHistory = async () => {
    try {
      setHistoryLoading(true);
      setHistoryError("");

      const data = await getPaymentHistory({
        month: selectedMonth,
        type: paymentTypeFilter,
      });

      setHistoryData(data);
    } catch (error) {
      setHistoryError(error.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [selectedMonth]);

  useEffect(() => {
    fetchPaymentHistory();
  }, [selectedMonth, paymentTypeFilter]);

  // ================= COLLECT PAYMENT =================

  const handleCollectPayment = async () => {
    if (!selectedTenant) return;

    try {
      setCollecting(true);

      await collectPayment({
        tenantId: selectedTenant.tenantId,
        paymentMethod,
        month: selectedMonth,
        transactionId,
        notes,
      });

      alert("Payment collected successfully!");

      setSelectedTenant(null);

      setPaymentMethod("upi");
      setTransactionId("");
      setNotes("");

      await fetchPayments();
      await fetchPaymentHistory();
    } catch (error) {
      alert(error.message);
    } finally {
      setCollecting(false);
    }
  };

  // ================= LOADING =================

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 sm:min-h-[60vh]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />

          <p className="mt-4 text-sm font-medium text-slate-500 sm:text-base">
            Loading payments...
          </p>
        </div>
      </div>
    );
  }

  // ================= ERROR =================

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 sm:min-h-[60vh]">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-lg font-bold text-red-600">
            !
          </div>

          <p className="mt-4 text-sm font-semibold leading-6 text-red-600 sm:text-base">
            {error}
          </p>

          <button
            onClick={fetchPayments}
            className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const tenants = paymentsData?.tenants || [];

  // ================= CALCULATE SUMMARY =================

  const totalPayable = tenants.reduce(
    (total, tenant) => total + tenant.totalPayable,
    0
  );

  const paidTenants = tenants.filter(
    (tenant) =>
      tenant.rent.status === "paid" &&
      tenant.advance.status === "paid"
  ).length;

  const pendingTenants = tenants.filter(
    (tenant) => tenant.totalPayable > 0
  ).length;

  const filteredTenants = tenants.filter((tenant) => {
    const search = searchTerm.toLowerCase().trim();

    const name = tenant.tenant?.name?.toLowerCase() || "";
    const phone = tenant.tenant?.phone || "";

    return name.includes(search) || phone.includes(search);
  });

  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-6 lg:space-y-8">

      {/* ================= HEADER ================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Payments
          </h1>

          <p className="mt-1.5 text-sm leading-6 text-slate-500 sm:text-base">
            Manage tenant rent and advance payments
          </p>
        </div>

        {/* MONTH SELECTOR */}

        <div className="w-full sm:w-auto">
          <label className="mb-1.5 block text-xs font-medium text-slate-500 sm:text-sm">
            Payment Month
          </label>

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-100 sm:h-12 sm:w-auto sm:px-4"
          />
        </div>
      </div>

      {/* ================= SUMMARY CARDS ================= */}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">

        {/* TOTAL TENANTS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <p className="text-xs font-medium text-slate-500 sm:text-sm">
            Total Tenants
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:mt-3 sm:text-3xl">
            {tenants.length}
          </h2>
        </div>

        {/* TOTAL PAYABLE */}

        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 sm:p-6">
          <p className="text-xs font-medium text-orange-700 sm:text-sm">
            Total Payable
          </p>

          <h2 className="mt-2 text-xl font-bold text-orange-600 sm:mt-3 sm:text-3xl">
            ₹{totalPayable.toLocaleString()}
          </h2>
        </div>

        {/* FULLY PAID */}

        <div className="rounded-2xl border border-green-100 bg-green-50 p-4 sm:p-6">
          <p className="text-xs font-medium text-green-700 sm:text-sm">
            Fully Paid
          </p>

          <h2 className="mt-2 text-2xl font-bold text-green-600 sm:mt-3 sm:text-3xl">
            {paidTenants}
          </h2>
        </div>

        {/* PENDING */}

        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 sm:p-6">
          <p className="text-xs font-medium text-red-700 sm:text-sm">
            Pending Tenants
          </p>

          <h2 className="mt-2 text-2xl font-bold text-red-500 sm:mt-3 sm:text-3xl">
            {pendingTenants}
          </h2>
        </div>
      </div>

      {/* ================= TENANT PAYMENTS ================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* SECTION HEADER */}

        <div className="border-b border-slate-200 p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Tenant Payments
          </h2>

          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            View and collect monthly payments
          </p>

          {/* SEARCH */}

          <div className="mt-4">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>

              <input
                type="text"
                placeholder="Search by tenant name or mobile number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-100 sm:h-12"
              />
            </div>
          </div>
        </div>

        {/* EMPTY */}

        {tenants.length === 0 && (
          <div className="p-8 text-center sm:p-10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              💳
            </div>

            <p className="mt-4 text-sm font-medium text-slate-500 sm:text-base">
              No tenants found.
            </p>
          </div>
        )}

        {/* SEARCH EMPTY */}

        {tenants.length > 0 && filteredTenants.length === 0 && (
          <div className="p-8 text-center sm:p-10">
            <p className="text-sm font-medium text-slate-500">
              No tenants match your search.
            </p>
          </div>
        )}

        {/* TENANT LIST */}

        {filteredTenants.length > 0 && (
          <div className="divide-y divide-slate-100">
            {filteredTenants.map((tenant) => (
              <div
                key={tenant.tenantId}
                className="p-4 transition hover:bg-slate-50 sm:p-5"
              >
                <div className="space-y-5">

                  {/* TENANT INFO */}

                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-slate-900 sm:text-lg">
                          {tenant.tenant.name}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {tenant.tenant.phone || "No phone"}
                        </p>
                      </div>

                      {tenant.totalPayable > 0 ? (
                        <span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-semibold text-orange-700 sm:text-xs">
                          Pending
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-semibold text-green-700 sm:text-xs">
                          Paid
                        </span>
                      )}
                    </div>

                    {/* ALLOCATION */}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {tenant.allocation ? (
                        <>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600 sm:text-xs">
                            Block {tenant.allocation.blockName}
                          </span>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600 sm:text-xs">
                            Room {tenant.allocation.roomNumber}
                          </span>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600 sm:text-xs">
                            Bed {tenant.allocation.bedNumber}
                          </span>

                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-medium text-blue-600 sm:text-xs">
                            {tenant.allocation.sharingType} Sharing
                          </span>
                        </>
                      ) : (
                        <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-[10px] font-medium text-yellow-700 sm:text-xs">
                          Bed not assigned
                        </span>
                      )}
                    </div>
                  </div>

                  {/* PAYMENT DETAILS */}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">

                    {/* RENT */}

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs text-slate-500">
                        Monthly Rent
                      </p>

                      <p className="mt-1 text-lg font-bold text-slate-900">
                        ₹{tenant.rent.amount.toLocaleString()}
                      </p>

                      <span
                        className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold capitalize sm:text-xs ${
                          tenant.rent.status === "paid"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {tenant.rent.status}
                      </span>
                    </div>

                    {/* ADVANCE */}

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs text-slate-500">
                        Advance
                      </p>

                      <p className="mt-1 text-lg font-bold text-slate-900">
                        ₹{tenant.advance.amount.toLocaleString()}
                      </p>

                      <span
                        className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold capitalize sm:text-xs ${
                          tenant.advance.status === "paid"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {tenant.advance.status}
                      </span>
                    </div>

                    {/* TOTAL */}

                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <p className="text-xs text-blue-600">
                        Total Payable
                      </p>

                      <p className="mt-1 text-lg font-bold text-blue-700">
                        ₹{tenant.totalPayable.toLocaleString()}
                      </p>

                      {tenant.totalPayable === 0 ? (
                        <span className="mt-2 inline-flex rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold text-green-700 sm:text-xs">
                          Fully Paid
                        </span>
                      ) : (
                        <span className="mt-2 inline-flex rounded-full bg-orange-100 px-2 py-1 text-[10px] font-semibold text-orange-700 sm:text-xs">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* BUTTON */}

                  <div>
                    {tenant.totalPayable > 0 ? (
                      <button
                        onClick={() => setSelectedTenant(tenant)}
                        className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.99] sm:w-auto"
                      >
                        Collect ₹
                        {tenant.totalPayable.toLocaleString()}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full cursor-not-allowed rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-400 sm:w-auto"
                      >
                        Paid
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= PAYMENT HISTORY ================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* HEADER */}

        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Payment History
              </h2>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                View all collected payments
              </p>
            </div>

            {/* FILTER BUTTONS */}

            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
              {["all", "rent", "advance"].map((type) => (
                <button
                  key={type}
                  onClick={() => setPaymentTypeFilter(type)}
                  className={`rounded-xl px-3 py-2.5 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                    paymentTypeFilter === type
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {type === "all"
                    ? "All"
                    : type === "rent"
                    ? "Rent"
                    : "Advance"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* HISTORY LOADING */}

        {historyLoading && (
          <div className="p-10 text-center">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />

            <p className="mt-3 text-sm text-slate-500">
              Loading payment history...
            </p>
          </div>
        )}

        {/* HISTORY ERROR */}

        {!historyLoading && historyError && (
          <div className="p-6 text-center">
            <p className="text-sm font-medium text-red-500">
              {historyError}
            </p>

            <button
              onClick={fetchPaymentHistory}
              className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY HISTORY */}

        {!historyLoading &&
          !historyError &&
          historyData?.payments?.length === 0 && (
            <div className="p-8 text-center sm:p-10">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                🧾
              </div>

              <p className="mt-4 text-sm font-medium text-slate-500">
                No payment history found.
              </p>
            </div>
          )}

        {/* PAYMENT LIST */}

        {!historyLoading &&
          !historyError &&
          historyData?.payments?.length > 0 && (
            <div className="divide-y divide-slate-100">
              {historyData.payments.map((payment) => (
                <div
                  key={payment.paymentId}
                  className="p-4 transition hover:bg-slate-50 sm:p-5"
                >
                  <div className="space-y-4">

                    {/* TENANT */}

                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-slate-900">
                        {payment.tenant?.name || "Unknown"}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {payment.tenant?.phone || "No phone"}
                      </p>
                    </div>

                    {/* PAYMENT DETAILS */}

                    <div className="flex flex-wrap gap-2">

                      {/* AMOUNT */}

                      <div className="rounded-xl border border-green-100 bg-green-50 px-3 py-2.5 sm:px-4 sm:py-3">
                        <p className="text-[10px] text-green-600 sm:text-xs">
                          Amount
                        </p>

                        <p className="mt-0.5 text-sm font-bold text-green-700 sm:text-base">
                          ₹{Number(payment.amount).toLocaleString()}
                        </p>
                      </div>

                      {/* TYPE */}

                      <span
                        className={`self-center rounded-full px-3 py-1.5 text-[10px] font-medium sm:text-xs ${
                          payment.paymentType === "advance"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {payment.paymentType === "advance"
                          ? "Advance"
                          : "Rent"}
                      </span>

                      {/* PAYMENT METHOD */}

                      <span className="self-center rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-medium text-slate-600 sm:text-xs">
                        {payment.paymentMethod === "bank_transfer"
                          ? "Bank Transfer"
                          : payment.paymentMethod?.toUpperCase()}
                      </span>

                      {/* MONTH */}

                      <span className="self-center rounded-full bg-orange-50 px-3 py-1.5 text-[10px] font-medium text-orange-600 sm:text-xs">
                        {payment.month}
                      </span>
                    </div>

                    {/* DATE */}

                    <div className="text-xs text-slate-500 sm:text-sm">
                      Payment Date:{" "}
                      <span className="font-medium text-slate-700">
                        {payment.paymentDate
                          ? new Date(
                              payment.paymentDate
                            ).toLocaleDateString()
                          : "-"}
                      </span>
                    </div>

                    {/* OPTIONAL DETAILS */}

                    {(payment.transactionId || payment.notes) && (
                      <div className="space-y-2 border-t border-slate-100 pt-4 text-xs sm:text-sm">

                        {payment.transactionId && (
                          <p className="break-all text-slate-500">
                            <span className="font-medium text-slate-700">
                              Transaction ID:
                            </span>{" "}
                            {payment.transactionId}
                          </p>
                        )}

                        {payment.notes && (
                          <p className="break-words text-slate-500">
                            <span className="font-medium text-slate-700">
                              Notes:
                            </span>{" "}
                            {payment.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* ================= PAYMENT MODAL ================= */}

      {selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">

          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:rounded-2xl">

            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4 sm:px-6">

              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                  Collect Payment
                </h2>

                <p className="mt-1 truncate text-sm text-slate-500">
                  {selectedTenant.tenant.name}
                </p>
              </div>

              <button
                onClick={() => setSelectedTenant(null)}
                disabled={collecting}
                aria-label="Close payment modal"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="p-5 sm:p-6">

              {/* PAYMENT AMOUNT */}

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
                <p className="text-xs font-medium text-blue-600 sm:text-sm">
                  Total Amount
                </p>

                <p className="mt-1 text-2xl font-bold text-blue-700 sm:text-3xl">
                  ₹
                  {selectedTenant.totalPayable.toLocaleString()}
                </p>
              </div>

              {/* PAYMENT METHOD */}

              <div className="mt-5">
                <label className="text-sm font-medium text-slate-700">
                  Payment Method
                </label>

                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={collecting}
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50"
                >
                  <option value="upi">UPI</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">
                    Bank Transfer
                  </option>
                  <option value="card">Card</option>
                </select>
              </div>

              {/* TRANSACTION ID */}

              <div className="mt-4">
                <label className="text-sm font-medium text-slate-700">
                  Transaction ID{" "}
                  <span className="font-normal text-slate-400">
                    (Optional)
                  </span>
                </label>

                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) =>
                    setTransactionId(e.target.value)
                  }
                  disabled={collecting}
                  placeholder="Enter transaction ID"
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50"
                />
              </div>

              {/* NOTES */}

              <div className="mt-4">
                <label className="text-sm font-medium text-slate-700">
                  Notes{" "}
                  <span className="font-normal text-slate-400">
                    (Optional)
                  </span>
                </label>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={collecting}
                  placeholder="Add notes..."
                  rows={3}
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50"
                />
              </div>

              {/* BUTTONS */}

              <div className="mt-6 grid grid-cols-2 gap-3">

                <button
                  onClick={() => setSelectedTenant(null)}
                  disabled={collecting}
                  className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleCollectPayment}
                  disabled={collecting}
                  className="h-12 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {collecting
                    ? "Processing..."
                    : `Collect ₹${selectedTenant.totalPayable.toLocaleString()}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payments;