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

CREATE VIEW BeershopService_Beers AS SELECT
  Beers_0.ID,
  Beers_0.name,
  Beers_0.abv,
  Beers_0.ibu,
  Beers_0.brewery_ID
FROM csw_Beers AS Beers_0;

CREATE VIEW BeershopService_Breweries AS SELECT
  Brewery_0.ID,
  Brewery_0.name
FROM csw_Brewery AS Brewery_0;