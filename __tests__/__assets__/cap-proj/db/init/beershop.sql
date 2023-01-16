CREATE DATABASE beershop WITH OWNER postgres;
\c beershop 
CREATE TABLE BeershopAdminService_UserScopes (
  username VARCHAR(5000) NOT NULL,
  is_admin BOOLEAN,
  PRIMARY KEY(username)
);
CREATE TABLE csw_Beers (
  ID VARCHAR(36) NOT NULL,
  name VARCHAR(100),
  abv DECIMAL(3, 1),
  ibu INTEGER,
  brewery_ID VARCHAR(36),
  createdAt TIMESTAMP,
  createdBy VARCHAR(255),
  modifiedAt TIMESTAMP,
  modifiedBy VARCHAR(255),
  PRIMARY KEY(ID)
);
CREATE TABLE csw_Brewery (
  ID VARCHAR(36) NOT NULL,
  name VARCHAR(150),
  createdAt TIMESTAMP,
  createdBy VARCHAR(255),
  modifiedAt TIMESTAMP,
  modifiedBy VARCHAR(255),
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
  type_DateTime TIMESTAMP,
  type_Timestamp TIMESTAMP,
  type_String VARCHAR(5000),
  type_Binary CHAR(100),
  type_LargeBinary BYTEA,
  type_LargeString TEXT,
  PRIMARY KEY(ID)
);
CREATE TABLE DRAFT_DraftAdministrativeData (
  DraftUUID VARCHAR(36) NOT NULL,
  CreationDateTime TIMESTAMP,
  CreatedByUser VARCHAR(256),
  DraftIsCreatedByMe BOOLEAN,
  LastChangeDateTime TIMESTAMP,
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
  type_DateTime TIMESTAMP NULL,
  type_Timestamp TIMESTAMP NULL,
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
CREATE VIEW BeershopService_Beers AS
SELECT Beers_0.ID,
  Beers_0.name,
  Beers_0.abv,
  Beers_0.ibu,
  Beers_0.brewery_ID,
  Beers_0.createdAt,
  Beers_0.createdBy,
  Beers_0.modifiedAt,
  Beers_0.modifiedBy
FROM csw_Beers AS Beers_0;
CREATE VIEW BeershopService_Breweries AS
SELECT Brewery_0.ID,
  Brewery_0.name,
  Brewery_0.createdAt,
  Brewery_0.createdBy,
  Brewery_0.modifiedAt,
  Brewery_0.modifiedBy
FROM csw_Brewery AS Brewery_0;
CREATE VIEW BeershopService_TypeChecks AS
SELECT TypeChecks_0.ID,
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
CREATE VIEW BeershopService_TypeChecksWithDraft AS
SELECT TypeChecks_0.ID,
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
CREATE VIEW BeershopService_DraftAdministrativeData AS
SELECT DraftAdministrativeData.DraftUUID,
  DraftAdministrativeData.CreationDateTime,
  DraftAdministrativeData.CreatedByUser,
  DraftAdministrativeData.DraftIsCreatedByMe,
  DraftAdministrativeData.LastChangeDateTime,
  DraftAdministrativeData.LastChangedByUser,
  DraftAdministrativeData.InProcessByUser,
  DraftAdministrativeData.DraftIsProcessedByMe
FROM DRAFT_DraftAdministrativeData AS DraftAdministrativeData;
CREATE VIEW BeershopAdminService_Beers AS
SELECT Beers_0.ID,
  Beers_0.createdAt,
  Beers_0.createdBy,
  Beers_0.modifiedAt,
  Beers_0.modifiedBy,
  Beers_0.name,
  Beers_0.abv,
  Beers_0.ibu,
  Beers_0.brewery_ID
FROM csw_Beers AS Beers_0;
CREATE VIEW BeershopAdminService_Breweries AS
SELECT Brewery_0.ID,
  Brewery_0.createdAt,
  Brewery_0.createdBy,
  Brewery_0.modifiedAt,
  Brewery_0.modifiedBy,
  Brewery_0.name
FROM csw_Brewery AS Brewery_0;
COPY csw_Beers (ID, name, abv, ibu, brewery_ID)
FROM '/tmp/data/csw-Beers.csv' DELIMITER ',' CSV HEADER;
COPY csw_Brewery (ID, name)
FROM '/tmp/data/csw-Brewery.csv' DELIMITER ',' CSV HEADER;
COPY csw_TypeChecks (ID, type_String, type_LargeString)
FROM '/tmp/data/csw-TypeChecks.csv' DELIMITER ',' CSV HEADER;
CREATE SCHEMA superbeer AUTHORIZATION postgres;
CREATE TABLE superbeer.BeershopAdminService_UserScopes (
  username VARCHAR(5000) NOT NULL,
  is_admin BOOLEAN,
  PRIMARY KEY(username)
);
CREATE TABLE superbeer.csw_Beers (
  ID VARCHAR(36) NOT NULL,
  name VARCHAR(100),
  abv DECIMAL(3, 1),
  ibu INTEGER,
  brewery_ID VARCHAR(36),
  createdAt TIMESTAMP,
  createdBy VARCHAR(255),
  modifiedAt TIMESTAMP,
  modifiedBy VARCHAR(255),
  PRIMARY KEY(ID)
);
CREATE TABLE superbeer.csw_Brewery (
  ID VARCHAR(36) NOT NULL,
  name VARCHAR(150),
  createdAt TIMESTAMP,
  createdBy VARCHAR(255),
  modifiedAt TIMESTAMP,
  modifiedBy VARCHAR(255),
  PRIMARY KEY(ID)
);
CREATE TABLE superbeer.csw_TypeChecks (
  ID VARCHAR(36) NOT NULL,
  type_Boolean BOOLEAN,
  type_Int32 INTEGER,
  type_Int64 BIGINT,
  type_Decimal DECIMAL(2, 1),
  type_Double NUMERIC(30, 15),
  type_Date DATE,
  type_Time TIME,
  type_DateTime TIMESTAMP,
  type_Timestamp TIMESTAMP,
  type_String VARCHAR(5000),
  type_Binary CHAR(100),
  type_LargeBinary BYTEA,
  type_LargeString TEXT,
  PRIMARY KEY(ID)
);
CREATE TABLE superbeer.DRAFT_DraftAdministrativeData (
  DraftUUID VARCHAR(36) NOT NULL,
  CreationDateTime TIMESTAMP,
  CreatedByUser VARCHAR(256),
  DraftIsCreatedByMe BOOLEAN,
  LastChangeDateTime TIMESTAMP,
  LastChangedByUser VARCHAR(256),
  InProcessByUser VARCHAR(256),
  DraftIsProcessedByMe BOOLEAN,
  PRIMARY KEY(DraftUUID)
);
CREATE TABLE superbeer.BeershopService_TypeChecksWithDraft_drafts (
  ID VARCHAR(36) NOT NULL,
  type_Boolean BOOLEAN NULL,
  type_Int32 INTEGER NULL,
  type_Int64 BIGINT NULL,
  type_Decimal DECIMAL(2, 1) NULL,
  type_Double NUMERIC(30, 15) NULL,
  type_Date DATE NULL,
  type_Time TIME NULL,
  type_DateTime TIMESTAMP NULL,
  type_Timestamp TIMESTAMP NULL,
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
CREATE VIEW superbeer.BeershopService_Beers AS
SELECT Beers_0.ID,
  Beers_0.name,
  Beers_0.abv,
  Beers_0.ibu,
  Beers_0.brewery_ID,
  Beers_0.createdAt,
  Beers_0.createdBy,
  Beers_0.modifiedAt,
  Beers_0.modifiedBy
FROM superbeer.csw_Beers AS Beers_0;
CREATE VIEW superbeer.BeershopService_Breweries AS
SELECT Brewery_0.ID,
  Brewery_0.name,
  Brewery_0.createdAt,
  Brewery_0.createdBy,
  Brewery_0.modifiedAt,
  Brewery_0.modifiedBy
FROM superbeer.csw_Brewery AS Brewery_0;
CREATE VIEW superbeer.BeershopService_TypeChecks AS
SELECT TypeChecks_0.ID,
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
FROM superbeer.csw_TypeChecks AS TypeChecks_0;
CREATE VIEW superbeer.BeershopService_TypeChecksWithDraft AS
SELECT TypeChecks_0.ID,
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
FROM superbeer.csw_TypeChecks AS TypeChecks_0;
CREATE VIEW superbeer.BeershopService_DraftAdministrativeData AS
SELECT DraftAdministrativeData.DraftUUID,
  DraftAdministrativeData.CreationDateTime,
  DraftAdministrativeData.CreatedByUser,
  DraftAdministrativeData.DraftIsCreatedByMe,
  DraftAdministrativeData.LastChangeDateTime,
  DraftAdministrativeData.LastChangedByUser,
  DraftAdministrativeData.InProcessByUser,
  DraftAdministrativeData.DraftIsProcessedByMe
FROM superbeer.DRAFT_DraftAdministrativeData AS DraftAdministrativeData;
CREATE VIEW superbeer.BeershopAdminService_Beers AS
SELECT Beers_0.ID,
  Beers_0.createdAt,
  Beers_0.createdBy,
  Beers_0.modifiedAt,
  Beers_0.modifiedBy,
  Beers_0.name,
  Beers_0.abv,
  Beers_0.ibu,
  Beers_0.brewery_ID
FROM superbeer.csw_Beers AS Beers_0;
CREATE VIEW superbeer.BeershopAdminService_Breweries AS
SELECT Brewery_0.ID,
  Brewery_0.createdAt,
  Brewery_0.createdBy,
  Brewery_0.modifiedAt,
  Brewery_0.modifiedBy,
  Brewery_0.name
FROM superbeer.csw_Brewery AS Brewery_0;
CREATE TABLE IF NOT EXISTS my_bookshop_authors
(
    id integer NOT NULL,
    name character varying(5000) COLLATE pg_catalog."default",
    CONSTRAINT my_bookshop_authors_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS my_bookshop_authors_texts
(
    locale character varying(14) COLLATE pg_catalog."default" NOT NULL,
    id integer NOT NULL,
    name character varying(5000) COLLATE pg_catalog."default",
    CONSTRAINT my_bookshop_authors_texts_pkey PRIMARY KEY (locale, id)
);
CREATE TABLE IF NOT EXISTS my_bookshop_books
(
    id integer NOT NULL,
    title character varying(5000) COLLATE pg_catalog."default",
    author_id integer,
    stock integer,
    CONSTRAINT my_bookshop_books_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS my_bookshop_books_texts
(
    locale character varying(14) COLLATE pg_catalog."default" NOT NULL,
    id integer NOT NULL,
    title character varying(5000) COLLATE pg_catalog."default",
    CONSTRAINT my_bookshop_books_texts_pkey PRIMARY KEY (locale, id)
);
CREATE OR REPLACE VIEW bookshopservice_authors
 AS
 SELECT authors_0.id,
    authors_0.name
   FROM my_bookshop_authors authors_0;
CREATE OR REPLACE VIEW bookshopservice_authors_texts
 AS
 SELECT texts_0.locale,
    texts_0.id,
    texts_0.name
   FROM my_bookshop_authors_texts texts_0;
CREATE OR REPLACE VIEW bookshopservice_books
 AS
 SELECT books_0.id,
    books_0.title,
    books_0.author_id,
    books_0.stock
   FROM my_bookshop_books books_0;
CREATE OR REPLACE VIEW bookshopservice_books_texts
 AS
 SELECT texts_0.locale,
    texts_0.id,
    texts_0.title
   FROM my_bookshop_books_texts texts_0;
CREATE OR REPLACE VIEW localized_my_bookshop_authors
 AS
 SELECT l_0.id,
    COALESCE(localized_1.name, l_0.name) AS name
   FROM my_bookshop_authors l_0
     LEFT JOIN my_bookshop_authors_texts localized_1 ON localized_1.id = l_0.id AND localized_1.locale::text = 'en'::text;
CREATE OR REPLACE VIEW localized_my_bookshop_books
 AS
 SELECT l_0.id,
    COALESCE(localized_1.title, l_0.title) AS title,
    l_0.author_id,
    l_0.stock
   FROM my_bookshop_books l_0
     LEFT JOIN my_bookshop_books_texts localized_1 ON localized_1.id = l_0.id AND localized_1.locale::text = 'en'::text;
CREATE OR REPLACE VIEW localized_bookshopservice_authors
 AS
 SELECT authors_0.id,
    authors_0.name
   FROM localized_my_bookshop_authors authors_0;

CREATE OR REPLACE VIEW localized_bookshopservice_books
 AS
 SELECT books_0.id,
    books_0.title,
    books_0.author_id,
    books_0.stock
   FROM localized_my_bookshop_books books_0;
CREATE OR REPLACE VIEW localized_de_my_bookshop_authors
 AS
 SELECT l_0.id,
    COALESCE(localized_de_1.name, l_0.name) AS name
   FROM my_bookshop_authors l_0
     LEFT JOIN my_bookshop_authors_texts localized_de_1 ON localized_de_1.id = l_0.id AND localized_de_1.locale::text = 'de'::text;
CREATE OR REPLACE VIEW localized_de_bookshopservice_authors
 AS
 SELECT authors_0.id,
    authors_0.name
   FROM localized_de_my_bookshop_authors authors_0;
CREATE OR REPLACE VIEW localized_de_my_bookshop_books
 AS
 SELECT l_0.id,
    COALESCE(localized_de_1.title, l_0.title) AS title,
    l_0.author_id,
    l_0.stock
   FROM my_bookshop_books l_0
     LEFT JOIN my_bookshop_books_texts localized_de_1 ON localized_de_1.id = l_0.id AND localized_de_1.locale::text = 'de'::text;
CREATE OR REPLACE VIEW localized_de_bookshopservice_books
 AS
 SELECT books_0.id,
    books_0.title,
    books_0.author_id,
    books_0.stock
   FROM localized_de_my_bookshop_books books_0;
CREATE OR REPLACE VIEW localized_en_my_bookshop_authors
 AS
 SELECT l_0.id,
    COALESCE(localized_en_1.name, l_0.name) AS name
   FROM my_bookshop_authors l_0
     LEFT JOIN my_bookshop_authors_texts localized_en_1 ON localized_en_1.id = l_0.id AND localized_en_1.locale::text = 'en'::text;
CREATE OR REPLACE VIEW localized_en_bookshopservice_authors
 AS
 SELECT authors_0.id,
    authors_0.name
   FROM localized_en_my_bookshop_authors authors_0;
CREATE OR REPLACE VIEW localized_en_my_bookshop_books
 AS
 SELECT l_0.id,
    COALESCE(localized_en_1.title, l_0.title) AS title,
    l_0.author_id,
    l_0.stock
   FROM my_bookshop_books l_0
     LEFT JOIN my_bookshop_books_texts localized_en_1 ON localized_en_1.id = l_0.id AND localized_en_1.locale::text = 'en'::text;
CREATE OR REPLACE VIEW localized_en_bookshopservice_books
 AS
 SELECT books_0.id,
    books_0.title,
    books_0.author_id,
    books_0.stock
   FROM localized_en_my_bookshop_books books_0;
CREATE OR REPLACE VIEW localized_it_my_bookshop_authors
 AS
 SELECT l_0.id,
    COALESCE(localized_it_1.name, l_0.name) AS name
   FROM my_bookshop_authors l_0
     LEFT JOIN my_bookshop_authors_texts localized_it_1 ON localized_it_1.id = l_0.id AND localized_it_1.locale::text = 'it'::text;
CREATE OR REPLACE VIEW localized_it_bookshopservice_authors
 AS
 SELECT authors_0.id,
    authors_0.name
   FROM localized_it_my_bookshop_authors authors_0;
CREATE OR REPLACE VIEW localized_it_my_bookshop_books
 AS
 SELECT l_0.id,
    COALESCE(localized_it_1.title, l_0.title) AS title,
    l_0.author_id,
    l_0.stock
   FROM my_bookshop_books l_0
     LEFT JOIN my_bookshop_books_texts localized_it_1 ON localized_it_1.id = l_0.id AND localized_it_1.locale::text = 'it'::text;
CREATE OR REPLACE VIEW localized_it_bookshopservice_books
 AS
 SELECT books_0.id,
    books_0.title,
    books_0.author_id,
    books_0.stock
   FROM localized_it_my_bookshop_books books_0;

COPY superbeer.csw_Beers (ID, name, abv, ibu, brewery_ID)
FROM '/tmp/data/csw-Beers.csv' DELIMITER ',' CSV HEADER;
COPY superbeer.csw_Brewery (ID, name)
FROM '/tmp/data/csw-Brewery.csv' DELIMITER ',' CSV HEADER;
COPY superbeer.csw_TypeChecks (ID, type_String, type_LargeString)
FROM '/tmp/data/csw-TypeChecks.csv' DELIMITER ',' CSV HEADER;
COPY my_bookshop_authors (ID, name)
FROM '/tmp/data/my.bookshop-Authors.csv' DELIMITER ',' CSV_HEADER;
COPY my_bookshop_authors_texts (ID, locale, name)
FROM '/tmp/data/my.bookshop-Authors_texts.csv' DELIMITER ',' CSV_HEADER;
COPY my_bookshop_books (ID, title, stock, author_ID)
FROM '/tmp/data/my.bookshop-Books.csv' DELIMITER ',' CSV_HEADER;
COPY my_bookshop_books_texts (ID, locale, title)
FROM '/tmp/data/my.bookshop-Books_texts.csv' DELIMITER ',' CSV_HEADER;
