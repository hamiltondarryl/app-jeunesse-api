import { Injectable } from '@nestjs/common';
import { CreateDashbordDto } from './dto/create-dashbord.dto';
import { UpdateDashbordDto } from './dto/update-dashbord.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashbordService {

constructor(
      private prismaService: PrismaService,
  
) {}

  create(createDashbordDto: CreateDashbordDto) {
    return 'This action adds a new dashbord';
  }

  async findAll() {
    try {
      const associationCountActivated = await this.prismaService.organisation.count({
        where: { activated: true },
      });

      const associationCountDeactivated = await this.prismaService.organisation.count({
        where: { activated: false },
      });

      const userCount = await this.prismaService.user.count();

      return {
        associationCountActivated,
        associationCountDeactivated,
        userCount,
      };
      
    } catch (error) {
      throw new Error('Failed to fetch dashboard data');
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} dashbord`;
  }

  update(id: number, updateDashbordDto: UpdateDashbordDto) {
    return `This action updates a #${id} dashbord`;
  }

  remove(id: number) {
    return `This action removes a #${id} dashbord`;
  }
}
