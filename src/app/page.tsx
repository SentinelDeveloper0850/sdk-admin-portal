import AppBarOffline from "./components/app-bar-offline";

export default function Home() {
  return (
    <div className="homepage">
      <AppBarOffline />
      <div className="flex flex-col items-center justify-center h-[80vh] text-center text-white">
        <h1 className="text-4xl font-bold mb-4 text-gray-800 dark:text-white">Welcome to the SDK Admin Portal</h1>
        <p className="text-lg text-gray-500 dark:text-gray-300 max-w-xl">
          This platform is under active development as part of the SDK Suite. 
          Only authorized personnel may sign in and access administrative tools.
        </p>
        <div className="mt-6">
          <a
            href="/auth/signin"
            className="px-6 py-2 rounded-full bg-yellow-500 text-black hover:bg-yellow-400 transition"
          >
            Sign In
          </a>
        </div>
      </div>
      <footer className="absolute bottom-4 w-full text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} SDK Somdaka CC. All rights reserved.
      </footer>
    </div>
  );
}
