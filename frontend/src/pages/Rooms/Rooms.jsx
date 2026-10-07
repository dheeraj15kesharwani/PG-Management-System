import { useEffect, useState } from "react";
import { getRooms } from "../../services/api";

function Rooms() {
  const [roomsData, setRoomsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getRooms();
      setRoomsData(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= LOADING =================

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 sm:min-h-[60vh]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />

          <p className="mt-4 text-sm font-medium text-slate-500 sm:text-base">
            Loading rooms and beds...
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
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl">
            !
          </div>

          <p className="mt-4 text-sm font-semibold leading-6 text-red-600 sm:text-base">
            {error}
          </p>

          <button
            onClick={fetchRooms}
            className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { summary, blocks } = roomsData;

  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-6 lg:space-y-8">

      {/* ================= HEADER ================= */}

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Rooms & Beds
        </h1>

        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500 sm:mt-2 sm:text-base">
          Manage your PG rooms, beds and occupancy.
        </p>
      </div>

      {/* ================= SUMMARY CARDS ================= */}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">

        {/* Total Rooms */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <p className="text-xs font-medium text-slate-500 sm:text-sm">
            Total Rooms
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:mt-3 sm:text-3xl">
            {summary.totalRooms}
          </h2>
        </div>

        {/* Total Beds */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <p className="text-xs font-medium text-slate-500 sm:text-sm">
            Total Beds
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:mt-3 sm:text-3xl">
            {summary.totalBeds}
          </h2>
        </div>

        {/* Vacant Beds */}

        <div className="rounded-2xl border border-green-100 bg-green-50 p-4 sm:p-6">
          <p className="text-xs font-medium text-green-700 sm:text-sm">
            Vacant Beds
          </p>

          <h2 className="mt-2 text-2xl font-bold text-green-700 sm:mt-3 sm:text-3xl">
            {summary.vacantBeds}
          </h2>
        </div>

        {/* Occupied Beds */}

        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 sm:p-6">
          <p className="text-xs font-medium text-red-700 sm:text-sm">
            Occupied Beds
          </p>

          <h2 className="mt-2 text-2xl font-bold text-red-700 sm:mt-3 sm:text-3xl">
            {summary.occupiedBeds}
          </h2>
        </div>
      </div>

      {/* ================= BLOCKS ================= */}

      <div className="space-y-5 sm:space-y-6">

        {blocks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
              🏠
            </div>

            <p className="mt-4 text-sm font-medium text-slate-500 sm:text-base">
              No rooms found in this PG.
            </p>
          </div>
        ) : (
          blocks.map((block) => (
            <div
              key={block.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >

              {/* ================= BLOCK HEADER ================= */}

              <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex items-center justify-between gap-3">

                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                      🏢 {block.name}
                    </h2>

                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                      {block.floors.length} Floor
                      {block.floors.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
                    {block.floors.length}{" "}
                    {block.floors.length === 1 ? "Floor" : "Floors"}
                  </span>

                </div>
              </div>

              {/* ================= FLOORS ================= */}

              <div className="space-y-7 p-4 sm:space-y-8 sm:p-6">

                {block.floors.map((floor) => (
                  <div key={floor.id}>

                    {/* FLOOR TITLE */}

                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="text-base font-semibold text-slate-800 sm:text-lg">
                        Floor {floor.floorNumber}
                      </h3>

                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 sm:px-3 sm:text-xs">
                        {floor.rooms.length}{" "}
                        {floor.rooms.length === 1 ? "Room" : "Rooms"}
                      </span>
                    </div>

                    {/* ================= ROOMS GRID ================= */}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">

                      {floor.rooms.map((room) => (
                        <div
                          key={room.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4 transition sm:p-5 sm:hover:-translate-y-1 sm:hover:shadow-lg"
                        >

                          {/* ROOM HEADER */}

                          <div className="flex items-start justify-between gap-3">

                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-500 sm:text-sm">
                                Room
                              </p>

                              <h4 className="mt-0.5 text-xl font-bold text-slate-900 sm:text-2xl">
                                {room.roomNumber}
                              </h4>
                            </div>

                            {/* SHARING BADGE */}

                            <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-700 sm:px-3 sm:text-xs">
                              {room.sharingType} Sharing
                            </span>
                          </div>

                          {/* ROOM STATUS */}

                          <div className="mt-3 sm:mt-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold sm:px-3 sm:text-xs ${
                                room.status === "active"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {room.status === "active"
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </div>

                          {/* BEDS */}

                          <div className="mt-4 border-t border-slate-100 pt-4 sm:mt-5">

                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-sm font-semibold text-slate-700">
                                Beds
                              </p>

                              <span className="text-xs text-slate-400">
                                {room.beds.length}{" "}
                                {room.beds.length === 1
                                  ? "bed"
                                  : "beds"}
                              </span>
                            </div>

                            <div className="space-y-2.5 sm:space-y-3">

                              {room.beds.map((bed) => (
                                <div
                                  key={bed.id}
                                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"
                                >

                                  {/* BED INFO */}

                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-800">
                                      🛏️ {bed.bedNumber}
                                    </p>

                                    {bed.tenant && (
                                      <p className="mt-1 truncate text-xs text-slate-500">
                                        {bed.tenant.name}
                                      </p>
                                    )}
                                  </div>

                                  {/* BED STATUS */}

                                  <span
                                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize sm:px-3 sm:text-xs ${
                                      bed.status === "vacant"
                                        ? "bg-green-100 text-green-700"
                                        : bed.status === "occupied"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-yellow-100 text-yellow-700"
                                    }`}
                                  >
                                    {bed.status}
                                  </span>

                                </div>
                              ))}

                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Rooms;