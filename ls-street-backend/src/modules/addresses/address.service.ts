import type { Prisma } from "@prisma/client";

import {
  AddressRepository,
  type CreateAddressData,
  type UpdateAddressData,
} from "./address.repository";

import type {
  CreateAddressInput,
  UpdateAddressInput,
} from "./address.schema";

interface ServiceErrorOptions {
  statusCode: number;
  code: string;
}

export class AddressServiceError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(
    message: string,
    options: ServiceErrorOptions,
  ) {
    super(message);

    this.name = "AddressServiceError";
    this.statusCode = options.statusCode;
    this.code = options.code;
  }
}

function normalizeOptionalText(
  value: string | null | undefined,
) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalized = value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

function normalizeZipCode(value: string) {
  return value.replace(/\D/g, "");
}

function normalizePhone(
  value: string | null | undefined,
) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalized = value.replace(/\D/g, "");

  return normalized.length > 0
    ? normalized
    : null;
}

export class AddressService {
  constructor(
    private readonly repository: AddressRepository,
  ) {}

  private async ensureAddressExists(
    userId: string,
    addressPublicId: string,
  ) {
    const address =
      await this.repository.findByPublicIdAndUserId(
        addressPublicId,
        userId,
      );

    if (!address) {
      throw new AddressServiceError(
        "Endereço não encontrado.",
        {
          statusCode: 404,
          code: "ADDRESS_NOT_FOUND",
        },
      );
    }

    return address;
  }

  async list(userId: string) {
    return this.repository.findAllByUserId(
      userId,
    );
  }

  async create(
    userId: string,
    body: CreateAddressInput,
  ) {
    const totalAddresses =
      await this.repository.countByUserId(userId);

    const shouldBeDefault =
      totalAddresses === 0 || body.isDefault;

    const data: CreateAddressData = {
      recipientName: body.recipientName.trim(),
      phone: normalizePhone(body.phone),
      zipCode: normalizeZipCode(body.zipCode),
      street: body.street.trim(),
      number: body.number.trim(),
      complement: normalizeOptionalText(
        body.complement,
      ),
      neighborhood: body.neighborhood.trim(),
      city: body.city.trim(),
      state: body.state.toUpperCase(),
      country: body.country.trim(),
      label: normalizeOptionalText(body.label),
      isDefault: shouldBeDefault,
      userId,
    };

    if (shouldBeDefault && totalAddresses > 0) {
      await this.repository.unsetDefaultAddresses(
        userId,
      );
    }

    return this.repository.create(data);
  }

  async update(
    userId: string,
    addressPublicId: string,
    body: UpdateAddressInput,
  ) {
    const address =
      await this.ensureAddressExists(
        userId,
        addressPublicId,
      );

    const data: UpdateAddressData = {};

    if (body.recipientName !== undefined) {
      data.recipientName =
        body.recipientName.trim();
    }

    if (body.phone !== undefined) {
      data.phone = normalizePhone(body.phone);
    }

    if (body.zipCode !== undefined) {
      data.zipCode = normalizeZipCode(
        body.zipCode,
      );
    }

    if (body.street !== undefined) {
      data.street = body.street.trim();
    }

    if (body.number !== undefined) {
      data.number = body.number.trim();
    }

    if (body.complement !== undefined) {
      data.complement = normalizeOptionalText(
        body.complement,
      );
    }

    if (body.neighborhood !== undefined) {
      data.neighborhood =
        body.neighborhood.trim();
    }

    if (body.city !== undefined) {
      data.city = body.city.trim();
    }

    if (body.state !== undefined) {
      data.state = body.state.toUpperCase();
    }

    if (body.country !== undefined) {
      data.country = body.country.trim();
    }

    if (body.label !== undefined) {
      data.label = normalizeOptionalText(
        body.label,
      );
    }

    if (body.isDefault === true) {
      await this.repository.unsetDefaultAddresses(
        userId,
        address.id,
      );

      data.isDefault = true;
    }

    if (
      body.isDefault === false &&
      address.isDefault
    ) {
      throw new AddressServiceError(
        "Defina outro endereço como padrão antes de remover o padrão atual.",
        {
          statusCode: 422,
          code: "DEFAULT_ADDRESS_REQUIRED",
        },
      );
    }

    const updated =
      await this.repository.update(
        addressPublicId,
        userId,
        data,
      );

    if (!updated) {
      throw new AddressServiceError(
        "Endereço não encontrado.",
        {
          statusCode: 404,
          code: "ADDRESS_NOT_FOUND",
        },
      );
    }

    return updated;
  }

  async setDefault(
    userId: string,
    addressPublicId: string,
  ) {
    const address =
      await this.ensureAddressExists(
        userId,
        addressPublicId,
      );

    if (address.isDefault) {
      return address;
    }

    await this.repository.unsetDefaultAddresses(
      userId,
      address.id,
    );

    return this.repository.setAsDefault(
      address.id,
    );
  }

  async delete(
    userId: string,
    addressPublicId: string,
  ) {
    const address =
      await this.ensureAddressExists(
        userId,
        addressPublicId,
      );

    await this.repository.deleteById(address.id);

    if (address.isDefault) {
      const nextAddress =
        await this.repository.findFirstByUserId(
          userId,
          address.id,
        );

      if (nextAddress) {
        await this.repository.setAsDefault(
          nextAddress.id,
        );
      }
    }
  }
}