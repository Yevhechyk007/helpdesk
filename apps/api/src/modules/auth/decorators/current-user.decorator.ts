import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserRecord } from '../../users/users.service';

export const CurrentUser = createParamDecorator(
  (field: keyof UserRecord | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: UserRecord }>();
    const user = request.user;
    return field ? user?.[field] : user;
  },
);
