import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit{ 
    //hereda de prisma client y de onModuleInit para que se ejecute al inicio de la aplicacion 
    async onModuleInit() {
        await this.$connect(); //conecta a la base de datos
    }
}