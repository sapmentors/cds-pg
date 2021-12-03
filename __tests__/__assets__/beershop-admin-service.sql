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
FROM csw_Brewery AS Brewery_0