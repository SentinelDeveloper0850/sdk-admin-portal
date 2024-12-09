"use client";

import { useParams } from "next/navigation";

const VehicleDetails = () => {
  const { id } = useParams(); // Extract 'id' from route parameters

  return (
    <div style={{ padding: "20px" }}>
      {/* Vehicle Details */}
      <h1>Vehicle Details</h1>
      <p>
        <strong>ID: </strong> {id}
      </p>
      <p>
        <strong>Name</strong>: Vehicle {id}
      </p>
      <p>
        <strong>Type:</strong> Truck{" "}
      </p>
      <p>
        <strong>Status</strong>: Active{" "}
      </p>
      <p>
        <strong>Mileage</strong>: 150,000 km{" "}
      </p>
    </div>
  );
};

export default VehicleDetails;
