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

CREATE TABLE DRAFT_DraftAdministrativeData (
  DraftUUID VARCHAR(36) NOT NULL,
  CreationDateTime TIMESTAMPTZ,
  CreatedByUser VARCHAR(256),
  DraftIsCreatedByMe BOOLEAN,
  LastChangeDateTime TIMESTAMPTZ,
  LastChangedByUser VARCHAR(256),
  InProcessByUser VARCHAR(256),
  DraftIsProcessedByMe BOOLEAN,
  PRIMARY KEY(DraftUUID)
);

CREATE TABLE BeershopService_TypeChecksWithDraft_drafts (
  ID VARCHAR(36) NOT NULL,
  type_Boolean BOOLEAN NULL,
  type_Int32 INTEGER NULL,
  type_Int64 BIGINT NULL,
  type_Decimal DECIMAL(2, 1) NULL,
  type_Double NUMERIC(30, 15) NULL,
  type_Date DATE NULL,
  type_Time TIME NULL,
  type_DateTime TIMESTAMPTZ NULL,
  type_Timestamp TIMESTAMPTZ NULL,
  type_String VARCHAR(5000) NULL,
  type_Binary CHAR(100) NULL,
  type_LargeBinary BYTEA NULL,
  type_LargeString TEXT NULL,
  IsActiveEntity BOOLEAN,
  HasActiveEntity BOOLEAN,
  HasDraftEntity BOOLEAN,
  DraftAdministrativeData_DraftUUID VARCHAR(36) NOT NULL,
  PRIMARY KEY(ID)
);

CREATE VIEW BeershopService_Beers AS SELECT
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

CREATE VIEW BeershopService_Breweries AS SELECT
  Brewery_0.ID,
  Brewery_0.createdAt,
  Brewery_0.createdBy,
  Brewery_0.modifiedAt,
  Brewery_0.modifiedBy,
  Brewery_0.name
FROM csw_Brewery AS Brewery_0;

CREATE VIEW BeershopService_TypeChecks AS SELECT
  TypeChecks_0.ID,
  TypeChecks_0.type_Boolean,
  TypeChecks_0.type_Int32,
  TypeChecks_0.type_Int64,
  TypeChecks_0.type_Decimal,
  TypeChecks_0.type_Double,
  TypeChecks_0.type_Date,
  TypeChecks_0.type_Time,
  TypeChecks_0.type_DateTime,
  TypeChecks_0.type_Timestamp,
  TypeChecks_0.type_String,
  TypeChecks_0.type_Binary,
  TypeChecks_0.type_LargeBinary,
  TypeChecks_0.type_LargeString
FROM csw_TypeChecks AS TypeChecks_0;

CREATE VIEW BeershopService_TypeChecksWithDraft AS SELECT
  TypeChecks_0.ID,
  TypeChecks_0.type_Boolean,
  TypeChecks_0.type_Int32,
  TypeChecks_0.type_Int64,
  TypeChecks_0.type_Decimal,
  TypeChecks_0.type_Double,
  TypeChecks_0.type_Date,
  TypeChecks_0.type_Time,
  TypeChecks_0.type_DateTime,
  TypeChecks_0.type_Timestamp,
  TypeChecks_0.type_String,
  TypeChecks_0.type_Binary,
  TypeChecks_0.type_LargeBinary,
  TypeChecks_0.type_LargeString
FROM csw_TypeChecks AS TypeChecks_0;

CREATE VIEW BeershopService_DraftAdministrativeData AS SELECT
  DraftAdministrativeData.DraftUUID,
  DraftAdministrativeData.CreationDateTime,
  DraftAdministrativeData.CreatedByUser,
  DraftAdministrativeData.DraftIsCreatedByMe,
  DraftAdministrativeData.LastChangeDateTime,
  DraftAdministrativeData.LastChangedByUser,
  DraftAdministrativeData.InProcessByUser,
  DraftAdministrativeData.DraftIsProcessedByMe
FROM DRAFT_DraftAdministrativeData AS DraftAdministrativeData