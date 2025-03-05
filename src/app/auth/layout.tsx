import React from "react";

const UnauthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <section className="absolute w-full md:w-[30%] px-4">{children}</section>
    </div>
  );
};

export default UnauthenticatedLayout;
