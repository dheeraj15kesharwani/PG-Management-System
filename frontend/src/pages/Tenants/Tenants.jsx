import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTenants,
  getBeds,
  registerTenant,
  createTenant,
  assignBed,
} from "../../services/api";

function Tenants() {
  const navigate = useNavigate();

  const [tenants, setTenants] = useState([]);
  const [beds, setBeds] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    emergencyContact: "",
    joiningDate: "",
    monthlyRent: "",
    sharingType: "",
    bedId: "",
  });

  // ================= FETCH DATA =================

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      const [tenantData, bedData] = await Promise.all([
        getTenants(),
        getBeds(),
      ]);

      setTenants(tenantData.tenants || []);
      setBeds(bedData.beds || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // ================= FORM CHANGE =================

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // ================= ADD TENANT =================

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSubmitting(true);
      setFormError("");

      // STEP 1: Register User
      const registerData = await registerTenant(formData);

      const userId = registerData.user.id;

      // STEP 2: Create Tenant Profile
      const tenantData = await createTenant({
        userId,
        joiningDate: formData.joiningDate,
        monthlyRent: formData.monthlyRent,
        emergencyContact: formData.emergencyContact,
      });

      const tenantId = tenantData.tenant._id;

      // STEP 3: Assign Bed
      await assignBed(tenantId, formData.bedId);

      alert("Tenant added successfully!");

      // Close Modal
      setShowModal(false);

      // Reset Form
      setFormData({
        name: "",
        email: "",
        phone: "",
        emergencyContact: "",
        joiningDate: "",
        monthlyRent: "",
        sharingType: "",
        bedId: "",
      });

      // Refresh Data
      fetchData();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ================= SEARCH + FILTER =================

  const filteredTenants = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return tenants.filter((tenant) => {
      const name = tenant.user?.name?.toLowerCase() || "";
      const email = tenant.user?.email?.toLowerCase() || "";
      const phone = tenant.user?.phone || "";

      const matchesSearch =
        !searchText ||
        name.includes(searchText) ||
        email.includes(searchText) ||
        phone.includes(searchText);

      const matchesStatus =
        statusFilter === "all" || tenant.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tenants, search, statusFilter]);

  // ================= VACANT BEDS =================

  const vacantBeds = useMemo(() => {
    return beds.filter(
      (bed) =>
        bed.status === "vacant" &&
        Number(bed.room?.sharingType) === Number(formData.sharingType)
    );
  }, [beds, formData.sharingType]);

  // ================= STATUS STYLE =================

  function getStatusStyle(status) {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";

      case "notice":
        return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";

      case "checked_out":
        return "bg-red-50 text-red-700 ring-1 ring-red-200";

      default:
        return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
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

  // ================= CLOSE MODAL =================

  function closeModal() {
    if (submitting) return;

    setShowModal(false);
    setFormError("");
  }

  // ================= LOADING =================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />

          <p className="text-sm text-slate-500 sm:text-base">
            Loading tenants...
          </p>
        </div>
      </div>
    );
  }

  // ================= ERROR =================

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-6">
        <h2 className="font-semibold text-red-700">
          Failed to load data
        </h2>

        <p className="mt-2 break-words text-sm text-red-600">
          {error}
        </p>

        <button
          onClick={fetchData}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-6 lg:space-y-8">
      {/* ================= HEADER ================= */}

      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 sm:text-sm">
            Residents
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Tenants
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
            Manage all residents in your PG
          </p>
        </div>

        <button
          onClick={() => {
            setShowModal(true);
            setFormError("");
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98] sm:w-auto"
        >
          <span className="text-lg leading-none">+</span>
          Add Tenant
        </button>
      </div>

      {/* ================= SEARCH + FILTER ================= */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* Search */}
          <div className="relative min-w-0 flex-1">
            <svg
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
              />
            </svg>

            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/5"
            />
          </div>

          {/* Status Filter */}
          <div className="relative lg:w-52">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/5"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="notice">On Notice</option>
              <option value="checked_out">Checked Out</option>
            </select>

            <svg
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="m6 9 6 6 6-6"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* ================= RESULTS ================= */}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-900">
            {filteredTenants.length}
          </span>{" "}
          of{" "}
          <span className="font-medium text-slate-700">
            {tenants.length}
          </span>{" "}
          tenants
        </p>

        {(search || statusFilter !== "all") && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
            className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ================= DESKTOP TABLE ================= */}

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tenant
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Block
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Floor
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Room
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Bed
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Phone
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Rent
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredTenants.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-16 text-center"
                  >
                    <div className="mx-auto max-w-sm">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
                        👤
                      </div>

                      <h3 className="mt-4 font-semibold text-slate-900">
                        No tenants found
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Try changing your search or filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => (
                  <tr
                    key={tenant._id}
                    className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50"
                  >
                    {/* Tenant */}
                    <td className="px-5 py-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 font-semibold text-white">
                          {tenant.user?.name
                            ? tenant.user.name
                                .charAt(0)
                                .toUpperCase()
                            : "?"}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {tenant.user?.name || "Unknown"}
                          </p>

                          <p className="max-w-[190px] truncate text-xs text-slate-500">
                            {tenant.user?.email || "-"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Block */}
                    <td className="px-5 py-5 text-sm text-slate-700">
                      {tenant.bed?.room?.floor?.block?.name || "-"}
                    </td>

                    {/* Floor */}
                    <td className="px-5 py-5 text-sm text-slate-700">
                      {tenant.bed?.room?.floor?.floorNumber
                        ? `Floor ${tenant.bed.room.floor.floorNumber}`
                        : "-"}
                    </td>

                    {/* Room */}
                    <td className="px-5 py-5 font-medium text-slate-900">
                      {tenant.bed?.room?.roomNumber || "-"}
                    </td>

                    {/* Bed */}
                    <td className="px-5 py-5 text-sm text-slate-700">
                      {tenant.bed?.bedNumber || "-"}
                    </td>

                    {/* Phone */}
                    <td className="px-5 py-5 text-sm text-slate-600">
                      {tenant.user?.phone || "-"}
                    </td>

                    {/* Rent */}
                    <td className="px-5 py-5 font-semibold text-slate-900">
                      ₹{tenant.monthlyRent || 0}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-5">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                          tenant.status
                        )}`}
                      >
                        {formatStatus(tenant.status)}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-5">
                      <button
                        onClick={() =>
                          navigate(`/tenants/${tenant._id}`)
                        }
                        className="whitespace-nowrap rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 active:scale-[0.98]"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MOBILE TENANT CARDS ================= */}

      <div className="space-y-3 md:hidden">
        {filteredTenants.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
              👤
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              No tenants found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filter.
            </p>
          </div>
        ) : (
          filteredTenants.map((tenant) => (
            <div
              key={tenant._id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              {/* Card Header */}
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 font-semibold text-white">
                    {tenant.user?.name
                      ? tenant.user.name.charAt(0).toUpperCase()
                      : "?"}
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-900">
                      {tenant.user?.name || "Unknown"}
                    </h3>

                    <p className="truncate text-xs text-slate-500">
                      {tenant.user?.email || "-"}
                    </p>
                  </div>
                </div>

                <span
                  className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusStyle(
                    tenant.status
                  )}`}
                >
                  {formatStatus(tenant.status)}
                </span>
              </div>

              {/* Card Details */}
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Location
                  </p>

                  <p className="mt-1 truncate text-sm font-medium text-slate-800">
                    {tenant.bed?.room?.roomNumber || "-"}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {tenant.bed?.room?.floor?.block?.name || "-"}
                    {" • "}
                    {tenant.bed?.room?.floor?.floorNumber
                      ? `Floor ${tenant.bed.room.floor.floorNumber}`
                      : "-"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Bed
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {tenant.bed?.bedNumber || "-"}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    ₹{tenant.monthlyRent || 0}/month
                  </p>
                </div>
              </div>

              {/* Contact */}
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
                  <svg
                    className="h-4 w-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M3 5a2 2 0 012-2h3.28a2 2 0 011.9 1.37l1.07 3.2a2 2 0 01-.5 2.11L9.5 10.93a16 16 0 003.57 3.57l1.25-1.25a2 2 0 012.11-.5l3.2 1.07A2 2 0 0121 15.72V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z"
                    />
                  </svg>

                  <span className="truncate">
                    {tenant.user?.phone || "-"}
                  </span>
                </div>

                <button
                  onClick={() =>
                    navigate(`/tenants/${tenant._id}`)
                  }
                  className="shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-700 active:scale-[0.98]"
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ================= ADD TENANT MODAL ================= */}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[2px]">

          <div className="flex h-full w-full items-end justify-center sm:items-center sm:p-4">

            <div
              className="
                flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl
                sm:h-auto sm:max-h-[92vh] sm:max-w-3xl sm:rounded-2xl
              "
            >

              {/* ================= MODAL HEADER ================= */}

              <div
                className="
                  flex shrink-0 items-center justify-between gap-4
                  border-b border-slate-100
                  px-4 py-4
                  sm:px-6 sm:py-5
                "
              >
                <div className="min-w-0">
                  <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-2xl">
                    Add New Tenant
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                    Fill in the tenant details and assign a bed.
                  </p>
                </div>

                <button
                  onClick={closeModal}
                  disabled={submitting}
                  className="
                    flex h-9 w-9 shrink-0 items-center justify-center
                    rounded-xl text-xl text-slate-400
                    transition hover:bg-slate-100 hover:text-slate-900
                    disabled:cursor-not-allowed disabled:opacity-50
                  "
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>

              {/* ================= SCROLLABLE FORM AREA ================= */}

              <div
                className="
                  min-h-0 flex-1 overflow-y-auto
                  overscroll-contain
                  px-4 py-5
                  sm:px-6 sm:py-6
                "
              >

                {/* Form Error */}

                {formError && (
                  <div
                    className="
                      mb-5 rounded-xl border border-red-200
                      bg-red-50 p-3.5
                      text-sm leading-5 text-red-600
                      sm:p-4
                    "
                  >
                    {formError}
                  </div>
                )}

                {/* Form */}

                <form
                  onSubmit={handleSubmit}
                  className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2"
                >

                  {/* ================= FULL NAME ================= */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Full Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter full name"
                      className="
                        w-full rounded-xl border border-slate-200
                        bg-white px-4 py-3
                        text-sm text-slate-900
                        outline-none transition
                        placeholder:text-slate-400
                        focus:border-slate-900
                        focus:ring-2 focus:ring-slate-900/5
                      "
                    />
                  </div>

                  {/* ================= EMAIL ================= */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="Enter email"
                      className="
                        w-full rounded-xl border border-slate-200
                        bg-white px-4 py-3
                        text-sm text-slate-900
                        outline-none transition
                        placeholder:text-slate-400
                        focus:border-slate-900
                        focus:ring-2 focus:ring-slate-900/5
                      "
                    />
                  </div>

                  {/* ================= PHONE ================= */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Phone Number
                    </label>

                    <input
                      type="tel"
                      inputMode="numeric"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="Enter phone number"
                      className="
                        w-full rounded-xl border border-slate-200
                        bg-white px-4 py-3
                        text-sm text-slate-900
                        outline-none transition
                        placeholder:text-slate-400
                        focus:border-slate-900
                        focus:ring-2 focus:ring-slate-900/5
                      "
                    />
                  </div>

                  {/* ================= EMERGENCY CONTACT ================= */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Emergency Contact
                    </label>

                    <input
                      type="tel"
                      inputMode="numeric"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleChange}
                      placeholder="Emergency contact number"
                      className="
                        w-full rounded-xl border border-slate-200
                        bg-white px-4 py-3
                        text-sm text-slate-900
                        outline-none transition
                        placeholder:text-slate-400
                        focus:border-slate-900
                        focus:ring-2 focus:ring-slate-900/5
                      "
                    />
                  </div>

                  {/* ================= JOINING DATE ================= */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Joining Date
                    </label>

                    <input
                      type="date"
                      name="joiningDate"
                      value={formData.joiningDate}
                      onChange={handleChange}
                      required
                      className="
                        w-full rounded-xl border border-slate-200
                        bg-white px-4 py-3
                        text-sm text-slate-900
                        outline-none transition
                        focus:border-slate-900
                        focus:ring-2 focus:ring-slate-900/5
                      "
                    />
                  </div>

                  {/* ================= MONTHLY RENT ================= */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Monthly Rent
                    </label>

                    <input
                      type="number"
                      inputMode="numeric"
                      name="monthlyRent"
                      value={formData.monthlyRent}
                      onChange={handleChange}
                      required
                      min="0"
                      placeholder="Enter monthly rent"
                      className="
                        w-full rounded-xl border border-slate-200
                        bg-white px-4 py-3
                        text-sm text-slate-900
                        outline-none transition
                        placeholder:text-slate-400
                        focus:border-slate-900
                        focus:ring-2 focus:ring-slate-900/5
                      "
                    />
                  </div>

                  {/* ================= SHARING TYPE ================= */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Preferred Sharing Type
                    </label>

                    <select
                      name="sharingType"
                      value={formData.sharingType}
                      onChange={(e) => {
                        handleChange(e);

                        setFormData((prev) => ({
                          ...prev,
                          sharingType: e.target.value,
                          bedId: "",
                        }));
                      }}
                      required
                      className="
                        w-full rounded-xl border border-slate-200
                        bg-white px-4 py-3
                        text-sm text-slate-900
                        outline-none transition
                        focus:border-slate-900
                        focus:ring-2 focus:ring-slate-900/5
                      "
                    >
                      <option value="">Select sharing type</option>
                      <option value="2">2 Sharing</option>
                      <option value="3">3 Sharing</option>
                      <option value="4">4 Sharing</option>
                    </select>
                  </div>

                  {/* ================= BED ================= */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Select Available Bed
                    </label>

                    <select
                      name="bedId"
                      value={formData.bedId}
                      onChange={handleChange}
                      required
                      disabled={
                        !formData.sharingType || vacantBeds.length === 0
                      }
                      className="
                        w-full rounded-xl border border-slate-200
                        bg-white px-4 py-3
                        text-sm text-slate-900
                        outline-none transition
                        focus:border-slate-900
                        focus:ring-2 focus:ring-slate-900/5
                        disabled:cursor-not-allowed
                        disabled:bg-slate-100
                        disabled:text-slate-400
                      "
                    >
                      {!formData.sharingType ? (
                        <option value="">
                          First select sharing type
                        </option>
                      ) : vacantBeds.length === 0 ? (
                        <option value="">
                          No vacant beds available
                        </option>
                      ) : (
                        <>
                          <option value="">
                            Select a vacant bed
                          </option>

                          {vacantBeds.map((bed) => (
                            <option key={bed._id} value={bed._id}>
                              Room {bed.room?.roomNumber || "Unknown"} — Bed{" "}
                              {bed.bedNumber}
                            </option>
                          ))}
                        </>
                      )}
                    </select>

                    {formData.sharingType &&
                      vacantBeds.length === 0 && (
                        <p className="mt-2 text-xs leading-5 text-red-500 sm:text-sm">
                          No vacant beds available for{" "}
                          {formData.sharingType} Sharing.
                        </p>
                      )}
                  </div>

                  {/* ================= BOTTOM ACTIONS ================= */}

                  <div
                    className="
                      sticky bottom-0 z-10
                      col-span-1
                      -mx-4 mt-2
                      flex flex-col-reverse gap-3
                      border-t border-slate-100
                      bg-white px-4 pt-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))]
                      sm:static sm:col-span-2
                      sm:mx-0 sm:flex-row sm:justify-end
                      sm:border-t sm:bg-transparent
                      sm:px-0 sm:pt-5 sm:pb-0
                    "
                  >
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={submitting}
                      className="
                        w-full rounded-xl
                        border border-slate-200
                        px-5 py-3
                        text-sm font-medium text-slate-700
                        transition hover:bg-slate-50
                        disabled:cursor-not-allowed disabled:opacity-50
                        sm:w-auto
                      "
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="
                        w-full rounded-xl
                        bg-slate-900
                        px-6 py-3
                        text-sm font-semibold text-white
                        shadow-sm transition
                        hover:bg-slate-800
                        active:scale-[0.98]
                        disabled:cursor-not-allowed disabled:opacity-60
                        sm:w-auto
                      "
                    >
                      {submitting ? "Adding Tenant..." : "Add Tenant"}
                    </button>
                  </div>

                </form>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Tenants;