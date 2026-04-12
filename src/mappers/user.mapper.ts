import { IUser } from "../models/user.model";
import { UserResponseDto } from "../interfaces/auth.interface";

export const toUserResponse = (user: IUser): UserResponseDto => ({
  id: user._id.toString(),
  email: user.email,
  name: user.name,
  role: user.role,
  ...(user.phone && { phone: user.phone }),
  ...(user.licensePlate && { licensePlate: user.licensePlate }),
  ...(user.createdAt && { createdAt: user.createdAt.toISOString() }),
  ...(user.updatedAt && { updatedAt: user.updatedAt.toISOString() }),
  ...(user.cccdImages && {
    cccdImages: {
      front: user.cccdImages.front?.url || "",
      back: user.cccdImages.back?.url || "",
    },
  }),
});

export const toRoomResponse = (room: any) => ({
  id: room._id.toString(),
  number: room.number,
  building: room.building.toString(),
  floor: room.floor,
  area: room.area,
  price: room.price,
  status: room.status,
  currentTenant: room.currentTenant?.toString(),
  description: room.description,
});
