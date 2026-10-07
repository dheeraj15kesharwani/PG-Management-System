import { useState } from "react";
import { useNavigate } from "react-router-dom";

function PGSetup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    type: "boys",
    address: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      "http://localhost:5000/api/pg",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create PG");
    }

    alert("PG created successfully!");

    localStorage.setItem(
      "pg",
      JSON.stringify({
        id: data.pg._id,
        name: data.pg.name,
        type: data.pg.type,
        address: data.pg.address,
      })
    );

    navigate("/dashboard");
  } catch (error) {
    alert(error.message);
  }
};

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-slate-900">
          Set Up Your PG
        </h1>

        <p className="mt-2 text-slate-500">
          Add your PG details to get started.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-700">
              PG Name
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter PG name"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              PG Type
            </label>

            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
            >
              <option value="boys">Boys PG</option>
              <option value="girls">Girls PG</option>
              <option value="co-ed">Co-ed PG</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Address
            </label>

            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter PG address"
              rows="4"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800"
          >
            Create PG
          </button>
        </form>
      </div>
    </div>
  );
}

export default PGSetup;