import type {
  BannerPosition,
  Prisma,
  PrismaClient,
} from "@prisma/client";

interface ListAdminBannersFilters {
  page: number;
  limit: number;

  search?: string;
  position?: BannerPosition;
  active?: boolean;

  sortOrder: "asc" | "desc";
}

const bannerSelect = {
  id: true,

  title: true,
  subtitle: true,

  imageUrl: true,
  mobileImageUrl: true,
  publicId: true,
  mobilePublicId: true,

  link: true,
  buttonText: true,

  position: true,
  sortOrder: true,
  active: true,

  startsAt: true,
  endsAt: true,

  createdAt: true,
  updatedAt: true,
} as const;

export class BannerRepository {
  constructor(
    private readonly prisma:
      PrismaClient,
  ) {}

  async create(
    data:
      Prisma.BannerCreateInput,
  ) {
    return this.prisma.banner.create({
      data,
      select: bannerSelect,
    });
  }

  async findById(
    bannerId: string,
  ) {
    return this.prisma.banner
      .findUnique({
        where: {
          id: bannerId,
        },

        select: bannerSelect,
      });
  }

  async update(
    bannerId: string,
    data:
      Prisma.BannerUpdateInput,
  ) {
    return this.prisma.banner
      .update({
        where: {
          id: bannerId,
        },

        data,
        select: bannerSelect,
      });
  }

  async delete(
    bannerId: string,
  ) {
    return this.prisma.banner
      .delete({
        where: {
          id: bannerId,
        },

        select: bannerSelect,
      });
  }

  async listAdmin(
    filters:
      ListAdminBannersFilters,
  ) {
    const where:
      Prisma.BannerWhereInput = {};

    if (
      filters.active !==
      undefined
    ) {
      where.active =
        filters.active;
    }

    if (filters.position) {
      where.position =
        filters.position;
    }

    if (filters.search) {
      where.OR = [
        {
          title: {
            contains:
              filters.search,

            mode: "insensitive",
          },
        },

        {
          subtitle: {
            contains:
              filters.search,

            mode: "insensitive",
          },
        },
      ];
    }

    const skip =
      (filters.page - 1) *
      filters.limit;

    const [
      banners,
      totalItems,
    ] =
      await this.prisma
        .$transaction([
          this.prisma.banner
            .findMany({
              where,

              skip,
              take:
                filters.limit,

              orderBy: [
                {
                  sortOrder:
                    filters.sortOrder,
                },

                {
                  createdAt: "desc",
                },
              ],

              select: bannerSelect,
            }),

          this.prisma.banner
            .count({
              where,
            }),
        ]);

    return {
      banners,
      totalItems,
    };
  }

  async listPublic(
    position?: BannerPosition,
  ) {
    const now = new Date();

    return this.prisma.banner
      .findMany({
        where: {
          active: true,

          ...(position
            ? {
                position,
              }
            : {}),

          AND: [
            {
              OR: [
                {
                  startsAt: null,
                },

                {
                  startsAt: {
                    lte: now,
                  },
                },
              ],
            },

            {
              OR: [
                {
                  endsAt: null,
                },

                {
                  endsAt: {
                    gte: now,
                  },
                },
              ],
            },
          ],
        },

        orderBy: [
          {
            sortOrder: "asc",
          },

          {
            createdAt: "desc",
          },
        ],

        select: bannerSelect,
      });
  }
}