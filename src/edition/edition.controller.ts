import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EditionService } from './edition.service';
import { CreateEditionDto } from './dto/create-edition.dto';
import { UpdateEditionDto } from './dto/update-edition.dto';

@Controller('edition')
export class EditionController {
  constructor(private readonly editionService: EditionService) {}

  @Post()
  create(@Body() createEditionDto: CreateEditionDto) {
    return this.editionService.create(createEditionDto);
  }

  @Get()
  findAll() {
    return this.editionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.editionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEditionDto: UpdateEditionDto) {
    return this.editionService.update(+id, updateEditionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.editionService.remove(+id);
  }
}
