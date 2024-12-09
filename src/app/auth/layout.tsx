import Image from "next/image";
import React from "react";

const UnauthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full w-full flex">
      <section className="h-full w-1/3 border-r-1 border-r-[#ffac00] border-opacity-20 px-8">
        {children}
      </section>
      <section className="w-2/3 h-full bg-[url('/primary-bg.svg')]">
      </section>
    </div>
  );
};

export default UnauthenticatedLayout;
