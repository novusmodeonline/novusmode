"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Breadcrumb } from "@/components";
import toast from "react-hot-toast";
import { isValidEmailAddressFormat, isValidPhoneNumber } from "@/scripts/utils";

const FloatingInput = ({
  label,
  type = "text",
  id,
  name,
  value,
  onChange,
  required = false,
}) => {
  return (
    <div className="relative w-full">
      <input
        type={type}
        name={name}
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        placeholder=" "
        className="peer w-full rounded-md border border-gray-300 bg-white px-3 pt-5 pb-2 text-sm text-gray-900 focus:border-[var(--color-bg)] focus:outline-none focus:ring-1 focus:ring-[var(--color-bg)]"
      />
      <label
        htmlFor={id}
        className="absolute left-3 top-2 text-xs text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-gray-600"
      >
        {label}
      </label>
    </div>
  );
};

const isValidFormattedDate = (dobStr) => {
  const [dd, mm, yyyy] = dobStr.split("/");
  const date = new Date(`${yyyy}-${mm}-${dd}`);
  return !isNaN(date.getTime());
};

const formatToDDMMYYYY = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const ProfilePage = () => {
  const { data: session } = useSession();
  const [initialData, setInitialData] = useState(null);
  const [formData, setFormData] = useState({});
  const [isChanged, setIsChanged] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          const formattedDob = formatToDDMMYYYY(data.dob);
          setInitialData(data);
          setFormData({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            dob: formattedDob,
            gender: data.gender || "",
          });
        });
    }
  }, [session]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "dob") {
      const raw = value.replace(/[^0-9]/g, "").slice(0, 8);
      if (raw.length >= 5)
        newValue = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}`;
      else if (raw.length >= 3) newValue = `${raw.slice(0, 2)}/${raw.slice(2)}`;
      else newValue = raw;
    }

    const updated = { ...formData, [name]: newValue };
    setFormData(updated);

    setIsChanged(
      JSON.stringify(updated) !==
        JSON.stringify({
          name: initialData.name || "",
          email: initialData.email || "",
          phone: initialData.phone || "",
          dob: formatToDDMMYYYY(initialData.dob),
          gender: initialData.gender || "",
        })
    );
  };

  const handleDatePick = (e) => {
    const date = new Date(e.target.value);
    const formatted = !isNaN(date.getTime())
      ? formatToDDMMYYYY(date)
      : formatToDDMMYYYY(new Date());
    const updated = { ...formData, dob: formatted };
    setFormData(updated);
    setIsChanged(true);
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Name is required.";
    if (!formData.email.trim() || !isValidEmailAddressFormat(formData.email))
      return "Invalid email.";
    if (!formData.phone.trim() || !isValidPhoneNumber(formData.phone))
      return "Invalid phone number.";
    if (!formData.dob || !isValidFormattedDate(formData.dob))
      return "Date of birth must be valid.";
    if (!formData.gender) return "Gender is required.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const [dd, mm, yyyy] = formData.dob.split("/");
    const formattedDOB = `${yyyy}-${mm}-${dd}`;

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, dob: formattedDOB }),
    });

    if (res.ok) {
      toast.success("Profile updated successfully");
      setIsChanged(false);
      const updated = await res.json();
      setInitialData(updated);
    } else {
      const errorData = await res.json();
      toast.error(errorData.message || "Failed to update profile");
    }
  };

  if (!initialData) return <p className="text-center py-10">Loading...</p>;

  return (
    <div className="min-h-screen bg-[var(--color-inverted-bg)] text-[var(--color-inverted-text)] px-6 md:px-24 py-12">
      <div className="text-black bg-white">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-24">
          <div className="mb-4">
            <Breadcrumb />
          </div>
        </div>
      </div>
      <h1 className="text-center text-[var(--color-bg)] text-4xl md:text-5xl font-bold mb-8">
        My Details
      </h1>
      <form
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow space-y-6"
      >
        <FloatingInput
          label="Name"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
        />
        <FloatingInput
          label="Email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          type="email"
        />
        <FloatingInput
          label="Phone"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
        />

        <div className="relative w-full">
          <FloatingInput
            label="Date of Birth"
            id="dob"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            placeholder="DD/MM/YYYY"
          />
          <input
            type="date"
            className="absolute right-3 top-[10px] w-6 cursor-pointer opacity-70"
            onChange={handleDatePick}
            value={(() => {
              const [dd, mm, yyyy] = formData.dob.split("/");
              return yyyy && mm && dd ? `${yyyy}-${mm}-${dd}` : "";
            })()}
          />
        </div>

        <div className="relative w-full">
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="peer w-full rounded-md border border-gray-300 bg-white px-3 pt-5 pb-2 text-sm text-gray-900 focus:border-[var(--color-bg)] focus:outline-none focus:ring-1 focus:ring-[var(--color-bg)] appearance-none"
          >
            <option value="">Select Gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
          <label
            htmlFor="gender"
            className="absolute left-3 top-2 text-xs text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-gray-600"
          >
            Gender
          </label>
        </div>

        <button
          type="submit"
          disabled={!isChanged}
          className="mt-4 w-full rounded-md bg-[var(--color-bg)] text-[var(--color-text)] py-2 px-4 text-sm font-semibold shadow-sm transition hover:opacity-90 disabled:opacity-50"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;
