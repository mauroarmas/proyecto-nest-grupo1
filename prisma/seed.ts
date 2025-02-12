import { Prisma, PrismaClient } from "@prisma/client";
import * as bcrypt from 'bcrypt';
import { USERS } from "../src/utils/mock";
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
}

main()
.catch((err) => {
    console.error(err);
    process.exit(1);
})
.finally(async () => {
    await prisma.$disconnect();
});