-- Add devprint top deployer wallets to trecher-id
-- These are the actual Solana deployer wallets from devprint/data/top-deployer-wallets.json

-- Deployer #2 (1452 tokens created)
INSERT INTO "User" (id, username, "displayName", "privyUserId", "twitterId", "avatarUrl", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'deployer_02', 'Deployer #2', 'devprint_2', 'devprint_2', 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" rx="24" fill="hsl(280,72%25,54%25)" /%3E%3Ctext x="50%25" y="56%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial" font-size="32" font-weight="700"%3E#2%3C/text%3E%3C/svg%3E', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "Wallet" (id, "userId", address, "totalPnlUsd", "winRate", "totalTrades", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, id, 'Ffgdi3WvDj4KDJrSWo1JbvCxbTtPu9jJPgMGa7tFwukr', 0, 0, 0, now(), now()
FROM "User" WHERE username = 'deployer_02'
ON CONFLICT DO NOTHING;

-- Deployer #3 (964 tokens)
INSERT INTO "User" (id, username, "displayName", "privyUserId", "twitterId", "avatarUrl", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'deployer_03', 'Deployer #3', 'devprint_3', 'devprint_3', 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" rx="24" fill="hsl(200,72%25,54%25)" /%3E%3Ctext x="50%25" y="56%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial" font-size="32" font-weight="700"%3E#3%3C/text%3E%3C/svg%3E', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "Wallet" (id, "userId", address, "totalPnlUsd", "winRate", "totalTrades", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, id, 'Dq3fi8ZmBhkrwHFBChLk2pqV8iAGW9uuJP7coshGzqT6', 0, 0, 0, now(), now()
FROM "User" WHERE username = 'deployer_03'
ON CONFLICT DO NOTHING;

-- Deployer #4 (941 tokens)
INSERT INTO "User" (id, username, "displayName", "privyUserId", "twitterId", "avatarUrl", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'deployer_04', 'Deployer #4', 'devprint_4', 'devprint_4', 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" rx="24" fill="hsl(160,72%25,54%25)" /%3E%3Ctext x="50%25" y="56%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial" font-size="32" font-weight="700"%3E#4%3C/text%3E%3C/svg%3E', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "Wallet" (id, "userId", address, "totalPnlUsd", "winRate", "totalTrades", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, id, 'whamNNP9tHoxLg92yHvJPdYhghEoC1qYTsh5a2oLbx', 0, 0, 0, now(), now()
FROM "User" WHERE username = 'deployer_04'
ON CONFLICT DO NOTHING;

-- Deployer #5 (924 tokens)
INSERT INTO "User" (id, username, "displayName", "privyUserId", "twitterId", "avatarUrl", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'deployer_05', 'Deployer #5', 'devprint_5', 'devprint_5', 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" rx="24" fill="hsl(120,72%25,54%25)" /%3E%3Ctext x="50%25" y="56%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial" font-size="32" font-weight="700"%3E#5%3C/text%3E%3C/svg%3E', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "Wallet" (id, "userId", address, "totalPnlUsd", "winRate", "totalTrades", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, id, '7naFFwuEJWeWwWYQUkgAWHsxYKg3KctEuUj42JdAMidP', 0, 0, 0, now(), now()
FROM "User" WHERE username = 'deployer_05'
ON CONFLICT DO NOTHING;

-- Deployer #6 (838 tokens)
INSERT INTO "User" (id, username, "displayName", "privyUserId", "twitterId", "avatarUrl", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'deployer_06', 'Deployer #6', 'devprint_6', 'devprint_6', 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" rx="24" fill="hsl(80,72%25,54%25)" /%3E%3Ctext x="50%25" y="56%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial" font-size="32" font-weight="700"%3E#6%3C/text%3E%3C/svg%3E', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "Wallet" (id, "userId", address, "totalPnlUsd", "winRate", "totalTrades", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, id, '5JJLDJ9d7WeP4sz6KGNRF3ueEF33dtbsihGVC5eyQu9D', 0, 0, 0, now(), now()
FROM "User" WHERE username = 'deployer_06'
ON CONFLICT DO NOTHING;

-- Deployer #7 (829 tokens)
INSERT INTO "User" (id, username, "displayName", "privyUserId", "twitterId", "avatarUrl", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'deployer_07', 'Deployer #7', 'devprint_7', 'devprint_7', 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" rx="24" fill="hsl(40,72%25,54%25)" /%3E%3Ctext x="50%25" y="56%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial" font-size="32" font-weight="700"%3E#7%3C/text%3E%3C/svg%3E', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "Wallet" (id, "userId", address, "totalPnlUsd", "winRate", "totalTrades", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, id, '7GhWwhaMgbKiRWxF93Bud6HnHMci6NCLTJyTxG8zFH51', 0, 0, 0, now(), now()
FROM "User" WHERE username = 'deployer_07'
ON CONFLICT DO NOTHING;

-- Deployer #8 (801 tokens)
INSERT INTO "User" (id, username, "displayName", "privyUserId", "twitterId", "avatarUrl", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'deployer_08', 'Deployer #8', 'devprint_8', 'devprint_8', 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" rx="24" fill="hsl(0,72%25,54%25)" /%3E%3Ctext x="50%25" y="56%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial" font-size="32" font-weight="700"%3E#8%3C/text%3E%3C/svg%3E', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "Wallet" (id, "userId", address, "totalPnlUsd", "winRate", "totalTrades", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, id, 'FLVFRVS4CknUBvZ36WJm1zEz7JbGA5vurbtibr1Wj5jS', 0, 0, 0, now(), now()
FROM "User" WHERE username = 'deployer_08'
ON CONFLICT DO NOTHING;

-- Deployer #9 (783 tokens)
INSERT INTO "User" (id, username, "displayName", "privyUserId", "twitterId", "avatarUrl", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'deployer_09', 'Deployer #9', 'devprint_9', 'devprint_9', 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" rx="24" fill="hsl(320,72%25,54%25)" /%3E%3Ctext x="50%25" y="56%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial" font-size="32" font-weight="700"%3E#9%3C/text%3E%3C/svg%3E', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "Wallet" (id, "userId", address, "totalPnlUsd", "winRate", "totalTrades", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, id, 'EFaQQTGywnD4CjQQvTugUiyVT4LV9G6MsWqiub8X6unN', 0, 0, 0, now(), now()
FROM "User" WHERE username = 'deployer_09'
ON CONFLICT DO NOTHING;

-- Deployer #10 (775 tokens)
INSERT INTO "User" (id, username, "displayName", "privyUserId", "twitterId", "avatarUrl", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'deployer_10', 'Deployer #10', 'devprint_10', 'devprint_10', 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" rx="24" fill="hsl(280,72%25,54%25)" /%3E%3Ctext x="50%25" y="56%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial" font-size="28" font-weight="700"%3E#10%3C/text%3E%3C/svg%3E', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "Wallet" (id, "userId", address, "totalPnlUsd", "winRate", "totalTrades", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, id, 'AV7PjXHL5JXZ1YoYRoN9Dsstg1x2UciBupMCXcJP8gUz', 0, 0, 0, now(), now()
FROM "User" WHERE username = 'deployer_10'
ON CONFLICT DO NOTHING;

-- Deployer #11 (740 tokens)
INSERT INTO "User" (id, username, "displayName", "privyUserId", "twitterId", "avatarUrl", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'deployer_11', 'Deployer #11', 'devprint_11', 'devprint_11', 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" rx="24" fill="hsl(240,72%25,54%25)" /%3E%3Ctext x="50%25" y="56%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial" font-size="28" font-weight="700"%3E#11%3C/text%3E%3C/svg%3E', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "Wallet" (id, "userId", address, "totalPnlUsd", "winRate", "totalTrades", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, id, '5FqUo9aBjsp7QeeyN6Vi2ZmF2fjS4H5EU7wnAQwPy17z', 0, 0, 0, now(), now()
FROM "User" WHERE username = 'deployer_11'
ON CONFLICT DO NOTHING;

-- Deployer #12 (730 tokens)
INSERT INTO "User" (id, username, "displayName", "privyUserId", "twitterId", "avatarUrl", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'deployer_12', 'Deployer #12', 'devprint_12', 'devprint_12', 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" rx="24" fill="hsl(200,72%25,54%25)" /%3E%3Ctext x="50%25" y="56%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial" font-size="28" font-weight="700"%3E#12%3C/text%3E%3C/svg%3E', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "Wallet" (id, "userId", address, "totalPnlUsd", "winRate", "totalTrades", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, id, '9pkJqJLtefuna3GLtKZyF5DBWwEGUdxZUSGCmf5jZhA9', 0, 0, 0, now(), now()
FROM "User" WHERE username = 'deployer_12'
ON CONFLICT DO NOTHING;

-- Deployer #13 (681 tokens)
INSERT INTO "User" (id, username, "displayName", "privyUserId", "twitterId", "avatarUrl", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'deployer_13', 'Deployer #13', 'devprint_13', 'devprint_13', 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" rx="24" fill="hsl(160,72%25,54%25)" /%3E%3Ctext x="50%25" y="56%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial" font-size="28" font-weight="700"%3E#13%3C/text%3E%3C/svg%3E', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "Wallet" (id, "userId", address, "totalPnlUsd", "winRate", "totalTrades", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, id, 'FFdBLYqL9rs5fUT38ArE8GV2L3BziEgG5LJUu6sshfkF', 0, 0, 0, now(), now()
FROM "User" WHERE username = 'deployer_13'
ON CONFLICT DO NOTHING;

-- Deployer #14 (634 tokens)
INSERT INTO "User" (id, username, "displayName", "privyUserId", "twitterId", "avatarUrl", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'deployer_14', 'Deployer #14', 'devprint_14', 'devprint_14', 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" rx="24" fill="hsl(120,72%25,54%25)" /%3E%3Ctext x="50%25" y="56%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial" font-size="28" font-weight="700"%3E#14%3C/text%3E%3C/svg%3E', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "Wallet" (id, "userId", address, "totalPnlUsd", "winRate", "totalTrades", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, id, '9xaPjSYagiWEVddmysThnUERhuaBx4r65j21JjhtHgpG', 0, 0, 0, now(), now()
FROM "User" WHERE username = 'deployer_14'
ON CONFLICT DO NOTHING;

-- Deployer #15 (616 tokens)
INSERT INTO "User" (id, username, "displayName", "privyUserId", "twitterId", "avatarUrl", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'deployer_15', 'Deployer #15', 'devprint_15', 'devprint_15', 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" rx="24" fill="hsl(80,72%25,54%25)" /%3E%3Ctext x="50%25" y="56%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial" font-size="28" font-weight="700"%3E#15%3C/text%3E%3C/svg%3E', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "Wallet" (id, "userId", address, "totalPnlUsd", "winRate", "totalTrades", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, id, 'D8ePpZLbVCUZqJ8336d9reJvZwbtVuYy17BaowUJDDRB', 0, 0, 0, now(), now()
FROM "User" WHERE username = 'deployer_15'
ON CONFLICT DO NOTHING;

-- Deployer #16 (610 tokens)
INSERT INTO "User" (id, username, "displayName", "privyUserId", "twitterId", "avatarUrl", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'deployer_16', 'Deployer #16', 'devprint_16', 'devprint_16', 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" rx="24" fill="hsl(40,72%25,54%25)" /%3E%3Ctext x="50%25" y="56%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial" font-size="28" font-weight="700"%3E#16%3C/text%3E%3C/svg%3E', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "Wallet" (id, "userId", address, "totalPnlUsd", "winRate", "totalTrades", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, id, 'pwZ5jRsFKyPGhgcS5uC9SrV3CxdsDptQuLQYiVhGz31', 0, 0, 0, now(), now()
FROM "User" WHERE username = 'deployer_16'
ON CONFLICT DO NOTHING;

-- Deployer #17 (590 tokens)
INSERT INTO "User" (id, username, "displayName", "privyUserId", "twitterId", "avatarUrl", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'deployer_17', 'Deployer #17', 'devprint_17', 'devprint_17', 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" rx="24" fill="hsl(0,72%25,54%25)" /%3E%3Ctext x="50%25" y="56%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial" font-size="28" font-weight="700"%3E#17%3C/text%3E%3C/svg%3E', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "Wallet" (id, "userId", address, "totalPnlUsd", "winRate", "totalTrades", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, id, 'HiSo5kykqDPs3EG14Fk9QY4B5RvkuEs8oJTiqPX3EDAn', 0, 0, 0, now(), now()
FROM "User" WHERE username = 'deployer_17'
ON CONFLICT DO NOTHING;

-- Deployer #18 (587 tokens)
INSERT INTO "User" (id, username, "displayName", "privyUserId", "twitterId", "avatarUrl", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'deployer_18', 'Deployer #18', 'devprint_18', 'devprint_18', 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" rx="24" fill="hsl(320,72%25,54%25)" /%3E%3Ctext x="50%25" y="56%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial" font-size="28" font-weight="700"%3E#18%3C/text%3E%3C/svg%3E', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "Wallet" (id, "userId", address, "totalPnlUsd", "winRate", "totalTrades", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, id, 'H8iNFjfjuVE2gTezGFVzmyjihnsv8nvWnxzfPRCwYMHp', 0, 0, 0, now(), now()
FROM "User" WHERE username = 'deployer_18'
ON CONFLICT DO NOTHING;

-- Deployer #19 (569 tokens)
INSERT INTO "User" (id, username, "displayName", "privyUserId", "twitterId", "avatarUrl", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'deployer_19', 'Deployer #19', 'devprint_19', 'devprint_19', 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" rx="24" fill="hsl(280,72%25,54%25)" /%3E%3Ctext x="50%25" y="56%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial" font-size="28" font-weight="700"%3E#19%3C/text%3E%3C/svg%3E', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "Wallet" (id, "userId", address, "totalPnlUsd", "winRate", "totalTrades", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, id, '4bLHcqw3NSUX6YWgb7Dh73L9rShzfYrSvxb5N9X4ELpj', 0, 0, 0, now(), now()
FROM "User" WHERE username = 'deployer_19'
ON CONFLICT DO NOTHING;

-- Deployer #20 (541 tokens)
INSERT INTO "User" (id, username, "displayName", "privyUserId", "twitterId", "avatarUrl", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'deployer_20', 'Deployer #20', 'devprint_20', 'devprint_20', 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" rx="24" fill="hsl(240,72%25,54%25)" /%3E%3Ctext x="50%25" y="56%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial" font-size="28" font-weight="700"%3E#20%3C/text%3E%3C/svg%3E', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "Wallet" (id, "userId", address, "totalPnlUsd", "winRate", "totalTrades", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, id, 'GeUnv1jmtviRbR7Gu1JnXSGkUMUgFVBHuEVQVpTaUX1W', 0, 0, 0, now(), now()
FROM "User" WHERE username = 'deployer_20'
ON CONFLICT DO NOTHING;

-- Verify
SELECT username, displayName FROM "User" WHERE username LIKE 'deployer_%' ORDER BY username;
