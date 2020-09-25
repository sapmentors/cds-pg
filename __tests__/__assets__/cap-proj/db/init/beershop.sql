CREATE DATABASE beershop WITH OWNER postgres;
\ c beershop CREATE TABLE csw_TypeChecks (
  ID VARCHAR(36) NOT NULL,
  type_Boolean BOOLEAN,
  type_Int32 INTEGER,
  type_Int64 BIGINT,
  type_Decimal DECIMAL(2, 1),
  type_Double NUMERIC(15, 15),
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
CREATE TABLE csw_Beers (
  ID VARCHAR(36) NOT NULL,
  name VARCHAR(100),
  abv DECIMAL(3, 1),
  ibu INTEGER,
  brewery_ID VARCHAR(36),
  PRIMARY KEY(ID)
);
CREATE TABLE csw_Brewery (
  ID VARCHAR(36) NOT NULL,
  name VARCHAR(150),
  PRIMARY KEY(ID)
);
CREATE VIEW BeershopService_Beers AS
SELECT Beers_0.ID,
  Beers_0.name,
  Beers_0.abv,
  Beers_0.ibu,
  Beers_0.brewery_ID
FROM csw_Beers AS Beers_0;
CREATE VIEW BeershopService_Breweries AS
SELECT Brewery_0.ID,
  Brewery_0.name
FROM csw_Brewery AS Brewery_0;
COPY csw_Beers(ID, name, abv, ibu, brewery_ID)
FROM '/tmp/data/csw-Beers.csv' DELIMITER ',' CSV HEADER;
COPY csw_Brewery(ID, name)
FROM '/tmp/data/csw-Brewery.csv' DELIMITER ',' CSV HEADER;