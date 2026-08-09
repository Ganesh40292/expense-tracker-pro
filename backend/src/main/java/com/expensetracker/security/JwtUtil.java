package com.expensetracker.security;

import java.security.Key;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.expensetracker.entity.RefreshToken;
import com.expensetracker.entity.User;
import com.expensetracker.exception.UnauthorizedException;
import com.expensetracker.repository.RefreshTokenRepository;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.access-expiration}")
    private long accessExpiration;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    // ── Access Token ──

    public String generateToken(String email) {

        Date currentDate = new Date();

        Date expiryDate =
                new Date(currentDate.getTime() + accessExpiration);

        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(currentDate)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractEmail(String token) {

        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    /**
     * Extract email even from an expired token (for refresh flow).
     */
    public String extractEmailFromExpiredToken(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
        } catch (ExpiredJwtException ex) {
            return ex.getClaims().getSubject();
        }
    }

    public boolean validateToken(String token) {

        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);

            return true;

        } catch (JwtException ex) {
            return false;
        }
    }

    /**
     * Returns true if the token is structurally valid but expired.
     */
    public boolean isTokenExpired(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return false;
        } catch (ExpiredJwtException ex) {
            return true;
        } catch (JwtException ex) {
            return false;
        }
    }

    // ── Refresh Token ──

    @Transactional
    public String createRefreshToken(User user, String deviceInfo, String ipAddress) {

        String tokenValue = UUID.randomUUID().toString();

        LocalDateTime expiryDate = LocalDateTime.now()
                .plusSeconds(refreshExpiration / 1000);

        RefreshToken refreshToken = new RefreshToken(
                tokenValue, user, deviceInfo, ipAddress, expiryDate
        );

        refreshTokenRepository.save(refreshToken);

        return tokenValue;
    }

    @Transactional
    public RefreshToken validateRefreshToken(String token) {

        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (refreshToken.isRevoked()) {
            // Potential token theft — revoke ALL tokens for this user
            refreshTokenRepository.revokeAllByUser(refreshToken.getUser());
            throw new UnauthorizedException("Refresh token has been revoked. All sessions invalidated for security.");
        }

        if (refreshToken.isExpired()) {
            refreshToken.setRevoked(true);
            refreshTokenRepository.save(refreshToken);
            throw new UnauthorizedException("Refresh token has expired");
        }

        return refreshToken;
    }

    /**
     * Token rotation: invalidate old refresh token and issue a new one.
     */
    @Transactional
    public String rotateRefreshToken(RefreshToken oldToken) {

        oldToken.setRevoked(true);
        refreshTokenRepository.save(oldToken);

        return createRefreshToken(
                oldToken.getUser(),
                oldToken.getDeviceInfo(),
                oldToken.getIpAddress()
        );
    }

    @Transactional
    public void revokeRefreshToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public void revokeAllUserTokens(User user) {
        refreshTokenRepository.revokeAllByUser(user);
    }

    public List<RefreshToken> getActiveSessionsForUser(User user) {
        return refreshTokenRepository.findAllByUserAndRevokedFalse(user);
    }
}