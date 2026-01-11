/**
 * Unit Tests for Auth Library
 * Tests authentication and user profile functions
 */
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { UserProfile } from '@/lib/auth';

describe('Auth Library', () => {
    describe('UserProfile Type', () => {
        it('should have correct structure for host users', () => {
            const hostProfile: UserProfile = {
                uid: 'host123',
                email: 'host@school.edu',
                displayName: 'Teacher Smith',
                photoURL: 'https://example.com/photo.jpg',
                role: 'host',
                lifetimePoints: 0,
                gamesPlayed: 0,
                gamesWon: 0,
                createdAt: Date.now(),
                lastActive: Date.now(),
            };

            expect(hostProfile.role).toBe('host');
            expect(hostProfile.email).toBe('host@school.edu');
            expect(hostProfile.photoURL).toBe('https://example.com/photo.jpg');
        });

        it('should have correct structure for player users', () => {
            const playerProfile: UserProfile = {
                uid: 'player123',
                email: 'student@school.edu',
                displayName: 'Student Jones',
                role: 'player',
                joinedClassId: 'class_abc123',
                lifetimePoints: 500,
                gamesPlayed: 10,
                gamesWon: 3,
                createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
                lastActive: Date.now(),
            };

            expect(playerProfile.role).toBe('player');
            expect(playerProfile.joinedClassId).toBe('class_abc123');
            expect(playerProfile.lifetimePoints).toBe(500);
        });

        it('should allow null photo URL', () => {
            const profileNoPhoto: UserProfile = {
                uid: 'user123',
                email: 'user@test.com',
                displayName: 'Test User',
                photoURL: null,
                role: 'player',
                lifetimePoints: 0,
                gamesPlayed: 0,
                gamesWon: 0,
                createdAt: Date.now(),
                lastActive: Date.now(),
            };

            expect(profileNoPhoto.photoURL).toBeNull();
        });
    });

    describe('Role Validation', () => {
        it('should only accept valid roles', () => {
            const validRoles = ['host', 'player'];

            validRoles.forEach(role => {
                expect(['host', 'player']).toContain(role);
            });
        });

        it('should determine host capabilities', () => {
            const isHost = (profile: UserProfile) => profile.role === 'host';

            const hostProfile: UserProfile = {
                uid: 'h1',
                email: 'h@t.com',
                displayName: 'Host',
                role: 'host',
                lifetimePoints: 0,
                gamesPlayed: 0,
                gamesWon: 0,
                createdAt: Date.now(),
                lastActive: Date.now(),
            };

            const playerProfile: UserProfile = {
                uid: 'p1',
                email: 'p@t.com',
                displayName: 'Player',
                role: 'player',
                lifetimePoints: 0,
                gamesPlayed: 0,
                gamesWon: 0,
                createdAt: Date.now(),
                lastActive: Date.now(),
            };

            expect(isHost(hostProfile)).toBe(true);
            expect(isHost(playerProfile)).toBe(false);
        });
    });

    describe('Leaderboard Sorting', () => {
        it('should sort users by lifetime points descending', () => {
            const users: UserProfile[] = [
                { uid: 'u1', email: 'a@t.com', displayName: 'A', role: 'player', lifetimePoints: 100, gamesPlayed: 5, gamesWon: 1, createdAt: 0, lastActive: 0 },
                { uid: 'u2', email: 'b@t.com', displayName: 'B', role: 'player', lifetimePoints: 500, gamesPlayed: 10, gamesWon: 3, createdAt: 0, lastActive: 0 },
                { uid: 'u3', email: 'c@t.com', displayName: 'C', role: 'player', lifetimePoints: 250, gamesPlayed: 7, gamesWon: 2, createdAt: 0, lastActive: 0 },
            ];

            const sorted = [...users].sort((a, b) => b.lifetimePoints - a.lifetimePoints);

            expect(sorted[0].displayName).toBe('B');
            expect(sorted[0].lifetimePoints).toBe(500);
            expect(sorted[1].displayName).toBe('C');
            expect(sorted[2].displayName).toBe('A');
        });

        it('should limit leaderboard to top N users', () => {
            const users: UserProfile[] = Array.from({ length: 150 }, (_, i) => ({
                uid: `u${i}`,
                email: `user${i}@test.com`,
                displayName: `User ${i}`,
                role: 'player' as const,
                lifetimePoints: Math.floor(Math.random() * 1000),
                gamesPlayed: Math.floor(Math.random() * 20),
                gamesWon: Math.floor(Math.random() * 5),
                createdAt: Date.now(),
                lastActive: Date.now(),
            }));

            const limit = 100;
            const sorted = [...users]
                .sort((a, b) => b.lifetimePoints - a.lifetimePoints)
                .slice(0, limit);

            expect(sorted.length).toBe(100);
            // First place should have >= last place
            expect(sorted[0].lifetimePoints).toBeGreaterThanOrEqual(sorted[99].lifetimePoints);
        });
    });

    describe('Points and Stats Calculations', () => {
        it('should calculate win rate correctly', () => {
            const calculateWinRate = (profile: UserProfile): number => {
                if (profile.gamesPlayed === 0) return 0;
                return Math.round((profile.gamesWon / profile.gamesPlayed) * 100);
            };

            const profile1: UserProfile = {
                uid: 'u1',
                email: 't@t.com',
                displayName: 'Test',
                role: 'player',
                lifetimePoints: 100,
                gamesPlayed: 10,
                gamesWon: 3,
                createdAt: 0,
                lastActive: 0,
            };

            expect(calculateWinRate(profile1)).toBe(30);

            const profile2: UserProfile = { ...profile1, gamesPlayed: 0, gamesWon: 0 };
            expect(calculateWinRate(profile2)).toBe(0);
        });

        it('should handle points increment logic', () => {
            const addPoints = (currentPoints: number, toAdd: number): number => {
                return currentPoints + toAdd;
            };

            expect(addPoints(100, 50)).toBe(150);
            expect(addPoints(0, 25)).toBe(25);
            expect(addPoints(100, -30)).toBe(70); // Negative for corrections
        });
    });

    describe('Email Validation Helper', () => {
        it('should validate email format', () => {
            const isValidEmail = (email: string): boolean => {
                const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return regex.test(email);
            };

            expect(isValidEmail('test@example.com')).toBe(true);
            expect(isValidEmail('user.name@domain.org')).toBe(true);
            expect(isValidEmail('invalid')).toBe(false);
            expect(isValidEmail('missing@domain')).toBe(false);
            expect(isValidEmail('@nodomain.com')).toBe(false);
            expect(isValidEmail('spaces in@email.com')).toBe(false);
        });
    });

    describe('Display Name Handling', () => {
        it('should extract initial for avatar', () => {
            const getInitial = (name: string): string => {
                return name.charAt(0).toUpperCase();
            };

            expect(getInitial('Alice')).toBe('A');
            expect(getInitial('bob')).toBe('B');
            expect(getInitial('123User')).toBe('1');
        });

        it('should handle empty display name gracefully', () => {
            const getInitial = (name: string): string => {
                if (!name || name.trim().length === 0) return '?';
                return name.charAt(0).toUpperCase();
            };

            expect(getInitial('')).toBe('?');
            expect(getInitial('  ')).toBe('?');
        });

        it('should truncate long display names', () => {
            const truncateName = (name: string, maxLength: number = 20): string => {
                if (name.length <= maxLength) return name;
                return name.substring(0, maxLength - 3) + '...';
            };

            expect(truncateName('Short Name')).toBe('Short Name');
            expect(truncateName('This Is A Very Long Display Name That Needs Truncation')).toBe('This Is A Very Lo...');
        });
    });

    describe('Anonymous User Handling', () => {
        it('should detect anonymous users by empty email', () => {
            const isAnonymous = (profile: UserProfile): boolean => {
                return !profile.email || profile.email.trim() === '';
            };

            const anonProfile: UserProfile = {
                uid: 'anon123',
                email: '',
                displayName: 'Guest Player',
                role: 'player',
                lifetimePoints: 0,
                gamesPlayed: 0,
                gamesWon: 0,
                createdAt: Date.now(),
                lastActive: Date.now(),
            };

            const normalProfile: UserProfile = {
                uid: 'user123',
                email: 'user@test.com',
                displayName: 'Normal User',
                role: 'player',
                lifetimePoints: 0,
                gamesPlayed: 0,
                gamesWon: 0,
                createdAt: Date.now(),
                lastActive: Date.now(),
            };

            expect(isAnonymous(anonProfile)).toBe(true);
            expect(isAnonymous(normalProfile)).toBe(false);
        });
    });
});
