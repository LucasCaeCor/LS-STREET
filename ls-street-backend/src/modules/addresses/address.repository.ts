import type {
  Address,
  Prisma,
  PrismaClient,
} from "@prisma/client";

export interface CreateAddressData {
  recipientName: string;
  phone?: string | null;
  zipCode: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  label?: string | null;
  isDefault: boolean;
  userId: string;
}

export type UpdateAddressData =
  Prisma.AddressUpdateInput;

const addressSelect = {
  id: true,
  publicId: true,
  recipientName: true,
  phone: true,
  zipCode: true,
  street: true,
  number: true,
  complement: true,
  neighborhood: true,
  city: true,
  state: true,
  country: true,
  label: true,
  isDefault: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AddressSelect;

export class AddressRepository {
  constructor(
    private readonly prisma: PrismaClient,
  ) {}

  async findAllByUserId(userId: string) {
    return this.prisma.address.findMany({
      where: {
        userId,
      },

      select: addressSelect,

      orderBy: [
        {
          isDefault: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });
  }

  async findByPublicIdAndUserId(
    publicId: string,
    userId: string,
  ) {
    return this.prisma.address.findFirst({
      where: {
        publicId,
        userId,
      },

      select: addressSelect,
    });
  }

  async countByUserId(userId: string) {
    return this.prisma.address.count({
      where: {
        userId,
      },
    });
  }

  async create(data: CreateAddressData) {
    return this.prisma.address.create({
      data,
      select: addressSelect,
    });
  }

  async update(
    publicId: string,
    userId: string,
    data: UpdateAddressData,
  ) {
    const address =
      await this.findByPublicIdAndUserId(
        publicId,
        userId,
      );

    if (!address) {
      return null;
    }

    return this.prisma.address.update({
      where: {
        id: address.id,
      },

      data,

      select: addressSelect,
    });
  }

  async unsetDefaultAddresses(
    userId: string,
    excludeAddressId?: string,
  ) {
    return this.prisma.address.updateMany({
      where: {
        userId,
        isDefault: true,

        ...(excludeAddressId
          ? {
              id: {
                not: excludeAddressId,
              },
            }
          : {}),
      },

      data: {
        isDefault: false,
      },
    });
  }

  async setAsDefault(
    addressId: string,
  ) {
    return this.prisma.address.update({
      where: {
        id: addressId,
      },

      data: {
        isDefault: true,
      },

      select: addressSelect,
    });
  }

  async findFirstByUserId(
    userId: string,
    excludeAddressId?: string,
  ) {
    return this.prisma.address.findFirst({
      where: {
        userId,

        ...(excludeAddressId
          ? {
              id: {
                not: excludeAddressId,
              },
            }
          : {}),
      },

      orderBy: {
        createdAt: "asc",
      },

      select: addressSelect,
    });
  }

  async deleteById(id: string) {
    return this.prisma.address.delete({
      where: {
        id,
      },
    });
  }

  async transaction<T>(
    callback: (
      prisma: Prisma.TransactionClient,
    ) => Promise<T>,
  ) {
    return this.prisma.$transaction(callback);
  }
}