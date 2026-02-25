import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  create(
    @Body() createProductDto: CreateProductDto,
    @Request() req,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.productsService.create(createProductDto, req.user.id, files);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.productsService.findAll(query);
  }

  @Get('featured')
  findFeatured() {
    return this.productsService.findFeatured();
  }

  @Get('trending')
  findTrending() {
    return this.productsService.findTrending();
  }

  @Get('search')
  search(@Query('q') query: string, @Query() filters: any) {
    return this.productsService.search(query, filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get('shop/:shopId')
  findByShop(@Param('shopId') shopId: string, @Query() query: any) {
    return this.productsService.findByShop(shopId, query);
  }

  @Get('category/:categoryId')
  findByCategory(@Param('categoryId') categoryId: string, @Query() query: any) {
    return this.productsService.findByCategory(categoryId, query);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req,
  ) {
    return this.productsService.update(id, updateProductDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  remove(@Param('id') id: string, @Request() req) {
    return this.productsService.remove(id, req.user.id);
  }

  @Post(':id/reviews')
  @UseGuards(JwtAuthGuard)
  createReview(
    @Param('id') id: string,
    @Body() reviewData: any,
    @Request() req,
  ) {
    return this.productsService.createReview(id, reviewData, req.user.id);
  }

  @Get(':id/reviews')
  getProductReviews(@Param('id') id: string, @Query() query: any) {
    return this.productsService.getProductReviews(id, query);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  likeProduct(@Param('id') id: string, @Request() req) {
    return this.productsService.likeProduct(id, req.user.id);
  }

  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  unlikeProduct(@Param('id') id: string, @Request() req) {
    return this.productsService.unlikeProduct(id, req.user.id);
  }

  @Post(':id/view')
  incrementView(@Param('id') id: string) {
    return this.productsService.incrementView(id);
  }
}