import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { User } from '@prisma/client';

export const GetUser = createParamDecorator(
    (data: keyof User | undefined, ctx: ExecutionContext): User | Partial<User> => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new UnauthorizedException('Usuario no encontrado en la solicitud');
        }

        if (data) {
            if (!(data in user)) {
                throw new UnauthorizedException(`La propiedad ${data} no existe en el usuario`);
            }
            return user[data];
        }

        return user;
    },
);