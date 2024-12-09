import { VehicleModel } from "@/app/models/vehicle.schema";

export const getVehicles = async () => {
  return await VehicleModel.find();
};
