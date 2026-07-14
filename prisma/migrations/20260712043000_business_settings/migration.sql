CREATE TABLE "BusinessSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "systemName" TEXT NOT NULL DEFAULT 'HashtagPlants',
    "systemTagline" TEXT NOT NULL DEFAULT 'Retail operations',
    "deliveryChargeDhaka" DECIMAL NOT NULL DEFAULT 60,
    "deliveryChargeOutsideDhaka" DECIMAL NOT NULL DEFAULT 120,
    "logoData" BLOB,
    "logoMimeType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "BusinessSettings" (
    "id",
    "systemName",
    "systemTagline",
    "deliveryChargeDhaka",
    "deliveryChargeOutsideDhaka",
    "updatedAt"
) VALUES (
    'default',
    'HashtagPlants',
    'Retail operations',
    60,
    120,
    CURRENT_TIMESTAMP
);
