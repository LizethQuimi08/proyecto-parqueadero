import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

/**
 * Descarga las claves públicas RSA del OAuth server en tiempo real
 * y verifica la firma de cada JWT recibido.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: process.env.JWKS_URI || 'http://localhost:8082/.well-known/jwks.json',
      }),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    return {
      username: payload.sub,
      tenantId: payload.tenantId ?? 'default',
      roles: payload.roles ?? [],
    };
  }
}
