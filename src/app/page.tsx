import AppBarOffline from "./components/app-bar-offline";

export default function Home() {
  return (
    <div className="homepage">
      <AppBarOffline />
      <div className="flex h-[80vh] flex-col items-center justify-center text-center text-white">
        <h1 className="mb-4 text-4xl font-bold text-gray-800 dark:text-white">
          Welcome to the SDK Admin Portal
        </h1>
        <p className="max-w-xl text-lg text-gray-500 dark:text-gray-300">
          This platform is under active development as part of the SDK Suite.
          Only authorized personnel may sign in and access administrative tools.
        </p>
        <div className="mt-6">
          <a
            href="/auth/signin"
            className="rounded-full bg-yellow-500 px-6 py-2 text-black transition hover:bg-yellow-400"
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
