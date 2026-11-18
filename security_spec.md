# UNO Tabletop Firestore Security Specification

## 1. Data Invariants
1. **Owner-Only Access**: A `UserProfile` document at `/users/{userId}` may only be read, created, or updated by the verified authenticated user whose `request.auth.uid == userId` and `request.auth.token.email_verified == true`.
2. **No Self-Minted Fortune on Create**: New profiles must initialize with `coins == 250`, `unlockedCards == ['classic']`, `unlockedTables == ['emerald']`, zeroed stats, and server timestamps (`createdAt == request.time`, `updatedAt == request.time`).
3. **Immutable Identity & Creation Timestamp**: `uid` and `createdAt` can never change after creation.
4. **Equip Integrity**: `equippedCard` must belong to `unlockedCards` and `equippedTable` must belong to `unlockedTables`.
5. **Bounded Economy Transitions**:
   - **Purchase Action**: Coins must strictly decrease (`incoming().coins < existing().coins && incoming().coins >= 0`), and `unlockedCards` / `unlockedTables` remain strictly bounded arrays of allowlisted theme IDs.
   - **Reward / Daily Claim Action**: Coin gains per update are bounded (`<= existing().coins + 350`) and `gamesPlayed >= existing().gamesPlayed`.
6. **Strict Schema Enforcement**: No shadow/ghost keys permitted (`hasAll` + `hasOnly` on create; `affectedKeys().hasOnly` per action on update). `list` queries and `delete` operations on `/users` are denied.

## 2. Adversarial "Dirty Dozen" Payloads (All Must Return PERMISSION_DENIED)
1. **Unauthenticated Read/Write**: Reading or writing `/users/userA` with `request.auth == null`.
2. **Unverified Email Spoof**: Writing `/users/userA` when `request.auth.token.email_verified == false`.
3. **Cross-User Read**: UserB attempting `get(/users/userA)`.
4. **Cross-User List Scraping**: Any user attempting `list(/users)`.
5. **UID Poisoning on Create**: Creating `/users/userA` with `uid: "userB"`.
6. **Invalid Path ID**: Targeting `/users/bad$id!with/slashes`.
7. **Coin Minting on Create**: Creating `/users/userA` with `coins: 999999`.
8. **Shadow/Ghost Field Injection**: Creating or updating `/users/userA` with an extra field `isAdmin: true`.
9. **Equipping Unowned Card Theme**: Updating `equippedCard: "royal-ruby"` when `"royal-ruby"` is not in `unlockedCards`.
10. **Client Timestamp Forgery**: Creating or updating with `updatedAt` set to a client timestamp instead of `request.time`.
11. **Unbounded Coin Inflation on Update**: Updating `coins` from `250` to `50000` in one update.
12. **Immutable Field Mutation**: Updating `uid` or `createdAt` after document creation.
