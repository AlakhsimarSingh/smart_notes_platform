import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(
      dto.email,
      dto.password,
    );
  }

  @Post('login')
  login(@Body() dto: SignupDto) {
    return this.authService.login(
      dto.email,
      dto.password,
    );
  }
}