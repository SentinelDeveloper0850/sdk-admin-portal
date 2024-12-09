"use client";

import { useParams, useRouter } from "next/navigation";

const DriverDetails = () => {
  const { id } = useParams(); // Extract 'id' from route parameters
  const router = useRouter(); // Next.js router for navigation

  // Placeholder driver data
  const driver = {
    id: id,
    name: `Driver ${id}`,
    availabilityStatus: "Available",
    assignedVehicle: "Toyota Corolla",
    licenseType: "Code 10",
    tripsCompleted: 45,
    lastTripDate: "2024-11-26",
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="mb-5 cursor-pointer rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-[#FFC107] focus:outline-none focus:ring focus:ring-blue-300"
      >
        Back
      </button>

      {/* Driver Details */}
      <h1 className="mb-4 text-xl font-bold">Driver Details</h1>
      <p>
        <strong>ID:</strong> {driver.id}
      </p>
      <p>
        <strong>Name:</strong> {driver.name}
      </p>
      <p>
        <strong>Availability:</strong> {driver.availabilityStatus}
      </p>
      <p>
        <strong>Assigned Vehicle:</strong> {driver.assignedVehicle}
      </p>
      <p>
        <strong>License Type:</strong> {driver.licenseType}
      </p>
      <p>
        <strong>Trips Completed:</strong> {driver.tripsCompleted}
      </p>
      <p>
        <strong>Last Trip Date:</strong> {driver.lastTripDate}
      </p>
    </div>
  );
};

export default DriverDetails;
