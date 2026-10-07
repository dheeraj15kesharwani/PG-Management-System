import { useEffect, useState } from "react";
import { getDashboard } from "../../services/api";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  useEffect(() => {
    getDashboard()
      .then((result) => {
        setData(result);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center px-4">
        <p className="text-center text-sm text-slate-500 sm:text-base">
          Loading dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-6">
        <h2 className="font-semibold text-red-700">
          Failed to load dashboard
        </h2>

        <p className="mt-2 break-words text-sm text-red-600">{error}</p>
      </div>
    );
  }

  const overview = data?.overview || {};
  const tenants = data?.tenants || {};
  const finance = data?.finance || {};
  const property = data?.property || {};

  const cards = [
    {
      title: "Total Beds",
      value: overview.totalBeds ?? 0,
      info: `Across ${property.totalBlocks ?? 0} blocks`,
      icon: "🛏️",
    },
    {
      title: "Occupied Beds",
      value: overview.occupiedBeds ?? 0,
      info: `${overview.occupancyRate ?? 0}% occupancy`,
      icon: "👤",
    },
    {
      title: "Available Beds",
      value: overview.vacantBeds ?? 0,
      info: "Ready for booking",
      icon: "🏠",
    },
    {
      title: "Collected Rent",
      value: `₹${finance.totalCollectedRent ?? 0}`,
      info: `${finance.collectionRate ?? 0}% collection rate`,
      icon: "₹",
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 sm:text-sm">
            PG Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back 👋
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Here’s what’s happening in your PG today.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-[0.98] sm:w-auto"
        >
          Logout
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="group min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-5 lg:p-6"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-500 sm:text-sm">
                  {card.title}
                </p>

                <h2 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-900 sm:mt-3 sm:text-3xl">
                  {card.value}
                </h2>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg transition duration-300 group-hover:bg-slate-900 group-hover:text-white sm:h-11 sm:w-11 sm:text-xl">
                {card.icon}
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500 sm:mt-4 sm:text-sm">
              {card.info}
            </p>
          </div>
        ))}
      </div>

      {/* Occupancy + Revenue */}
      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        {/* Occupancy */}
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 sm:text-sm">
                Occupancy
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                {overview.occupancyRate ?? 0}%
              </h2>
            </div>

            <span className="w-fit max-w-full rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 sm:text-sm">
              {overview.occupiedBeds ?? 0} / {overview.totalBeds ?? 0} beds
            </span>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100 sm:mt-6">
            <div
              className="h-full rounded-full bg-slate-900 transition-all duration-700"
              style={{
                width: `${Math.min(
                  overview.occupancyRate ?? 0,
                  100
                )}%`,
              }}
            />
          </div>

          <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs sm:mt-4 sm:text-sm">
            <span className="text-slate-500">
              Occupied: {overview.occupiedBeds ?? 0}
            </span>

            <span className="text-slate-500">
              Vacant: {overview.vacantBeds ?? 0}
            </span>
          </div>
        </div>

        {/* Revenue */}
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <p className="text-xs font-medium text-slate-500 sm:text-sm">
            Monthly Revenue
          </p>

          <div className="mt-3 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="min-w-0 break-words text-2xl font-bold text-slate-900 sm:text-3xl">
              ₹{finance.totalCollectedRent ?? 0}
            </h2>

            <span className="w-fit max-w-full rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 sm:text-sm">
              {finance.collectionRate ?? 0}% collected
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4">
            <div className="min-w-0 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">Expected</p>

              <p className="mt-1 break-words text-lg font-semibold text-slate-900">
                ₹{finance.totalExpectedRent ?? 0}
              </p>
            </div>

            <div className="min-w-0 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">Pending</p>

              <p className="mt-1 break-words text-lg font-semibold text-slate-900">
                ₹{finance.totalPendingRent ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tenant Overview */}
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div>
          <p className="text-xs font-medium text-slate-500 sm:text-sm">
            Tenant Overview
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
            Tenant status
          </h2>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-4">
          <div className="min-w-0 rounded-xl bg-slate-50 p-4 sm:p-5">
            <p className="text-sm text-slate-500">Active</p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {tenants.active ?? 0}
            </p>
          </div>

          <div className="min-w-0 rounded-xl bg-slate-50 p-4 sm:p-5">
            <p className="text-sm text-slate-500">On Notice</p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {tenants.onNotice ?? 0}
            </p>
          </div>

          <div className="min-w-0 rounded-xl bg-slate-50 p-4 sm:p-5">
            <p className="text-sm text-slate-500">Checked Out</p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {tenants.checkedOut ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Property Overview */}
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 sm:text-sm">
              Property Overview
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              Your PG at a glance
            </h2>
          </div>

          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 sm:text-sm">
            {property.totalBlocks ?? 0} Blocks
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <div className="min-w-0 rounded-xl bg-slate-50 p-4 sm:p-5">
            <p className="text-sm text-slate-500">Blocks</p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {property.totalBlocks ?? 0}
            </p>
          </div>

          <div className="min-w-0 rounded-xl bg-slate-50 p-4 sm:p-5">
            <p className="text-sm text-slate-500">Floors</p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {property.totalFloors ?? 0}
            </p>
          </div>

          <div className="min-w-0 rounded-xl bg-slate-50 p-4 sm:p-5">
            <p className="text-sm text-slate-500">Rooms</p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {property.totalRooms ?? 0}
            </p>
          </div>

          <div className="min-w-0 rounded-xl bg-slate-50 p-4 sm:p-5">
            <p className="text-sm text-slate-500">Beds</p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {property.totalBeds ?? 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;