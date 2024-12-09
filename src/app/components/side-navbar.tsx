import Link from "next/link";

const menuItems: {
  id: number;
  name: string;
  url: unknown;
}[] = [
  { id: 1, name: "Dashboard", url: "/dashboard" },
  { id: 2, name: "EFT Transactions", url: "/transactions/eft" },
  { id: 3, name: "Easypay Transactions", url: "/transactions/easypay" },
  { id: 4, name: "Receipt Management", url: "/receipts" },
  // { id: 5, name: "Policies", url: "/users" },
  // { id: 6, name: "Graves", url: "/bookings" },
  // { id: 7, name: "Funerals", url: "/bookings" },
  // { id: 8, name: "Documents", url: "/bookings" },
  // { id: 9, name: "Terms", url: "/bookings" },
  // { id: 10, name: "FAQS", url: "/bookings" },
  { id: 11, name: "Users", url: "/users" },
  // { id: 12, name: "Settings", url: "/bookings" },
];

const SideNavBar = () => {
  return (
    <section className="h-full w-64 overflow-auto bg-white dark:bg-zinc-900">
      <div className="grid gap-0">
        {menuItems.map((item) => {
          const url = item.url ?? "";
          return (
            <Link key={item.id} href={url}>
              <div className="flex cursor-pointer items-center gap-4 px-4 py-3 hover:bg-[#FFC107] hover:text-[#2B3E50]">
                <p className="text-sm font-normal uppercase tracking-wider">
                  {item.name}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
      {/* <div className="absolute bottom-3 left-3 animate-bounce rounded-full bg-slate-200 p-1">
        <IconHelp className="cursor-pointer text-[#0056b3]" />
      </div> */}
    </section>
  );
};

export default SideNavBar;
