CREATE TABLE BeershopAdminService_UserScopes (
  username VARCHAR(5000) NOT NULL,
  is_admin BOOLEAN,
  PRIMARY KEY(username)
);

CREATE TABLE csw_Beers (
  ID VARCHAR(36) NOT NULL,
  createdAt TIMESTAMPTZ,
  createdBy VARCHAR(255),
  modifiedAt TIMESTAMPTZ,
  modifiedBy VARCHAR(255),
  name VARCHAR(100),
  abv DECIMAL(3, 1),
  ibu INTEGER,
  brewery_ID VARCHAR(36),
  PRIMARY KEY(ID)
);

CREATE TABLE csw_Brewery (
  ID VARCHAR(36) NOT NULL,
  createdAt TIMESTAMPTZ,
  createdBy VARCHAR(255),
  modifiedAt TIMESTAMPTZ,
  modifiedBy VARCHAR(255),
  name VARCHAR(150),
  PRIMARY KEY(ID)
);

CREATE TABLE csw_TypeChecks (
  ID VARCHAR(36) NOT NULL,
  type_Boolean BOOLEAN,
  type_Int32 INTEGER,
  type_Int64 BIGINT,
  type_Decimal DECIMAL(2, 1),
  type_Double NUMERIC(30, 15),
  type_Date DATE,
  type_Time TIME,
  type_DateTime TIMESTAMPTZ,
  type_Timestamp TIMESTAMPTZ,
  type_String VARCHAR(5000),
  type_Binary CHAR(100),
  type_LargeBinary BYTEA,
  type_LargeString TEXT,
  PRIMARY KEY(ID)
);

CREATE TABLE csw_TypeChecksSibling (
  ID VARCHAR(36) NOT NULL,
  dummyField VARCHAR(5000),
  typeChecks_ID VARCHAR(36),
  PRIMARY KEY(ID)
);

CREATE TABLE csw_TypeChecks_texts (
  locale VARCHAR(14) NOT NULL,
  ID VARCHAR(36) NOT NULL,
  type_String VARCHAR(5000),
  PRIMARY KEY(locale, ID)
);

CREATE VIEW BeershopAdminService_Beers AS SELECT
  Beers_0.ID,
  Beers_0.createdAt,
  Beers_0.createdBy,
  Beers_0.modifiedAt,
  Beers_0.modifiedBy,
  Beers_0.name,
  Beers_0.abv,
  Beers_0.ibu,
  Beers_0.brewery_ID
FROM csw_Beers AS Beers_0;

CREATE VIEW BeershopAdminService_Breweries AS SELECT
  Brewery_0.ID,
  Brewery_0.createdAt,
  Brewery_0.createdBy,
  Brewery_0.modifiedAt,
  Brewery_0.modifiedBy,
  Brewery_0.name
FROM csw_Brewery AS Brewery_0;

CREATE VIEW localized_csw_TypeChecks AS SELECT
  L_0.ID,
  L_0.type_Boolean,
  L_0.type_Int32,
  L_0.type_Int64,
  L_0.type_Decimal,
  L_0.type_Double,
  L_0.type_Date,
  L_0.type_Time,
  L_0.type_DateTime,
  L_0.type_Timestamp,
  coalesce(localized_1.type_String, L_0.type_String) AS type_String,
  L_0.type_Binary,
  L_0.type_LargeBinary,
  L_0.type_LargeString
FROM (csw_TypeChecks AS L_0 LEFT JOIN csw_TypeChecks_texts AS localized_1 ON localized_1.ID = L_0.ID AND localized_1.locale = 'en');

CREATE VIEW localized_csw_TypeChecksSibling AS SELECT
  L.ID,
  L.dummyField,
  L.typeChecks_ID
FROM csw_TypeChecksSibling AS L;

CREATE VIEW localized_de_csw_TypeChecks AS SELECT
  L_0.ID,
  L_0.type_Boolean,
  L_0.type_Int32,
  L_0.type_Int64,
  L_0.type_Decimal,
  L_0.type_Double,
  L_0.type_Date,
  L_0.type_Time,
  L_0.type_DateTime,
  L_0.type_Timestamp,
  coalesce(localized_de_1.type_String, L_0.type_String) AS type_String,
  L_0.type_Binary,
  L_0.type_LargeBinary,
  L_0.type_LargeString
FROM (csw_TypeChecks AS L_0 LEFT JOIN csw_TypeChecks_texts AS localized_de_1 ON localized_de_1.ID = L_0.ID AND localized_de_1.locale = 'de');

CREATE VIEW localized_fr_csw_TypeChecks AS SELECT
  L_0.ID,
  L_0.type_Boolean,
  L_0.type_Int32,
  L_0.type_Int64,
  L_0.type_Decimal,
  L_0.type_Double,
  L_0.type_Date,
  L_0.type_Time,
  L_0.type_DateTime,
  L_0.type_Timestamp,
  coalesce(localized_fr_1.type_String, L_0.type_String) AS type_String,
  L_0.type_Binary,
  L_0.type_LargeBinary,
  L_0.type_LargeString
FROM (csw_TypeChecks AS L_0 LEFT JOIN csw_TypeChecks_texts AS localized_fr_1 ON localized_fr_1.ID = L_0.ID AND localized_fr_1.locale = 'fr');

CREATE VIEW localized_de_csw_TypeChecksSibling AS SELECT
  L.ID,
  L.dummyField,
  L.typeChecks_ID
FROM csw_TypeChecksSibling AS L;

CREATE VIEW localized_fr_csw_TypeChecksSibling AS SELECT
  L.ID,
  L.dummyField,
  L.typeChecks_ID
FROM csw_TypeChecksSibling AS L;