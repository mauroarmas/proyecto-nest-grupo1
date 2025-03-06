import { Prisma, PrismaClient } from "@prisma/client";
import * as bcrypt from 'bcrypt';
import { BRAND, CATEGORIES, SUPPLIER, USERS } from "../src/utils/mock";
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('password', 10);
    const users: Prisma.UserCreateManyInput[] = USERS.map((user) => ({
        ...user,
        password: hashedPassword,
        createdAt: faker.date.recent(),
    }))
    await prisma.user.createMany({
        data: users,
    });

    const categories: Prisma.CategoryCreateManyInput[] = CATEGORIES.map((category) => ({
        ...category,
        createdAt: faker.date.recent(),
    }));
    await prisma.category.createMany({
        data: categories,
    });

    const brands: Prisma.BrandCreateManyInput[] = BRAND.map((brand) => ({
        ...brand,
        createdAt: faker.date.recent(),
    }));
    await prisma.brand.createMany({
        data: brands,
    });

    const supplier: Prisma.SupplierCreateManyInput[] = SUPPLIER.map((supplier) => ({
        ...supplier,
        createdAt: faker.date.recent(),
    }))
    await prisma.supplier.createMany({
        data: supplier,
    });
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });