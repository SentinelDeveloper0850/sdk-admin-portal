import { Card, CardBody } from "@nextui-org/react";

import AppNavbar from "./components/app-navbar";

export default function Home() {
  return (
    <>
      <AppNavbar />
      <Card className="mx-auto mt-8 max-w-md">
        <CardBody className="text-center">
          <h1 className="text-5xl">FleetSync</h1>
          <p className="mt-2 text-lg">Drive Your Fleet Into the Future</p>
        </CardBody>
      </Card>
    </>
  );
}
