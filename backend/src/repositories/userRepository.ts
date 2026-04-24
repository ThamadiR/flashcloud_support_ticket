 export class UserRepository {
  constructor(private readonly prisma: any) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByIdWithBasicFields(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    });
  }

  findByIdWithProfileFields(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        contactNo: true,
        role: true,
        img: true,
      },
    });
  }

  findLastByIdDesc() {
    return this.prisma.user.findFirst({ orderBy: { id: 'desc' } });
  }

  createUser(data: any) {
    return this.prisma.user.create({ data });
  }

  updateUser(id: number, data: any, select?: any) {
    return this.prisma.user.update({ where: { id }, data, ...(select ? { select } : {}) });
  }

  deleteUser(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }

  countUsers(where?: any) {
    if (where) {
      return this.prisma.user.count({ where });
    }

    return this.prisma.user.count();
  }

  findManyUsers(args: any) {
    return this.prisma.user.findMany(args);
  }

  countAdmins() {
    return this.prisma.user.count({ where: { role: 'ADMIN' } as any });
  }
}
