"use client";

import React from "react";

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  address?: string;
}

const UserProfile: React.FC = () => {

  const profile: ProfileData = {
    firstName: "John",
    lastName: "Doe",
    email: "johndoe@example.com",
    phone: "+1234567890",
    role: "Administrator",
    address: "123 FleetSync Avenue, Tech City, RSA",
  };

  return (
    <div className="mx-auto max-w-lg rounded-lg bg-white p-6 shadow-md">
      <h1 className="mb-4 text-2xl font-bold">Profile</h1>
      <p className="mb-6 text-gray-500">
        Your personal details are listed below.
      </p>
      <div className="grid grid-cols-1 gap-4">
        {/* First Name */}
        <div>
          <p className="text-sm font-semibold text-gray-500">First Name</p>
          <p className="text-lg font-medium">{profile.firstName}</p>
        </div>

        {/* Last Name */}
        <div>
          <p className="text-sm font-semibold text-gray-500">Last Name</p>
          <p className="text-lg font-medium">{profile.lastName}</p>
        </div>

        {/* Email */}
        <div>
          <p className="text-sm font-semibold text-gray-500">Email</p>
          <p className="text-lg font-medium">{profile.email}</p>
        </div>

        {/* Phone */}
        {profile.phone && (
          <div>
            <p className="text-sm font-semibold text-gray-500">Phone</p>
            <p className="text-lg font-medium">{profile.phone}</p>
          </div>
        )}

        {/* Role */}
        <div>
          <p className="text-sm font-semibold text-gray-500">Role</p>
          <p className="text-lg font-medium">{profile.role}</p>
        </div>

        {/* Address */}
        {profile.address && (
          <div>
            <p className="text-sm font-semibold text-gray-500">Address</p>
            <p className="text-lg font-medium">{profile.address}</p>
          </div>
        )}
      </div>

      <button className="mb-5 ml-auto mt-6 cursor-pointer rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-[#FFC107] focus:outline-none focus:ring focus:ring-blue-300">
        Create
      </button>
    </div>
  );
};

export default UserProfile;
