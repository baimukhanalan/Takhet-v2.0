import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { CommunityService } from './community.service';

class CreateCommunityPostDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  author!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(4000)
  body!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  category!: string;
}

class CreateCommunityReplyDto {
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  text!: string;
}

class CreatePublicFeedbackDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  review!: string;
}

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('posts')
  posts() {
    return this.communityService.listPosts();
  }

  @Get('top-doctors')
  topDoctors() {
    return this.communityService.topDoctors();
  }

  @Post('posts')
  createPost(@Body() dto: CreateCommunityPostDto) {
    return this.communityService.createPost({
      author: 'Анонимно',
      title: dto.title,
      body: dto.body,
      category: dto.category
    });
  }

  @Post('posts/:id/reply')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('doctor')
  reply(@Param('id') id: string, @Req() req: any, @Body() dto: CreateCommunityReplyDto) {
    return this.communityService.addReply(id, {
      author: req.user.email || 'Врач Takhet+',
      doctorId: req.user.id,
      text: dto.text
    });
  }

  @Post('feedback')
  submitFeedback(@Body() dto: CreatePublicFeedbackDto) {
    return this.communityService.submitPublicFeedback(dto);
  }
}
