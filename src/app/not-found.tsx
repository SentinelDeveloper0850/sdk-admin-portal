import { Card, CardBody } from "@nextui-org/react";

export default function NotFound() {
  return (
    <Card className="mx-auto mt-8 max-w-md">
      <CardBody className="text-center">
        <p className="text-xl">This page cannot be found.</p>
      </CardBody>
    </Card>
  );
}
