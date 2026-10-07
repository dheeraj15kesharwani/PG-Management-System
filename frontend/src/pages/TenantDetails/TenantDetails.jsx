import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  getTenantDetails,
  updateTenant,
  giveTenantNotice,
  cancelTenantNotice,
  extendCheckoutDate,
  completeTenantCheckout,
  getCheckoutSummary,
} from "../../services/api";

function TenantDetails() {
  const { tenantId } = useParams();

  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ================= GIVE NOTICE =================

  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [checkoutDate, setCheckoutDate] = useState("");
  const [noticeError, setNoticeError] = useState("");
  const [submittingNotice, setSubmittingNotice] = useState(false);

  // ================= EDIT TENANT =================

  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState("");

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    monthlyRent: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelation: "",
  });

  // ================= EXTEND CHECKOUT =================

  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendDate, setExtendDate] = useState("");
  const [extendError, setExtendError] = useState("");
  const [submittingExtend, setSubmittingExtend] = useState(false);

  // ================= CHECKOUT SUMMARY =================

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutSummary, setCheckoutSummary] = useState(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [loadingCheckoutSummary, setLoadingCheckoutSummary] = useState(false);
  const [completingCheckout, setCompletingCheckout] = useState(false);

  // ================= FETCH TENANT =================

  async function fetchTenantDetails() {
    try {
      setLoading(true);
      setError("");

      const data = await getTenantDetails(tenantId);

      setTenant(data.tenant);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTenantDetails();
  }, [tenantId]);

  // ================= GIVE NOTICE =================

  async function handleGiveNotice(e) {
    e.preventDefault();

    try {
      setSubmittingNotice(true);
      setNoticeError("");

      if (!checkoutDate) {
        setNoticeError("Please select checkout date");
        return;
      }

      await giveTenantNotice(tenantId, checkoutDate);

      alert("Notice added successfully!");

      setShowNoticeModal(false);
      setCheckoutDate("");

      await fetchTenantDetails();
    } catch (error) {
      setNoticeError(error.message);
    } finally {
      setSubmittingNotice(false);
    }
  }

  // ================= CANCEL NOTICE =================

  async function handleCancelNotice() {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this tenant's notice?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await cancelTenantNotice(tenantId);

      alert("Notice cancelled successfully!");

      await fetchTenantDetails();
    } catch (error) {
      alert(error.message);
    }
  }

  // ================= EDIT TENANT =================

  function openEditModal() {
    setEditError("");

    setEditForm({
      name: tenant.name || "",
      email: tenant.email || "",
      phone: tenant.phone || "",
      monthlyRent: tenant.monthlyRent || "",
      emergencyName: tenant.emergencyContact?.name || "",
      emergencyPhone: tenant.emergencyContact?.phone || "",
      emergencyRelation: tenant.emergencyContact?.relation || "",
    });

    setShowEditModal(true);
  }

  async function handleEditSubmit(e) {
    e.preventDefault();

    try {
      setEditing(true);
      setEditError("");

      if (!editForm.name.trim()) {
        setEditError("Tenant name is required");
        return;
      }

      if (!editForm.phone.trim()) {
        setEditError("Phone number is required");
        return;
      }

      if (
        editForm.monthlyRent === "" ||
        Number(editForm.monthlyRent) < 0
      ) {
        setEditError("Please enter a valid monthly rent");
        return;
      }

      const payload = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        monthlyRent: Number(editForm.monthlyRent),
        emergencyContact: {
          name: editForm.emergencyName.trim(),
          phone: editForm.emergencyPhone.trim(),
          relation: editForm.emergencyRelation.trim(),
        },
      };

      await updateTenant(tenantId, payload);

      alert("Tenant updated successfully");

      setShowEditModal(false);

      await fetchTenantDetails();
    } catch (error) {
      setEditError(error.message || "Failed to update tenant");
    } finally {
      setEditing(false);
    }
  }

  // ================= EXTEND CHECKOUT =================

  async function handleExtendCheckout(e) {
    e.preventDefault();

    try {
      setSubmittingExtend(true);
      setExtendError("");

      if (!extendDate) {
        setExtendError("Please select a new checkout date");
        return;
      }

      await extendCheckoutDate(tenantId, extendDate);

      alert("Checkout date extended successfully!");

      setShowExtendModal(false);
      setExtendDate("");

      await fetchTenantDetails();
    } catch (error) {
      setExtendError(error.message);
    } finally {
      setSubmittingExtend(false);
    }
  }

  // ================= CHECKOUT SUMMARY =================

  async function handleOpenCheckout() {
    try {
      setLoadingCheckoutSummary(true);
      setCheckoutError("");
      setCheckoutSummary(null);

      const data = await getCheckoutSummary(tenantId);

      setCheckoutSummary(data.summary);
      setShowCheckoutModal(true);
    } catch (error) {
      setCheckoutError(error.message);
    } finally {
      setLoadingCheckoutSummary(false);
    }
  }

  async function handleConfirmCheckout() {
    try {
      setCompletingCheckout(true);
      setCheckoutError("");

      await completeTenantCheckout(tenantId);

      alert("Tenant checkout completed successfully!");

      setShowCheckoutModal(false);
      setCheckoutSummary(null);

      await fetchTenantDetails();
    } catch (error) {
      setCheckoutError(error.message);
    } finally {
      setCompletingCheckout(false);
    }
  }

  // ================= STATUS =================

  function getStatusStyle(status) {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";

      case "notice":
        return "bg-amber-50 text-amber-700 border border-amber-200";

      case "checked_out":
        return "bg-red-50 text-red-700 border border-red-200";

      default:
        return "bg-slate-50 text-slate-700 border border-slate-200";
    }
  }

  function formatStatus(status) {
    if (!status) return "Unknown";

    if (status === "checked_out") {
      return "Checked Out";
    }

    if (status === "notice") {
      return "On Notice";
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  // ================= FORMAT DATE =================

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // ================= DAYS REMAINING =================

  function getDaysRemaining(date) {
    if (!date) return null;

    const today = new Date();
    const checkout = new Date(date);

    today.setHours(0, 0, 0, 0);
    checkout.setHours(0, 0, 0, 0);

    const difference = checkout - today;

    return Math.ceil(difference / (1000 * 60 * 60 * 24));
  }

  // ================= HELPERS =================

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10";

  const closeEditModal = () => {
    if (editing) return;
    setShowEditModal(false);
    setEditError("");
  };

  const closeNoticeModal = () => {
    if (submittingNotice) return;
    setShowNoticeModal(false);
    setNoticeError("");
    setCheckoutDate("");
  };

  const closeExtendModal = () => {
    if (submittingExtend) return;
    setShowExtendModal(false);
    setExtendDate("");
    setExtendError("");
  };

  const closeCheckoutModal = () => {
    if (completingCheckout) return;
    setShowCheckoutModal(false);
    setCheckoutSummary(null);
    setCheckoutError("");
  };

  // ================= LOADING =================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
          <p className="mt-4 text-sm text-slate-500">
            Loading tenant details...
          </p>
        </div>
      </div>
    );
  }

  // ================= ERROR =================

  if (error && !tenant) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-6">
        <h2 className="font-semibold text-red-600">
          Failed to load tenant details
        </h2>

        <p className="mt-2 text-sm leading-6 text-red-500">
          {error}
        </p>
      </div>
    );
  }

  // ================= NO TENANT =================

  if (!tenant) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-slate-500">Tenant not found.</p>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(tenant.checkoutDate);

  const isCheckoutDue = daysRemaining === 0;

  const isCheckoutOverdue =
    daysRemaining !== null && daysRemaining < 0;

  return (
    <div className="min-w-0 space-y-4 pb-6 sm:space-y-6">

      {/* ================= HEADER ================= */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5">

          {/* Profile */}

          <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-white sm:h-16 sm:w-16 sm:rounded-full sm:text-2xl">
              {tenant.name
                ? tenant.name.charAt(0).toUpperCase()
                : "?"}
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">
                {tenant.name || "Unknown Tenant"}
              </h1>

              <p className="mt-1 truncate text-sm text-slate-500">
                {tenant.email || "-"}
              </p>

              <p className="text-sm text-slate-500">
                {tenant.phone || "-"}
              </p>
            </div>
          </div>

          {/* Actions */}

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">

            <span
              className={`w-full rounded-xl px-4 py-2.5 text-center text-sm font-semibold sm:w-auto ${getStatusStyle(
                tenant.status
              )}`}
            >
              {formatStatus(tenant.status)}
            </span>

            <button
              onClick={openEditModal}
              className="w-full rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 sm:w-auto"
            >
              Edit Tenant
            </button>

            {tenant.status === "active" && (
              <button
                onClick={() => {
                  setShowNoticeModal(true);
                  setNoticeError("");
                  setCheckoutDate("");
                }}
                className="w-full rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 sm:w-auto"
              >
                Give Notice
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= NOTICE INFORMATION ================= */}

      {tenant.status === "notice" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-6">
          <div className="space-y-5">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <h2 className="text-lg font-bold text-amber-800">
                  ⚠️ Tenant is on Notice
                </h2>

                <p className="mt-2 text-sm leading-6 text-amber-700">
                  This tenant is expected to vacate the room on
                  the selected checkout date.
                </p>
              </div>

              {daysRemaining !== null && (
                <div
                  className={`rounded-2xl bg-white px-6 py-4 text-center shadow-sm ${
                    isCheckoutOverdue
                      ? "border border-red-200"
                      : isCheckoutDue
                      ? "border border-orange-200"
                      : "border border-amber-100"
                  }`}
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Checkout Status
                  </p>

                  <p
                    className={`mt-1 text-2xl font-bold ${
                      isCheckoutOverdue
                        ? "text-red-600"
                        : isCheckoutDue
                        ? "text-orange-600"
                        : "text-amber-600"
                    }`}
                  >
                    {isCheckoutOverdue
                      ? "Overdue"
                      : isCheckoutDue
                      ? "Due Today"
                      : `${daysRemaining} Days`}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Notice Given On
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {formatDate(tenant.noticeDate)}
                </p>
              </div>

              <div className="rounded-xl bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Expected Checkout Date
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {formatDate(tenant.checkoutDate)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">

              <button
                type="button"
                onClick={handleCancelNotice}
                className="w-full rounded-xl border border-amber-300 bg-white px-5 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 sm:w-auto"
              >
                Cancel Notice
              </button>

              <button
                type="button"
                onClick={() => {
                  setExtendError("");
                  setExtendDate("");
                  setShowExtendModal(true);
                }}
                className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
              >
                Extend Checkout
              </button>

              <button
                type="button"
                onClick={handleOpenCheckout}
                disabled={loadingCheckoutSummary}
                className="w-full rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {loadingCheckoutSummary
                  ? "Checking..."
                  : "Complete Checkout"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ROOM DETAILS ================= */}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <SectionTitle
          icon="🛏️"
          title="Room & Bed Details"
        />

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard
            label="Block"
            value={
              tenant.bed?.room?.floor?.block?.name || "-"
            }
          />

          <InfoCard
            label="Floor"
            value={
              tenant.bed?.room?.floor?.floorNumber
                ? `Floor ${tenant.bed.room.floor.floorNumber}`
                : "-"
            }
          />

          <InfoCard
            label="Room"
            value={tenant.bed?.room?.roomNumber || "-"}
          />

          <InfoCard
            label="Bed"
            value={tenant.bed?.bedNumber || "-"}
          />
        </div>

        {tenant.bed?.room?.sharingType && (
          <div className="mt-3 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Sharing Type
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {tenant.bed.room.sharingType} Sharing
            </p>
          </div>
        )}
      </section>

      {/* ================= FINANCIAL DETAILS ================= */}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <SectionTitle
          icon="₹"
          title="Financial Details"
        />

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MoneyCard
            label="Monthly Rent"
            value={tenant.monthlyRent || 0}
          />

          <MoneyCard
            label="Advance Amount"
            value={tenant.advanceAmount || 0}
          />

          <MoneyCard
            label="Refundable Amount"
            value={tenant.refundableAmount || 0}
          />

          <MoneyCard
            label="Maintenance Deduction"
            value={tenant.maintenanceDeduction || 0}
          />
        </div>
      </section>

      {/* ================= PERSONAL DETAILS ================= */}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <SectionTitle
          icon="👤"
          title="Personal Details"
        />

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <DetailItem
            label="Full Name"
            value={tenant.name}
          />

          <DetailItem
            label="Email"
            value={tenant.email}
          />

          <DetailItem
            label="Phone"
            value={tenant.phone}
          />

          <DetailItem
            label="Joining Date"
            value={formatDate(tenant.joiningDate)}
          />
        </div>
      </section>

      {/* ================= EMERGENCY CONTACT ================= */}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <SectionTitle
          icon="🚨"
          title="Emergency Contact"
        />

        {typeof tenant.emergencyContact === "object" &&
        tenant.emergencyContact !== null ? (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem
              label="Name"
              value={tenant.emergencyContact.name}
            />

            <DetailItem
              label="Phone"
              value={tenant.emergencyContact.phone}
            />

            <DetailItem
              label="Relation"
              value={tenant.emergencyContact.relation}
            />
          </div>
        ) : (
          <div className="mt-5">
            <p className="font-semibold text-slate-900">
              {tenant.emergencyContact || "-"}
            </p>
          </div>
        )}
      </section>

      {/* =========================================================
          EDIT TENANT MODAL
      ========================================================= */}

      {showEditModal && (
        <ModalOverlay onClose={closeEditModal}>
          <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl">

            <ModalHeader
              title="Edit Tenant"
              subtitle="Update tenant information"
              onClose={closeEditModal}
            />

            {editError && (
              <div className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 sm:mx-6">
                {editError}
              </div>
            )}

            <form
              onSubmit={handleEditSubmit}
              className="flex-1 overflow-y-auto px-4 py-5 sm:px-6"
            >
              <div className="space-y-6">

                {/* Personal */}

                <div>
                  <h3 className="font-semibold text-slate-900">
                    Personal Details
                  </h3>

                  <div className="mt-4 space-y-4">

                    <FormField label="Full Name">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            name: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </FormField>

                    <FormField label="Email">
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            email: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </FormField>

                    <FormField label="Phone">
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            phone: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </FormField>

                    <FormField label="Monthly Rent">
                      <input
                        type="number"
                        min="0"
                        value={editForm.monthlyRent}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            monthlyRent: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </FormField>

                  </div>
                </div>

                {/* Emergency */}

                <div className="border-t border-slate-200 pt-6">
                  <h3 className="font-semibold text-slate-900">
                    Emergency Contact
                  </h3>

                  <div className="mt-4 space-y-4">

                    <FormField label="Name">
                      <input
                        type="text"
                        value={editForm.emergencyName}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            emergencyName: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </FormField>

                    <FormField label="Phone">
                      <input
                        type="text"
                        value={editForm.emergencyPhone}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            emergencyPhone: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </FormField>

                    <FormField label="Relation">
                      <input
                        type="text"
                        value={editForm.emergencyRelation}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            emergencyRelation: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </FormField>

                  </div>
                </div>
              </div>

              {/* Buttons */}

              <div className="sticky bottom-0 -mx-4 mt-6 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white p-4 sm:-mx-6 sm:flex-row sm:justify-end sm:px-6">

                <button
                  type="button"
                  onClick={closeEditModal}
                  className="w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={editing}
                  className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {editing ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* =========================================================
          GIVE NOTICE MODAL
      ========================================================= */}

      {showNoticeModal && (
        <ModalOverlay onClose={closeNoticeModal}>
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6">

            <ModalHeader
              title="Give Notice"
              subtitle="Select when the tenant will vacate the room."
              onClose={closeNoticeModal}
            />

            {noticeError && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {noticeError}
              </div>
            )}

            <form
              onSubmit={handleGiveNotice}
              className="mt-6"
            >
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Expected Checkout Date
              </label>

              <input
                type="date"
                value={checkoutDate}
                onChange={(e) => setCheckoutDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
                className={inputClass}
              />

              <div className="mt-6 grid grid-cols-1 gap-2 sm:flex sm:justify-end">
                <button
                  type="button"
                  onClick={closeNoticeModal}
                  className="w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingNotice}
                  className="w-full rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {submittingNotice
                    ? "Adding Notice..."
                    : "Confirm Notice"}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* =========================================================
          EXTEND CHECKOUT MODAL
      ========================================================= */}

      {showExtendModal && (
        <ModalOverlay onClose={closeExtendModal}>
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6">

            <ModalHeader
              title="Extend Checkout Date"
              subtitle={
                <>
                  Current checkout date:{" "}
                  <span className="font-semibold text-slate-700">
                    {formatDate(tenant.checkoutDate)}
                  </span>
                </>
              }
              onClose={closeExtendModal}
            />

            {extendError && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {extendError}
              </div>
            )}

            <form
              onSubmit={handleExtendCheckout}
              className="mt-6"
            >
              <label className="mb-2 block text-sm font-medium text-slate-700">
                New Checkout Date
              </label>

              <input
                type="date"
                value={extendDate}
                onChange={(e) => setExtendDate(e.target.value)}
                min={
                  tenant.checkoutDate
                    ? new Date(tenant.checkoutDate)
                        .toISOString()
                        .split("T")[0]
                    : new Date().toISOString().split("T")[0]
                }
                required
                className={inputClass}
              />

              <p className="mt-2 text-xs leading-5 text-slate-500">
                New checkout date must be later than the current
                checkout date.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-2 sm:flex sm:justify-end">
                <button
                  type="button"
                  onClick={closeExtendModal}
                  className="w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingExtend}
                  className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {submittingExtend
                    ? "Updating..."
                    : "Extend Date"}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* =========================================================
          CHECKOUT SUMMARY MODAL
      ========================================================= */}

      {showCheckoutModal && checkoutSummary && (
        <ModalOverlay onClose={closeCheckoutModal}>
          <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl">

            <ModalHeader
              title="Complete Checkout"
              subtitle="Review the financial settlement before checkout."
              onClose={closeCheckoutModal}
            />

            <div className="overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6">

              {/* Tenant */}

              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Tenant
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {tenant.name}
                </p>
              </div>

              {/* Error */}

              {checkoutError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {checkoutError}
                </div>
              )}

              {/* Financial Summary */}

              <div className="mt-6">
                <h3 className="font-semibold text-slate-900">
                  Financial Settlement
                </h3>

                <div className="mt-4 space-y-3">

                  <SummaryRow
                    label="Monthly Rent"
                    value={`₹${checkoutSummary.monthlyRent || 0}`}
                  />

                  <SummaryRow
                    label="Previous Pending Rent"
                    value={`₹${
                      checkoutSummary.previousPendingRent || 0
                    }`}
                    valueClass="text-red-600"
                  />

                  <SummaryRow
                    label="Current Month Rent"
                    value={`₹${
                      checkoutSummary.currentMonthRent || 0
                    }`}
                    valueClass="text-red-600"
                  />

                  <SummaryRow
                    label="Total Pending Rent"
                    value={`₹${
                      checkoutSummary.totalPendingRent || 0
                    }`}
                    strong
                    valueClass="text-red-600"
                    bordered
                  />

                  <SummaryRow
                    label="Refundable Amount"
                    value={`₹${
                      checkoutSummary.refundableAmount || 0
                    }`}
                    valueClass="text-emerald-600"
                  />

                  <SummaryRow
                    label="Maintenance Deduction"
                    value={`₹${
                      checkoutSummary.maintenanceDeduction || 0
                    }`}
                  />

                </div>
              </div>

              {/* Final Settlement */}

              <div className="mt-6 rounded-2xl bg-slate-900 p-5 text-white">

                <p className="text-sm text-slate-300">
                  Final Settlement
                </p>

                {checkoutSummary.settlementType === "refund" ? (
                  <>
                    <p className="mt-1 text-2xl font-bold">
                      ₹{checkoutSummary.finalAmount || 0}
                    </p>

                    <p className="mt-1 text-sm text-emerald-300">
                      Refund to tenant
                    </p>
                  </>
                ) : checkoutSummary.settlementType === "due" ? (
                  <>
                    <p className="mt-1 text-2xl font-bold">
                      ₹{checkoutSummary.finalAmount || 0}
                    </p>

                    <p className="mt-1 text-sm text-red-300">
                      Amount to collect from tenant
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-2xl font-bold">
                      ₹0
                    </p>

                    <p className="mt-1 text-sm text-slate-300">
                      No amount pending
                    </p>
                  </>
                )}
              </div>

              {/* Pending Months */}

              {checkoutSummary.pendingMonths?.length > 0 && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-700">
                    Pending Rent Months
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {checkoutSummary.pendingMonths.map((month) => (
                      <span
                        key={month}
                        className="rounded-lg bg-white px-3 py-1 text-xs font-medium text-red-600"
                      >
                        {month}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Buttons */}

              <div className="mt-6 grid grid-cols-1 gap-2 sm:flex sm:justify-end">
                <button
                  type="button"
                  onClick={closeCheckoutModal}
                  className="w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmCheckout}
                  disabled={completingCheckout}
                  className="w-full rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {completingCheckout
                    ? "Completing..."
                    : "Confirm Checkout"}
                </button>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

/* =========================================================
   REUSABLE UI COMPONENTS
========================================================= */

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
        {icon}
      </div>

      <h2 className="text-lg font-bold text-slate-900">
        {title}
      </h2>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3 sm:p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold text-slate-900 sm:text-base">
        {value}
      </p>
    </div>
  );
}

function MoneyCard({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3 sm:p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
        {label}
      </p>

      <p className="mt-1 truncate text-lg font-bold text-slate-900 sm:text-xl">
        ₹{value}
      </p>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words font-semibold text-slate-900">
        {value || "-"}
      </p>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      {children}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueClass = "text-slate-900",
  strong = false,
  bordered = false,
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${
        bordered
          ? "border-t border-slate-200 pt-3"
          : ""
      }`}
    >
      <span
        className={`text-sm ${
          strong
            ? "font-medium text-slate-700"
            : "text-slate-500"
        }`}
      >
        {label}
      </span>

      <span
        className={`shrink-0 ${
          strong ? "font-bold" : "font-semibold"
        } ${valueClass}`}
      >
        {value}
      </span>
    </div>
  );
}

function ModalOverlay({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      {children}
    </div>
  );
}

function ModalHeader({
  title,
  subtitle,
  onClose,
}) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">

      <div className="min-w-0">
        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
          {title}
        </h2>

        {subtitle && (
          <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
            {subtitle}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}

export default TenantDetails;